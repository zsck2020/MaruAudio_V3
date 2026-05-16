/**
 * SRT 字幕解析与序列化工具
 *
 * 设计参考 V2 `backend/subtitle/subtitle_utils.py` 中的字幕时间换算约定，
 * 以纯函数 + 不可变数据风格在前端独立实现。
 */

/** 单条字幕条目 */
export interface SubtitleCue {
  /** 序号，从 1 开始 */
  index: number;
  /** 起始毫秒 */
  startMs: number;
  /** 结束毫秒 */
  endMs: number;
  /** 字幕文本，多行用 \n 分隔 */
  text: string;
  /** 角色（可选，部分 ASR 引擎会标注说话人） */
  speaker?: string;
  /** 置信度（0–1，可选） */
  confidence?: number;
}

const SRT_TIME_REGEX = /^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})$/;

/** 将 SRT 时间字符串 "HH:MM:SS,mmm" / "HH:MM:SS.mmm" 转毫秒。非法格式返回 NaN。 */
export function srtTimeToMs(time: string): number {
  const match = SRT_TIME_REGEX.exec(time.trim());
  if (!match) return NaN;
  const [, hh, mm, ss, ms] = match;
  return (
    Number(hh) * 3_600_000 +
    Number(mm) * 60_000 +
    Number(ss) * 1_000 +
    Number(ms.padEnd(3, '0').slice(0, 3))
  );
}

/** 将毫秒转 SRT 时间字符串 "HH:MM:SS,mmm"。负值视为 0。 */
export function msToSrtTime(ms: number): string {
  const safe = Math.max(0, Math.floor(ms));
  const hh = Math.floor(safe / 3_600_000);
  const mm = Math.floor((safe % 3_600_000) / 60_000);
  const ss = Math.floor((safe % 60_000) / 1_000);
  const mmm = safe % 1_000;
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${pad(hh)}:${pad(mm)}:${pad(ss)},${pad(mmm, 3)}`;
}

/** 解析 SRT 文本，返回字幕条目数组。容忍 BOM、CRLF、空块、HTML 标签。 */
export function parseSrt(content: string): SubtitleCue[] {
  if (!content) return [];
  // 去 BOM + 统一换行符
  const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();
  if (!normalized) return [];

  const blocks = normalized.split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];
  let fallbackIndex = 1;

  for (const block of blocks) {
    const lines = block.split('\n').filter(Boolean);
    if (lines.length === 0) continue;

    // 首行可能是纯数字序号，也可能直接是时间轴。注意：
    // parseInt('00:00:01,000') === 0，因此必须用严格的全数字正则判断。
    let cursor = 0;
    let index: number;
    if (/^\d+$/.test(lines[0])) {
      index = Number.parseInt(lines[0], 10);
      cursor = 1;
    } else {
      index = fallbackIndex;
    }
    fallbackIndex = Math.max(fallbackIndex + 1, index + 1);

    const timeLine = lines[cursor];
    if (!timeLine) continue;
    cursor += 1;

    const timeMatch = /([\d:.,]+)\s*-->\s*([\d:.,]+)/.exec(timeLine);
    if (!timeMatch) continue;
    const startMs = srtTimeToMs(timeMatch[1]);
    const endMs = srtTimeToMs(timeMatch[2]);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) continue;

    const text = lines
      .slice(cursor)
      .join('\n')
      .replace(/<[^>]+>/g, '') // 去除 SRT 偶尔出现的 HTML 标签
      .trim();

    cues.push({ index, startMs, endMs, text });
  }

  return cues;
}

/** 将字幕条目数组序列化为 SRT 文本（行尾使用 \n） */
export function formatSrt(cues: SubtitleCue[]): string {
  return (
    cues
      .map((cue, i) => {
        const idx = cue.index ?? i + 1;
        return [
          String(idx),
          `${msToSrtTime(cue.startMs)} --> ${msToSrtTime(cue.endMs)}`,
          cue.text ?? '',
        ].join('\n');
      })
      .join('\n\n') + '\n'
  );
}

/** 把 SRT 转为 VTT */
export function formatVtt(cues: SubtitleCue[]): string {
  const body = cues
    .map((cue, i) => {
      const idx = cue.index ?? i + 1;
      const start = msToSrtTime(cue.startMs).replace(',', '.');
      const end = msToSrtTime(cue.endMs).replace(',', '.');
      return [String(idx), `${start} --> ${end}`, cue.text ?? ''].join('\n');
    })
    .join('\n\n');
  return `WEBVTT\n\n${body}\n`;
}

/** 简单的"按 ms 平移"工具，用于整体字幕轴前后偏移 */
export function shiftCues(cues: SubtitleCue[], deltaMs: number): SubtitleCue[] {
  return cues.map((c) => ({
    ...c,
    startMs: Math.max(0, c.startMs + deltaMs),
    endMs: Math.max(0, c.endMs + deltaMs),
  }));
}

/** 计算字幕总时长（取最后一条 endMs；空列表返回 0） */
export function totalDurationMs(cues: SubtitleCue[]): number {
  if (cues.length === 0) return 0;
  return cues.reduce((max, c) => Math.max(max, c.endMs), 0);
}

/** 按时间排序并重排 index */
export function normalize(cues: SubtitleCue[]): SubtitleCue[] {
  return [...cues]
    .sort((a, b) => a.startMs - b.startMs)
    .map((c, i) => ({ ...c, index: i + 1 }));
}
