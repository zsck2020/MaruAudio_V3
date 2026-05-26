<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import Tooltip from '../Tooltip.svelte';
  import { dubbing, type EngineMode } from '$lib/stores/dubbing.svelte';
  import { toast } from '$lib/stores/toast.svelte';

  let {
    onSegment = () => {},
    onPause = () => {},
    onPinyin = () => {},
    onNumber = () => {},
  }: {
    onSegment?: () => void;
    onPause?: () => void;
    onPinyin?: () => void;
    onNumber?: () => void;
  } = $props();

  const ENGINE_LABELS: Record<EngineMode, string> = {
    lightweight: '轻量引擎',
    emotion: '情感引擎',
    cloud: '云端引擎',
  };

  const ENGINE_ICONS: Record<EngineMode, string> = {
    lightweight: 'thunderbolt',
    emotion: 'experiment',
    cloud: 'cloud',
  };

  let showEngineMenu = $state(false);
  const engines: EngineMode[] = ['lightweight', 'emotion', 'cloud'];
  const engineMenuId = 'toolbar-engine-menu';

  function handleEngineToggleKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      showEngineMenu = true;
    }

    if (event.key === 'Escape') {
      showEngineMenu = false;
    }
  }

  function handleEngineFocusOut(event: FocusEvent) {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof HTMLElement && nextTarget.closest('.engine-selector')) return;
    showEngineMenu = false;
  }

  function selectEngine(mode: EngineMode) {
    if (mode === 'cloud' && !dubbing.engineAvailable.cloud) {
      toast.warning('云端模式需登录且余额充足，生成前请完成登录/充值');
    } else if (mode === 'lightweight' && !dubbing.engineAvailable.lightweight) {
      toast.warning('轻量引擎不可用，可尝试云端引擎');
    } else if (mode === 'emotion' && !dubbing.engineAvailable.emotion) {
      toast.warning('情感引擎不可用或显存不足，可尝试轻量引擎或云端引擎');
    }
    dubbing.setEngine(mode);
    showEngineMenu = false;
  }
</script>

<div class="text-toolbar">
  <div class="toolbar-left">
    <Tooltip text="按语义自动分段" position="bottom">
      <button type="button" class="tool-btn" onclick={onSegment}>
        <Icon name="scissor" size={16} color="var(--color-text-tertiary)" />
        <span class="tool-label">文义分段</span>
      </button>
    </Tooltip>
    <Tooltip text="插入省略号（…）作为自然停顿" position="bottom">
      <button type="button" class="tool-btn" onclick={onPause}>
        <Icon name="pause" size={16} color="var(--color-text-tertiary)" />
        <span class="tool-label">插入停顿</span>
      </button>
    </Tooltip>
    <Tooltip text="插入拼音标注（如 zhong4 = 重）" position="bottom">
      <button type="button" class="tool-btn" onclick={onPinyin}>
        <Icon name="font-size" size={16} color="var(--color-text-tertiary)" />
        <span class="tool-label">拼音标注</span>
      </button>
    </Tooltip>
    <Tooltip text="引擎自动处理数字读法" position="bottom">
      <button type="button" class="tool-btn" onclick={onNumber}>
        <Icon name="number" size={16} color="var(--color-text-tertiary)" />
        <span class="tool-label">数字读法</span>
      </button>
    </Tooltip>
  </div>

  <div class="toolbar-right">
    <div class="engine-selector" onfocusout={handleEngineFocusOut}>
      <button
        type="button"
        class="engine-btn"
        aria-haspopup="menu"
        aria-expanded={showEngineMenu}
        aria-controls={engineMenuId}
        onclick={() => (showEngineMenu = !showEngineMenu)}
        onkeydown={handleEngineToggleKeydown}
      >
        <span
          class="status-dot"
          class:loading={dubbing.engineChecking}
          class:available={!dubbing.engineChecking && dubbing.engineAvailable[dubbing.engineMode]?.available}
          class:unavailable={!dubbing.engineChecking && !dubbing.engineAvailable[dubbing.engineMode]?.available}
        ></span>
        <Icon name={ENGINE_ICONS[dubbing.engineMode]} size={14} color="var(--color-primary)" />
        <span class="engine-label">{ENGINE_LABELS[dubbing.engineMode]}</span>
        <Icon name="ant-design:down-outlined" size={10} color="var(--color-text-tertiary)" />
      </button>
      {#if showEngineMenu}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div id={engineMenuId} class="engine-menu" role="menu" tabindex="-1" onmouseleave={() => (showEngineMenu = false)}>
          {#each engines as eng (eng)}
            <button
              type="button"
              class="engine-option"
              class:active={dubbing.engineMode === eng}
              role="menuitemradio"
              aria-checked={dubbing.engineMode === eng}
              onclick={() => selectEngine(eng)}
            >
              <Icon
                name={ENGINE_ICONS[eng]}
                size={14}
                color={dubbing.engineMode === eng ? 'var(--color-primary)' : 'var(--color-text-tertiary)'}
              />
              <span>{ENGINE_LABELS[eng]}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .text-toolbar {
    height: var(--control-height);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--spacing-sm);
    background-color: var(--color-bg-elevated);
    border-bottom: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg) 0 0 0;
    flex-shrink: 0;
  }

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .toolbar-right {
    display: flex;
    align-items: center;
  }

  /* 设计文档：对齐 TitleBar icon-btn 32×32，hover spotlight */
  .tool-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: var(--control-height-sm);
    height: var(--control-height-sm);
    padding: 0 var(--spacing-sm);
    background: transparent;
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: background-color var(--transition-duration) var(--transition-timing), color var(--transition-duration) var(--transition-timing), border-color var(--transition-duration) var(--transition-timing);
    flex-shrink: 0;
  }

  .tool-btn:hover {
    background-color: var(--color-bg-spotlight);
  }

  .tool-btn:focus-visible,
  .engine-btn:focus-visible,
  .engine-option:focus-visible {
    box-shadow: inset 0 0 0 1px var(--color-primary);
  }

  .tool-btn:hover :global(svg) {
    color: var(--color-text) !important;
  }

  .tool-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    white-space: nowrap;
  }

  .tool-btn:hover .tool-label {
    color: var(--color-text);
  }

  .engine-selector {
    position: relative;
  }

  .engine-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: var(--control-height-sm);
    height: var(--control-height-sm);
    padding: 0 var(--spacing-sm);
    background: transparent;
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: background-color var(--transition-duration) var(--transition-timing), color var(--transition-duration) var(--transition-timing), border-color var(--transition-duration) var(--transition-timing);
  }

  .engine-btn:hover {
    border-color: var(--color-primary);
  }

  .engine-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    white-space: nowrap;
  }

  .engine-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 4px;
    background-color: var(--color-bg-elevated);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
    overflow: hidden;
    z-index: 100;
    min-width: 140px;
  }

  .engine-option {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: var(--control-height-sm);
    padding: 0 var(--spacing-md);
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    transition: background-color var(--transition-duration) var(--transition-timing);
  }

  .engine-option:hover {
    background-color: var(--color-bg-spotlight);
  }

  .engine-option.active {
    color: var(--color-primary);
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status-dot.available {
    background-color: var(--color-success);
  }

  .status-dot.loading {
    background-color: var(--color-warning);
    box-shadow: 0 0 0 1px var(--color-bg-elevated);
  }

  .status-dot.unavailable {
    background-color: var(--color-error);
  }
</style>
