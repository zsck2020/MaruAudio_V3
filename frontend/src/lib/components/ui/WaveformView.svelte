<script lang="ts">
  import { computeWaveform } from '$lib/utils/waveform';

  interface Props {
    audioSrc: string;
    currentTime?: number;
    duration?: number;
    onSeek?: (time: number) => void;
    height?: number;
    barWidth?: number;
    barGap?: number;
    barRadius?: number;
    colorPlayed?: string;
    colorUnplayed?: string;
    colorPointer?: string;
    interactive?: boolean;
  }

  let {
    audioSrc,
    currentTime = 0,
    duration = 0,
    onSeek,
    height = 48,
    barWidth = 2,
    barGap = 1,
    barRadius = 1,
    colorPlayed = 'var(--color-primary)',
    colorUnplayed = 'rgba(255, 255, 255, 0.12)',
    colorPointer = 'var(--color-primary)',
    interactive = true,
  }: Props = $props();

  let canvasEl: HTMLCanvasElement | undefined = $state();
  let containerEl: HTMLDivElement | undefined = $state();
  let peaks: Float32Array | null = $state(null);
  let loading = $state(false);
  let containerWidth = $state(0);

  let barCount = $derived(
    containerWidth > 0 ? Math.floor(containerWidth / (barWidth + barGap)) : 200
  );

  let playedRatio = $derived(
    duration > 0 ? Math.min(currentTime / duration, 1) : 0
  );

  $effect(() => {
    if (!containerEl) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) containerWidth = e.contentRect.width;
    });
    ro.observe(containerEl);
    return () => ro.disconnect();
  });

  $effect(() => {
    if (!audioSrc || barCount <= 0) {
      peaks = null;
      return;
    }
    loading = true;
    computeWaveform(audioSrc, barCount)
      .then((p) => { peaks = p; })
      .catch(() => { peaks = null; })
      .finally(() => { loading = false; });
  });

  $effect(() => {
    draw();
  });

  function draw() {
    if (!canvasEl || !peaks || peaks.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const w = containerWidth;
    const h = height;

    canvasEl.width = w * dpr;
    canvasEl.height = h * dpr;
    canvasEl.style.width = `${w}px`;
    canvasEl.style.height = `${h}px`;

    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const playedBars = Math.floor(playedRatio * peaks.length);
    const minBarH = 2;

    const playedStyle = getComputedStyle(canvasEl);
    const playedColor = colorPlayed.startsWith('var(')
      ? playedStyle.getPropertyValue(colorPlayed.slice(4, -1).trim()) || '#3b6eaf'
      : colorPlayed;
    const unplayedColor = colorUnplayed;

    for (let i = 0; i < peaks.length; i++) {
      const x = i * (barWidth + barGap);
      const barH = Math.max(peaks[i] * (h - 4), minBarH);
      const y = (h - barH) / 2;

      ctx.fillStyle = i < playedBars ? playedColor : unplayedColor;
      if (barRadius > 0) {
        roundRect(ctx, x, y, barWidth, barH, barRadius);
      } else {
        ctx.fillRect(x, y, barWidth, barH);
      }
    }

    if (duration > 0 && playedRatio > 0 && playedRatio < 1) {
      const pointerX = playedRatio * w;
      const pointerColor = colorPointer.startsWith('var(')
        ? playedStyle.getPropertyValue(colorPointer.slice(4, -1).trim()) || '#3b6eaf'
        : colorPointer;
      ctx.fillStyle = pointerColor;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(pointerX - 0.5, 0, 1, h);
      ctx.globalAlpha = 1;
    }
  }

  function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number,
  ) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }

  function handlePointerDown(e: PointerEvent) {
    if (!interactive || !onSeek || duration <= 0 || !containerEl) return;
    seekToPointer(e);
    const onMove = (me: PointerEvent) => seekToPointer(me);
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  function seekToPointer(e: PointerEvent) {
    if (!containerEl || !onSeek || duration <= 0) return;
    const rect = containerEl.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  bind:this={containerEl}
  class="waveform-container"
  class:interactive
  class:loading
  style="height: {height}px"
  role={interactive ? 'slider' : undefined}
  aria-label="音频波形"
  aria-valuemin={interactive ? 0 : undefined}
  aria-valuemax={interactive ? (duration || 0) : undefined}
  aria-valuenow={interactive ? currentTime : undefined}
  tabindex={interactive ? 0 : undefined}
  onpointerdown={handlePointerDown}
>
  {#if loading}
    <div class="waveform-skeleton" aria-hidden="true"></div>
  {:else if peaks && peaks.length > 0}
    <canvas bind:this={canvasEl} class="waveform-canvas"></canvas>
  {:else}
    <div class="waveform-empty" aria-hidden="true"></div>
  {/if}
</div>

<style>
  .waveform-container {
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: var(--border-radius-sm, 4px);
    user-select: none;
    touch-action: none;
  }

  .waveform-container.interactive {
    cursor: pointer;
  }

  .waveform-canvas {
    display: block;
    width: 100%;
    height: 100%;
  }

  .waveform-skeleton {
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.04) 0%,
      rgba(255, 255, 255, 0.08) 50%,
      rgba(255, 255, 255, 0.04) 100%
    );
    background-size: 200% 100%;
    animation: waveform-shimmer 1.5s ease-in-out infinite;
    border-radius: inherit;
  }

  .waveform-empty {
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.03);
    border-radius: inherit;
  }

  @keyframes waveform-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
</style>
