<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import Tooltip from '../Tooltip.svelte';
  import WaveformView from '../ui/WaveformView.svelte';
  import { dubbing } from '$lib/stores/dubbing.svelte';
  import { convertFileSrc } from '@tauri-apps/api/core';

  let {
    onRegenerate = () => {},
    onSubtitle = () => {},
    onDownload = () => {},
  }: {
    onRegenerate?: () => void;
    onSubtitle?: () => void;
    onDownload?: () => void;
  } = $props();

  let audioEl: HTMLAudioElement | undefined = $state();

  let hasAudio = $derived(!!dubbing.generatedAudioPath);

  let playableAudioSrc = $derived(
    dubbing.generatedAudioPath
      ? (dubbing.generatedAudioPath.startsWith('http') || dubbing.generatedAudioPath.startsWith('blob:')
          ? dubbing.generatedAudioPath
          : convertFileSrc(dubbing.generatedAudioPath))
      : ''
  );

  let transportEnabled = $derived(hasAudio && !dubbing.isGenerating);
  let actionsEnabled = $derived(hasAudio && !dubbing.isGenerating);

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function togglePlay() {
    if (!transportEnabled || !audioEl) return;
    if (dubbing.isPlaying) {
      audioEl.pause();
      dubbing.isPlaying = false;
    } else {
      void audioEl.play();
      dubbing.isPlaying = true;
    }
  }

  function handleTimeUpdate() {
    if (audioEl) dubbing.currentTime = audioEl.currentTime;
  }

  function handleLoadedMetadata() {
    if (audioEl) dubbing.duration = audioEl.duration;
  }

  function handleEnded() {
    dubbing.isPlaying = false;
    dubbing.currentTime = 0;
  }

  function handleSeek(e: Event) {
    if (!transportEnabled) return;
    const target = e.target as HTMLInputElement;
    const time = parseFloat(target.value);
    if (audioEl) {
      audioEl.currentTime = time;
      dubbing.currentTime = time;
    }
  }

  function skipForward() {
    if (!transportEnabled || !audioEl) return;
    audioEl.currentTime = Math.min(audioEl.currentTime + 5, dubbing.duration);
    dubbing.currentTime = audioEl.currentTime;
  }

  function skipBackward() {
    if (!transportEnabled || !audioEl) return;
    audioEl.currentTime = Math.max(audioEl.currentTime - 5, 0);
    dubbing.currentTime = audioEl.currentTime;
  }

  let progressPercent = $derived(
    dubbing.duration > 0 ? (dubbing.currentTime / dubbing.duration) * 100 : 0
  );

  let segmentLabel = $derived(
    dubbing.generationSegmentTotal > 0
      ? `${dubbing.generationSegmentCurrent}/${dubbing.generationSegmentTotal} 段`
      : ''
  );
</script>

