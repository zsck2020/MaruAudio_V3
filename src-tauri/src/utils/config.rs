// 配置管理

use std::path::PathBuf;

pub struct ConfigManager {
    config_dir: PathBuf,
}

impl ConfigManager {
    pub fn new() -> Self {
        let config_dir = Self::get_config_dir();
        std::fs::create_dir_all(&config_dir).unwrap_or_default();
        
        Self { config_dir }
    }
    
    fn get_config_dir() -> PathBuf {
        // TODO: 根据平台获取配置目录
        PathBuf::from(".")
    }
}

