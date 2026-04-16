<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import type { EngineMode } from '$lib/stores/dubbing.svelte';

  interface Props {
    currentMode: EngineMode;
    engineAvailable: { lightweight: boolean; emotion: boolean; cloud: boolean };
    engineChecking: boolean;
    onChange: (mode: EngineMode) => void;
  }

  let { currentMode, engineAvailable, engineChecking, onChange }: Props = $props();

  const engines: { id: EngineMode; label: string; icon: string; desc: string }[] = [
    { id: 'lightweight', label: '极速引擎', icon: 'zap', desc: 'IndexTTS 1.5 快速推理' },
    { id: 'emotion', label: '情感引擎', icon: 'heart', desc: 'IndexTTS 2.0 情感控制' },
    { id: 'cloud', label: '云端引擎', icon: 'cloud', desc: '云端 GPU 高性能推理' },
  ];

  function getStatusColor(mode: EngineMode): string {
    if (engineChecking) return 'var(--color-warning)';
    return engineAvailable[mode] ? 'var(--color-success)' : 'var(--color-error)';
  }

  function getStatusText(mode: EngineMode): string {
    if (engineChecking) return '检测中';
    return engineAvailable[mode] ? '可用' : '不可用';
  }
</script>

<div class="engine-selector" role="radiogroup" aria-label="选择推理引擎">
  {#each engines as engine (engine.id)}
    <button
      type="button"
      role="radio"
      aria-checked={currentMode === engine.id}
      class="engine-option"
      class:active={currentMode === engine.id}
      class:unavailable={!engineAvailable[engine.id] && !engineChecking}
      onclick={() => onChange(engine.id)}
    >
      <div class="engine-header">
        <Icon
          name={engine.icon}
          size={14}
          color={currentMode === engine.id ? 'var(--color-primary)' : 'var(--color-text-tertiary)'}
        />
        <span class="engine-label">{engine.label}</span>
        <span
          class="status-dot"
          class:checking={engineChecking}
          style="background-color: {getStatusColor(engine.id)}"
          title={getStatusText(engine.id)}
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
    transition: background-color var(--transition-duration) var(--transition-timing), color var(--transition-duration) var(--transition-timing), box-shadow var(--transition-duration) var(--transition-timing), opacity var(--transition-duration) var(--transition-timing);
    position: relative;
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
    opacity: 0.6;
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
