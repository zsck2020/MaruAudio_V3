import type { EmotionSliders } from '$lib/types/dubbing';
import { EMOTION_SLIDER_SUM_MAX } from '$lib/types/dubbing';

/**
 * 计算情感滑块值的总和
 */
export function calculateEmotionSum(sliders: EmotionSliders): number {
  return Object.values(sliders).reduce((sum, value) => sum + value, 0);
}

/**
 * 归一化情感向量
 * 当总和超过最大值时，按比例缩放所有值
 *
 * @param sliders - 原始情感滑块值
 * @param maxSum - 最大允许总和（默认 0.8）
 * @returns 归一化后的情感滑块值
 */
export function normalizeEmotionVector(
  sliders: EmotionSliders,
  maxSum: number = EMOTION_SLIDER_SUM_MAX
): EmotionSliders {
  const sum = calculateEmotionSum(sliders);

  // 如果总和小于等于最大值或为零，无需归一化
  if (sum <= maxSum || sum === 0) {
    return sliders;
  }

  // 按比例缩放
  const scale = maxSum / sum;
  return {
    happy: sliders.happy * scale,
    angry: sliders.angry * scale,
    sad: sliders.sad * scale,
    afraid: sliders.afraid * scale,
    disgusted: sliders.disgusted * scale,
    melancholic: sliders.melancholic * scale,
    surprised: sliders.surprised * scale,
    calm: sliders.calm * scale,
  };
}

/**
 * 创建默认情感滑块值
 */
export function createDefaultEmotionSliders(): EmotionSliders {
  return {
    happy: 0,
    angry: 0,
    sad: 0,
    afraid: 0,
    disgusted: 0,
    melancholic: 0,
    surprised: 0,
    calm: 0.5,
  };
}

/**
 * 检查情感向量是否需要归一化
 */
export function needsNormalization(
  sliders: EmotionSliders,
  maxSum: number = EMOTION_SLIDER_SUM_MAX
): boolean {
  return calculateEmotionSum(sliders) > maxSum;
}
