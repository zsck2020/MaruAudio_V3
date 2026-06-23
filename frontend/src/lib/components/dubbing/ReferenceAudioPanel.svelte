<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import { dubbing } from '$lib/stores/dubbing.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import AudioUploader from './AudioUploader.svelte';
  import AudioPlayer from './AudioPlayer.svelte';
  import PresetLibrary from './PresetLibrary.svelte';
  import type { VoiceSourceType } from '$lib/types/dubbing';
  import { vocalSeparate, vocalSeparateInfo } from '$lib/api/tts';

  let sourceType = $state<VoiceSourceType>('upload');
  let autoVocalSeparate = $state(true);
  let isProcessingVocal = $state(false);
  let vocalProgress = $state(0);
  let vocalMessage = $state('');
  let vocalMethod = $state<string>('unknown');
  let vocalAvailable = $state<boolean | null>(null);

  $effect(() => {
    void (async () => {
      try {
        const info = await vocalSeparateInfo();
        vocalAvailable = info.available;
        vocalMethod = info.method;
      } catch {
        vocalAvailable = false;
        vocalMethod = 'unreachable';
      }
    })();
  });

  async function saveFileToRefDir(file: File, url: string): Promise<string> {
    const { writeFile, mkdir, exists } = await import('@tauri-apps/plugin-fs');
    const { join, appDataDir } = await import('@tauri-apps/api/path');
    const { getOutputDir } = await import('$lib/api/tts');

    const ext = file.name.split('.').pop() || 'wav';
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buf = new Uint8Array(await file.arrayBuffer());

    try {
      const outputDir = await getOutputDir();
      const refDir = outputDir.ref_audio;
      if (!await exists(refDir)) await mkdir(refDir, { recursive: true });
      const filePath = await join(refDir, uniqueName);
      await writeFile(filePath, buf);
      return filePath;
    } catch {
      const dataDir = await appDataDir();
      const refDir = await join(dataDir, 'ref_audio');
      if (!await exists(refDir)) await mkdir(refDir, { recursive: true });
      const filePath = await join(refDir, uniqueName);
      await writeFile(filePath, buf);
      return filePath;
    }
  }

  async function runVocalSeparation(localPath: string): Promise<string | null> {
    isProcessingVocal = true;
    vocalProgress = 0;
    vocalMessage = '准备人声分离…';

    try {
      const evt = await vocalSeparate(
        { input_path: localPath },
        {
          onProgress: (e) => {
            vocalProgress = Math.round(e.progress * 100);
            vocalMessage = e.message;
          },
        }
      );
      vocalProgress = 100;
      vocalMessage = `人声分离完成 (${evt.method})`;
      return evt.output_path;
    } catch (err) {
      vocalMessage = '';
      const msg = err instanceof Error ? err.message : String(err);
      toast.warning(`人声分离失败，已退回原音频：${msg}`);
      return null;
    } finally {
      setTimeout(() => {
        isProcessingVocal = false;
        vocalProgress = 0;
        vocalMessage = '';
      }, 1200);
    }
  }

  async function handleUpload(file: File, url: string) {
    try {
      const filePath = await saveFileToRefDir(file, url);

      let finalPath = filePath;
      if (autoVocalSeparate && vocalAvailable !== false) {
        const separated = await runVocalSeparation(filePath);
        if (separated) finalPath = separated;
      }

      dubbing.setVoice('uploaded', file.name, finalPath);
    } catch {
      dubbing.setVoice('uploaded', file.name, url);
      toast.info('音频已加载，但本地保存失败，推理可能不可用');
    }
  }

  function handleRemove() {
    dubbing.setVoice(null, '默认音色', null);
  }
</script>

