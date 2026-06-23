<script lang="ts">
  import Icon from '../icons/Icon.svelte';
  import Logo from '../icons/Logo.svelte';
  import Tooltip from './Tooltip.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { toast } from '$lib/stores/toast.svelte';
  import { membership } from '$lib/stores/membership.svelte';
  import PermissionBadge from '$lib/components/membership/PermissionBadge.svelte';

  let isMaximized = $state(false);
  let showProfileMenu = $state(false);
  let showOrdersModal = $state(false);
  let showRedeemModal = $state(false);
  let showLogoutConfirm = $state(false);
  let redeemKey = $state('');
  let redeemLoading = $state(false);

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

  const mockOrders = [
    { id: 'ORD-20260527001', time: '2026-05-27 14:32', type: '云端字符包', detail: '日常包 · 5 万字', amount: '¥39.9', status: '已完成' },
    { id: 'ORD-20260525002', time: '2026-05-25 09:18', type: '旗舰版', detail: '永久授权', amount: '¥198', status: '已完成' },
    { id: 'ORD-20260520003', time: '2026-05-20 16:45', type: '云端字符包', detail: '体验包 · 1 万字', amount: '¥9.9', status: '已完成' },
    { id: 'ORD-20260518004', time: '2026-05-18 11:22', type: '卡密兑换', detail: '旗舰版激活码', amount: '¥0', status: '已兑换' },
    { id: 'ORD-20260515005', time: '2026-05-15 20:08', type: '云端字符包', detail: '创作包 · 20 万字', amount: '¥129', status: '已退款' },
    { id: 'ORD-20260510006', time: '2026-05-10 08:30', type: '云端字符包', detail: '商业包 · 100 万字', amount: '¥499', status: '已完成' },
  ];

  function handleProfileAction(action: 'profile' | 'account' | 'billing' | 'orders' | 'redeem' | 'logout') {
    showProfileMenu = false;
    if (action === 'profile') { goto('/profile'); return; }
    if (action === 'account') { goto('/setting'); return; }
    if (action === 'billing') { membership.requestUpgrade('cloud_chars'); return; }
    if (action === 'orders') { showOrdersModal = true; return; }
    if (action === 'redeem') { redeemKey = ''; showRedeemModal = true; return; }
    if (action === 'logout') { showLogoutConfirm = true; return; }
  }

  async function handleRedeem() {
    redeemLoading = true;
    try {
      const result = await membership.redeemCardKey(redeemKey);
      if (result.ok) {
        toast.success(result.message);
        showRedeemModal = false;
        redeemKey = '';
      } else {
        toast.warning(result.message);
      }
    } finally {
      redeemLoading = false;
    }
  }

  async function handleLogout() {
    await membership.logout();
    showLogoutConfirm = false;
    toast.success('已退出登录');
    goto('/');
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
        <button type="button" class="plan-chip" onclick={() => goto('/profile')} title="查看套餐权益">
          <PermissionBadge label={membership.plan.badge} tone={membership.isPaid ? 'flagship' : 'free'} compact />
        </button>
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
              <div class="profile-sub">
                {membership.plan.name}
                {#if membership.isPaid}
                  · 云端 {membership.account.cloudBalance.toLocaleString('zh-CN')} 字
                {:else}
                  · 今日剩余 {membership.dailyRemaining.toLocaleString('zh-CN')} 字
                {/if}
              </div>
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
            <span>字符包 / 升级</span>
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

<!-- 消费记录弹窗 -->
<Modal bind:open={showOrdersModal} title="消费记录" size="lg" onClose={() => showOrdersModal = false}>
  <div class="orders-body">
    <div class="orders-summary">
      <div class="summary-item">
        <span>累计消费</span>
        <strong>¥875.8</strong>
      </div>
      <div class="summary-item">
        <span>订单总数</span>
        <strong>{mockOrders.length}</strong>
      </div>
      <div class="summary-item">
        <span>云端字符累计购买</span>
        <strong>126 万字</strong>
      </div>
    </div>
    <div class="orders-table">
      <div class="orders-head">
        <span>订单号</span><span>时间</span><span>类型</span><span>详情</span><span>金额</span><span>状态</span>
      </div>
      {#each mockOrders as order (order.id)}
        <div class="order-row">
          <span class="order-id">{order.id}</span>
          <span>{order.time}</span>
          <span>{order.type}</span>
          <span>{order.detail}</span>
          <span class="order-amount">{order.amount}</span>
          <span class="order-status" class:refunded={order.status === '已退款'}>{order.status}</span>
        </div>
      {/each}
    </div>
    <p class="orders-hint">以上为本机记录，完整消费明细请登录管理后台查看。</p>
  </div>
</Modal>

<!-- 卡密兑换弹窗 -->
<Modal bind:open={showRedeemModal} title="卡密兑换" size="sm" onClose={() => showRedeemModal = false}>
  <div class="redeem-body">
    <div class="redeem-icon">
      <Icon name="gift" size={36} color="var(--color-primary)" />
    </div>
    <p class="redeem-desc">输入卡密激活码，兑换旗舰版权益或云端字符包。卡密不区分大小写，每个卡密仅可使用一次。</p>
    <div class="redeem-input-wrap">
      <input
        type="text"
        class="redeem-input"
        placeholder="请输入卡密，如 MARU-VIP-XXXX-XXXX"
        bind:value={redeemKey}
        onkeydown={(e) => e.key === 'Enter' && !redeemLoading && redeemKey.trim() && handleRedeem()}
      />
    </div>
    <div class="redeem-actions">
      <Button variant="default" size="sm" onclick={() => showRedeemModal = false}>取消</Button>
      <Button variant="primary" size="sm" onclick={handleRedeem} loading={redeemLoading} disabled={!redeemKey.trim()}>兑换</Button>
    </div>
    <p class="redeem-hint">卡密来源：官方活动、合作渠道、邀请奖励。如有问题请联系客服。</p>
  </div>
</Modal>

<!-- 退出登录确认弹窗 -->
<Modal bind:open={showLogoutConfirm} title="退出登录" size="sm" onClose={() => showLogoutConfirm = false}>
  <div class="logout-body">
    <div class="logout-icon">
      <Icon name="warning" size={36} color="var(--color-warning)" />
    </div>
    <p class="logout-desc">退出登录后，会员权益将暂停，云端余额保留在账户中。本地项目和样音不受影响。</p>
    <div class="logout-info">
      <div><span>当前套餐</span><strong>{membership.plan.name}</strong></div>
      {#if membership.account.cloudBalance > 0}
        <div><span>云端余额</span><strong>{membership.account.cloudBalance.toLocaleString('zh-CN')} 字</strong></div>
      {/if}
    </div>
    <div class="logout-actions">
      <Button variant="default" size="sm" onclick={() => showLogoutConfirm = false}>取消</Button>
      <Button variant="danger" size="sm" onclick={handleLogout}>确认退出</Button>
    </div>
  </div>
</Modal>

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

  .plan-chip {
    display: inline-flex;
    align-items: center;
    padding: 0;
    background: transparent;
    border: none;
    cursor: pointer;
    -webkit-app-region: no-drag;
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
    width: var(--control-height-xs);
    height: var(--control-height-xs);
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
    height: var(--control-height-xs);
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
    width: var(--control-height-xs);
    height: var(--control-height-xs);
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
    width: var(--control-height-sm);
    height: var(--control-height-sm);
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
    width: var(--control-height-sm);
    height: var(--control-height-sm);
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
    height: var(--control-height-sm);
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
      width: var(--control-height-xs);
      height: var(--control-height-xs);
    }
    
    .tutorial-btn {
      height: var(--control-height-xs);
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

  /* 消费记录弹窗 */
  .orders-body {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .orders-summary {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-sm);
  }

  .summary-item {
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-container);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .summary-item span {
    color: var(--color-text-tertiary);
    font-size: var(--font-size-xs);
  }

  .summary-item strong {
    color: var(--color-primary);
    font-size: var(--font-size-lg);
  }

  .orders-table {
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    overflow: hidden;
  }

  .orders-head,
  .order-row {
    display: grid;
    grid-template-columns: minmax(100px, 1.2fr) minmax(90px, 1fr) 70px minmax(80px, 1fr) 60px 60px;
    align-items: center;
    gap: var(--spacing-sm);
    padding: 0 var(--spacing-md);
    min-height: 38px;
    font-size: var(--font-size-sm);
  }

  .orders-head {
    color: var(--color-text-tertiary);
    background: var(--color-bg-container);
    border-bottom: 1px solid var(--color-border-secondary);
    font-size: var(--font-size-xs);
  }

  .order-row {
    color: var(--color-text-secondary);
    border-bottom: 1px solid var(--color-border-secondary);
    transition: background-color var(--transition-duration) var(--transition-timing);
  }

  .order-row:last-child { border-bottom: none; }
  .order-row:hover { background: var(--color-hover-bg); }

  .order-id {
    color: var(--color-text-tertiary);
    font-family: ui-monospace, Menlo, Consolas, monospace;
    font-size: var(--font-size-xs);
  }

  .order-amount { color: var(--color-text); font-weight: 500; }

  .order-status {
    padding: 2px 7px;
    border-radius: var(--border-radius-pill);
    font-size: var(--font-size-xs);
    color: var(--color-success);
    background: color-mix(in srgb, var(--color-success) 14%, transparent);
    text-align: center;
  }

  .order-status.refunded {
    color: var(--color-warning);
    background: color-mix(in srgb, var(--color-warning) 14%, transparent);
  }

  .orders-hint {
    margin: 0;
    color: var(--color-text-disabled);
    font-size: var(--font-size-xs);
    text-align: center;
  }

  /* 卡密兑换弹窗 */
  .redeem-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md) 0;
  }

  .redeem-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--color-primary) 14%, transparent);
  }

  .redeem-desc {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    line-height: 1.6;
    text-align: center;
  }

  .redeem-input-wrap {
    width: 100%;
  }

  .redeem-input {
    width: 100%;
    height: 40px;
    padding: 0 var(--spacing-md);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    background: var(--color-bg-base);
    color: var(--color-text);
    font-family: ui-monospace, Menlo, Consolas, monospace;
    font-size: var(--font-size);
    letter-spacing: 1px;
    text-align: center;
    outline: none;
    box-sizing: border-box;
    transition: border-color var(--transition-duration) var(--transition-timing);
  }

  .redeem-input:focus { border-color: var(--color-primary); }

  .redeem-actions {
    display: flex;
    gap: var(--spacing-sm);
    width: 100%;
  }

  .redeem-actions :global(.ui-btn) { flex: 1; }

  .redeem-hint {
    margin: 0;
    color: var(--color-text-disabled);
    font-size: var(--font-size-xs);
    text-align: center;
  }

  /* 退出登录确认弹窗 */
  .logout-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md) 0;
  }

  .logout-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--color-warning) 14%, transparent);
  }

  .logout-desc {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    line-height: 1.6;
    text-align: center;
  }

  .logout-info {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-container);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .logout-info div {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--font-size-sm);
  }

  .logout-info span { color: var(--color-text-tertiary); }
  .logout-info strong { color: var(--color-text); font-weight: 500; }

  .logout-actions {
    display: flex;
    gap: var(--spacing-sm);
    width: 100%;
  }

  .logout-actions :global(.ui-btn) { flex: 1; }
</style>
