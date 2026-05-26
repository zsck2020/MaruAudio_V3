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

<div class="player" class:playing={dubbing.isPlaying} class:has-audio={hasAudio} class:generating={dubbing.isGenerating}>
  <div class="player-glow" aria-hidden="true"></div>

  <!-- 左侧：播放控件 -->
  <div class="transport">
    <button type="button" class="transport-btn" disabled={!transportEnabled} onclick={skipBackward} aria-label="后退 5 秒">
      <Icon name="ant-design:step-backward-outlined" size={14} color="currentColor" />
    </button>
    <button type="button" class="play-btn" disabled={!transportEnabled} onclick={togglePlay} aria-label={dubbing.isPlaying ? '暂停' : '播放'}>
      <span class="play-btn-ring" aria-hidden="true"></span>
      <Icon name={dubbing.isPlaying ? 'pause-fill' : 'play-fill'} size={20} color="#fff" />
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
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-sm) var(--spacing-lg);
    min-height: 84px;
    background:
      radial-gradient(circle at 92% -30%, color-mix(in srgb, var(--color-primary) 0%, transparent), transparent 55%),
      linear-gradient(180deg, color-mix(in srgb, var(--color-bg-elevated) 96%, transparent), var(--color-bg-base));
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
    overflow: visible;
    transition:
      border-color var(--transition-duration) var(--transition-timing),
      box-shadow var(--transition-duration) var(--transition-timing),
      background 0.45s ease;
  }

  .player.has-audio:hover,
  .player.playing {
    border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
    box-shadow:
      0 6px 22px color-mix(in srgb, var(--color-primary) 12%, transparent),
      inset 0 1px 0 rgba(255, 255, 255, 0.03);
  }

  .player-glow {
    position: absolute;
    inset: 0;
    border-radius: var(--border-radius-lg);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.45s ease, background 0.45s ease;
    background: radial-gradient(circle at 92% -30%, color-mix(in srgb, var(--color-primary) 25%, transparent), transparent 55%);
  }

  .player.playing .player-glow,
  .player.has-audio:hover .player-glow {
    opacity: 1;
  }

  .player.generating .player-glow {
    opacity: 1;
    background: radial-gradient(circle at 92% -30%, color-mix(in srgb, var(--color-warning) 25%, transparent), transparent 55%);
  }

  /* 播放控件 */
  .transport {
    position: relative;
    z-index: 1;
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
    transition:
      color var(--motion-duration-mid) var(--motion-ease-base),
      background-color var(--motion-duration-mid) var(--motion-ease-base),
      transform 0.15s var(--motion-ease-base);
  }

  .transport-btn:hover:not(:disabled) {
    background-color: var(--color-hover-bg);
    color: var(--color-text);
    transform: scale(1.08);
  }

  .transport-btn:active:not(:disabled) {
    transform: scale(0.95);
  }

  .transport-btn:disabled {
    color: var(--color-text-disabled);
    cursor: not-allowed;
  }

  .play-btn {
    position: relative;
    width: var(--control-height);
    height: var(--control-height);
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    background:
      radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--color-primary) 80%, white 20%), var(--color-primary) 60%, var(--color-primary-active));
    box-shadow:
      0 4px 14px color-mix(in srgb, var(--color-primary) 35%, transparent),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
    transition:
      transform 0.2s var(--motion-ease-base),
      box-shadow 0.2s var(--motion-ease-base);
  }

  .play-btn:hover:not(:disabled) {
    transform: scale(1.08);
    box-shadow:
      0 6px 20px color-mix(in srgb, var(--color-primary) 50%, transparent),
      inset 0 1px 0 rgba(255, 255, 255, 0.32);
  }

  .play-btn:active:not(:disabled) {
    transform: scale(0.96);
  }

  .play-btn:disabled {
    background:
      radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--color-text-disabled) 70%, white 5%), var(--color-text-disabled));
    box-shadow: none;
    cursor: not-allowed;
    opacity: 0.6;
  }

  .play-btn-ring {
    position: absolute;
    inset: -5px;
    border-radius: 50%;
    border: 1px solid color-mix(in srgb, var(--color-primary) 40%, transparent);
    opacity: 0;
    transition: opacity 0.25s ease, transform 0.25s ease;
    pointer-events: none;
  }

  .play-btn:hover:not(:disabled) .play-btn-ring,
  .player.playing .play-btn:not(:disabled) .play-btn-ring {
    opacity: 1;
    transform: scale(1.08);
  }

  .player.playing .play-btn-ring {
    animation: ring-pulse 1.8s ease-in-out infinite;
  }

  @keyframes ring-pulse {
    0%, 100% { transform: scale(1.08); opacity: 0.7; }
    50% { transform: scale(1.18); opacity: 0.2; }
  }

  /* 进度区 */
  .progress-area {
    position: relative;
    z-index: 1;
    flex: 1;
    height: 48px;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    min-width: 0;
    padding: 0 var(--spacing-sm);
    border-radius: var(--border-radius);
    background: color-mix(in srgb, var(--color-bg-base) 65%, transparent);
    border: 1px solid var(--color-border-secondary);
    transition: border-color var(--motion-duration-mid) var(--motion-ease-base);
    box-sizing: border-box;
  }

  .player.playing .progress-area {
    border-color: color-mix(in srgb, var(--color-primary) 25%, var(--color-border-secondary));
  }

  .time-label {
    font-size: 11px;
    color: var(--color-text-tertiary);
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum";
    letter-spacing: 0.3px;
    flex-shrink: 0;
    min-width: 38px;
    text-align: center;
    transition: color var(--motion-duration-mid) var(--motion-ease-base);
  }

  .player.playing .time-label:first-child {
    color: var(--color-primary);
    font-weight: 500;
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
    height: 6px;
    background-color: color-mix(in srgb, var(--color-border) 50%, transparent);
    border-radius: 3px;
    overflow: hidden;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  .gen-fill {
    height: 100%;
    background: linear-gradient(90deg,
      var(--color-warning),
      color-mix(in srgb, var(--color-warning) 60%, var(--color-primary) 40%),
      var(--color-primary));
    background-size: 200% 100%;
    border-radius: 3px;
    transition: width 0.3s ease;
    animation: gen-shimmer 2.5s ease-in-out infinite;
    box-shadow: 0 0 8px color-mix(in srgb, var(--color-warning) 40%, transparent);
  }

  @keyframes gen-shimmer {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  .gen-pct {
    font-size: 12px;
    color: var(--color-warning);
    font-variant-numeric: tabular-nums;
    font-weight: 500;
    flex-shrink: 0;
    min-width: 32px;
    text-align: right;
  }

  /* 操作按钮 */
  .actions {
    position: relative;
    z-index: 1;
    height: 48px;
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    padding: 0 6px;
    border-radius: var(--border-radius);
    background: color-mix(in srgb, var(--color-bg-base) 50%, transparent);
    border: 1px solid var(--color-border-secondary);
    box-sizing: border-box;
  }

  .action-btn {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    color: var(--color-text-tertiary);
    transition:
      color var(--motion-duration-mid) var(--motion-ease-base),
      background-color var(--motion-duration-mid) var(--motion-ease-base),
      transform 0.15s var(--motion-ease-base);
  }

  .action-btn:hover:not(:disabled) {
    background-color: color-mix(in srgb, var(--color-primary) 12%, transparent);
    color: var(--color-primary);
    transform: scale(1.08);
  }

  .action-btn:active:not(:disabled) {
    transform: scale(0.94);
  }

  .action-btn:disabled {
    color: var(--color-text-disabled);
    cursor: not-allowed;
  }

  .action-btn:focus-visible,
  .transport-btn:focus-visible,
  .play-btn:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }
</style>