{#if dubbing.generatedAudioPath}
  <audio
    bind:this={audioEl}
    src={playableAudioSrc}
    ontimeupdate={handleTimeUpdate}
    onloadedmetadata={handleLoadedMetadata}
    onended={handleEnded}
    preload="metadata"
  ></audio>
{/if}

<div class="player">
  <!-- 左侧：播放控件 -->
  <div class="transport">
    <button type="button" class="transport-btn" disabled={!transportEnabled} onclick={skipBackward} aria-label="后退 5 秒">
      <Icon name="ant-design:step-backward-outlined" size={14} color="currentColor" />
    </button>
    <button type="button" class="play-btn" disabled={!transportEnabled} onclick={togglePlay} aria-label={dubbing.isPlaying ? '暂停' : '播放'}>
      <Icon name={dubbing.isPlaying ? 'pause-fill' : 'play-fill'} size={20} color="currentColor" />
    </button>
    <button type="button" class="transport-btn" disabled={!transportEnabled} onclick={skipForward} aria-label="前进 5 秒">
      <Icon name="ant-design:step-forward-outlined" size={14} color="currentColor" />
    </button>
  </div>

  <!-- 中间：波形进度 -->
  <div class="progress-area">
    {#if dubbing.isGenerating}
      <div class="gen-row">
        <span class="gen-label">生成中{segmentLabel ? ` · ${segmentLabel}` : ''}</span>
        <div class="gen-track">
          <div class="gen-fill" style="width: {dubbing.progress}%"></div>
        </div>
        <span class="gen-pct">{dubbing.progress}%</span>
      </div>
    {:else}
      <span class="time-label">{formatTime(dubbing.currentTime)}</span>
      {#if playableAudioSrc}
        <WaveformView
          audioSrc={playableAudioSrc}
          currentTime={dubbing.currentTime}
          duration={dubbing.duration}
          onSeek={(t) => { if (audioEl) { audioEl.currentTime = t; dubbing.currentTime = t; } }}
          height={36}
          barWidth={2}
          barGap={1}
          interactive={transportEnabled}
        />
      {:else}
        <div class="waveform-empty-state">
          <div class="empty-bars" aria-hidden="true">
            {#each Array(80) as _, i (i)}
              <span style="height:{8 + ((i * 7) % 20)}%"></span>
            {/each}
          </div>
          <span class="empty-hint">生成配音后可预览波形</span>
        </div>
      {/if}
      <span class="time-label">{formatTime(dubbing.duration)}</span>
    {/if}
  </div>

  <!-- 右侧：操作按钮 -->
  <div class="actions">
    <Tooltip text="下载" position="top">
      <button type="button" class="action-btn" disabled={!actionsEnabled} onclick={onDownload} aria-label="下载音频">
        <Icon name="download" size={15} color="currentColor" />
      </button>
    </Tooltip>
    <Tooltip text="字幕" position="top">
      <button type="button" class="action-btn" disabled={!actionsEnabled} onclick={onSubtitle} aria-label="生成字幕">
        <Icon name="file-text" size={15} color="currentColor" />
      </button>
    </Tooltip>
    <Tooltip text="重新生成" position="top">
      <button type="button" class="action-btn" disabled={dubbing.isGenerating || !hasAudio} onclick={onRegenerate} aria-label="重新生成">
        <Icon name="redo" size={15} color="currentColor" />
      </button>
    </Tooltip>
  </div>
</div>

<style>
  .player {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-sm) var(--spacing-lg);
    min-height: 84px;
    background-color: var(--color-bg-elevated);
    border-radius: var(--border-radius);
  }

  /* 播放控件 */
  .transport {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    flex-shrink: 0;
  }

  .transport-btn {
    width: var(--control-height-xs);
    height: var(--control-height-xs);
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    color: var(--color-text-secondary);
    transition: color var(--motion-duration-mid) var(--motion-ease-base),
      background-color var(--motion-duration-mid) var(--motion-ease-base);
  }

  .transport-btn:hover:not(:disabled) {
    background-color: var(--color-hover-bg);
    color: var(--color-text);
  }

  .transport-btn:disabled {
    color: var(--color-text-disabled);
    cursor: not-allowed;
  }

  .play-btn {
    width: var(--control-height-sm);
    height: var(--control-height-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: 50%;
    cursor: pointer;
    color: var(--color-primary);
    transition: color var(--motion-duration-mid) var(--motion-ease-base),
      border-color var(--motion-duration-mid) var(--motion-ease-base),
      background-color var(--motion-duration-mid) var(--motion-ease-base);
  }

  .play-btn:hover:not(:disabled) {
    border-color: var(--color-primary);
    background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
  }

  .play-btn:disabled {
    color: var(--color-text-disabled);
    border-color: var(--color-border-secondary);
    cursor: not-allowed;
  }

  /* 进度区 */
  .progress-area {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    min-width: 0;
  }

  .time-label {
    font-size: 12px;
    color: var(--color-text-tertiary);
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
    min-width: 38px;
    text-align: center;
  }

  .waveform-empty-state {
    flex: 1;
    height: 36px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius-sm);
    overflow: hidden;
  }

  .empty-bars {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1px;
    opacity: 0.35;
  }

  .empty-bars span {
    width: 2px;
    border-radius: 1px;
    background-color: rgba(255, 255, 255, 0.15);
    flex-shrink: 0;
  }

  .empty-hint {
    position: relative;
    z-index: 1;
    font-size: 11px;
    color: var(--color-text-disabled);
    letter-spacing: 0.3px;
  }

  /* 生成中进度 */
  .gen-row {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .gen-label {
    font-size: 12px;
    color: var(--color-text-secondary);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .gen-track {
    flex: 1;
    height: 4px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }

  .gen-fill {
    height: 100%;
    background-color: var(--color-primary);
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .gen-pct {
    font-size: 12px;
    color: var(--color-text-tertiary);
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
    min-width: 32px;
    text-align: right;
  }

  /* 操作按钮 */
  .actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    flex-shrink: 0;
  }

  .action-btn {
    width: var(--control-height-xs);
    height: var(--control-height-xs);
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    color: var(--color-text-tertiary);
    transition: color var(--motion-duration-mid) var(--motion-ease-base),
      background-color var(--motion-duration-mid) var(--motion-ease-base);
  }

  .action-btn:hover:not(:disabled) {
    background-color: var(--color-hover-bg);
    color: var(--color-text);
  }

  .action-btn:disabled {
    color: var(--color-text-disabled);
    cursor: not-allowed;
  }

  .action-btn:focus-visible,
  .transport-btn:focus-visible,
  .play-btn:focus-visible {
    box-shadow: 0 0 0 2px var(--color-focus-ring);
  }
</style>
