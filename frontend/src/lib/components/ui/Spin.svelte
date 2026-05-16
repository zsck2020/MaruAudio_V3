<script lang="ts" module>
  export type SpinSize = 'sm' | 'md' | 'lg' | 'xl';
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    size?: SpinSize;
    text?: string;
    spinning?: boolean;
    delay?: number;
    children?: Snippet;
    fullscreen?: boolean;
  }

  let {
    size = 'md',
    text = '',
    spinning = true,
    delay = 0,
    children,
    fullscreen = false,
  }: Props = $props();

  let visible = $state(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  $effect(() => {
    if (spinning) {
      if (delay > 0) {
        timer = setTimeout(() => (visible = true), delay);
      } else {
        visible = true;
      }
    } else {
      if (timer) clearTimeout(timer);
      visible = false;
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  });

  const sizeMap: Record<SpinSize, number> = { sm: 18, md: 28, lg: 38, xl: 48 };
  let spinPx = $derived(sizeMap[size]);
  let strokeWidth = $derived(size === 'sm' ? 2 : size === 'md' ? 3 : 4);
</script>

{#if children}
  <div class="spin-wrap" class:has-overlay={spinning && visible}>
    <div class="spin-content" class:blur={spinning && visible}>
      {@render children()}
    </div>
    {#if spinning && visible}
      <div class="spin-overlay" class:fullscreen role="status" aria-live="polite">
        <div class="spinner-stack">
          <span class="dot-spinner" style="width: {spinPx}px; height: {spinPx}px; border-width: {strokeWidth}px;"></span>
          {#if text}<span class="spin-text">{text}</span>{/if}
        </div>
      </div>
    {/if}
  </div>
{:else if visible}
  <div class="spin-bare" class:fullscreen role="status" aria-live="polite">
    <span class="dot-spinner" style="width: {spinPx}px; height: {spinPx}px; border-width: {strokeWidth}px;"></span>
    {#if text}<span class="spin-text">{text}</span>{/if}
  </div>
{/if}

<style>
  .spin-wrap {
    position: relative;
    display: contents;
  }
  .spin-wrap.has-overlay {
    display: block;
  }

  .spin-content.blur {
    opacity: 0.45;
    filter: blur(0.5px);
    pointer-events: none;
    transition: opacity var(--motion-duration-mid) var(--motion-ease-base);
  }

  .spin-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .spin-overlay.fullscreen,
  .spin-bare.fullscreen {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.45);
    z-index: 9999;
  }

  .spin-bare {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
  }

  .spinner-stack {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .dot-spinner {
    border-style: solid;
    border-color: var(--color-primary);
    border-top-color: transparent;
    border-radius: 50%;
    animation: ui-spin-rotate 0.9s linear infinite;
    display: inline-block;
  }

  .spin-text {
    color: var(--color-primary);
    font-size: var(--font-size-sm);
  }

  @keyframes ui-spin-rotate {
    to { transform: rotate(360deg); }
  }
</style>
