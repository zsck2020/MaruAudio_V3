use crate::utils::error::{AppError, AppResult};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportSegment {
    pub audio_path: String,
    pub text: String,
    pub role_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportResult {
    pub audio_path: String,
    pub srt_path: Option<String>,
    pub segment_count: usize,
    pub total_duration_ms: u64,
}

/// 拼接多段 WAV 音频为一个完整文件，可选生成 SRT 字幕
#[tauri::command]
pub async fn export_concat_audio(
    segments: Vec<ExportSegment>,
    output_path: String,
    gap_ms: u32,
    generate_srt: bool,
) -> AppResult<ExportResult> {
    if segments.is_empty() {
        return Err(AppError::InvalidInput("没有可导出的音频片段".into()));
    }

    let gap_samples_per_channel = |sample_rate: u32| -> usize {
        (sample_rate as u64 * gap_ms as u64 / 1000) as usize
    };

    let first_path = &segments[0].audio_path;
    let first_reader = hound::WavReader::open(first_path)
        .map_err(|e| AppError::File(format!("读取 WAV 失败 {}: {}", first_path, e)))?;
    let spec = first_reader.spec();
    drop(first_reader);

    let mut writer = hound::WavWriter::create(&output_path, spec)
        .map_err(|e| AppError::File(format!("创建 WAV 失败: {}", e)))?;

    let mut srt_entries: Vec<(u64, u64, String, String)> = Vec::new();
    let mut current_ms: u64 = 0;
    let gap_samples = gap_samples_per_channel(spec.sample_rate);

    for seg in &segments {
        if !Path::new(&seg.audio_path).exists() {
            return Err(AppError::File(format!("音频文件不存在: {}", seg.audio_path)));
        }

        let mut reader = hound::WavReader::open(&seg.audio_path)
            .map_err(|e| AppError::File(format!("读取 WAV 失败 {}: {}", seg.audio_path, e)))?;

        let seg_spec = reader.spec();
        if seg_spec.sample_rate != spec.sample_rate || seg_spec.channels != spec.channels {
            return Err(AppError::File(format!(
                "采样率/声道不一致: {} ({}/{}ch) vs 首段 ({}/{}ch)",
                seg.audio_path, seg_spec.sample_rate, seg_spec.channels,
                spec.sample_rate, spec.channels,
            )));
        }

        let start_ms = current_ms;

        match spec.sample_format {
            hound::SampleFormat::Int => {
                let samples: Vec<i32> = reader.samples::<i32>()
                    .filter_map(|s| s.ok())
                    .collect();
                for s in &samples {
                    writer.write_sample(*s)
                        .map_err(|e| AppError::File(format!("写入 WAV 失败: {}", e)))?;
                }
                let total_samples = samples.len() as u64;
                let duration_ms = total_samples * 1000 / (spec.sample_rate as u64 * spec.channels as u64);
                current_ms += duration_ms;
            }
            hound::SampleFormat::Float => {
                let samples: Vec<f32> = reader.samples::<f32>()
                    .filter_map(|s| s.ok())
                    .collect();
                for s in &samples {
                    writer.write_sample(*s)
                        .map_err(|e| AppError::File(format!("写入 WAV 失败: {}", e)))?;
                }
                let total_samples = samples.len() as u64;
                let duration_ms = total_samples * 1000 / (spec.sample_rate as u64 * spec.channels as u64);
                current_ms += duration_ms;
            }
        }

        srt_entries.push((start_ms, current_ms, seg.role_name.clone(), seg.text.clone()));

        if gap_ms > 0 {
            let silence_count = gap_samples * spec.channels as usize;
            match spec.sample_format {
                hound::SampleFormat::Int => {
                    for _ in 0..silence_count {
                        writer.write_sample(0i32)
                            .map_err(|e| AppError::File(format!("写入静音失败: {}", e)))?;
                    }
                }
                hound::SampleFormat::Float => {
                    for _ in 0..silence_count {
                        writer.write_sample(0.0f32)
                            .map_err(|e| AppError::File(format!("写入静音失败: {}", e)))?;
                    }
                }
            }
            current_ms += gap_ms as u64;
        }
    }

    writer.finalize()
        .map_err(|e| AppError::File(format!("写入 WAV 最终化失败: {}", e)))?;

    let srt_path = if generate_srt {
        let srt_file = output_path.replace(".wav", ".srt");
        let srt_content = build_srt(&srt_entries);
        tokio::fs::write(&srt_file, srt_content).await
            .map_err(|e| AppError::File(format!("写入 SRT 失败: {}", e)))?;
        Some(srt_file)
    } else {
        None
    };

    Ok(ExportResult {
        audio_path: output_path,
        srt_path,
        segment_count: segments.len(),
        total_duration_ms: current_ms,
    })
}

fn build_srt(entries: &[(u64, u64, String, String)]) -> String {
    let mut out = String::new();
    for (i, (start, end, role, text)) in entries.iter().enumerate() {
        out.push_str(&format!("{}\n", i + 1));
        out.push_str(&format!("{} --> {}\n", ms_to_srt(*start), ms_to_srt(*end)));
        out.push_str(&format!("[{}] {}\n\n", role, text));
    }
    out
}

fn ms_to_srt(ms: u64) -> String {
    let total_secs = ms / 1000;
    let millis = ms % 1000;
    let secs = total_secs % 60;
    let mins = (total_secs / 60) % 60;
    let hours = total_secs / 3600;
    format!("{:02}:{:02}:{:02},{:03}", hours, mins, secs, millis)
}
