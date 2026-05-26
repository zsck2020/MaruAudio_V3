/**
 * TTS API 调用层 — 封装 Tauri invoke 与 Rust TTS 服务交互
 */

import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

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

/** SSE 流式推理事件类型 */
export interface TtsProgressEvent {
  type: 'progress';
  progress: number;
  message: string;
  segmentCurrent: number;
  segmentTotal: number;
}

export interface TtsCompleteEvent {
  type: 'complete';
  outputPath: string;
}

export interface TtsErrorEvent {
  type: 'error';
  message: string;
}

export type TtsStreamEvent = TtsProgressEvent | TtsCompleteEvent | TtsErrorEvent;

export interface TtsStreamCallbacks {
  onProgress?: (evt: TtsProgressEvent) => void;
  onComplete?: (evt: TtsCompleteEvent) => void;
  onError?: (evt: TtsErrorEvent) => void;
}

/**
 * SSE 流式推理 — 调用 Rust 命令，监听 Tauri 事件获取进度
 * 返回取消监听函数和 Promise
 */
export function synthesizeStream(
  req: SynthesizeRequest,
  callbacks: TtsStreamCallbacks,
): { promise: Promise<string>; cancel: () => void } {
  let unlisteners: UnlistenFn[] = [];
  let cancelled = false;

  const promise = (async () => {
    // 监听 Tauri 事件
    const unProgress = await listen<TtsProgressEvent>('tts-progress', (e) => {
      if (!cancelled) callbacks.onProgress?.(e.payload);
    });
    const unComplete = await listen<TtsCompleteEvent>('tts-complete', (e) => {
      if (!cancelled) callbacks.onComplete?.(e.payload);
    });
    const unError = await listen<TtsErrorEvent>('tts-error', (e) => {
      if (!cancelled) callbacks.onError?.(e.payload);
    });
    unlisteners = [unProgress, unComplete, unError];

    try {
      const outputPath = await invoke<string>('tts_synthesize_stream', { req });
      return outputPath;
    } finally {
      for (const fn of unlisteners) fn();
      unlisteners = [];
    }
  })();

  return {
    promise,
    cancel: () => {
      cancelled = true;
      for (const fn of unlisteners) fn();
      unlisteners = [];
      void invoke('tts_cancel');
    },
  };
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

// ==================== 人声分离 ====================

const TTS_SERVER_BASE = 'http://127.0.0.1:9880';

export interface VocalSeparateInfo {
  available: boolean;
  /** 'demucs' | 'librosa' | 'none' */
  method: string;
  supports_video: boolean;
  cut_duration_seconds: number;
}

export async function vocalSeparateInfo(): Promise<VocalSeparateInfo> {
  const resp = await fetch(`${TTS_SERVER_BASE}/vocal-separate/info`);
  if (!resp.ok) throw new Error('查询人声分离能力失败');
  return resp.json();
}

export interface VocalSeparateRequest {
  input_path: string;
  output_path?: string;
}

export interface VocalSeparateCompleteEvent {
  type: 'complete';
  output_path: string;
  method: string;
}

export interface StreamProgressEvent {
  type: 'progress';
  progress: number;
  message: string;
  segmentCurrent?: number;
  segmentTotal?: number;
}

export interface StreamErrorEvent {
  type: 'error';
  message: string;
}

interface SseCallbacks<TComplete> {
  onProgress?: (evt: StreamProgressEvent) => void;
  onComplete?: (evt: TComplete) => void;
  onError?: (evt: StreamErrorEvent) => void;
}

async function consumeSseStream<TComplete extends { type: 'complete' }>(
  url: string,
  body: unknown,
  callbacks: SseCallbacks<TComplete>,
): Promise<TComplete> {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(body),
  });

  if (!resp.ok || !resp.body) {
    const detail = await resp.text().catch(() => '');
    throw new Error(`HTTP ${resp.status}: ${detail.slice(0, 200)}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let completePayload: TComplete | null = null;
  let errorMessage: string | null = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);

      for (const line of rawEvent.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const json = line.slice(6).trim();
        if (!json) continue;

        let evt: { type: string } & Record<string, unknown>;
        try {
          evt = JSON.parse(json);
        } catch {
          continue;
        }

        if (evt.type === 'progress') {
          callbacks.onProgress?.(evt as unknown as StreamProgressEvent);
        } else if (evt.type === 'complete') {
          completePayload = evt as unknown as TComplete;
          callbacks.onComplete?.(completePayload);
        } else if (evt.type === 'error') {
          errorMessage = (evt as unknown as StreamErrorEvent).message;
          callbacks.onError?.(evt as unknown as StreamErrorEvent);
        }
      }
    }
  }

  if (errorMessage) throw new Error(errorMessage);
  if (!completePayload) throw new Error('未收到完成事件');
  return completePayload;
}

/**
 * 人声分离 — 视频/音频 → 提取 → 裁剪 15s → 分离人声 → 输出
 * 返回完整事件，进度通过 callbacks.onProgress 推送
 */
export function vocalSeparate(
  req: VocalSeparateRequest,
  callbacks: SseCallbacks<VocalSeparateCompleteEvent> = {},
): Promise<VocalSeparateCompleteEvent> {
  return consumeSseStream(`${TTS_SERVER_BASE}/vocal-separate`, req, callbacks);
}

// ==================== 字幕生成 ====================

export type AsrModel = 'BIJIAN' | 'FasterWhisper' | 'WhisperAPI';
export type SubtitleFormat = 'srt' | 'vtt' | 'ass' | 'json';

export interface TranscribeRequest {
  input_path: string;
  asr_model?: AsrModel;
  language?: string;
  need_word_timestamp?: boolean;
  output_format?: SubtitleFormat;
}

export interface TranscribeCompleteEvent {
  type: 'complete';
  output_path: string;
  segment_count: number;
  duration_ms: number;
}

/**
 * 字幕转录 — 音频/视频 → ASR → 字幕文件
 * 默认走必剪 (BIJIAN)，输出 SRT。
 *
 * Tauri 桌面端走 invoke 桥（生产 CSP 友好），浏览器测试回落到直接 HTTP SSE。
 * 签名保持稳定，调用方无感知。
 */
export async function transcribe(
  req: TranscribeRequest,
  callbacks: SseCallbacks<TranscribeCompleteEvent> = {},
): Promise<TranscribeCompleteEvent> {
  const payload: TranscribeRequest = {
    asr_model: 'BIJIAN',
    language: 'zh',
    need_word_timestamp: false,
    output_format: 'srt',
    ...req,
  };

  if (typeof window !== 'undefined') {
    try {
      const { isTauri } = await import('@tauri-apps/api/core');
      if (isTauri()) {
        return await transcribeViaInvoke(payload, callbacks);
      }
    } catch {
      // 不在 Tauri 环境（如 vitest jsdom），下面回落到 HTTP
    }
  }

  return consumeSseStream(`${TTS_SERVER_BASE}/transcribe`, payload, callbacks);
}

/** Tauri 桥接版字幕转录 — 走 subtitle_transcribe_stream 命令 + subtitle-* 事件 */
async function transcribeViaInvoke(
  req: TranscribeRequest,
  callbacks: SseCallbacks<TranscribeCompleteEvent>,
): Promise<TranscribeCompleteEvent> {
  const unlisteners: UnlistenFn[] = [];
  let completePayload: TranscribeCompleteEvent | null = null;
  let errorMessage: string | null = null;

  try {
    unlisteners.push(
      await listen<{ progress: number; message: string; segmentCurrent?: number; segmentTotal?: number }>('subtitle-progress', (e) => {
        callbacks.onProgress?.({
          type: 'progress',
          progress: (e.payload.progress ?? 0) / 100,
          message: e.payload.message ?? '',
          segmentCurrent: e.payload.segmentCurrent,
          segmentTotal: e.payload.segmentTotal,
        });
      }),
    );
    unlisteners.push(
      await listen<{ outputPath: string; segmentCount?: number; durationMs?: number }>(
        'subtitle-complete',
        (e) => {
          completePayload = {
            type: 'complete',
            output_path: e.payload.outputPath,
            segment_count: e.payload.segmentCount ?? 0,
            duration_ms: e.payload.durationMs ?? 0,
          };
        },
      ),
    );
    unlisteners.push(
      await listen<{ message: string }>('subtitle-error', (e) => {
        errorMessage = e.payload.message;
      }),
    );

    const outputPath = await invoke<string>('subtitle_transcribe_stream', { req });

    if (errorMessage) {
      callbacks.onError?.({ type: 'error', message: errorMessage });
      throw new Error(errorMessage);
    }

    if (completePayload) {
      callbacks.onComplete?.(completePayload);
      return completePayload;
    }

    // 兜底：Rust 已返回 outputPath，但 subtitle-complete 事件还未到（极少见）
    const fallback: TranscribeCompleteEvent = {
      type: 'complete',
      output_path: outputPath,
      segment_count: 0,
      duration_ms: 0,
    };
    callbacks.onComplete?.(fallback);
    return fallback;
  } finally {
    for (const fn of unlisteners) {
      try {
        fn();
      } catch {
        /* ignore */
      }
    }
  }
}

// ==================== LLM 台词拆分 ====================

// ==================== 预置样音 ====================

export interface PresetVoice {
  id: string;
  name: string;
  gender: string;
  language: string;
  description: string;
  tags: string[];
  display_tag: string;
  file_path: string;
  cover: string;
  duration?: number;
  is_premium: boolean;
  source: string;
}

export interface PresetsResponse {
  presets: PresetVoice[];
  count: number;
}

export async function listPresets(): Promise<PresetsResponse> {
  const resp = await fetch(`${TTS_SERVER_BASE}/presets`);
  if (!resp.ok) throw new Error('获取预置样音失败');
  return resp.json();
}

// ==================== LLM ====================

export interface LlmModelsResponse {
  models: string[];
  count: number;
}

export async function listLlmModels(apiBaseUrl: string, apiKey: string): Promise<LlmModelsResponse> {
  const resp = await fetch(`${TTS_SERVER_BASE}/llm-models`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_base_url: apiBaseUrl, api_key: apiKey }),
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    throw new Error(`获取模型列表失败 (${resp.status}): ${detail.slice(0, 200)}`);
  }

  return resp.json();
}

export interface SplitLinesRequest {
  text: string;
  api_base_url: string;
  api_key: string;
  model?: string;
  roles?: string[];
  emotions?: string[];
  strengths?: string[];
  custom_prompt?: string;
}

export interface SplitLineResult {
  role_name: string;
  text_content: string;
  emotion_name: string;
  strength_name: string;
}

export interface SplitLinesResponse {
  lines: SplitLineResult[];
  count: number;
}

export async function splitLines(req: SplitLinesRequest): Promise<SplitLinesResponse> {
  const resp = await fetch(`${TTS_SERVER_BASE}/split-lines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    throw new Error(`台词拆分失败 (${resp.status}): ${detail.slice(0, 200)}`);
  }

  return resp.json();
}
