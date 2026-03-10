<script lang="ts">
  import Icon from '../icons/Icon.svelte';
  import Logo from '../icons/Logo.svelte';
  import Tooltip from './Tooltip.svelte';
  import { onMount } from 'svelte';
  import { getCurrentWindow, type Window as TauriWindow } from '@tauri-apps/api/window';

  let isMaximized = $state(false);
  let isTauriApp = $state(false);
  let appWindow: TauriWindow | null = null;

  onMount(() => {
    (async () => {
      try {
        appWindow = getCurrentWindow();
        isMaximized = await appWindow.isMaximized();
        isTauriApp = true;
      } catch (e) {
        isTauriApp = false;
      }
    })();
  });

  // 窗口控制函数 - 复用缓存的 appWindow 实例
  async function withWindow(fn: (win: TauriWindow) => Promise<void>) {
    if (!isTauriApp || !appWindow) return;
    try {
      await fn(appWindow);
    } catch (e) {
      if (import.meta.env.DEV) console.warn('Window operation failed:', e);
    }
  }

  async function handleMinimize() {
    await withWindow(w => w.minimize());
  }

  async function handleMaximize() {
    await withWindow(async (w) => {
      await w.toggleMaximize();
      isMaximized = await w.isMaximized();
    });
  }

  async function handleClose() {
    await withWindow(w => w.close());
  }

  // 双击标题栏最大化/还原
  function handleHeaderDoubleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.closest('button, .header-right')) {
      return;
    }
    handleMaximize();
  }
</script>

<div class="header" ondblclick={handleHeaderDoubleClick} role="banner">
  <div class="header-left">
    <div class="logo-section">
      <div class="logo-icon">
        <Logo size={28} color="var(--color-text)" />
      </div>
      <div class="app-title">丸子配音</div>
    </div>
  </div>
  
  <div class="header-right">
    <Tooltip text="用户中心" position="bottom">
      <button class="icon-btn avatar-btn">
        <Icon name="avatar" size={32} color="var(--color-text-tertiary)" />
      </button>
    </Tooltip>
    <Tooltip text="教程" position="bottom">
      <button class="tutorial-btn active">
        <Icon name="tutorial" size={20} color="var(--color-text-tertiary)" />
        <span class="tutorial-text">教程</span>
      </button>
    </Tooltip>
    <Tooltip text="通知" position="bottom">
      <button class="icon-btn">
        <Icon name="bell" size={20} color="var(--color-text-tertiary)" />
      </button>
    </Tooltip>
    <div class="divider"></div>
    <Tooltip text="最小化" position="bottom">
      <button class="window-btn minimize-btn" onclick={handleMinimize}>
        <Icon name="minimize" size={20} color="var(--color-text-tertiary)" />
      </button>
    </Tooltip>
    <Tooltip text="最大化" position="bottom">
      <button class="window-btn maximize-btn" onclick={handleMaximize}>
        <Icon name={isMaximized ? "restore" : "maximize"} size={20} color="var(--color-text-tertiary)" />
      </button>
    </Tooltip>
    <Tooltip text="关闭" position="bottom">
      <button class="window-btn close-btn" onclick={handleClose}>
        <Icon name="close" size={20} color="var(--color-text-tertiary)" />
      </button>
    </Tooltip>
  </div>
</div>

<style>
  .header {
    height: 55px;
    min-height: 55px;
    background-color: var(--color-bg-base);
    border-bottom: 1px solid var(--color-border-secondary);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--spacing-lg);
    flex-shrink: 0;
    -webkit-app-region: drag;
    position: relative;
    z-index: 100;
  }
  
  @media (max-width: 768px) {
    .header {
      padding: 0 var(--spacing-md);
      height: 50px;
      min-height: 50px;
    }
  }
  
  .header-left {
    display: flex;
    align-items: center;
  }
  
  .logo-section {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .logo-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    flex-shrink: 0;
  }
  
  
  .app-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-text);
    letter-spacing: 0.3px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }
  
  @media (max-width: 768px) {
    .app-title {
      font-size: var(--font-size);
    }
  }
  
  @media (max-width: 480px) {
    .tutorial-text {
      display: none;
    }
  }
  
  .header-right {
    display: flex;
    align-items: center;
    -webkit-app-region: no-drag;
  }
  
  .header-right > :global(.tooltip-wrapper) {
    margin: 0 !important;
    display: flex !important;
    align-items: center;
    flex-shrink: 0;
  }
  
  .header-right > :global(.tooltip-wrapper) + :global(.tooltip-wrapper) {
    margin-left: var(--spacing-sm) !important;
  }
  
  :global(.header-right > .tooltip-wrapper + .divider) {
    margin-left: var(--spacing-sm) !important;
  }
  
  :global(.header-right > .divider + .tooltip-wrapper) {
    margin-left: var(--spacing-sm) !important;
  }
  
  .avatar-btn {
    transform: translateX(-5px);
    width: auto;
    height: auto;
    padding: 0;
  }
  
  .tutorial-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 var(--spacing-md);
    background: transparent;
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all var(--transition-duration) var(--transition-timing);
    -webkit-app-region: no-drag;
    flex-shrink: 0;
  }

  .tutorial-btn:hover {
    background-color: var(--color-bg-spotlight);
  }

  .tutorial-btn.active {
    background-color: var(--color-bg-spotlight);
  }

  .tutorial-btn.active .tutorial-text {
    color: var(--color-text-secondary);
  }

  .tutorial-btn.active :global(svg) {
    color: var(--color-text-secondary);
  }

  .tutorial-text {
    font-size: var(--font-size);
    color: var(--color-text-secondary);
    font-weight: 500;
    line-height: 1;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  /* 合并 icon-btn 和 window-btn 的公共样式 */
  .icon-btn,
  .window-btn {
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-duration) var(--transition-timing);
    -webkit-app-region: no-drag;
    flex-shrink: 0;
  }

  .icon-btn:hover,
  .window-btn:hover {
    background-color: var(--color-bg-spotlight);
  }

  .icon-btn:hover :global(svg),
  .window-btn:hover :global(svg) {
    color: var(--color-text);
  }

  .close-btn:hover {
    background-color: var(--color-error);
  }

  .close-btn:hover :global(svg) {
    color: var(--color-text-active);
  }

  .divider {
    width: 1px;
    height: 20px;
    background-color: var(--color-border);
    margin: 0 var(--spacing-xs);
    flex-shrink: 0;
  }
  
  /* 响应式调整 */
  @media (max-width: 1024px) {
    .header-right {
      gap: var(--spacing-xs);
    }
    
    .icon-btn,
    .window-btn {
      width: 32px;
      height: 32px;
    }
    
    .tutorial-btn {
      height: 28px;
    }
  }
  
  @media (max-width: 480px) {
    .logo-icon {
      width: 28px;
      height: 28px;
    }
    
    .header-right {
      gap: 4px;
    }
  }
</style>
