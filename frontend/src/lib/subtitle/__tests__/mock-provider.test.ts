import { describe, expect, test } from 'vitest';
import { mockSubtitleProvider } from '$lib/subtitle';
import type { SubtitleEvent } from '$lib/subtitle';

describe('mockSubtitleProvider.transcribe', () => {
  test('完成后返回非空 cues 并按时间递增', async () => {
    const events: SubtitleEvent[] = [];
    const cues = await mockSubtitleProvider.transcribe(
      { source: 'fake.mp4', language: 'zh', diarization: true },
      (e) => events.push(e),
    );

    expect(cues.length).toBeGreaterThan(0);

    for (let i = 1; i < cues.length; i++) {
      expect(cues[i].startMs).toBeGreaterThan(cues[i - 1].startMs);
    }

    const lastProgress = [...events].reverse().find((e) => e.type === 'progress');
    expect(lastProgress).toBeTruthy();
    expect(lastProgress!.type === 'progress' && lastProgress!.progress).toBeGreaterThanOrEqual(90);

    const last = events[events.length - 1];
    expect(last.type).toBe('result');
  });

  test('diarization=false 时不携带 speaker 字段', async () => {
    const cues = await mockSubtitleProvider.transcribe(
      { source: 'fake.mp4', diarization: false },
      () => {},
    );
    for (const c of cues) {
      expect(c.speaker).toBeUndefined();
    }
  });
});

describe('mockSubtitleProvider.translate', () => {
  test('为每条字幕加上 [lang] 前缀', async () => {
    const input = [
      { index: 1, startMs: 0, endMs: 1000, text: '原文' },
      { index: 2, startMs: 1000, endMs: 2000, text: 'hi' },
    ];
    const out = await mockSubtitleProvider.translate({ cues: input, targetLang: 'en' }, () => {});
    expect(out).toHaveLength(2);
    expect(out[0].text).toBe('[en] 原文');
    expect(out[1].text).toBe('[en] hi');
  });
});

describe('mockSubtitleProvider.optimize', () => {
  test('standard 仅折叠空白', async () => {
    const out = await mockSubtitleProvider.optimize(
      { cues: [{ index: 1, startMs: 0, endMs: 1000, text: '  hello   world  ' }], level: 'standard' },
      () => {},
    );
    expect(out[0].text).toBe('hello world');
  });

  test('deep 把感叹/疑问转句号', async () => {
    const out = await mockSubtitleProvider.optimize(
      { cues: [{ index: 1, startMs: 0, endMs: 1000, text: '真的吗！？太好啦！' }], level: 'deep' },
      () => {},
    );
    expect(out[0].text).toContain('。');
    expect(out[0].text).not.toMatch(/[!?！？]/);
  });
});
