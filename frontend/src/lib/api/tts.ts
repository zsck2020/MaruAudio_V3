/**
 * TTS API 调用层 — 封装 Tauri invoke 与 Rust TTS 服务交互
 */

import { invoke } from '@tauri-apps/api/core';

// ---- 类型定义 ----

export interface EngineStatus {
  engine: string;
  available: boolean;
  message: string;
  device?: string;
  vram_mb?: number;
}

export interface HealthResponse {
  status: string;
  engines: EngineStatus[];
}

export interface SynthesizeRequest {
  engine: string;
  text: string;
  speaker_audio_path: string;
  inference_mode: string;
  interval_silence: number;
  max_text_tokens_per_segment: number;
  bucket_max_size: number;
  emotion_method: string;
  emotion_vector?: number[];
  emotion_text?: string;
  emotion_audio_path?: string;
  emo_alpha: number;
  temperature: number;
  top_p: number;
  top_k: number;
  num_beams: number;
  repetition_penalty: number;
  max_mel_tokens: number;
}

// ---- API 方法 ----

/**
 * 检查 TTS Server 健康状态及引擎可用性
 */
export async function checkHealth(): Promise<HealthResponse> {
  return invoke<HealthResponse>('tts_check_health');
}

/**
 * 同步推理 — 返回输出音频路径
 */
export async function synthesize(req: SynthesizeRequest): Promise<string> {
  return invoke<string>('tts_synthesize', { req });
}

/**
 * 预加载指定引擎
 */
export async function preloadEngine(engineName: string): Promise<void> {
  return invoke('tts_preload_engine', { engineName });
}

/**
 * 取消当前推理
 */
export async function cancelSynthesis(): Promise<void> {
  return invoke('tts_cancel');
}

/**
 * 检查引擎健康状态（engine_health 命令）
 */
export async function engineHealth(): Promise<HealthResponse> {
  return invoke<HealthResponse>('engine_health');
}

/**
 * 获取 output 目录路径（从 TTS Server 获取）
 */
export interface OutputDirResponse {
  root: string;
  audio: string;
  video: string;
  subtitle: string;
  ref_audio: string;
  emo_audio: string;
  preset: string;
}

export async function getOutputDir(): Promise<OutputDirResponse> {
  const resp = await fetch('http://127.0.0.1:9880/output-dir');
  if (!resp.ok) throw new Error('获取 output 目录失败');
  return resp.json();
}
