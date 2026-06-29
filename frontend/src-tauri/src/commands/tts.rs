use crate::services::tts::{self, TtsState, SynthesizeRequest, HealthResponse};
use crate::utils::error::AppResult;
use tauri::{AppHandle, State};

/// 检查 TTS Server 健康状态及引擎可用性
#[tauri::command]
pub async fn tts_check_health(state: State<'_, TtsState>) -> AppResult<HealthResponse> {
    let health = tts::check_health(&state).await?;
    Ok(health)
}

/// 同步推理 — 返回输出音频路径
#[tauri::command]
pub async fn tts_synthesize(state: State<'_, TtsState>, req: SynthesizeRequest) -> AppResult<String> {
    if !state.try_begin_synthesis() {
        return Err(crate::utils::error::AppError::Tts("已有推理任务进行中".to_string()));
    }

    let result = match tts::synthesize(&state, req).await {
        Ok(resp) => resp.output_path,
        Err(e) => {
            state.set_synthesizing(false);
            return Err(crate::utils::error::AppError::Tts(e.to_string()));
        }
    };

    state.set_synthesizing(false);
    Ok(result)
}

/// 预加载指定引擎
#[tauri::command]
pub async fn tts_preload_engine(state: State<'_, TtsState>, engine_name: String) -> AppResult<()> {
    tts::preload_engine(&state, &engine_name).await?;
    Ok(())
}

/// SSE 流式推理 — 通过 Tauri 事件系统推送进度到前端
#[tauri::command]
pub async fn tts_synthesize_stream(
    state: State<'_, TtsState>,
    app: AppHandle,
    req: SynthesizeRequest,
) -> AppResult<String> {
    if !state.try_begin_synthesis() {
        return Err(crate::utils::error::AppError::Tts("已有推理任务进行中".to_string()));
    }

    let result = match tts::synthesize_stream(&state, &app, req).await {
        Ok(path) => path,
        Err(e) => {
            state.set_synthesizing(false);
            return Err(crate::utils::error::AppError::Tts(e.to_string()));
        }
    };

    state.set_synthesizing(false);
    Ok(result)
}

/// 取消当前推理
#[tauri::command]
pub async fn tts_cancel(state: State<'_, TtsState>) -> AppResult<()> {
    tts::cancel_synthesis(&state).await?;
    Ok(())
}
