import { describe, it, expect } from 'vitest';
import {
  calculateEmotionSum,
  normalizeEmotionVector,
  createDefaultEmotionSliders,
  needsNormalization,
} from './emotion';
import type { EmotionSliders } from '$lib/types/dubbing';
import { EMOTION_SLIDER_SUM_MAX } from '$lib/types/dubbing';

describe('emotion utils', () => {
  describe('calculateEmotionSum', () => {
    it('should calculate sum of all emotion values', () => {
      const sliders: EmotionSliders = {
        happy: 0.1,
        angry: 0.2,
        sad: 0.3,
        afraid: 0.05,
        disgusted: 0.05,
        melancholic: 0.1,
        surprised: 0.05,
        calm: 0.05,
      };
      expect(calculateEmotionSum(sliders)).toBeCloseTo(0.9);
    });

    it('should return 0 for all-zero sliders', () => {
      const sliders: EmotionSliders = {
        happy: 0,
        angry: 0,
        sad: 0,
        afraid: 0,
        disgusted: 0,
        melancholic: 0,
        surprised: 0,
        calm: 0,
      };
      expect(calculateEmotionSum(sliders)).toBe(0);
    });

    it('should handle single emotion value', () => {
      const sliders: EmotionSliders = {
        happy: 0.5,
        angry: 0,
        sad: 0,
        afraid: 0,
        disgusted: 0,
        melancholic: 0,
        surprised: 0,
        calm: 0,
      };
      expect(calculateEmotionSum(sliders)).toBe(0.5);
    });
  });

  describe('normalizeEmotionVector', () => {
    it('should not modify sliders when sum is below max', () => {
      const sliders: EmotionSliders = {
        happy: 0.1,
        angry: 0.1,
        sad: 0.1,
        afraid: 0.1,
        disgusted: 0.1,
        melancholic: 0.1,
        surprised: 0.1,
        calm: 0.1,
      };
      const normalized = normalizeEmotionVector(sliders);
      expect(normalized).toEqual(sliders);
    });

    it('should scale down when sum exceeds max', () => {
      const sliders: EmotionSliders = {
        happy: 0.2,
        angry: 0.2,
        sad: 0.2,
        afraid: 0.2,
        disgusted: 0.2,
        melancholic: 0.2,
        surprised: 0.2,
        calm: 0.2,
      };
      const normalized = normalizeEmotionVector(sliders);
      const sum = calculateEmotionSum(normalized);
      expect(sum).toBeCloseTo(EMOTION_SLIDER_SUM_MAX);
    });

    it('should preserve proportions when normalizing', () => {
      const sliders: EmotionSliders = {
        happy: 0.4,
        angry: 0.2,
        sad: 0.2,
        afraid: 0.1,
        disgusted: 0.1,
        melancholic: 0.1,
        surprised: 0.1,
        calm: 0.1,
      };
      const normalized = normalizeEmotionVector(sliders);

      // Check that ratios are preserved
      const originalRatio = sliders.happy / sliders.angry;
      const normalizedRatio = normalized.happy / normalized.angry;
      expect(normalizedRatio).toBeCloseTo(originalRatio);
    });

    it('should handle zero sum without error', () => {
      const sliders: EmotionSliders = {
        happy: 0,
        angry: 0,
        sad: 0,
        afraid: 0,
        disgusted: 0,
        melancholic: 0,
        surprised: 0,
        calm: 0,
      };
      const normalized = normalizeEmotionVector(sliders);
      expect(normalized).toEqual(sliders);
    });

    it('should respect custom maxSum parameter', () => {
      const sliders: EmotionSliders = {
        happy: 0.3,
        angry: 0.3,
        sad: 0.3,
        afraid: 0.3,
        disgusted: 0,
        melancholic: 0,
        surprised: 0,
        calm: 0,
      };
      const customMax = 0.6;
      const normalized = normalizeEmotionVector(sliders, customMax);
      const sum = calculateEmotionSum(normalized);
      expect(sum).toBeCloseTo(customMax);
    });
  });

  describe('createDefaultEmotionSliders', () => {
    it('should create sliders with calm at 0.5 and others at 0', () => {
      const defaults = createDefaultEmotionSliders();
      expect(defaults.calm).toBe(0.5);
      expect(defaults.happy).toBe(0);
      expect(defaults.angry).toBe(0);
      expect(defaults.sad).toBe(0);
      expect(defaults.afraid).toBe(0);
      expect(defaults.disgusted).toBe(0);
      expect(defaults.melancholic).toBe(0);
      expect(defaults.surprised).toBe(0);
    });

    it('should create valid emotion sliders below max sum', () => {
      const defaults = createDefaultEmotionSliders();
      const sum = calculateEmotionSum(defaults);
      expect(sum).toBeLessThanOrEqual(EMOTION_SLIDER_SUM_MAX);
    });
  });

  describe('needsNormalization', () => {
    it('should return false when sum is below max', () => {
      const sliders: EmotionSliders = {
        happy: 0.1,
        angry: 0.1,
        sad: 0.1,
        afraid: 0.1,
        disgusted: 0.1,
        melancholic: 0.1,
        surprised: 0.1,
        calm: 0.1,
      };
      expect(needsNormalization(sliders)).toBe(false);
    });

    it('should return true when sum exceeds max', () => {
      const sliders: EmotionSliders = {
        happy: 0.2,
        angry: 0.2,
        sad: 0.2,
        afraid: 0.2,
        disgusted: 0.2,
        melancholic: 0.2,
        surprised: 0.2,
        calm: 0.2,
      };
      expect(needsNormalization(sliders)).toBe(true);
    });

    it('should return false when sum equals max', () => {
      const sliders: EmotionSliders = {
        happy: 0.1,
        angry: 0.1,
        sad: 0.1,
        afraid: 0.1,
        disgusted: 0.1,
        melancholic: 0.1,
        surprised: 0.1,
        calm: 0.1,
      };
      const normalized = normalizeEmotionVector(sliders);
      expect(needsNormalization(normalized)).toBe(false);
    });

    it('should respect custom maxSum parameter', () => {
      const sliders: EmotionSliders = {
        happy: 0.5,
        angry: 0,
        sad: 0,
        afraid: 0,
        disgusted: 0,
        melancholic: 0,
        surprised: 0,
        calm: 0,
      };
      expect(needsNormalization(sliders, 0.4)).toBe(true);
      expect(needsNormalization(sliders, 0.6)).toBe(false);
    });
  });
});
