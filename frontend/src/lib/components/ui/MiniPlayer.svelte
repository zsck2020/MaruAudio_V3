<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import WaveformView from './WaveformView.svelte';
  import { convertFileSrc } from '@tauri-apps/api/core';

  interface Props {
    src: string;
    label?: string;
    height?: number;
    onEnded?: () => void;
  }

  let { src, label = '', height = 32, onEnded }: Props = $props();

  let audioEl: HTMLAudioElement | undefined = $state();
  let playing = $state(false);
  let currentTime = $state(0);
  let duration = $state(0);

  let playableSrc = $derived(
    src.startsWith('http') || src.startsWith('blob:') ? src : convertFileSrc(src)
  );

  function formatTime(t: number): string {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function toggle() {
    if (!audioEl) return;
    if (playing) {
      audioEl.pause();
      playing = false;
    } else {
      void audioEl.play();
      playing = true;
    }
  }

  function handleEnded() {
    playing = false;
    currentTime = 0;
    onEnded?.();
  }

  function handleSeek(time: number) {
    if (audioEl) {
      audioEl.currentTime = time;
      currentTime = time;
    }
  }

  export function stop() {
    if (audioEl && playing) {
      audioEl.pause();
      playing = false;
      currentTime = 0;
    }
  }

  export function play(newSrc?: string) {
    if (newSrc && audioEl) {
      audioEl.src = newSrc.startsWith('http') || newSrc.startsWith('blob:') ? newSrc : convertFileSrc(newSrc);
      audioEl.load();
    }
    if (audioEl) {
      void audioEl.play();
      playing = true;
    }
  }
</script>

<div class="mini-player" class:playing>
  <audio
    bind:this={audioEl}
    src={playableSrc}
    preload="metadata"
    ontimeupdate={() => { if (audioEl) currentTime = audioEl.currentTime; }}
    onloadedmetadata={() => { if (audioEl) duration = audioEl.duration; }}
    onended={handleEnded}
  ></audio>

  <button type="button" class="mp-play" onclick={toggle} aria-label={playing ? '暂停' : '播放'}>
    <Icon name={playing ? 'pause-fill' : 'play-fill'} size={14} color="#fff" />
  </button>

  <div class="mp-wave">
    {#if playableSrc}
      <WaveformView
        audioSrc={playableSrc}
        {currentTime}
        {duration}
        onSeek={handleSeek}
        {height}
        barWidth={2}
        barGap={1}
      />
    {/if}
  </div>

  <span class="mp-time">{formatTime(currentTime)} / {formatTime(duration)}</span>

  {#if label}
    <span class="mp-label" title={label}>{label}</span>
  {/if}
</div>

<style>
  .mini-player {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    transition: border-color var(--motion-duration-mid) var(--motion-ease-base);
  }

  .mini-player.playing {
    border-color: color-mix(in srgb, var(--color-primary) 40%, var(--color-border-secondary));
  }

  .mp-play {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 50%;
    background: var(--color-primary);
    cursor: pointer;
    transition: background-color var(--motion-duration-mid) var(--motion-ease-base), transform 0.15s;
  }

  .mp-play:hover {
    background: var(--color-primary-hover);
    transform: scale(1.06);
  }

  .mp-wave {
    flex: 1;
    min-width: 0;
    height: 32px;
  }

  .mp-time {
    font-size: 11px;
    color: var(--color-text-tertiary);
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .mp-label {
    font-size: 11px;
    color: var(--color-text-disabled);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 120px;
    flex-shrink: 0;
  }
</style>
