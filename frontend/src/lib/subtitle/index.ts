/**
 * 字幕子系统统一出口
 *
 * 路径约定：`$lib/subtitle/<symbol>`
 */

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
export { mockSubtitleProvider, defaultSubtitleProvider } from './mock-provider';
