//! 字幕（ASR）服务 — 通过 HTTP 调用 Python TTS Server 的 /transcribe SSE 接口

use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::sync::Mutex;

const DEFAULT_TTS_SERVER_URL: &str = "http://127.0.0.1:9880";

fn tts_server_url() -> String {
    std::env::var("MARUAUDIO_TTS_URL").unwrap_or_else(|_| DEFAULT_TTS_SERVER_URL.to_string())
}

// ---- 请求 / 事件结构 ----

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscribeRequest {
    /// 音频或视频文件的绝对路径
    pub input_path: String,
    /// ASR 引擎名：BIJIAN / FasterWhisper / WhisperAPI
    #[serde(default = "default_asr_model")]
    pub asr_model: String,
    /// 识别语言
    #[serde(default = "default_language")]
    pub language: String,
    /// 是否生成词级时间戳
    #[serde(default)]
    pub need_word_timestamp: bool,
    /// 字幕输出格式：srt / vtt / ass / json
    #[serde(default = "default_output_format")]
    pub output_format: String,
}

fn default_asr_model() -> String {
    "BIJIAN".to_string()
}

fn default_language() -> String {
    "zh".to_string()
}

fn default_output_format() -> String {
    "json".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum SseEvent {
    #[serde(rename = "progress")]
    Progress {
        progress: f64,
        message: String,
        #[serde(default)]
        segment_current: i32,
        #[serde(default)]
        segment_total: i32,
    },
    #[serde(rename = "complete")]
    Complete {
        output_path: String,
        #[serde(default)]
        segment_count: i32,
        #[serde(default)]
        duration_ms: i64,
    },
    #[serde(rename = "error")]
    Error { message: String },
}

/// 字幕子系统状态（避免并发提交）
#[derive(Debug)]
pub struct SubtitleState {
    is_running: AtomicBool,
    client: reqwest::Client,
    cancel_token: Arc<Mutex<Option<tokio_util::sync::CancellationToken>>>,
}

impl SubtitleState {
    pub fn new() -> Self {
        Self {
            is_running: AtomicBool::new(false),
            client: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(600))
                .build()
                .unwrap_or_default(),
            cancel_token: Arc::new(Mutex::new(None)),
        }
    }

    #[allow(dead_code)]
    pub fn is_running(&self) -> bool {
        self.is_running.load(Ordering::Relaxed)
    }

    pub fn set_running(&self, val: bool) {
        self.is_running.store(val, Ordering::Relaxed);
    }

    /// 原子地尝试开始任务：仅当当前空闲（false→true）时返回 true，
    /// 避免「检查后置位」之间的 TOCTOU 竞态导致并发双任务
    pub fn try_begin(&self) -> bool {
        self.is_running
            .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
            .is_ok()
    }
}

impl Default for SubtitleState {
    fn default() -> Self {
        Self::new()
    }
}

/// 取消当前转录任务
pub async fn cancel_transcribe(state: &SubtitleState) -> Result<()> {
    let token = state.cancel_token.lock().await;
    if let Some(ct) = token.as_ref() {
        ct.cancel();
    }
    state.set_running(false);
    Ok(())
}

async fn set_cancel_token(state: &SubtitleState, ct: tokio_util::sync::CancellationToken) {
    let mut token = state.cancel_token.lock().await;
    *token = Some(ct);
}

async fn clear_cancel_token(state: &SubtitleState) {
    let mut token = state.cancel_token.lock().await;
    *token = None;
}

/// SSE 流式转录 — 调用 Python Server 的 /transcribe，
/// 解析 SSE 事件并通过 Tauri 事件系统推送给前端
pub async fn transcribe_stream(
    state: &SubtitleState,
    app: &AppHandle,
    req: TranscribeRequest,
) -> Result<String> {
    let url = format!("{}/transcribe", tts_server_url());
    let ct = tokio_util::sync::CancellationToken::new();
    set_cancel_token(state, ct.clone()).await;

    let resp = state
        .client
        .post(&url)
        .json(&req)
        // 转录长视频可能远超 client 默认 600s，单独放宽到 1 小时兜底；
        // 真正的提前结束仍靠 CancellationToken。
        .timeout(std::time::Duration::from_secs(3600))
        .send()
        .await?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        clear_cancel_token(state).await;
        return Err(anyhow::anyhow!(
            "字幕服务错误 ({}): {}",
            status,
            body
        ));
    }

    let mut stream = resp.bytes_stream();
    let mut output_path = String::new();
    let mut buffer: Vec<u8> = Vec::new();

    use futures_util::StreamExt;

    while let Some(chunk) = stream.next().await {
        if ct.is_cancelled() {
            clear_cancel_token(state).await;
            return Err(anyhow::anyhow!("字幕任务已取消"));
        }

        let chunk = chunk?;
        buffer.extend_from_slice(&chunk);

        // 在字节层面按 "\n\n" 切出完整 SSE 事件再解码，
        // 避免多字节 UTF-8（中文消息/路径）跨 chunk 边界被截断成乱码
        while let Some(event_end) = find_double_newline(&buffer) {
            let raw_event: Vec<u8> = buffer.drain(..event_end + 2).collect();
            let raw_event = String::from_utf8_lossy(&raw_event[..event_end]);

            for line in raw_event.lines() {
                if let Some(data) = line.strip_prefix("data: ") {
                    if let Ok(evt) = serde_json::from_str::<SseEvent>(data) {
                        match &evt {
                            SseEvent::Progress {
                                progress,
                                message,
                                segment_current,
                                segment_total,
                            } => {
                                let _ = app.emit(
                                    "subtitle-progress",
                                    serde_json::json!({
                                        "type": "progress",
                                        "progress": (*progress * 100.0) as i32,
                                        "message": message,
                                        "segmentCurrent": segment_current,
                                        "segmentTotal": segment_total,
                                    }),
                                );
                            }
                            SseEvent::Complete {
                                output_path: path,
                                segment_count,
                                duration_ms,
                            } => {
                                output_path = path.clone();
                                let _ = app.emit(
                                    "subtitle-complete",
                                    serde_json::json!({
                                        "type": "complete",
                                        "outputPath": path,
                                        "segmentCount": segment_count,
                                        "durationMs": duration_ms,
                                    }),
                                );
                            }
                            SseEvent::Error { message } => {
                                let _ = app.emit(
                                    "subtitle-error",
                                    serde_json::json!({
                                        "type": "error",
                                        "message": message,
                                    }),
                                );
                                clear_cancel_token(state).await;
                                return Err(anyhow::anyhow!("{}", message));
                            }
                        }
                    }
                }
            }
        }
    }

    clear_cancel_token(state).await;

    if output_path.is_empty() {
        return Err(anyhow::anyhow!("字幕完成但未返回输出路径"));
    }

    Ok(output_path)
}

