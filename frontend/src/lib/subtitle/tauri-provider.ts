/**
 * 字幕业务的 Tauri Provider
 *
 * 通过 Tauri invoke + 事件订阅桥接到后端 `services/subtitle/` 的必剪 ASR 实现。
 *
 * - transcribe：调 `subtitle_transcribe_stream` 命令，监听 `subtitle-progress` /
 *   `subtitle-complete` / `subtitle-error` 三个事件；完成后通过 `subtitle_read_output`
 *   读 JSON 输出文件并转 SubtitleCue[]。
 * - translate / optimize：后端尚未实现，暂时透传给 mock 占位，等后端接口就绪
 *   后再补真实实现。
 */

import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { SubtitleCue } from './srt';
import {
  mockSubtitleProvider,
  type SubtitleEvent,
  type SubtitleProvider,
  type TranscribeOptions,
} from './mock-provider';

/** 后端命令请求体（与 Rust TranscribeRequest 一致） */
interface TauriTranscribeRequest {
  input_path: string;
  asr_model?: 'BIJIAN' | 'FasterWhisper' | 'WhisperAPI';
  language?: string;
  need_word_timestamp?: boolean;
  output_format?: 'srt' | 'vtt' | 'ass' | 'json';
}

/** 后端进度事件 payload */
interface BackendProgressEvent {
  type: 'progress';
  progress: number;
  message: string;
  segmentCurrent?: number;
  segmentTotal?: number;
}

interface BackendCompleteEvent {
  type: 'complete';
  outputPath: string;
  segmentCount?: number;
  durationMs?: number;
}

interface BackendErrorEvent {
  type: 'error';
  message: string;
}

/** Python ASRData.to_json() 输出格式：键是 1-based 字符串序号 */
type BackendCuesJson = Record<string, {
  start_time: number;
  end_time: number;
  original_subtitle: string;
  translated_subtitle?: string;
}>;

function backendJsonToCues(payload: BackendCuesJson): SubtitleCue[] {
  const entries = Object.entries(payload).sort(
    (a, b) => Number(a[0]) - Number(b[0]),
  );
  return entries.map(([key, value], i) => ({
    index: Number(key) || i + 1,
    startMs: value.start_time,
    endMs: value.end_time,
    text: value.original_subtitle ?? '',
  }));
}

async function readOutputAsCues(outputPath: string): Promise<SubtitleCue[]> {
  const raw = await invoke<string>('subtitle_read_output', { path: outputPath });
  let parsed: BackendCuesJson;
  try {
    parsed = JSON.parse(raw) as BackendCuesJson;
  } catch (err) {
    throw new Error(`字幕输出 JSON 解析失败：${err instanceof Error ? err.message : String(err)}`);
  }
  return backendJsonToCues(parsed);
}

export const tauriSubtitleProvider: SubtitleProvider = {
  async transcribe(opt: TranscribeOptions, onEvent: (evt: SubtitleEvent) => void): Promise<SubtitleCue[]> {
    const req: TauriTranscribeRequest = {
      input_path: opt.source,
      asr_model: 'BIJIAN',
      language: opt.language ?? 'zh',
      need_word_timestamp: false,
      output_format: 'json',
    };

    const unlisteners: UnlistenFn[] = [];
    let cues: SubtitleCue[] | null = null;
    let lastError: string | null = null;

    try {
      unlisteners.push(
        await listen<BackendProgressEvent>('subtitle-progress', (e) => {
          onEvent({
            type: 'progress',
            progress: e.payload.progress,
            message: e.payload.message,
          });
        }),
      );

      unlisteners.push(
        await listen<BackendErrorEvent>('subtitle-error', (e) => {
          lastError = e.payload.message;
          onEvent({ type: 'error', message: e.payload.message });
        }),
      );

      const outputPath = await invoke<string>('subtitle_transcribe_stream', { req });

      cues = await readOutputAsCues(outputPath);
      onEvent({ type: 'result', cues });
      return cues;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (lastError == null) {
        onEvent({ type: 'error', message: msg });
      }
      throw err;
    } finally {
      for (const fn of unlisteners) {
        try { fn(); } catch { /* ignore */ }
      }
    }
  },

  // 翻译 / 优化暂时透传 mock —— 等后端接口就绪后替换
  translate: mockSubtitleProvider.translate,
  optimize: mockSubtitleProvider.optimize,
};
