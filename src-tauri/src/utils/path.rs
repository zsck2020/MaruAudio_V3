// 路径处理工具

use std::path::PathBuf;

pub fn get_app_data_dir() -> PathBuf {
    // TODO: 获取应用数据目录
    PathBuf::from(".")
}

pub fn get_outputs_dir() -> PathBuf {
    get_app_data_dir().join("outputs")
}

