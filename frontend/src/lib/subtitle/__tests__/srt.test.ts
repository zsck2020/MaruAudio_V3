import { describe, expect, test } from 'vitest';
import {
  srtTimeToMs,
  msToSrtTime,
  parseSrt,
  formatSrt,
  formatVtt,
  shiftCues,
  totalDurationMs,
  normalize,
} from '$lib/subtitle';
import type { SubtitleCue } from '$lib/subtitle';

describe('srtTimeToMs', () => {
  test('标准 HH:MM:SS,mmm 格式', () => {
    expect(srtTimeToMs('00:00:01,240')).toBe(1240);
    expect(srtTimeToMs('00:01:30,000')).toBe(90_000);
    expect(srtTimeToMs('01:00:00,000')).toBe(3_600_000);
  });
  test('容忍小数点分隔（VTT 风格）', () => {
    expect(srtTimeToMs('00:00:01.500')).toBe(1500);
  });
  test('非法格式返回 NaN', () => {
    expect(Number.isNaN(srtTimeToMs('not a time'))).toBe(true);
    expect(Number.isNaN(srtTimeToMs('00:00:01'))).toBe(true);
  });
  test('毫秒位补零', () => {
    expect(srtTimeToMs('00:00:01,1')).toBe(1100);
    expect(srtTimeToMs('00:00:01,12')).toBe(1120);
  });
});

describe('msToSrtTime', () => {
  test('基础转换', () => {
    expect(msToSrtTime(0)).toBe('00:00:00,000');
    expect(msToSrtTime(1240)).toBe('00:00:01,240');
    expect(msToSrtTime(3_661_240)).toBe('01:01:01,240');
  });
  test('负值固定为 0', () => {
    expect(msToSrtTime(-500)).toBe('00:00:00,000');
  });
  test('与 srtTimeToMs 互逆', () => {
    const cases = [0, 1, 240, 1_240, 90_000, 3_661_240, 86_399_999];
    for (const ms of cases) {
      expect(srtTimeToMs(msToSrtTime(ms))).toBe(ms);
    }
  });
});

describe('parseSrt / formatSrt', () => {
  const sample = `\uFEFF1\r\n00:00:01,240 --> 00:00:04,820\r\nHello, world!\r\n第二行\r\n\r\n2\r\n00:00:05,120 --> 00:00:08,900\r\n<i>This is italic</i>\r\n`;

  test('解析时去除 BOM、统一 CRLF、剥离 HTML 标签', () => {
    const cues = parseSrt(sample);
    expect(cues).toHaveLength(2);
    expect(cues[0].index).toBe(1);
    expect(cues[0].startMs).toBe(1240);
    expect(cues[0].endMs).toBe(4820);
    expect(cues[0].text).toBe('Hello, world!\n第二行');
    expect(cues[1].text).toBe('This is italic');
  });

  test('无序号块自动补 index', () => {
    const noIndex = '00:00:01,000 --> 00:00:02,000\n第一句';
    const cues = parseSrt(noIndex);
    expect(cues).toHaveLength(1);
    expect(cues[0].index).toBe(1);
  });

  test('空字符串/空白返回 []', () => {
    expect(parseSrt('')).toEqual([]);
    expect(parseSrt('  \n\n  ')).toEqual([]);
  });

  test('formatSrt 输出可被自身重新解析', () => {
    const cues: SubtitleCue[] = [
      { index: 1, startMs: 0, endMs: 1000, text: 'A' },
      { index: 2, startMs: 1100, endMs: 2200, text: 'B\nC' },
    ];
    const text = formatSrt(cues);
    const round = parseSrt(text);
    expect(round).toEqual(cues);
  });
});

describe('formatVtt', () => {
  test('以 WEBVTT 头开始、时间用小数点分隔', () => {
    const cues: SubtitleCue[] = [{ index: 1, startMs: 1240, endMs: 4820, text: 'X' }];
    const vtt = formatVtt(cues);
    expect(vtt.startsWith('WEBVTT\n\n')).toBe(true);
    expect(vtt).toContain('00:00:01.240 --> 00:00:04.820');
  });
});

describe('shiftCues / totalDurationMs / normalize', () => {
  test('shiftCues 平移并截到非负', () => {
    const cues: SubtitleCue[] = [{ index: 1, startMs: 500, endMs: 1000, text: 'A' }];
    expect(shiftCues(cues, 100)).toEqual([{ index: 1, startMs: 600, endMs: 1100, text: 'A' }]);
    expect(shiftCues(cues, -800)).toEqual([{ index: 1, startMs: 0, endMs: 200, text: 'A' }]);
  });
  test('totalDurationMs 空数组返回 0、非空取最大 endMs', () => {
    expect(totalDurationMs([])).toBe(0);
    expect(
      totalDurationMs([
        { index: 1, startMs: 0, endMs: 1_000, text: '' },
        { index: 2, startMs: 500, endMs: 5_000, text: '' },
      ]),
    ).toBe(5_000);
  });
  test('normalize 按时间排序并重排 index', () => {
    const cues: SubtitleCue[] = [
      { index: 7, startMs: 2_000, endMs: 3_000, text: 'B' },
      { index: 3, startMs: 0, endMs: 1_000, text: 'A' },
    ];
    const out = normalize(cues);
    expect(out.map((c) => c.text)).toEqual(['A', 'B']);
    expect(out.map((c) => c.index)).toEqual([1, 2]);
  });
});