<div class="ref-audio-panel">
  <div class="section-header">
    <span class="section-title">参考音频</span>
    {#if dubbing.voiceAudioUrl}
      <button type="button" class="change-btn" onclick={handleRemove}>
        <Icon name="refresh-cw" size={10} color="currentColor" />
        <span>更换</span>
      </button>
    {/if}
  </div>

  {#if dubbing.voiceAudioUrl}
    <AudioPlayer audioUrl={dubbing.voiceAudioUrl} onRemove={handleRemove} />
  {:else}
    <div class="source-toggle" role="tablist" aria-label="样音来源">
      <button
        type="button"
        role="tab"
        aria-selected={sourceType === 'upload'}
        class="source-tab"
        class:active={sourceType === 'upload'}
        onclick={() => sourceType = 'upload'}
      >
        <Icon name="upload" size={12} color={sourceType === 'upload' ? 'var(--color-bg-elevated)' : 'var(--color-text-secondary)'} />
        <span>上传样音</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={sourceType === 'preset'}
        class="source-tab"
        class:active={sourceType === 'preset'}
        onclick={() => sourceType = 'preset'}
      >
        <Icon name="library" size={12} color={sourceType === 'preset' ? 'var(--color-bg-elevated)' : 'var(--color-text-secondary)'} />
        <span>预置样音</span>
      </button>
    </div>

    {#if sourceType === 'upload'}
      <label class="vocal-toggle" class:disabled={vocalAvailable === false}>
        <input
          type="checkbox"
          bind:checked={autoVocalSeparate}
          disabled={vocalAvailable === false || isProcessingVocal}
        />
        <span class="toggle-text">
          <span class="toggle-label">自动人声分离</span>
          <span class="toggle-hint">
            {#if vocalAvailable === null}
              检测能力中…
            {:else if vocalAvailable === false}
              后端未启用 demucs / librosa，已禁用
            {:else}
              上传后自动去除背景音乐 · 当前 {vocalMethod}
            {/if}
          </span>
        </span>
      </label>

      <AudioUploader onUpload={handleUpload} />

      {#if isProcessingVocal}
        <div class="vocal-progress" role="status">
          <div class="vocal-progress-bar">
            <div class="vocal-progress-fill" style="width: {vocalProgress}%"></div>
          </div>
          <div class="vocal-progress-text">
            <span>{vocalMessage || '处理中…'}</span>
            <span class="vocal-progress-pct">{vocalProgress}%</span>
          </div>
        </div>
      {/if}
    {:else}
      <PresetLibrary />
    {/if}
  {/if}
</div>

<style>
  .ref-audio-panel {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border-secondary);
    flex-shrink: 0;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .section-title {
    font-size: var(--font-size-xs);
    color: var(--color-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .change-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--font-size-xs);
    color: var(--color-primary);
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: var(--border-radius-sm);
    transition:
      background-color var(--transition-duration) var(--transition-timing),
      opacity var(--transition-duration) var(--transition-timing);
  }

  .change-btn:hover {
    background-color: var(--color-bg-spotlight);
  }

  .source-toggle {
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
    height: 30px;
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

  .source-tab:hover:not(.active) {
    color: var(--color-text);
  }

  .source-tab.active {
    background-color: var(--color-primary);
    color: var(--color-bg-elevated);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .vocal-toggle {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
    background-color: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: border-color var(--transition-duration) var(--transition-timing);
  }

  .vocal-toggle:hover {
    border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border-secondary));
  }

  .vocal-toggle input[type="checkbox"] {
    margin-top: 2px;
    accent-color: var(--color-primary);
  }

  .vocal-toggle.disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .toggle-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .toggle-label {
    font-size: var(--font-size-sm);
    color: var(--color-text);
  }

  .toggle-hint {
    font-size: var(--font-size-xs);
    color: var(--color-text-tertiary);
    line-height: 1.4;
  }

  .vocal-progress {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: var(--spacing-sm);
    border-radius: var(--border-radius);
    background-color: color-mix(in srgb, var(--color-primary) 8%, var(--color-bg-base));
    border: 1px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
  }

  .vocal-progress-bar {
    height: 4px;
    border-radius: 2px;
    background-color: color-mix(in srgb, var(--color-border) 70%, transparent);
    overflow: hidden;
  }

  .vocal-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 70%, white 30%));
    border-radius: 2px;
    transition: width 0.15s ease;
    box-shadow: 0 0 6px color-mix(in srgb, var(--color-primary) 50%, transparent);
  }

  .vocal-progress-text {
    display: flex;
    justify-content: space-between;
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
  }

  .vocal-progress-pct {
    font-variant-numeric: tabular-nums;
    color: var(--color-primary);
  }
</style>
