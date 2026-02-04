pub trait TtsProvider: Send + Sync {
    fn name(&self) -> &'static str;
    fn synthesize(&self, text: &str) -> Result<Vec<u8>, String>;
}

pub struct NoopTtsProvider;

impl TtsProvider for NoopTtsProvider {
    fn name(&self) -> &'static str {
        "noop"
    }

    fn synthesize(&self, _text: &str) -> Result<Vec<u8>, String> {
        Err("TTS not implemented yet".to_string())
    }
}


