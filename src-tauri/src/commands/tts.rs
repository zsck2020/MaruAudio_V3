use crate::services::tts::{NoopTtsProvider, TtsProvider};

#[tauri::command]
pub fn tts_health() -> &'static str {
    let provider: &dyn TtsProvider = &NoopTtsProvider;
    let _ = provider.synthesize("health_check");
    provider.name()
}



