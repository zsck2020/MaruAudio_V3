use crate::services::subtitle::{self, SubtitleState, TranscribeRequest};
use crate::utils::error::AppResult;
use tauri::{AppHandle, State};

/// SSE 流式字幕转录 — 通过 Tauri 事件系统推送进度
#[tauri::command]
pub async fn subtitle_transcribe_stream(
    state: State<'_, SubtitleState>,
    app: AppHandle,
    req: TranscribeRequest,
) -> AppResult<String> {
    if state.is_running() {
        return Err(crate::utils::error::AppError::Tts(
            "已有字幕任务进行中".to_string(),
        ));
    }
    state.set_running(true);

    let result = match subtitle::transcribe_stream(&state, &app, req).await {
        Ok(path) => path,
        Err(e) => {
            state.set_running(false);
            return Err(crate::utils::error::AppError::Tts(e.to_string()));
        }
    };

    state.set_running(false);
    Ok(result)
}

/// 取消当前字幕任务
#[tauri::command]
pub async fn subtitle_cancel(state: State<'_, SubtitleState>) -> AppResult<()> {
    subtitle::cancel_transcribe(&state).await?;
    Ok(())
}

/// 读取转录输出文件（前端拿到 outputPath 后可读 JSON 内容）
#[tauri::command]
pub async fn subtitle_read_output(path: String) -> AppResult<String> {
    let content = subtitle::read_subtitle_json(&path)
        .await
        .map_err(|e| crate::utils::error::AppError::Tts(e.to_string()))?;
    Ok(content)
}
