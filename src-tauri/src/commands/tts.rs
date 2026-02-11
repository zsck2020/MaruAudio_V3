use crate::services::tts::{NoopTtsProvider, TtsProvider};

#[tauri::command]
pub fn tts_health() -> Result<&'static str, String> {
    let provider: &dyn TtsProvider = &NoopTtsProvider;
    match provider.synthesize("health_check") {
        Ok(_) => Ok(provider.name()),
        Err(e) => Err(format!("TTS health check failed: {}", e))
    }
}
