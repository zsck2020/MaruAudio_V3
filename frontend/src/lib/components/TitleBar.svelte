<script lang="ts">
  import Icon from '../icons/Icon.svelte';
  import Logo from '../icons/Logo.svelte';
  import Tooltip from './Tooltip.svelte';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { toast } from '$lib/stores/toast.svelte';

  let isMaximized = $state(false);
  let showProfileMenu = $state(false);

  async function getWindow() {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      return getCurrentWindow();
    } catch {
      return null;
    }
  }

  onMount(async () => {
    const win = await getWindow();
    if (win) {
      isMaximized = await win.isMaximized();
    }
  });

  async function withWindow(fn: (win: any) => Promise<void>) {
    const win = await getWindow();
    if (!win) return;
    try {
      await fn(win);
    } catch (e) {
      if (import.meta.env.DEV) console.warn('窗口操作失败：', e);
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

  function handleComingSoon(feature: string) {
    toast.info(`${feature} 功能即将开放`);
  }

  function handleProfileAction(action: 'profile' | 'account' | 'billing' | 'orders' | 'redeem' | 'logout') {
    showProfileMenu = false;
    if (action === 'profile') {
      goto('/profile');
      return;
    }

    const labels: Record<typeof action, string> = {
      account: '账号设置',
      billing: '充值中心',
      orders: '消费记录',
      redeem: '卡密兑换',
      logout: '退出登录',
    };
    toast.info(`${labels[action]} 功能即将开放`);
  }

  function handleProfileFocusOut(event: FocusEvent) {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof HTMLElement && nextTarget.closest('.profile-menu-wrap')) return;
    showProfileMenu = false;
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
      <div class="app-title">丸子配音<span class="version">V3.0.0</span></div>
    </div>
  </div>
  
  <div class="header-right">
    <div class="profile-menu-wrap" onfocusout={handleProfileFocusOut}>
      <Tooltip text="用户中心" position="bottom">
        <button
          type="button"
          class="icon-btn avatar-btn"
          class:active={showProfileMenu}
          aria-label="用户中心"
          aria-haspopup="menu"
          aria-expanded={showProfileMenu}
          onclick={() => (showProfileMenu = !showProfileMenu)}
        >
          <div class="avatar-circle">
            <Icon name="avatar" size={16} color={showProfileMenu ? 'var(--color-primary)' : 'var(--color-text-tertiary)'} />
          </div>
        </button>
      </Tooltip>

      {#if showProfileMenu}
        <div class="profile-menu" role="menu">
          <div class="profile-card">
            <div class="profile-avatar">
              <Icon name="sound-fill" size={18} color="var(--color-primary)" />
            </div>
            <div class="profile-meta">
              <div class="profile-name">清风明月</div>
              <div class="profile-sub">PRO 会员 · 剩余 128,420 字符</div>
            </div>
          </div>
          <button type="button" role="menuitem" class="profile-menu-item active" onclick={() => handleProfileAction('profile')}>
            <Icon name="avatar" size={14} color="currentColor" />
            <span>个人中心</span>
          </button>
          <button type="button" role="menuitem" class="profile-menu-item" onclick={() => handleProfileAction('account')}>
            <Icon name="setting" size={14} color="currentColor" />
            <span>账号设置</span>
          </button>
          <button type="button" role="menuitem" class="profile-menu-item" onclick={() => handleProfileAction('billing')}>
            <Icon name="wallet" size={14} color="currentColor" />
            <span>充值中心</span>
          </button>
          <button type="button" role="menuitem" class="profile-menu-item" onclick={() => handleProfileAction('orders')}>
            <Icon name="file-text" size={14} color="currentColor" />
            <span>消费记录</span>
          </button>
          <button type="button" role="menuitem" class="profile-menu-item" onclick={() => handleProfileAction('redeem')}>
            <Icon name="gift" size={14} color="currentColor" />
            <span>卡密兑换</span>
          </button>
          <div class="profile-menu-divider"></div>
          <button type="button" role="menuitem" class="profile-menu-item danger" onclick={() => handleProfileAction('logout')}>
            <Icon name="logout" size={14} color="currentColor" />
            <span>退出登录</span>
          </button>
        </div>
      {/if}
    </div>
    <Tooltip text="教程" position="bottom">
      <button type="button" class="tutorial-btn" aria-label="教程" onclick={() => handleComingSoon('教程')}>
        <Icon name="tutorial" size={20} color="var(--color-text-tertiary)" />
        <span class="tutorial-text">教程</span>
      </button>
    </Tooltip>
    <Tooltip text="通知" position="bottom">
      <button type="button" class="icon-btn" aria-label="通知" onclick={() => handleComingSoon('通知')}>
        <Icon name="bell" size={20} color="var(--color-text-tertiary)" />
      </button>
    </Tooltip>
    <div class="divider"></div>
    <Tooltip text="最小化" position="bottom">
      <button type="button" class="window-btn minimize-btn" aria-label="最小化" onclick={handleMinimize}>
        <Icon name="minimize" size={20} color="var(--color-text-tertiary)" />
      </button>
    </Tooltip>
    <Tooltip text="最大化" position="bottom">
      <button type="button" class="window-btn maximize-btn" aria-label={isMaximized ? '还原窗口' : '最大化'} onclick={handleMaximize}>
        <Icon name={isMaximized ? "restore" : "maximize"} size={20} color="var(--color-text-tertiary)" />
      </button>
    </Tooltip>
    <Tooltip text="关闭" position="bottom">
      <button type="button" class="window-btn close-btn" aria-label="关闭" onclick={handleClose}>
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
    display: flex;
    align-items: flex-end;
    gap: 6px;
  }

  .version {
    font-size: 10px;
    font-weight: 300;
    color: var(--color-text-tertiary);
    letter-spacing: 0;
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

  .profile-menu-wrap {
    position: relative;
    display: flex;
    align-items: center;
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
  
  .avatar-circle {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1.5px solid var(--color-text-tertiary);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color var(--transition-duration) var(--transition-timing);
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
    transition: background-color var(--transition-duration) var(--transition-timing), color var(--transition-duration) var(--transition-timing), border-color var(--transition-duration) var(--transition-timing);
    -webkit-app-region: no-drag;
    flex-shrink: 0;
  }

  .tutorial-btn:hover {
    background-color: var(--color-bg-spotlight);
  }

  .tutorial-btn:focus-visible,
  .icon-btn:focus-visible,
  .window-btn:focus-visible {
    box-shadow: inset 0 0 0 1px var(--color-primary);
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
    transition: background-color var(--transition-duration) var(--transition-timing), color var(--transition-duration) var(--transition-timing), border-color var(--transition-duration) var(--transition-timing);
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

  .icon-btn.avatar-btn {
    width: 34px;
    height: 34px;
    padding: 0;
    border-radius: 50%;
  }

  .icon-btn.avatar-btn.active {
    background-color: var(--color-bg-spotlight);
  }

  .icon-btn.avatar-btn.active .avatar-circle {
    border-color: var(--color-primary);
  }

  .icon-btn.avatar-btn:hover .avatar-circle {
    border-color: var(--color-text);
  }

  .icon-btn.avatar-btn:hover .avatar-circle :global(svg) {
    color: var(--color-text) !important;
  }

  .profile-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 220px;
    padding: var(--spacing-sm);
    background-color: var(--color-bg-elevated);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
    z-index: 300;
  }

  .profile-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
    border-radius: var(--border-radius);
    background-color: var(--color-bg-container);
    border: 1px solid var(--color-border-secondary);
    margin-bottom: var(--spacing-xs);
  }

  .profile-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: color-mix(in srgb, var(--color-primary) 18%, transparent);
    flex-shrink: 0;
  }

  .profile-meta {
    min-width: 0;
  }

  .profile-name {
    font-size: var(--font-size-sm);
    color: var(--color-text);
    font-weight: 500;
  }

  .profile-sub {
    font-size: 10px;
    color: var(--color-text-tertiary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .profile-menu-item {
    width: 100%;
    height: 32px;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: 0 var(--spacing-sm);
    background: transparent;
    border: none;
    border-radius: var(--border-radius-sm);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition:
      background-color var(--transition-duration) var(--transition-timing),
      color var(--transition-duration) var(--transition-timing);
  }

  .profile-menu-item:hover,
  .profile-menu-item.active {
    background-color: var(--color-bg-spotlight);
    color: var(--color-primary);
  }

  .profile-menu-item.danger {
    color: var(--color-error);
  }

  .profile-menu-divider {
    height: 1px;
    margin: var(--spacing-xs) 0;
    background-color: var(--color-border-secondary);
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
