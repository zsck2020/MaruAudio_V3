<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import Tooltip from '../Tooltip.svelte';
  import { dubbing } from '$lib/stores/dubbing.svelte';

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
      src={dubbing.generatedAudioPath}
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
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    /* 主行（红框内控件）在底栏竖直方向居中，避免贴在上沿 */
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-lg);
    /* 原 64px，整体向上多占 20px 垂直空间 */
    min-height: 84px;
    background-color: var(--color-bg-elevated);
    border-top: 1px solid var(--color-border-secondary);
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
    height: 4px;
    background-color: var(--color-border);
    border-radius: 2px;
    overflow: hidden;
  }

  .gen-progress-fill {
    height: 100%;
    background-color: var(--color-primary);
    border-radius: 2px;
    transition: width 0.3s ease;
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
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    border-radius: 50%;
    transition: background-color var(--transition-duration) var(--transition-timing);
    flex-shrink: 0;
  }

  .play-btn:hover:not(:disabled) {
    background-color: var(--color-bg-spotlight);
  }

  .play-btn:disabled,
  .skip-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .play-btn:disabled:hover,
  .skip-btn:disabled:hover {
    background-color: transparent;
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
    height: 4px;
    border-radius: 2px;
    outline: none;
    cursor: pointer;
    background: linear-gradient(
      to right,
      var(--color-primary) 0%,
      var(--color-primary) var(--progress, 0%),
      var(--color-border) var(--progress, 0%),
      var(--color-border) 100%
    );
  }

  .progress-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
    cursor: pointer;
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
    transition: all var(--transition-duration) var(--transition-timing);
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
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    border-radius: 50%;
    transition: background-color var(--transition-duration) var(--transition-timing);
    flex-shrink: 0;
  }

  .skip-btn:hover:not(:disabled) {
    background-color: var(--color-bg-spotlight);
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
