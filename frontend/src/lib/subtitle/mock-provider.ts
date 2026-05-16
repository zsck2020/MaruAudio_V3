/**
 * 字幕业务的 Mock Provider
 *
 * 后端 ASR / 翻译 / 优化服务在 V3 尚未对接。本文件提供与未来真实 provider
 * 形态一致的接口，让字幕页 UI 可基于稳定契约开发，待后端就绪只需替换实现。
 *
 * 真实 provider 的签名约定与本 mock 完全一致；切换时仅需把
 * `defaultSubtitleProvider` 指向真实实现即可。
 */

import type { SubtitleCue } from './srt';

export type SubtitleProgressEvent = {
  type: 'progress';
  /** 0-100 */
  progress: number;
  message: string;
};

export type SubtitleResultEvent = {
  type: 'result';
  cues: SubtitleCue[];
};

export type SubtitleErrorEvent = {
  type: 'error';
  message: string;
};

export type SubtitleEvent = SubtitleProgressEvent | SubtitleResultEvent | SubtitleErrorEvent;

export interface TranscribeOptions {
  /** 音视频文件路径或 blob URL */
  source: string;
  /** 语言代码（如 zh / en） */
  language?: string;
  /** 是否启用说话人分离 */
  diarization?: boolean;
  /** 是否启用标点增强 */
  punctuation?: boolean;
  /** 是否启用时间轴精修 */
  timelineRefine?: boolean;
}

export interface TranslateOptions {
  cues: SubtitleCue[];
  /** 目标语言代码 */
  targetLang: string;
}

export interface OptimizeOptions {
  cues: SubtitleCue[];
  /** 优化等级：light=仅标点；standard=标点+断句；deep=口语化整理 */
  level?: 'light' | 'standard' | 'deep';
}

export interface SubtitleProvider {
  transcribe: (opt: TranscribeOptions, onEvent: (evt: SubtitleEvent) => void) => Promise<SubtitleCue[]>;
  translate: (opt: TranslateOptions, onEvent: (evt: SubtitleEvent) => void) => Promise<SubtitleCue[]>;
  optimize: (opt: OptimizeOptions, onEvent: (evt: SubtitleEvent) => void) => Promise<SubtitleCue[]>;
}

/** ------ 内部工具 ------ */

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const MOCK_TRANSCRIPT_LINES = [
  '如果这扇门真的通往过去，那我们必须在天亮前做出选择。',
  '我不怕改变历史，我只怕你再也回不来了。',
  '走廊尽头的钟声敲响，所有人的呼吸都停在了同一秒。',
  '快看，墙上的影子动了！',
  '你以为自己是在拯救他们，其实只是亲手打开了牢笼。',
  '我会回来，这是我给你的承诺。',
];

const MOCK_SPEAKERS = ['林澈', '苏晚', '旁白', '少年', '反派', '林澈'];

/** ------ Mock 实现 ------ */

export const mockSubtitleProvider: SubtitleProvider = {
  async transcribe(opt, onEvent) {
    const steps: Array<[number, string]> = [
      [5, '解析音视频元数据...'],
      [15, '提取音频轨道...'],
      [30, '上传至 ASR 引擎...'],
      [55, '识别中（中段）...'],
      [78, '识别中（后段）...'],
      [92, '生成字幕条目...'],
      [98, '应用标点与说话人分离...'],
    ];

    for (const [progress, message] of steps) {
      await delay(180);
      onEvent({ type: 'progress', progress, message });
    }

    const cues: SubtitleCue[] = MOCK_TRANSCRIPT_LINES.map((text, i) => {
      const start = i * 4_000 + 1_240;
      return {
        index: i + 1,
        startMs: start,
        endMs: start + 3_400,
        text,
        speaker: opt.diarization === false ? undefined : MOCK_SPEAKERS[i],
        confidence: 0.85 + Math.random() * 0.13,
      };
    });

    onEvent({ type: 'result', cues });
    return cues;
  },

  async translate(opt, onEvent) {
    onEvent({ type: 'progress', progress: 10, message: `准备翻译为 ${opt.targetLang}...` });
    await delay(220);
    onEvent({ type: 'progress', progress: 50, message: '翻译中...' });
    await delay(360);
    onEvent({ type: 'progress', progress: 90, message: '后处理对齐...' });
    await delay(140);

    const out = opt.cues.map((c) => ({
      ...c,
      text: `[${opt.targetLang}] ${c.text}`,
    }));
    onEvent({ type: 'result', cues: out });
    return out;
  },

  async optimize(opt, onEvent) {
    const level = opt.level ?? 'standard';
    onEvent({ type: 'progress', progress: 12, message: `字幕优化 · ${level}...` });
    await delay(180);
    onEvent({ type: 'progress', progress: 64, message: '调整断句与标点...' });
    await delay(220);

    const out = opt.cues.map((c) => ({
      ...c,
      text: level === 'deep'
        ? c.text.replace(/[,，；、 ]+/g, ' ').replace(/[!?！？]+/g, '。').trim()
        : c.text.replace(/\s+/g, ' ').trim(),
    }));
    onEvent({ type: 'progress', progress: 96, message: '完成' });
    await delay(60);
    onEvent({ type: 'result', cues: out });
    return out;
  },
};

/** 默认导出 mock provider；接通后端后切换为真实实现。 */
export const defaultSubtitleProvider: SubtitleProvider = mockSubtitleProvider;
