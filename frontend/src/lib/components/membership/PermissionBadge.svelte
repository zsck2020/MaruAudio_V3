<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import type { FeatureKey } from '$lib/stores/membership.svelte';
  import { FEATURE_INFO } from '$lib/stores/membership.svelte';

  interface Props {
    feature?: FeatureKey;
    label?: string;
    tone?: 'flagship' | 'cloud' | 'team' | 'free';
    locked?: boolean;
    compact?: boolean;
  }

  let {
    feature,
    label,
    tone,
    locked = false,
    compact = false,
  }: Props = $props();

  let resolvedLabel = $derived(label ?? (feature ? FEATURE_INFO[feature].badge : '权益'));
  let resolvedTone = $derived(tone ?? (
    resolvedLabel === '云端字符' ? 'cloud' : resolvedLabel === '团队' ? 'team' : resolvedLabel === '免费' ? 'free' : 'flagship'
  ));
</script>

<span class="permission-badge {resolvedTone}" class:compact title={feature ? FEATURE_INFO[feature].title : resolvedLabel}>
  {#if locked}
    <Icon name="lock" size={10} color="currentColor" />
  {/if}
  <span>{resolvedLabel}</span>
</span>

<style>
  .permission-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    height: 20px;
    padding: 0 7px;
    border-radius: var(--border-radius-pill);
    border: 1px solid transparent;
    font-size: var(--font-size-xs);
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
  }

  .permission-badge.compact {
    height: 18px;
    padding: 0 6px;
    font-size: 10px;
  }

  .permission-badge.flagship {
    color: color-mix(in srgb, var(--color-warning) 78%, var(--color-text));
    background: color-mix(in srgb, var(--color-warning) 16%, transparent);
    border-color: color-mix(in srgb, var(--color-warning) 38%, transparent);
  }

  .permission-badge.cloud {
    color: var(--color-info);
    background: color-mix(in srgb, var(--color-info) 14%, transparent);
    border-color: color-mix(in srgb, var(--color-info) 36%, transparent);
  }

  .permission-badge.team {
    color: var(--color-accent);
    background: color-mix(in srgb, var(--color-accent) 14%, transparent);
    border-color: color-mix(in srgb, var(--color-accent) 36%, transparent);
  }

  .permission-badge.free {
    color: var(--color-text-tertiary);
    background: color-mix(in srgb, var(--color-border) 38%, transparent);
    border-color: var(--color-border-secondary);
  }
</style>
