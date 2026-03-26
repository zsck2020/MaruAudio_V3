<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import { dubbing, type RightTab } from '$lib/stores/dubbing.svelte';
  import TabReferenceAudio from './TabReferenceAudio.svelte';
  import TabParamControl from './TabParamControl.svelte';
  import TabEmotionControl from './TabEmotionControl.svelte';

  const TABS: { id: RightTab; icon: string; label: string; emotionOnly?: boolean }[] = [
    { id: 'audio', icon: 'sound', label: '参考音频' },
    { id: 'params', icon: 'sliders', label: '参数控制' },
    { id: 'emotion', icon: 'heart', label: '情感控制', emotionOnly: true },
  ];

  let visibleTabs = $derived(
    TABS.filter(t => !t.emotionOnly || dubbing.showEmotionTab)
  );
</script>

<div class="param-tabs-container">
  {#if dubbing.engineMode === 'cloud'}
    <div class="cloud-strip" role="status">
      <Icon name="cloud" size={14} color="var(--color-primary)" />
      <span class="cloud-strip-text">
        云端模式需登录且余额充足。余额展示待对接接口；不可用时会提示登录或充值。
      </span>
    </div>
  {/if}
  <div class="tabs-header">
    {#each visibleTabs as tab (tab.id)}
      <button
        class="tab-btn"
        class:active={dubbing.activeTab === tab.id}
        onclick={() => dubbing.activeTab = tab.id}
      >
        <Icon name={tab.icon} size={14} color={dubbing.activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-tertiary)'} />
        <span>{tab.label}</span>
      </button>
    {/each}
  </div>

  <div class="tabs-content">
    {#if dubbing.activeTab === 'audio'}
      <TabReferenceAudio />
    {:else if dubbing.activeTab === 'params'}
      <TabParamControl />
    {:else if dubbing.activeTab === 'emotion' && dubbing.showEmotionTab}
      <TabEmotionControl />
    {/if}
  </div>
</div>

<style>
  .param-tabs-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    border-radius: 0;
  }

  .cloud-strip {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-bg-container);
    border-bottom: 1px solid var(--color-border-secondary);
    flex-shrink: 0;
  }

  .cloud-strip-text {
    font-size: 11px;
    line-height: 1.4;
    color: var(--color-text-tertiary);
  }

  .tabs-header {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--color-border-secondary);
    flex-shrink: 0;
  }

  .tab-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 40px;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
    transition: all var(--transition-duration) var(--transition-timing);
  }

  .tab-btn:hover {
    color: var(--color-text-secondary);
  }

  .tab-btn.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
  }

  .tabs-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }
</style>
