<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import { dubbing } from '$lib/stores/dubbing.svelte';

  interface Props {
    audioUrl: string;
    onRemove: () => void;
  }

  let { audioUrl, onRemove }: Props = $props();

  let audioPreviewEl: HTMLAudioElement | undefined = $state();
  let isPlaying = $state(false);
  let currentTime = $state(0);
  let duration = $state(0);
  let audioDuration = $state('--:--');
  let audioFormat = $state('--');

  let progressPercent = $derived(duration > 0 ? (currentTime / duration) * 100 : 0);

  function handleAudioMeta() {
    if (audioPreviewEl && audioPreviewEl.duration) {
      const d = audioPreviewEl.duration;
      duration = d;
      const m = Math.floor(d / 60);
      const s = Math.floor(d % 60);
      audioDuration = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    const name = dubbing.voiceName?.toLowerCase() ?? '';
    if (name.endsWith('.wav')) audioFormat = 'WAV';
    else if (name.endsWith('.mp3')) audioFormat = 'MP3';
    else if (name.endsWith('.flac')) audioFormat = 'FLAC';
    else audioFormat = '音频';
  }

  function handleTimeUpdate() {
    if (audioPreviewEl) {
      currentTime = audioPreviewEl.currentTime;
    }
  }

  function togglePlay() {
    if (audioPreviewEl) {
      if (isPlaying) {
        audioPreviewEl.pause();
      } else {
        audioPreviewEl.play();
      }
      isPlaying = !isPlaying;
    }
  }

  function handleEnded() {
    isPlaying = false;
    currentTime = 0;
  }

  function formatTime(time: number): string {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function handleSeek(e: Event) {
    const target = e.target as HTMLInputElement;
    const time = parseFloat(target.value);
    if (audioPreviewEl) {
      audioPreviewEl.currentTime = time;
      currentTime = time;
    }
  }
</script>

<div class="player-container">
  <!-- 文件信息卡片 -->
  <div class="audio-file-card">
    <div class="audio-file-main">
      <div class="audio-wave-icon">
        <Icon name="sound" size={20} color="var(--color-primary)" />
      </div>
      <div class="audio-file-info">
        <span class="audio-file-name">{dubbing.voiceName}</span>
        <span class="audio-file-meta">{audioFormat} · {audioDuration}</span>
      </div>
    </div>
    <button type="button" class="audio-file-remove" onclick={onRemove} title="移除">
      <Icon name="delete" size={16} color="var(--color-text-tertiary)" />
    </button>
  </div>

  <!-- 自定义音频播放器 -->
  <div class="custom-player">
    <button type="button" class="play-btn" onclick={togglePlay}>
      <Icon name={isPlaying ? 'pause' : 'play'} size={16} color="#fff" />
    </button>
    <div class="progress-bar">
      <input
        type="range"
        class="progress-input"
        min="0"
        max={duration || 100}
        step="0.1"
        value={currentTime}
        oninput={handleSeek}
      />
      <div class="progress-track">
        <div class="progress-fill" style="width: {progressPercent}%"></div>
      </div>
    </div>
    <span class="time-display">{formatTime(currentTime)} / {formatTime(duration)}</span>
  </div>

  <!-- 隐藏的原生音频元素 -->
  <audio
    src={audioUrl}
    preload="metadata"
    bind:this={audioPreviewEl}
    onloadedmetadata={handleAudioMeta}
    ontimeupdate={handleTimeUpdate}
    onended={handleEnded}
    class="hidden-audio"
  >
    <track kind="captions" />
  </audio>
</div>

<style>
  .player-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .audio-file-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    transition: border-color var(--transition-duration) var(--transition-timing);
  }

  .audio-file-card:hover {
    border-color: var(--color-border);
  }

  .audio-file-main {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .audio-wave-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(59, 130, 246, 0.1);
    border-radius: var(--border-radius-sm);
    flex-shrink: 0;
  }

  .audio-file-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .audio-file-name {
    font-size: var(--font-size-sm);
    color: var(--color-text);
    font-weight: 500;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .audio-file-meta {
    font-size: 11px;
    color: var(--color-text-tertiary);
  }

  .audio-file-remove {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: background-color var(--transition-duration) var(--transition-timing);
  }

  .audio-file-remove:hover {
    background-color: rgba(239, 68, 68, 0.1);
  }

  .audio-file-remove:hover :global(svg) {
    color: var(--color-error) !important;
  }

  .custom-player {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
  }

  .play-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-primary);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    flex-shrink: 0;
    transition:
      background-color var(--transition-duration) var(--transition-timing),
      transform var(--transition-duration) var(--transition-timing);
  }

  .play-btn:hover {
    background-color: var(--color-primary-hover);
    transform: scale(1.05);
  }

  .play-btn :global(svg) {
    color: var(--color-bg-elevated);
  }

  .progress-bar {
    flex: 1;
    position: relative;
    height: 20px;
    display: flex;
    align-items: center;
  }

  .progress-input {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    z-index: 2;
  }

  .progress-track {
    width: 100%;
    height: 4px;
    background-color: var(--color-border);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background-color: var(--color-primary);
    border-radius: 2px;
    transition: width 0.1s linear;
  }

  .time-display {
    font-size: 11px;
    color: var(--color-text-tertiary);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    min-width: 80px;
    text-align: right;
  }

  .hidden-audio {
    display: none;
  }
</style>
