<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import { dubbing } from '$lib/stores/dubbing.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { VOICE_CATEGORIES, RECENT_VOICES } from '$lib/config/categories';
  import type { VoiceSourceType } from '$lib/types/dubbing';
  import AudioUploader from './AudioUploader.svelte';
  import AudioPlayer from './AudioPlayer.svelte';
  import PresetLibrary from './PresetLibrary.svelte';

  // 跟踪 URL.createObjectURL 创建的对象 URL，用于释放内存
  let objectUrl: string | null = $state(null);

  // 来源选择：upload = 上传本地样音, preset = 选择预置样音
  let sourceType = $state<VoiceSourceType>('upload');

  // 使用集中配置的分类数据（预置样音页面使用）
  const categories = VOICE_CATEGORIES;
  const recentVoices = RECENT_VOICES;

  function onSourceChange(type: VoiceSourceType) {
    sourceType = type;
  }

  function handleCategoryClick(categoryId: string) {
    toast.info(`进入${categories.find(c => c.id === categoryId)?.name}分类`);
  }

  function handleRecentVoiceClick(voiceName: string) {
    dubbing.setVoice('preset', voiceName, null);
    toast.success(`已选择：${voiceName}`);
  }

  function handleUpload(file: File, url: string) {
    // 释放之前的 URL 以避免内存泄漏
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
    objectUrl = url;
    dubbing.setVoice('uploaded', file.name, url);
  }

  function handleRemove() {
    // 释放对象 URL 以避免内存泄漏
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
    dubbing.setVoice(null, '默认音色', null);
  }

  // 组件卸载时释放资源
  $effect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  });
</script>

<div class="ref-audio-panel">
  <!-- 来源选择 - 胶囊式分段选择器 -->
  <div class="source-selector" role="tablist" aria-label="样音来源">
    <button
      type="button"
      role="tab"
      class="source-tab"
      class:active={sourceType === 'upload'}
      onclick={() => onSourceChange('upload')}
    >
      <Icon name="upload" size={14} color={sourceType === 'upload' ? '#fff' : 'var(--color-text-secondary)'} />
      <span>上传本地样音</span>
    </button>
    <button
      type="button"
      role="tab"
      class="source-tab"
      class:active={sourceType === 'preset'}
      onclick={() => onSourceChange('preset')}
    >
      <Icon name="library" size={14} color={sourceType === 'preset' ? '#fff' : 'var(--color-text-secondary)'} />
      <span>选择预置样音</span>
    </button>
  </div>

  {#if sourceType === 'upload'}
    <!-- 上传区域 -->
    <div class="upload-section">
      {#if !dubbing.voiceAudioUrl}
        <AudioUploader onUpload={handleUpload} />
      {:else}
        <AudioPlayer audioUrl={dubbing.voiceAudioUrl} onRemove={handleRemove} />
      {/if}
    </div>
  {:else}
    <!-- 预置样音区域 -->
    <PresetLibrary />
  {/if}
</div>

<style>
  .ref-audio-panel {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
  }

  /* 来源选择 - 胶囊式分段选择器 */
  .source-selector {
    display: flex;
    gap: 4px;
    padding: 4px;
    background-color: var(--color-bg-base);
    border-radius: var(--border-radius);
  }

  .source-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 32px;
    padding: 0 var(--spacing-sm);
    background: transparent;
    border: none;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    transition: all var(--transition-duration) var(--transition-timing);
  }

  .source-tab:hover {
    color: var(--color-text);
  }

  .source-tab.active {
    background-color: var(--color-primary);
    color: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  /* 上传区域 */
  .upload-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }
</style>
