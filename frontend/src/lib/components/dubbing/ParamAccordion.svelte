<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import { dubbing } from '$lib/stores/dubbing.svelte';
  import TabParamControl from './TabParamControl.svelte';
  import TabEmotionControl from './TabEmotionControl.svelte';

  let paramsOpen = $state(true);
  let emotionOpen = $state(false);
</script>

<div class="accordion-container">
  <!-- 参数控制 -->
  <div class="accordion-section">
    <button
      type="button"
      class="accordion-header"
      onclick={() => paramsOpen = !paramsOpen}
    >
      <div class="header-left">
        <Icon
          name={paramsOpen ? 'ant-design:down-outlined' : 'ant-design:right-outlined'}
          size={10}
          color="var(--color-text-tertiary)"
        />
        <span class="header-title">参数控制</span>
      </div>
      <span
        class="reset-link"
        role="button"
        tabindex="0"
        onclick={(e: Event) => { e.stopPropagation(); }}
        onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter') e.stopPropagation(); }}
        title="恢复默认值"
      >
        默认值
      </span>
    </button>
    {#if paramsOpen}
      <div class="accordion-body">
        <TabParamControl />
      </div>
    {/if}
  </div>

  <!-- 情感控制 (仅情感引擎) -->
  {#if dubbing.showEmotionTab}
    <div class="accordion-section">
      <button
        type="button"
        class="accordion-header"
        onclick={() => emotionOpen = !emotionOpen}
      >
        <div class="header-left">
          <Icon
            name={emotionOpen ? 'ant-design:down-outlined' : 'ant-design:right-outlined'}
            size={10}
            color="var(--color-text-tertiary)"
          />
          <span class="header-title">情感控制</span>
        </div>
        <span class="header-badge">仅情感引擎</span>
      </button>
      {#if emotionOpen}
        <div class="accordion-body">
          <TabEmotionControl />
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .accordion-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .accordion-section {
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .accordion-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 36px;
    padding: 0 var(--spacing-md);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: background-color var(--transition-duration) var(--transition-timing);
  }

  .accordion-header:hover {
    background-color: var(--color-bg-spotlight);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .header-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-secondary);
  }

  .reset-link {
    font-size: 11px;
    color: var(--color-text-tertiary);
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: var(--border-radius-sm);
    transition:
      color var(--transition-duration) var(--transition-timing),
      background-color var(--transition-duration) var(--transition-timing);
  }

  .reset-link:hover {
    color: var(--color-primary);
    background-color: var(--color-bg-spotlight);
  }

  .header-badge {
    font-size: 10px;
    color: var(--color-text-tertiary);
    padding: 2px 6px;
    background: var(--color-bg-base);
    border-radius: var(--border-radius-sm);
  }

  .accordion-body {
    overflow: hidden;
  }
</style>
