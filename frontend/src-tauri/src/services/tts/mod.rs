use anyhow::Result;

/// TTS 提供商 trait（预留接口，暂未完全实现）
#[allow(unused)]
pub trait TtsProvider: Send + Sync {
    fn name(&self) -> &'static str;
    fn synthesize(&self, text: &str) -> Result<Vec<u8>>;
}

pub struct NoopTtsProvider;

impl TtsProvider for NoopTtsProvider {
    fn name(&self) -> &'static str {
        "noop"
    }

    fn synthesize(&self, _text: &str) -> Result<Vec<u8>> {
        Err(anyhow::anyhow!("TTS not implemented yet"))
    }
}
