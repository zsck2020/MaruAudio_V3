<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import { dubbing, type EngineMode } from '$lib/stores/dubbing.svelte';

  const engines: { id: EngineMode; label: string; icon: string; desc: string }[] = [
    { id: 'lightweight', label: '轻量引擎', icon: 'zap', desc: '本地推理 · 速度优先' },
    { id: 'emotion', label: '情感引擎', icon: 'heart', desc: '本地推理 · 情感丰富' },
    { id: 'cloud', label: '云端引擎', icon: 'cloud', desc: '云端推理 · 免本地显存' },
  ];

  function statusColor(mode: EngineMode): string {
    if (dubbing.engineChecking) return 'var(--color-warning)';
    return dubbing.engineAvailable[mode]?.available
      ? 'var(--color-success)'
      : 'var(--color-error)';
  }

  function statusText(mode: EngineMode): string {
    if (dubbing.engineChecking) return '检测中...';
    return dubbing.engineAvailable[mode]?.message ?? '未知状态';
  }

  function handleSelect(mode: EngineMode) {
    dubbing.setEngine(mode);
  }
</script>

<div class="engine-selector" role="radiogroup" aria-label="选择推理引擎">
  {#each engines as engine (engine.id)}
    <button
      type="button"
      role="radio"
      aria-checked={dubbing.engineMode === engine.id}
      class="engine-option"
      class:active={dubbing.engineMode === engine.id}
      class:unavailable={!dubbing.engineAvailable[engine.id]?.available && !dubbing.engineChecking}
      onclick={() => handleSelect(engine.id)}
      title={`${engine.label} · ${statusText(engine.id)}`}
    >
      <div class="engine-header">
        <Icon
          name={engine.icon}
          size={14}
          color={dubbing.engineMode === engine.id ? 'var(--color-primary)' : 'var(--color-text-tertiary)'}
        />
        <span class="engine-label">{engine.label}</span>
        <span
          class="status-dot"
          class:checking={dubbing.engineChecking}
          style="background-color: {statusColor(engine.id)}"
          aria-hidden="true"
        ></span>
      </div>
      <span class="engine-desc">{engine.desc}</span>
    </button>
  {/each}
</div>

<style>
  .engine-selector {
    display: flex;
    gap: 2px;
    padding: var(--spacing-sm);
    background-color: var(--color-bg-base);
    border-bottom: 1px solid var(--color-border-secondary);
    flex-shrink: 0;
  }

  .engine-option {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: var(--spacing-sm) var(--spacing-xs);
    background: transparent;
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition:
      background-color var(--transition-duration) var(--transition-timing),
      color var(--transition-duration) var(--transition-timing),
      box-shadow var(--transition-duration) var(--transition-timing),
      opacity var(--transition-duration) var(--transition-timing);
    position: relative;
    width: 100%;
  }

  .engine-option:hover:not(.active) {
    background-color: var(--color-bg-elevated);
  }

  .engine-option.active {
    background-color: var(--color-bg-elevated);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .engine-option:focus-visible {
    box-shadow: inset 0 0 0 1px var(--color-primary);
  }

  .engine-option.unavailable {
    opacity: 0.55;
  }

  .engine-header {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .engine-label {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text-secondary);
    transition: color var(--transition-duration) var(--transition-timing);
  }

  .engine-option.active .engine-label {
    color: var(--color-text);
  }

  .engine-desc {
    font-size: 10px;
    color: var(--color-text-tertiary);
    white-space: nowrap;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
    transition: transform 0.2s ease;
  }

  .status-dot.checking {
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(0.8);
    }
  }

  .engine-option:hover .status-dot {
    transform: scale(1.2);
  }
</style>
