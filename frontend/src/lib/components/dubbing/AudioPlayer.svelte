<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import { dubbing } from '$lib/stores/dubbing.svelte';
  import { convertFileSrc } from '@tauri-apps/api/core';

  interface Props {
    audioUrl: string;
    onRemove: () => void;
  }

  let { audioUrl, onRemove }: Props = $props();

  // 将本地文件路径转为浏览器可播放的 URL
  let playableUrl = $derived(
    audioUrl.startsWith('blob:') || audioUrl.startsWith('http')
      ? audioUrl
      : convertFileSrc(audioUrl)
  );

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

<div class="player-card" class:playing={isPlaying}>
  <div class="player-glow" aria-hidden="true"></div>

  <div class="player-head">
    <button
      type="button"
      class="play-orb"
      onclick={togglePlay}
      aria-label={isPlaying ? '暂停' : '播放'}
    >
      <span class="play-orb-ring" aria-hidden="true"></span>
      <Icon name={isPlaying ? 'pause-fill' : 'play-fill'} size={18} color="#fff" />
    </button>

    <div class="audio-meta">
      <span class="audio-name" title={dubbing.voiceName}>{dubbing.voiceName}</span>
      <span class="audio-sub">
        <span class="meta-chip">{audioFormat}</span>
        <span class="meta-dot" aria-hidden="true"></span>
        <span class="meta-time">{audioDuration}</span>
      </span>
    </div>

    <button type="button" class="remove-btn" onclick={onRemove} title="移除参考音频" aria-label="移除参考音频">
      <Icon name="close" size={14} color="currentColor" />
    </button>
  </div>

  <div class="player-progress">
    <div class="time-now">{formatTime(currentTime)}</div>
    <div class="seek-wrap">
      <input
        type="range"
        class="seek-input"
        min="0"
        max={duration || 100}
        step="0.1"
        value={currentTime}
        oninput={handleSeek}
        style="--progress: {progressPercent}%"
        aria-label="音频进度"
      />
      <div class="seek-track" aria-hidden="true">
        <div class="seek-fill" style="width: {progressPercent}%"></div>
      </div>
    </div>
    <div class="time-total">{formatTime(duration)}</div>
  </div>

  <audio
    src={playableUrl}
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
  .player-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
    border-radius: var(--border-radius-lg);
    border: 1px solid var(--color-border-secondary);
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--color-bg-elevated) 96%, transparent), var(--color-bg-base));
    overflow: hidden;
    transition:
      border-color var(--transition-duration) var(--transition-timing),
      box-shadow var(--transition-duration) var(--transition-timing);
  }

  .player-card:hover {
    border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
    box-shadow:
      0 6px 22px color-mix(in srgb, var(--color-primary) 12%, transparent),
      inset 0 1px 0 rgba(255, 255, 255, 0.03);
  }

  .player-glow {
    position: absolute;
    inset: -40% -10% auto auto;
    width: 220px;
    height: 220px;
    background: radial-gradient(circle, color-mix(in srgb, var(--color-primary) 25%, transparent), transparent 70%);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.45s ease;
  }

  .player-card:hover .player-glow,
  .player-card.playing .player-glow {
    opacity: 1;
  }

  .player-head {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    z-index: 1;
  }

  .play-orb {
    position: relative;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
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
      transform 0.2s var(--transition-timing),
      box-shadow 0.2s var(--transition-timing);
  }

  .play-orb:hover {
    transform: scale(1.06);
    box-shadow:
      0 6px 20px color-mix(in srgb, var(--color-primary) 50%, transparent),
      inset 0 1px 0 rgba(255, 255, 255, 0.32);
  }

  .play-orb:active {
    transform: scale(0.97);
  }

  .play-orb-ring {
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 1px solid color-mix(in srgb, var(--color-primary) 40%, transparent);
    opacity: 0;
    transition: opacity 0.25s ease, transform 0.25s ease;
  }

  .play-orb:hover .play-orb-ring {
    opacity: 1;
    transform: scale(1.08);
  }

  .play-orb :global(svg) {
    color: #fff;
  }

  .audio-meta {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .audio-name {
    font-size: var(--font-size);
    font-weight: 500;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .audio-sub {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--color-text-tertiary);
  }

  .meta-chip {
    padding: 1px 6px;
    border-radius: var(--border-radius-sm);
    background-color: color-mix(in srgb, var(--color-primary) 14%, transparent);
    color: var(--color-primary);
    letter-spacing: 0.4px;
    font-weight: 500;
  }

  .meta-dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background-color: var(--color-text-quaternary);
  }

  .meta-time {
    font-variant-numeric: tabular-nums;
  }

  .remove-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    color: var(--color-text-tertiary);
    transition:
      background-color var(--transition-duration) var(--transition-timing),
      color var(--transition-duration) var(--transition-timing);
  }

  .remove-btn:hover {
    background-color: color-mix(in srgb, var(--color-error) 12%, transparent);
    color: var(--color-error);
  }

  .player-progress {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    z-index: 1;
  }

  .time-now,
  .time-total {
    font-size: 10px;
    font-variant-numeric: tabular-nums;
    color: var(--color-text-tertiary);
    min-width: 36px;
  }

  .time-now {
    color: var(--color-primary);
    text-align: right;
  }

  .time-total {
    text-align: left;
  }

  .seek-wrap {
    flex: 1;
    position: relative;
    height: 18px;
    display: flex;
    align-items: center;
  }

  .seek-track {
    position: absolute;
    inset: auto 0;
    height: 4px;
    border-radius: 2px;
    background-color: color-mix(in srgb, var(--color-border) 70%, transparent);
    overflow: hidden;
    pointer-events: none;
  }

  .seek-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 70%, white 30%));
    border-radius: 2px;
    transition: width 0.1s linear;
    box-shadow: 0 0 6px color-mix(in srgb, var(--color-primary) 50%, transparent);
  }

  .seek-input {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 100%;
    background: transparent;
    cursor: pointer;
    position: relative;
    z-index: 2;
  }

  .seek-input::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--color-bg-elevated);
    border: 2px solid var(--color-primary);
    box-shadow: 0 0 8px color-mix(in srgb, var(--color-primary) 60%, transparent);
    cursor: grab;
    transition: transform 0.15s ease;
  }

  .seek-input:hover::-webkit-slider-thumb {
    transform: scale(1.15);
  }

  .seek-input:active::-webkit-slider-thumb {
    cursor: grabbing;
    transform: scale(1.25);
  }

  .hidden-audio {
    display: none;
  }
</style>
