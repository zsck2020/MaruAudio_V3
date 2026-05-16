<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import Tooltip from '../Tooltip.svelte';
  import { dubbing, type GenerationMode } from '$lib/stores/dubbing.svelte';

  let {
    onGenerate = () => {},
    onImport = () => {},
  }: {
    onGenerate?: () => void;
    onImport?: () => void;
  } = $props();

  // 推理模式选项
  const INFERENCE_OPTIONS: { value: GenerationMode; label: string }[] = [
    { value: 'normal', label: '普通推理' },
    { value: 'batch', label: '批量推理' },
  ];

  let showInferenceDropdown = $state(false);
  const inferenceMenuId = 'inference-mode-menu';

  function handleInferenceToggleKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      showInferenceDropdown = true;
    }

    if (event.key === 'Escape') {
      showInferenceDropdown = false;
    }
  }

  function handleInferenceFocusOut(event: FocusEvent) {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof HTMLElement && nextTarget.closest('.inference-dropdown-wrapper')) return;
    showInferenceDropdown = false;
  }

  function selectInferenceMode(mode: GenerationMode) {
    dubbing.generationMode = mode;
    showInferenceDropdown = false;
  }

  function getCurrentInferenceLabel(): string {
    return INFERENCE_OPTIONS.find(opt => opt.value === dubbing.generationMode)?.label ?? '普通推理';
  }
</script>

<div class="left-bottom-bar">
  <div class="bar-left">
    <!-- 推理模式下拉选择（仅轻量引擎支持批量推理） -->
    {#if dubbing.supportsBatchGeneration}
      <div class="inference-selector">
        <span class="inference-label">推理模式：</span>
        <div class="inference-dropdown-wrapper" onfocusout={handleInferenceFocusOut}>
          <button
            type="button"
            class="inference-dropdown"
            aria-haspopup="menu"
            aria-expanded={showInferenceDropdown}
            aria-controls={inferenceMenuId}
            onclick={() => showInferenceDropdown = !showInferenceDropdown}
            onkeydown={handleInferenceToggleKeydown}
          >
            <span>{getCurrentInferenceLabel()}</span>
            <Icon name="ant-design:down-outlined" size={10} color="var(--color-text-tertiary)" />
          </button>
          {#if showInferenceDropdown}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div id={inferenceMenuId} class="inference-menu" role="menu" tabindex="-1" onmouseleave={() => showInferenceDropdown = false}>
              {#each INFERENCE_OPTIONS as option (option.value)}
                <button
                  type="button"
                  class="inference-option"
                  class:active={dubbing.generationMode === option.value}
                  role="menuitemradio"
                  aria-checked={dubbing.generationMode === option.value}
                  onclick={() => selectInferenceMode(option.value)}
                >
                  {option.label}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <div class="divider"></div>
    {/if}

    <Tooltip text="导入 txt/docx 文件" position="top">
      <button type="button" class="action-btn" onclick={onImport}>
        <Icon name="import" size={14} color="var(--color-text-tertiary)" />
        <span>导入文本</span>
      </button>
    </Tooltip>

    <div class="divider"></div>

    <span class="word-count" class:over={dubbing.wordCount > 10000}>
      {dubbing.wordCount} 字
    </span>
  </div>

  <button
    type="button"
    class="generate-btn"
    onclick={onGenerate}
    disabled={dubbing.isGenerating || dubbing.wordCount === 0}
  >
    {#if dubbing.isGenerating}
      生成中...
    {:else}
      生成配音
    {/if}
  </button>
</div>

<style>
  .left-bottom-bar {
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--spacing-md);
    background-color: var(--color-bg-elevated);
    border-top: 1px solid var(--color-border-secondary);
    border-radius: 0;
    flex-shrink: 0;
  }

  .bar-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  /* 推理模式选择器 */
  .inference-selector {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .inference-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .inference-dropdown-wrapper {
    position: relative;
  }

  .inference-dropdown {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 120px;
    height: 28px;
    padding: 0 var(--spacing-sm);
    background-color: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    font-size: var(--font-size-sm);
    color: var(--color-text);
    transition: background-color var(--transition-duration) var(--transition-timing), color var(--transition-duration) var(--transition-timing), border-color var(--transition-duration) var(--transition-timing);
  }

  .inference-dropdown:hover {
    border-color: var(--color-primary);
  }

  .inference-dropdown:focus-visible,
  .inference-option:focus-visible,
  .action-btn:focus-visible,
  .generate-btn:focus-visible {
    box-shadow: inset 0 0 0 1px var(--color-primary);
  }

  .inference-menu {
    position: absolute;
    bottom: calc(100% + 4px);
    left: 0;
    min-width: 120px;
    background-color: var(--color-bg-elevated);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-sm);
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    z-index: 100;
  }

  .inference-option {
    display: flex;
    align-items: center;
    width: 100%;
    height: 32px;
    padding: 0 var(--spacing-sm);
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    text-align: left;
    transition: background-color var(--transition-duration) var(--transition-timing), color var(--transition-duration) var(--transition-timing), border-color var(--transition-duration) var(--transition-timing);
  }

  .inference-option:hover {
    background-color: var(--color-bg-spotlight);
    color: var(--color-text);
  }

  .inference-option.active {
    color: var(--color-primary);
    background-color: var(--color-bg-spotlight);
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 28px;
    padding: 0 var(--spacing-sm);
    background: transparent;
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    transition: background-color var(--transition-duration) var(--transition-timing), color var(--transition-duration) var(--transition-timing), border-color var(--transition-duration) var(--transition-timing);
  }

  .action-btn:hover {
    border-color: var(--color-primary);
    color: var(--color-text);
  }

  .divider {
    width: 1px;
    height: 16px;
    background-color: var(--color-border-secondary);
    flex-shrink: 0;
  }

  .word-count {
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
  }

  .word-count.over {
    color: var(--color-error);
  }

  .generate-btn {
    height: 32px;
    padding: 0 20px;
    background-color: var(--color-primary);
    color: var(--color-bg-elevated);
    border: none;
    border-radius: var(--border-radius);
    font-size: var(--font-size);
    font-weight: 500;
    cursor: pointer;
    transition: background-color var(--transition-duration) var(--transition-timing), color var(--transition-duration) var(--transition-timing), border-color var(--transition-duration) var(--transition-timing);
    flex-shrink: 0;
  }

  .generate-btn:hover:not(:disabled) {
    background-color: var(--color-primary-hover);
  }

  .generate-btn:active:not(:disabled) {
    background-color: var(--color-primary-active);
  }

  .generate-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
