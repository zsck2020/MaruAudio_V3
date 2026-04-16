<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import { dubbing } from '$lib/stores/dubbing.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { VOICE_CATEGORIES, RECENT_VOICES } from '$lib/config/categories';

  const categories = VOICE_CATEGORIES;
  const recentVoices = RECENT_VOICES;

  function handleCategoryClick(categoryId: string) {
    toast.info(`进入${categories.find(c => c.id === categoryId)?.name}分类`);
  }

  function handleRecentVoiceClick(voiceName: string) {
    dubbing.setVoice('preset', voiceName, null);
    toast.success(`已选择：${voiceName}`);
  }

  function handlePresetLibrary() {
    toast.info('样音库选择弹窗开发中');
  }
</script>

<div class="preset-library">
  <!-- 搜索框 -->
  <div class="preset-search">
    <Icon name="search" size={14} color="var(--color-text-tertiary)" />
    <input type="text" placeholder="搜索样音..." class="preset-search-input" />
  </div>

  <!-- 快速分类 -->
  <div class="category-section">
    <div class="section-title">
      <span>快速分类</span>
    </div>
    <div class="category-grid">
      {#each categories as cat (cat.id)}
        <button
          type="button"
          class="category-btn"
          onclick={() => handleCategoryClick(cat.id)}
        >
          <span>{cat.name}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- 最近使用 -->
  <div class="recent-section">
    <div class="section-title">
      <span>最近使用</span>
    </div>
    <div class="recent-list">
      {#each recentVoices as voice (voice.id)}
        <button
          type="button"
          class="recent-item"
          onclick={() => handleRecentVoiceClick(voice.name)}
        >
          <div class="recent-left">
            <Icon name="play" size={14} color="var(--color-text-tertiary)" />
            <span class="recent-name">{voice.name}</span>
          </div>
          <span class="recent-count">使用{voice.usageCount}次</span>
          <Icon name="right" size={12} color="var(--color-text-disabled)" />
        </button>
      {/each}
    </div>
  </div>

  <!-- 浏览全部按钮 -->
  <button type="button" class="browse-all-btn" onclick={handlePresetLibrary}>
    <Icon name="library" size={16} color="#fff" />
    <span>浏览全部样音</span>
    <Icon name="right" size={14} color="rgba(255,255,255,0.7)" />
  </button>
</div>

<style>
  .preset-library {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  /* 搜索框 */
  .preset-search {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: 0 var(--spacing-sm);
    height: 40px;
    background: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    transition: border-color var(--transition-duration) var(--transition-timing);
  }

  .preset-search:focus-within {
    border-color: var(--color-primary);
  }

  .preset-search-input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--color-text);
    font-size: var(--font-size);
    outline: none;
  }

  .preset-search-input::placeholder {
    color: var(--color-text-disabled);
  }

  /* 分区标题 */
  .section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 500;
    color: var(--color-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: var(--spacing-xs);
  }

  /* 分类网格 */
  .category-section {
    display: flex;
    flex-direction: column;
  }

  .category-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-sm);
  }

  .category-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    padding: 0 var(--spacing-sm);
    background: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    transition:
      background-color var(--transition-duration) var(--transition-timing),
      border-color var(--transition-duration) var(--transition-timing),
      color var(--transition-duration) var(--transition-timing);
  }

  .category-btn:hover {
    background: var(--color-bg-elevated);
    border-color: var(--color-primary);
    color: var(--color-text);
  }

  /* 最近使用 */
  .recent-section {
    display: flex;
    flex-direction: column;
  }

  .recent-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .recent-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition:
      background-color var(--transition-duration) var(--transition-timing),
      border-color var(--transition-duration) var(--transition-timing);
  }

  .recent-item:hover {
    background: var(--color-bg-elevated);
    border-color: var(--color-border);
  }

  .recent-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex: 1;
  }

  .recent-name {
    font-size: var(--font-size-sm);
    color: var(--color-text);
  }

  .recent-count {
    font-size: 11px;
    color: var(--color-text-disabled);
  }

  /* 浏览全部按钮 */
  .browse-all-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    height: 44px;
    padding: 0 var(--spacing-lg);
    background-color: var(--color-primary);
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: var(--font-size);
    font-weight: 500;
    color: var(--color-bg-elevated);
    transition:
      background-color var(--transition-duration) var(--transition-timing),
      transform var(--transition-duration) var(--transition-timing),
      box-shadow var(--transition-duration) var(--transition-timing);
    margin-top: var(--spacing-xs);
  }

  .browse-all-btn:hover {
    background-color: var(--color-primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .browse-all-btn:active {
    background-color: var(--color-primary-active);
    transform: translateY(0);
  }

  .browse-all-btn :global(svg) {
    color: var(--color-bg-elevated);
  }
</style>