/// 读取转录输出文件（JSON / SRT / VTT / ASS）
///
/// 安全：禁止任意文件读取。校验：
/// 1. 文件扩展名必须在白名单（srt/vtt/ass/json）
/// 2. canonicalize 后路径必须落在允许的输出目录之一：
///    - 当前工作目录下的 `output/subtitle/`
///    - 路径中必须含 `output/subtitle/` 或 `output\subtitle\` 片段
/// 3. 拒绝路径穿越（canonicalize 已会拒绝 `..`）
pub async fn read_subtitle_json(path: &str) -> Result<String> {
    use std::path::{Component, PathBuf};

    const ALLOWED_EXT: &[&str] = &["srt", "vtt", "ass", "json"];

    let p = PathBuf::from(path);

    // 拒绝包含 `..` 的相对路径片段
    if p.components().any(|c| matches!(c, Component::ParentDir)) {
        anyhow::bail!("非法路径（含 ..）: {}", path);
    }

    // 校验扩展名
    let ext = p
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    if !ALLOWED_EXT.contains(&ext.as_str()) {
        anyhow::bail!("禁止读取此类型文件（仅 srt/vtt/ass/json）: {}", path);
    }

    // canonicalize 解析符号链接 + 绝对化
    let resolved = tokio::fs::canonicalize(&p).await.map_err(|e| {
        anyhow::anyhow!("路径不存在或不可解析: {} ({})", path, e)
    })?;

    let resolved_str = resolved.to_string_lossy().replace('\\', "/");
    // 路径必须落在 `output/subtitle/` 子树（Python 后端固定路径）
    if !resolved_str.contains("/output/subtitle/") {
        anyhow::bail!(
            "路径不在允许的字幕输出目录内: {}",
            resolved.display()
        );
    }

    // 文件大小上限：32 MB（远大于任何合法字幕）
    let meta = tokio::fs::metadata(&resolved).await?;
    if meta.len() > 32 * 1024 * 1024 {
        anyhow::bail!("字幕文件过大: {} bytes", meta.len());
    }

    let content = tokio::fs::read_to_string(&resolved).await?;
    Ok(content)
}

/// 在字节缓冲中定位 SSE 事件分隔符 "\n\n" 的起始下标
fn find_double_newline(buf: &[u8]) -> Option<usize> {
    buf.windows(2).position(|w| w == b"\n\n")
}

#[cfg(test)]
mod tests {
    use super::read_subtitle_json;

    #[tokio::test]
    async fn rejects_path_traversal() {
        let result = read_subtitle_json("../../../etc/passwd").await;
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("非法路径"));
    }

    #[tokio::test]
    async fn rejects_disallowed_extension() {
        let result = read_subtitle_json("/tmp/secret.key").await;
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("禁止读取此类型文件"));
    }

    #[tokio::test]
    async fn rejects_outside_output_subtitle() {
        // 临时建一个有效扩展名的文件在系统 tmp，且不在 output/subtitle 下
        let mut tmp = std::env::temp_dir();
        tmp.push(format!("rs_subtest_{}.srt", std::process::id()));
        tokio::fs::write(&tmp, b"test").await.unwrap();

        let result = read_subtitle_json(tmp.to_str().unwrap()).await;
        let _ = tokio::fs::remove_file(&tmp).await;

        assert!(result.is_err());
        let msg = result.unwrap_err().to_string();
        assert!(
            msg.contains("不在允许的字幕输出目录") || msg.contains("路径不存在"),
            "unexpected: {}",
            msg
        );
    }
}
