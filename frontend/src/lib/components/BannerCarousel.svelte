<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    items,
    autoplayDuration = 5000,
    duration = 500,
    children,
  }: {
    items: any[];
    autoplayDuration?: number;
    duration?: number;
    children: Snippet<[any]>;
  } = $props();

  let currentIndex = $state(0);
  let isPaused = $state(false);
  let isTransitioning = $state(false);
  let autoplayTimer: ReturnType<typeof setInterval> | null = null;
  let containerEl: HTMLDivElement | undefined = $state();

  const totalItems = $derived(items.length);

  function goTo(index: number) {
    if (isTransitioning || totalItems <= 1) return;
    isTransitioning = true;
    currentIndex = ((index % totalItems) + totalItems) % totalItems;
    setTimeout(() => { isTransitioning = false; }, duration);
  }

  function next() { goTo(currentIndex + 1); }
  function prev() { goTo(currentIndex - 1); }

  function startAutoplay() {
    stopAutoplay();
    if (totalItems > 1) {
      autoplayTimer = setInterval(() => {
        if (!isPaused) next();
      }, autoplayDuration);
    }
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  $effect(() => {
    startAutoplay();
    return stopAutoplay;
  });

  // 触摸滑动支持
  let touchStartX = 0;

  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.touches[0].clientX;
    isPaused = true;
  }

  function handleTouchEnd(e: TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) {
      dx > 0 ? prev() : next();
    }
    isPaused = false;
  }

  function handleMouseEnter() { isPaused = true; }
  function handleMouseLeave() { isPaused = false; }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="carousel"
  role="region"
  aria-label="轮播图"
  bind:this={containerEl}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  ontouchstart={handleTouchStart}
  ontouchend={handleTouchEnd}
>
  <div
    class="carousel-track"
    style="transform: translateX(-{currentIndex * 100}%); transition-duration: {duration}ms;"
  >
    {#each items as item, i (i)}
      <div class="carousel-slide">
        {@render children(item)}
      </div>
    {/each}
  </div>

  {#if totalItems > 1}
    <div class="carousel-dots">
      {#each items as _, i (i)}
        <button
          type="button"
          class="dot"
          class:active={i === currentIndex}
          onclick={() => goTo(i)}
          aria-label="切换到第 {i + 1} 张"
        ></button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .carousel {
    position: relative;
    overflow: hidden;
    width: 100%;
  }

  .carousel-track {
    display: flex;
    transition-property: transform;
    transition-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1);
    will-change: transform;
  }

  .carousel-slide {
    min-width: 100%;
    flex-shrink: 0;
  }

  .carousel-dots {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 6px;
    z-index: 2;
  }

  .dot {
    width: 6px;
    height: 6px;
    min-height: unset !important;
    border-radius: 50%;
    border: none;
    background-color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    padding: 0;
    transition: background-color 0.3s, transform 0.3s;
  }

  .dot:hover {
    background-color: rgba(255, 255, 255, 0.7);
  }

  .dot.active {
    background-color: var(--color-primary, #3b6eaf);
    transform: scale(1.3);
  }
</style>
