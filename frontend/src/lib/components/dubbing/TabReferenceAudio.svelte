<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import { dubbing } from '$lib/stores/dubbing.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { VOICE_CATEGORIES, RECENT_VOICES } from '$lib/config/categories';
  import type { VoiceSourceType } from '$lib/types/dubbing';
  import AudioUploader from './AudioUploader.svelte';
  import AudioPlayer from './AudioPlayer.svelte';
  import PresetLibrary from './PresetLibrary.svelte';

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

  async function handleUpload(file: File, url: string) {
    try {
      const { writeFile, mkdir, exists } = await import('@tauri-apps/plugin-fs');
      const { join } = await import('@tauri-apps/api/path');
      const { getOutputDir } = await import('$lib/api/tts');

      // 从 TTS Server 获取 output 目录路径
      const outputDir = await getOutputDir();
      const refDir = outputDir.ref_audio;
      // 确保目录存在
      if (!await exists(refDir)) {
        await mkdir(refDir, { recursive: true });
      }

      // 生成唯一文件名
      const ext = file.name.split('.').pop() || 'wav';
      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const filePath = await join(refDir, uniqueName);

      // 读取文件内容并写入
      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      await writeFile(filePath, uint8);

      // 使用文件路径作为 voiceAudioUrl（供 TTS 引擎读取）
      dubbing.setVoice('uploaded', file.name, filePath);
    } catch {
      // TTS Server 不可用时降级到 $APPDATA
      try {
        const { writeFile, mkdir, exists } = await import('@tauri-apps/plugin-fs');
        const { appDataDir, join } = await import('@tauri-apps/api/path');

        const dataDir = await appDataDir();
        const refDir = await join(dataDir, 'ref_audio');
        if (!await exists(refDir)) {
          await mkdir(refDir, { recursive: true });
        }

        const ext = file.name.split('.').pop() || 'wav';
        const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const filePath = await join(refDir, uniqueName);

        const arrayBuffer = await file.arrayBuffer();
        await writeFile(filePath, new Uint8Array(arrayBuffer));

        dubbing.setVoice('uploaded', file.name, filePath);
      } catch {
        // 最终降级：使用 blob URL（仅能播放，无法推理）
        dubbing.setVoice('uploaded', file.name, url);
        toast.info('音频已加载，但本地保存失败，推理可能不可用');
      }
    }
  }

  function handleRemove() {
    dubbing.setVoice(null, '默认音色', null);
  }
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
      <Icon name="upload" size={14} color={sourceType === 'upload' ? 'var(--color-bg-elevated)' : 'var(--color-text-secondary)'} />
      <span>上传本地样音</span>
    </button>
    <button
      type="button"
      role="tab"
      class="source-tab"
      class:active={sourceType === 'preset'}
      onclick={() => onSourceChange('preset')}
    >
      <Icon name="library" size={14} color={sourceType === 'preset' ? 'var(--color-bg-elevated)' : 'var(--color-text-secondary)'} />
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
    transition:
      background-color var(--transition-duration) var(--transition-timing),
      color var(--transition-duration) var(--transition-timing),
      box-shadow var(--transition-duration) var(--transition-timing);
  }

  .source-tab:hover {
    color: var(--color-text);
  }

  .source-tab.active {
    background-color: var(--color-primary);
    color: var(--color-bg-elevated);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  /* 上传区域 */
  .upload-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }
</style>
