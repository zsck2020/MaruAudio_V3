/**
 * 字幕子系统统一出口
 *
 * 路径约定：`$lib/subtitle/<symbol>`
 *
 * `defaultSubtitleProvider` 会按运行环境自动选择：
 * - Tauri 桌面端 → `tauriSubtitleProvider`（真实必剪 ASR）
 * - 浏览器 / 测试 → `mockSubtitleProvider`（mock 假数据）
 */

import { env } from '$lib/stores/environment.svelte';
import { mockSubtitleProvider, type SubtitleProvider } from './mock-provider';
import { tauriSubtitleProvider } from './tauri-provider';

export type { SubtitleCue } from './srt';
export {
  srtTimeToMs,
  msToSrtTime,
  parseSrt,
  formatSrt,
  formatVtt,
  shiftCues,
  totalDurationMs,
  normalize,
} from './srt';

export type {
  SubtitleProvider,
  SubtitleEvent,
  SubtitleProgressEvent,
  SubtitleResultEvent,
  SubtitleErrorEvent,
  TranscribeOptions,
  TranslateOptions,
  OptimizeOptions,
} from './mock-provider';
export { mockSubtitleProvider } from './mock-provider';
export { tauriSubtitleProvider } from './tauri-provider';

/**
 * 默认 provider：Tauri 环境用真实必剪 ASR，其余环境用 mock。
 * 字幕页直接 `import { defaultSubtitleProvider } from '$lib/subtitle'` 即可。
 */
export const defaultSubtitleProvider: SubtitleProvider = env.isTauri
  ? tauriSubtitleProvider
  : mockSubtitleProvider;
