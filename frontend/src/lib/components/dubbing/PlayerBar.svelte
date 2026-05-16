<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import Tooltip from '../Tooltip.svelte';
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

  // 将本地文件路径转为浏览器可播放的 URL
  let playableAudioSrc = $derived(
    dubbing.generatedAudioPath
      ? (dubbing.generatedAudioPath.startsWith('http') || dubbing.generatedAudioPath.startsWith('blob:')
          ? dubbing.generatedAudioPath
          : convertFileSrc(dubbing.generatedAudioPath))
      : ''
  );
  /** 底部播放器控件：有音频且非生成中才可操作 transport */
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
    if (audioEl) {
      dubbing.currentTime = audioEl.currentTime;
    }
  }

  function handleLoadedMetadata() {
    if (audioEl) {
      dubbing.duration = audioEl.duration;
    }
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
      ? `第 ${dubbing.generationSegmentCurrent} / ${dubbing.generationSegmentTotal} 段`
      : ''
  );
</script>

<!-- 底部固定：始终同一套播放器布局，仅根据状态启用/禁用或切换中间区域 -->
<div class="player-bar">
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

  <div class="player-main-row">
    <Tooltip text={transportEnabled ? '后退 5 秒' : '生成完成后可用'} position="top">
      <button
        type="button"
        class="skip-btn"
        disabled={!transportEnabled}
        onclick={skipBackward}
      >
        <Icon
          name="ant-design:step-backward-outlined"
          size={16}
          color={transportEnabled ? 'var(--color-text-secondary)' : 'var(--color-text-disabled)'}
        />
      </button>
    </Tooltip>

      <button
        type="button"
        class="play-btn"
        disabled={!transportEnabled}
        aria-label={transportEnabled ? '播放 / 暂停' : '暂无可用音频'}
        onclick={togglePlay}
      >
        <Icon
          name={dubbing.isPlaying ? 'pause-fill' : 'play-fill'}
          size={28}
          color={transportEnabled ? 'var(--color-primary)' : 'var(--color-text-disabled)'}
        />
      </button>

    <Tooltip text={transportEnabled ? '前进 5 秒' : '生成完成后可用'} position="top">
      <button
        type="button"
        class="skip-btn"
        disabled={!transportEnabled}
        onclick={skipForward}
      >
        <Icon
          name="ant-design:step-forward-outlined"
          size={16}
          color={transportEnabled ? 'var(--color-text-secondary)' : 'var(--color-text-disabled)'}
        />
      </button>
    </Tooltip>

    <div
      class="progress-section"
      class:progress-section--generating={dubbing.isGenerating}
    >
      {#if dubbing.isGenerating}
        <div class="gen-inline">
          <Icon name="pause-fill" size={18} color="var(--color-primary)" />
          <span class="gen-main">
            生成中…
            {#if segmentLabel}
              <span class="gen-segment">{segmentLabel}</span>
            {/if}
          </span>
          <div class="gen-progress-bar" role="progressbar" aria-valuenow={dubbing.progress}>
            <div class="gen-progress-fill" style="width: {dubbing.progress}%"></div>
          </div>
          <span class="gen-message">{dubbing.progressMessage || '准备生成…'}</span>
          <span class="gen-percent">{dubbing.progress}%</span>
        </div>
      {:else if hasAudio}
        <input
          type="range"
          class="progress-slider"
          min="0"
          max={dubbing.duration || 0}
          step="0.1"
          value={dubbing.currentTime}
          oninput={handleSeek}
          style="--progress: {progressPercent}%"
        />
        <div class="time-display">
          <span>{formatTime(dubbing.currentTime)}</span>
          <span class="time-sep">/</span>
          <span>{formatTime(dubbing.duration)}</span>
        </div>
      {:else}
        <input
          type="range"
          class="progress-slider disabled-slider"
          min="0"
          max="100"
          value="0"
          disabled
          aria-hidden="true"
        />
        <div class="time-display">
          <span>00:00</span>
          <span class="time-sep">/</span>
          <span>00:00</span>
        </div>
      {/if}
    </div>

    <div class="player-actions">
      <Tooltip text={actionsEnabled ? (dubbing.playerWaveformOpen ? '收起波形' : '展开波形') : '生成后可用'} position="top">
        <button
          type="button"
          class="player-action-btn text-action"
          class:active={dubbing.playerWaveformOpen}
          disabled={!actionsEnabled}
          onclick={() => {
            if (actionsEnabled) dubbing.playerWaveformOpen = !dubbing.playerWaveformOpen;
          }}
        >
          波形
          <Icon name="ant-design:down-outlined" size={10} color="currentColor" />
        </button>
      </Tooltip>
      <Tooltip text={actionsEnabled ? '下载音频' : '生成后可用'} position="top">
        <button type="button" class="player-action-btn" disabled={!actionsEnabled} onclick={onDownload}>
          <Icon name="download" size={16} color="var(--color-text-tertiary)" />
        </button>
      </Tooltip>
      <Tooltip text={actionsEnabled ? '生成字幕' : '生成后可用'} position="top">
        <button type="button" class="player-action-btn" disabled={!actionsEnabled} onclick={onSubtitle}>
          <Icon name="file-text" size={16} color="var(--color-text-tertiary)" />
        </button>
      </Tooltip>
      <Tooltip text={hasAudio ? '重新生成' : '生成后可用'} position="top">
        <button
          type="button"
          class="player-action-btn"
          disabled={dubbing.isGenerating || !hasAudio}
          onclick={onRegenerate}
        >
          <Icon name="redo" size={16} color="var(--color-text-tertiary)" />
        </button>
      </Tooltip>
    </div>
  </div>

  {#if hasAudio && dubbing.playerWaveformOpen}
    <div class="waveform-placeholder" role="img" aria-label="波形预览占位">
      <span>波形预览区域（对接音频解析后展示）</span>
    </div>
  {/if}
</div>

<style>
  .player-bar {
    position: relative;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-lg);
    min-height: 84px;
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--color-bg-elevated) 96%, transparent), var(--color-bg-elevated));
    border-top: 1px solid var(--color-border-secondary);
  }

  .player-bar::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-primary) 40%, transparent), transparent);
    pointer-events: none;
  }

  .player-main-row {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-md);
    min-height: 44px;
  }

  .disabled-slider {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .gen-inline {
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-sm);
    min-width: 0;
  }

  .gen-main {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    white-space: nowrap;
  }

  .gen-segment {
    margin-left: var(--spacing-sm);
    color: var(--color-text-tertiary);
  }

  .gen-progress-bar {
    flex: 1;
    min-width: 100px;
    height: 6px;
    background-color: color-mix(in srgb, var(--color-border) 70%, transparent);
    border-radius: 3px;
    overflow: hidden;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.35);
  }

  .gen-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 75%, white 25%));
    border-radius: 3px;
    transition: width 0.3s ease;
    box-shadow: 0 0 10px color-mix(in srgb, var(--color-primary) 60%, transparent);
    position: relative;
  }

  .gen-progress-fill::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
    animation: shimmer 1.8s ease-in-out infinite;
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  .gen-message {
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .gen-percent {
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }

  .play-btn {
    position: relative;
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid color-mix(in srgb, var(--color-primary) 35%, transparent);
    cursor: pointer;
    border-radius: 50%;
    transition:
      background-color var(--transition-duration) var(--transition-timing),
      border-color var(--transition-duration) var(--transition-timing),
      box-shadow var(--transition-duration) var(--transition-timing),
      transform 0.15s var(--transition-timing);
    flex-shrink: 0;
  }

  .play-btn:hover:not(:disabled) {
    background-color: color-mix(in srgb, var(--color-primary) 12%, transparent);
    border-color: var(--color-primary);
    box-shadow: 0 0 16px color-mix(in srgb, var(--color-primary) 35%, transparent);
    transform: scale(1.04);
  }

  .play-btn:active:not(:disabled) {
    transform: scale(0.97);
  }

  .play-btn:disabled,
  .skip-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    border-color: transparent;
  }

  .play-btn:disabled:hover,
  .skip-btn:disabled:hover {
    background-color: transparent;
    transform: none;
    box-shadow: none;
  }

  .progress-section {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    min-width: 0;
  }

  .progress-section.progress-section--generating {
    flex-wrap: wrap;
    align-items: center;
  }

  .progress-slider {
    -webkit-appearance: none;
    appearance: none;
    flex: 1;
    height: 6px;
    border-radius: 3px;
    outline: none;
    cursor: pointer;
    background:
      linear-gradient(
        to right,
        var(--color-primary) 0%,
        color-mix(in srgb, var(--color-primary) 70%, white 30%) var(--progress, 0%),
        color-mix(in srgb, var(--color-border) 75%, transparent) var(--progress, 0%),
        color-mix(in srgb, var(--color-border) 75%, transparent) 100%
      );
    box-shadow:
      inset 0 1px 2px rgba(0, 0, 0, 0.35),
      0 0 12px color-mix(in srgb, var(--color-primary) calc(var(--glow-amount, 35) * 1%), transparent);
    transition: box-shadow 0.25s ease;
  }

  .progress-slider:hover:not(:disabled) {
    --glow-amount: 50;
  }

  .progress-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--color-bg-elevated);
    border: 2px solid var(--color-primary);
    box-shadow:
      0 1px 6px rgba(0, 0, 0, 0.4),
      0 0 10px color-mix(in srgb, var(--color-primary) 55%, transparent);
    cursor: grab;
    transition: transform 0.15s ease;
  }

  .progress-slider:hover::-webkit-slider-thumb {
    transform: scale(1.15);
  }

  .progress-slider:active::-webkit-slider-thumb {
    cursor: grabbing;
    transform: scale(1.25);
  }

  .time-display {
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }

  .time-sep {
    margin: 0 2px;
  }

  .player-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    flex-shrink: 0;
  }

  .player-action-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition:
      background-color var(--transition-duration) var(--transition-timing),
      color var(--transition-duration) var(--transition-timing);
    color: var(--color-text-tertiary);
  }

  .player-action-btn.text-action {
    width: auto;
    min-width: 56px;
    padding: 0 var(--spacing-sm);
    gap: 2px;
    font-size: var(--font-size-sm);
  }

  .player-action-btn.text-action.active {
    color: var(--color-primary);
    background-color: var(--color-bg-spotlight);
  }

  .player-action-btn:hover:not(:disabled) {
    background-color: var(--color-bg-spotlight);
  }

  .player-action-btn:hover:not(:disabled) :global(svg) {
    color: var(--color-text) !important;
  }

  .player-action-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .player-action-btn:disabled:hover {
    background-color: transparent;
  }

  .player-action-btn:disabled:hover :global(svg) {
    color: var(--color-text-disabled) !important;
  }

  .skip-btn {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid transparent;
    cursor: pointer;
    border-radius: 50%;
    transition:
      background-color var(--transition-duration) var(--transition-timing),
      border-color var(--transition-duration) var(--transition-timing),
      transform 0.15s var(--transition-timing);
    flex-shrink: 0;
  }

  .skip-btn:hover:not(:disabled) {
    background-color: var(--color-bg-spotlight);
    border-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
    transform: scale(1.08);
  }

  .skip-btn:active:not(:disabled) {
    transform: scale(0.95);
  }

  .waveform-placeholder {
    width: 100%;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: var(--color-text-disabled);
    background-color: var(--color-bg-base);
    border: 1px dashed var(--color-border-secondary);
    border-radius: var(--border-radius-sm);
  }
</style>
