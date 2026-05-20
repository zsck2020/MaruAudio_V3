/**
 * 音频波形解码工具 — Web Audio API 解码 + RMS 块采样
 *
 * 用法：
 *   const peaks = await computeWaveform(audioSrc, 300);
 *   // peaks: Float32Array，每个值 0~1，长度 = barCount
 */

const cache = new Map<string, Float32Array>();
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

/**
 * 给定音频 URL（blob: / http: / asset: 均可），
 * 返回 barCount 个 0~1 的 RMS 峰值数组。
 */
export async function computeWaveform(
  audioSrc: string,
  barCount: number = 300,
): Promise<Float32Array> {
  const key = `${audioSrc}::${barCount}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const resp = await fetch(audioSrc);
  const arrayBuffer = await resp.arrayBuffer();
  const ctx = getAudioContext();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

  const channelData = audioBuffer.getChannelData(0);
  const totalSamples = channelData.length;
  const blockSize = Math.floor(totalSamples / barCount);

  const peaks = new Float32Array(barCount);
  let globalMax = 0;

  for (let i = 0; i < barCount; i++) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, totalSamples);
    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += channelData[j] * channelData[j];
    }
    const rms = Math.sqrt(sum / (end - start));
    peaks[i] = rms;
    if (rms > globalMax) globalMax = rms;
  }

  if (globalMax > 0) {
    for (let i = 0; i < barCount; i++) {
      peaks[i] /= globalMax;
    }
  }

  cache.set(key, peaks);
  return peaks;
}

export function clearWaveformCache(audioSrc?: string): void {
  if (audioSrc) {
    for (const key of cache.keys()) {
      if (key.startsWith(audioSrc)) cache.delete(key);
    }
  } else {
    cache.clear();
  }
}
