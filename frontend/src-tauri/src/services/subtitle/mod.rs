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

    pub fn is_running(&self) -> bool {
        self.is_running.load(Ordering::Relaxed)
    }

    pub fn set_running(&self, val: bool) {
        self.is_running.store(val, Ordering::Relaxed);
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

    let resp = state.client.post(&url).json(&req).send().await?;

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
    let mut buffer = String::new();

    use futures_util::StreamExt;

    while let Some(chunk) = stream.next().await {
        if ct.is_cancelled() {
            clear_cancel_token(state).await;
            return Err(anyhow::anyhow!("字幕任务已取消"));
        }

        let chunk = chunk?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        // 解析 SSE：以 "data: " 开头、"\n\n" 结尾
        while let Some(event_end) = buffer.find("\n\n") {
            let raw_event = buffer[..event_end].to_string();
            buffer = buffer[event_end + 2..].to_string();

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

/// 读取转录输出文件（JSON 格式）
pub async fn read_subtitle_json(path: &str) -> Result<String> {
    let content = tokio::fs::read_to_string(path).await?;
    Ok(content)
}
