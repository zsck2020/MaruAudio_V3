<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    text,
    position = 'right',
    delay = 150,
    wrapperClass = '',
    children
  }: {
    text: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
    wrapperClass?: string;
    children: Snippet;
  } = $props();

  let visible = $state(false);
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let isHovering = $state(false);

  function show() {
    timeout = setTimeout(() => {
      visible = true;
    }, delay);
  }

  function hide() {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    visible = false;
  }

  function handleMouseEnter() {
    isHovering = true;
    show();
  }

  function handleMouseLeave() {
    isHovering = false;
    hide();
  }

  function handleFocusIn(e: FocusEvent) {
    // 仅在键盘导航（Tab）聚焦时显示，避免鼠标点击或窗口激活误触发
    const target = e.target as HTMLElement;
    if (target && target.matches(':focus-visible')) {
      show();
    }
  }

  function handleFocusOut() {
    if (!isHovering) {
      hide();
    }
  }
</script>

<div
  class="tooltip-wrapper {wrapperClass}"
  role="group"
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  onfocusin={handleFocusIn}
  onfocusout={handleFocusOut}
>
  {@render children()}
  {#if visible}
    <div class="tooltip-content {position}">
      <span class="tooltip-text">{text}</span>
      <div class="tooltip-arrow"></div>
    </div>
  {/if}
</div>

<style>
  .tooltip-wrapper {
    position: relative;
    display: inline-flex;
  }

  .tooltip-content {
    position: absolute;
    z-index: 9999;
    background-color: var(--color-bg-elevated, #2D2F38);
    color: var(--color-text, rgba(255, 255, 255, 0.9));
    padding: 8px 12px;
    border-radius: var(--border-radius, 6px);
    font-size: var(--font-size-sm, 12px);
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
    pointer-events: none;
    white-space: nowrap;
    animation: fadeIn 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(8px);
    letter-spacing: 0.2px;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .tooltip-arrow {
    position: absolute;
    width: 6px;
    height: 6px;
    background-color: var(--color-bg-elevated, #2D2F38);
    border: 1px solid rgba(255, 255, 255, 0.05);
    transform: rotate(45deg);
  }

  /* Right position */
  .tooltip-content.right {
    left: calc(100% + 10px);
    top: 50%;
    transform: translateY(-50%);
  }
  .tooltip-content.right .tooltip-arrow {
    left: -3px;
    top: 50%;
    margin-top: -3px;
    border-right: none;
    border-bottom: none;
  }

  /* Left position */
  .tooltip-content.left {
    right: calc(100% + 10px);
    top: 50%;
    transform: translateY(-50%);
  }
  .tooltip-content.left .tooltip-arrow {
    right: -3px;
    top: 50%;
    margin-top: -3px;
    border-left: none;
    border-top: none;
  }

  /* Bottom position */
  .tooltip-content.bottom {
    top: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%);
  }
  .tooltip-content.bottom .tooltip-arrow {
    top: -3px;
    left: 50%;
    margin-left: -3px;
    border-top: none;
    border-left: none;
  }

  /* Top position */
  .tooltip-content.top {
    bottom: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%);
  }
  .tooltip-content.top .tooltip-arrow {
    bottom: -3px;
    left: 50%;
    margin-left: -3px;
    border-bottom: none;
    border-right: none;
  }

  .tooltip-text {
    white-space: nowrap;
    line-height: 1.4;
    user-select: none;
  }

  /* 优化移动端显示 */
  @media (max-width: 768px) {
    .tooltip-content {
      padding: 6px 10px;
      font-size: 11px;
    }
  }
</style>


