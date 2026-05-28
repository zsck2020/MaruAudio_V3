import type { EngineMode } from '$lib/types/dubbing';
import { membership, type FeatureKey } from '$lib/stores/membership.svelte';
import { dubbing } from '$lib/stores/dubbing.svelte';

export function engineFeature(mode: EngineMode): FeatureKey | null {
  if (mode === 'emotion') return 'emotion_engine';
  if (mode === 'cloud') return 'cloud_engine';
  return null;
}

export function requireFeature(feature: FeatureKey): boolean {
  if (membership.canUseFeature(feature)) return true;
  membership.requestUpgrade(feature);
  return false;
}

export function requestEngineChange(mode: EngineMode): boolean {
  const feature = engineFeature(mode);
  if (feature && !requireFeature(feature)) return false;
  dubbing.setEngine(mode);
  return true;
}

export function requireGeneratePermission(engine: EngineMode, chars: number): boolean {
  const feature = engineFeature(engine);
  if (feature && !requireFeature(feature)) return false;

  if (engine === 'cloud') {
    const estimated = Math.max(0, chars);
    if (!membership.canGenerateCloud(estimated)) {
      membership.requestUpgrade('cloud_chars');
      return false;
    }
    return true;
  }

  if (!membership.canGenerateLocal(chars)) {
    membership.requestUpgrade('watermark_free');
    return false;
  }

  return true;
}
