//! TTS 引擎服务 — 通过 HTTP 调用 Python TTS Server

use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::sync::Mutex;

// Python TTS Server 默认地址
const DEFAULT_TTS_SERVER_URL: &str = "http://127.0.0.1:9880";

/// 获取 TTS Server URL（支持环境变量覆盖）
fn tts_server_url() -> String {
    std::env::var("MARUAUDIO_TTS_URL").unwrap_or_else(|_| DEFAULT_TTS_SERVER_URL.to_string())
}

// ---- 数据结构 ----

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EngineStatus {
    pub engine: String,
    pub available: bool,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub device: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vram_mb: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthResponse {
    pub status: String,
    pub engines: Vec<EngineStatus>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum SseEvent {
    #[serde(rename = "progress")]
    Progress {
        progress: f64,
        message: String,
        segment_current: i32,
        segment_total: i32,
    },
    #[serde(rename = "complete")]
    Complete {
        output_path: String,
        duration_seconds: f64,
        rtf: f64,
    },
    #[serde(rename = "error")]
    Error { message: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SynthesizeRequest {
    pub engine: String,
    pub text: String,
    pub speaker_audio_path: String,
    pub inference_mode: String,
    pub interval_silence: i32,
    pub max_text_tokens_per_segment: i32,
    pub bucket_max_size: i32,
    pub emotion_method: String,
    pub emotion_vector: Option<Vec<f64>>,
    pub emotion_text: Option<String>,
    pub emotion_audio_path: Option<String>,
    pub emo_alpha: f64,
    pub temperature: f64,
    pub top_p: f64,
    pub top_k: i32,
    pub num_beams: i32,
    pub repetition_penalty: f64,
    pub max_mel_tokens: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SynthesizeResponse {
    pub output_path: String,
}

/// TTS 服务状态（Tauri managed state）
#[derive(Debug)]
pub struct TtsState {
    /// 当前推理任务 ID（预留给未来多任务并发调度）
    #[allow(dead_code)]
    current_task_id: AtomicU64,
    /// 是否正在推理
    is_synthesizing: AtomicBool,
    /// HTTP 客户端
    client: reqwest::Client,
    /// 取消令牌
    cancel_token: Arc<Mutex<Option<tokio_util::sync::CancellationToken>>>,
}

impl TtsState {
    pub fn new() -> Self {
        Self {
            current_task_id: AtomicU64::new(0),
            is_synthesizing: AtomicBool::new(false),
            client: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(600))
                .build()
                .unwrap_or_default(),
            cancel_token: Arc::new(Mutex::new(None)),
        }
    }

    #[allow(dead_code)]
    pub fn is_synthesizing(&self) -> bool {
        self.is_synthesizing.load(Ordering::Relaxed)
    }

    pub fn set_synthesizing(&self, val: bool) {
        self.is_synthesizing.store(val, Ordering::Relaxed);
    }

    /// 原子地尝试开始推理：仅当当前空闲（false→true）时返回 true，
    /// 避免「检查后置位」之间的 TOCTOU 竞态导致并发双任务
    pub fn try_begin_synthesis(&self) -> bool {
        self.is_synthesizing
            .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
            .is_ok()
    }

    #[allow(dead_code)]
    pub fn next_task_id(&self) -> u64 {
        self.current_task_id.fetch_add(1, Ordering::Relaxed) + 1
    }

    #[allow(dead_code)]
    pub fn current_task_id(&self) -> u64 {
        self.current_task_id.load(Ordering::Relaxed)
    }
}

// ---- 服务方法 ----

/// 健康检查 — 检测 Python TTS Server 是否运行及引擎状态
pub async fn check_health(state: &TtsState) -> Result<HealthResponse> {
    let url = format!("{}/health", tts_server_url());
    let resp = state.client.get(&url).send().await?;
    let health: HealthResponse = resp.json().await?;
    Ok(health)
}

/// 同步推理
pub async fn synthesize(state: &TtsState, req: SynthesizeRequest) -> Result<SynthesizeResponse> {
    let url = format!("{}/synthesize", tts_server_url());
    let resp = state.client.post(&url).json(&req).send().await?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(anyhow::anyhow!("TTS Server 错误 ({}): {}", status, body));
    }

    let result: SynthesizeResponse = resp.json().await?;
    Ok(result)
}

/// 预加载引擎
pub async fn preload_engine(state: &TtsState, engine_name: &str) -> Result<()> {
    let url = format!("{}/engine/{}/preload", tts_server_url(), engine_name);
    let resp = state.client.post(&url).send().await?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(anyhow::anyhow!("预加载失败 ({}): {}", status, body));
    }

    Ok(())
}

/// 取消当前推理
pub async fn cancel_synthesis(state: &TtsState) -> Result<()> {
    let token = state.cancel_token.lock().await;
    if let Some(ct) = token.as_ref() {
        ct.cancel();
    }
    state.set_synthesizing(false);
    Ok(())
}

/// 设置取消令牌
pub async fn set_cancel_token(state: &TtsState, ct: tokio_util::sync::CancellationToken) {
    let mut token = state.cancel_token.lock().await;
    *token = Some(ct);
}

/// 清除取消令牌
pub async fn clear_cancel_token(state: &TtsState) {
    let mut token = state.cancel_token.lock().await;
    *token = None;
}

/// SSE 流式推理 — 调用 Python Server 的 /synthesize/stream，
/// 解析 SSE 事件并通过 Tauri 事件系统推送到前端
pub async fn synthesize_stream(
    state: &TtsState,
    app: &AppHandle,
    req: SynthesizeRequest,
) -> Result<String> {
    let url = format!("{}/synthesize/stream", tts_server_url());
    let ct = tokio_util::sync::CancellationToken::new();
    set_cancel_token(state, ct.clone()).await;

    let resp = state
        .client
        .post(&url)
        .json(&req)
        // 流式推理可能远超 client 默认 600s（长文本），单独放宽到 1 小时兜底；
        // 真正的提前结束仍靠 CancellationToken。
        .timeout(std::time::Duration::from_secs(3600))
        .send()
        .await?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        clear_cancel_token(state).await;
        return Err(anyhow::anyhow!("TTS Server 错误 ({}): {}", status, body));
    }

    let mut stream = resp.bytes_stream();
    let mut output_path = String::new();
    let mut buffer: Vec<u8> = Vec::new();

    use futures_util::StreamExt;

    while let Some(chunk) = stream.next().await {
        if ct.is_cancelled() {
            clear_cancel_token(state).await;
            return Err(anyhow::anyhow!("推理已取消"));
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
                            SseEvent::Progress { progress, message, segment_current, segment_total } => {
                                let _ = app.emit("tts-progress", serde_json::json!({
                                    "type": "progress",
                                    "progress": (*progress * 100.0) as i32,
                                    "message": message,
                                    "segmentCurrent": segment_current,
                                    "segmentTotal": segment_total,
                                }));
                            }
                            SseEvent::Complete { output_path: path, .. } => {
                                output_path = path.clone();
                                let _ = app.emit("tts-complete", serde_json::json!({
                                    "type": "complete",
                                    "outputPath": path,
                                }));
                            }
                            SseEvent::Error { message } => {
                                let _ = app.emit("tts-error", serde_json::json!({
                                    "type": "error",
                                    "message": message,
                                }));
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
        return Err(anyhow::anyhow!("推理完成但未返回输出路径"));
    }

    Ok(output_path)
}

/// 在字节缓冲中定位 SSE 事件分隔符 "\n\n" 的起始下标
fn find_double_newline(buf: &[u8]) -> Option<usize> {
    buf.windows(2).position(|w| w == b"\n\n")
}
