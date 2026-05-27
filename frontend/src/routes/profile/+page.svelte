<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import Icon from '$lib/icons/Icon.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { appSettings } from '$lib/stores/settings.svelte';

  onMount(() => { void appSettings.init(); });

  function fmt(n: number): string {
    return n.toLocaleString('zh-CN');
  }

  function durationLabel(ms: number): string {
    const totalMin = Math.floor(ms / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  }

  let monthlyChars = $derived(fmt(appSettings.usage.monthlyCharsGenerated));
  let totalDuration = $derived(durationLabel(appSettings.usage.totalDurationMs));
  let totalProjects = $derived(fmt(appSettings.usage.totalProjects));
  let remainingChars = $derived(fmt(Math.max(0, appSettings.usage.quota - appSettings.usage.monthlyCharsGenerated)));
  let usedChars = $derived(fmt(appSettings.usage.monthlyCharsGenerated));
  let quotaPercent = $derived(
    appSettings.usage.quota > 0
      ? Math.min(100, Math.round((appSettings.usage.monthlyCharsGenerated / appSettings.usage.quota) * 100))
      : 0,
  );

  const quickLinks = [
    { icon: 'project-box', label: '我的项目' },
    { icon: 'sound', label: '我的样音' },
    { icon: 'subtitle', label: '我的字幕' },
    { icon: 'download', label: '我的下载' },
    { icon: 'star', label: '收藏夹' },
    { icon: 'delete', label: '回收站' },
    { icon: 'message', label: '消息中心' },
    { icon: 'help', label: '帮助中心' },
  ];

  const privileges = ['高速生成队列', '云端引擎不限量', '专属客服通道', '新功能尝鲜'];

  const devices = [
    { icon: 'windows', name: 'Windows · MaruPC', time: '2026-05-13 19:42', current: true },
  ];

  function copyInvite() {
    toast.success('邀请码已复制');
  }
</script>

<div class="profile-page">
  <header class="profile-header">
    <h1>个人中心</h1>
    <button type="button" class="back-link" onclick={() => goto('/')}>
      返回首页
      <Icon name="arrow-right" size={12} color="currentColor" />
    </button>
  </header>

  <section class="hero-card">
    <div class="user-block">
      <div class="avatar-shell">
        <Icon name="sound-fill" size={46} color="var(--color-primary)" />
        <button type="button" class="camera-btn" aria-label="更换头像（即将推出）" disabled>
          <Icon name="image" size={12} color="var(--color-text)" />
        </button>
      </div>
      <div class="user-meta">
        <div class="name-row">
          <span class="user-name">清风明月</span>
          <span class="pro-badge"><Icon name="crown" size={12} color="#1a1a1a" />PRO 会员</span>
          <span class="verified">已认证</span>
        </div>
        <div class="user-sub">UID 100086 · 已加入 384 天</div>
        <p>专注影视配音 · 5 年创作者</p>
      </div>
    </div>

    <div class="hero-stats">
      <div class="hero-stat">
        <span>本月生成字符</span>
        <strong>{monthlyChars}</strong>
      </div>
      <div class="hero-stat">
        <span>配音时长</span>
        <strong>{totalDuration}</strong>
      </div>
      <div class="hero-stat">
        <span>累计项目</span>
        <strong>{totalProjects}</strong>
      </div>
    </div>
  </section>

  <div class="profile-grid">
    <main class="profile-main">
      <article class="card balance-card">
        <header class="card-head">
          <h2>账户余额</h2>
          <button type="button" class="link" disabled title="即将推出">查看明细</button>
        </header>
        <div class="balance-body">
          <div>
            <div class="big-number">{remainingChars}</div>
            <div class="muted">剩余字符</div>
          </div>
          <div class="quota-visual" aria-label="本月配额使用情况">
            <div class="quota-bar">
              <div class="quota-fill" style="width:{quotaPercent}%"></div>
            </div>
            <div class="quota-labels">
              <span>已用 {quotaPercent}%</span>
              <span>配额 {fmt(appSettings.usage.quota)}</span>
            </div>
          </div>
        </div>
        <footer class="card-actions">
          <span class="muted">本月已使用 {usedChars} 字符</span>
          <div>
            <button type="button" class="btn-secondary" disabled title="即将推出">字符流水</button>
            <button type="button" class="btn-primary" disabled title="即将推出">
              <Icon name="thunder-fill" size={14} color="#fff" />
              立即充值
            </button>
          </div>
        </footer>
      </article>

      <article class="card member-card">
        <div class="member-badge">
          <Icon name="crown" size={26} color="#1a1a1a" />
          <span>PRO</span>
        </div>
        <div class="member-info">
          <h2>PRO 会员</h2>
          <p>2026-12-31 到期 · 还剩 218 天</p>
        </div>
        <ul class="privileges">
          {#each privileges as item (item)}
            <li><Icon name="check-circle" size={13} color="var(--color-success)" />{item}</li>
          {/each}
        </ul>
        <div class="member-actions">
          <button type="button" class="btn-secondary" disabled title="即将推出">续费</button>
          <button type="button" class="btn-primary" disabled title="即将推出">升级至企业版</button>
        </div>
      </article>

      <article class="card invite-card">
        <header class="card-head">
          <h2>邀请有礼</h2>
          <button type="button" class="link" disabled title="即将推出">邀请记录</button>
        </header>
        <div class="invite-body">
          <div class="invite-code">
            <span>MARU-Q8K3</span>
            <button type="button" onclick={copyInvite}>
              <Icon name="copy" size={14} color="var(--color-text-tertiary)" />
            </button>
          </div>
          <div class="invite-stat"><span>已邀请</span><strong>8 人</strong></div>
          <div class="invite-stat"><span>累计奖励</span><strong>16,000 字符</strong></div>
          <button type="button" class="btn-secondary" disabled title="即将推出">分享海报</button>
        </div>
      </article>
    </main>

    <aside class="profile-side">
      <article class="card">
        <header class="card-head"><h2>快捷入口</h2></header>
        <div class="quick-grid">
          {#each quickLinks as item (item.label)}
            <button type="button" class="quick-item" disabled title="即将推出">
              <Icon name={item.icon} size={20} color="var(--color-primary)" />
              <span>{item.label}</span>
            </button>
          {/each}
        </div>
      </article>

      <article class="card">
        <header class="card-head">
          <h2>账号安全</h2>
          <span class="safe-badge">安全级别 高</span>
        </header>
        <div class="safe-list">
          <div><span>手机绑定</span><strong>138****8888</strong><button>修改</button></div>
          <div><span>邮箱绑定</span><strong>q***@example.com</strong><button>更换</button></div>
          <div><span>登录密码</span><strong>上次修改 60 天前</strong><button>修改密码</button></div>
          <div><span>第三方登录</span><strong>微信已绑定 · QQ 未绑定</strong><button>管理</button></div>
          <div><span>登录设备</span><strong>3 台</strong><button>管理</button></div>
        </div>
      </article>

      <article class="card">
        <header class="card-head"><h2>设备管理</h2></header>
        <div class="device-list">
          {#each devices as item (item.name)}
            <div class="device-row">
              <Icon name={item.icon} size={16} color="var(--color-text-tertiary)" />
              <div>
                <span>{item.name}</span>
                <small>最后登录：{item.time}</small>
              </div>
              {#if item.current}
                <em>当前</em>
              {:else}
                <button type="button" disabled title="即将推出">移除</button>
              {/if}
            </div>
          {/each}
        </div>
      </article>

      <button type="button" class="logout-btn" disabled title="即将推出">退出登录</button>
    </aside>
  </div>
</div>

<style>
  .profile-page {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding: var(--spacing-lg);
    background-color: var(--color-bg-container);
    display: flex;
    flex-direction: column;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .profile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 36px;
  }

  .profile-header h1 {
    margin: 0;
    font-size: var(--font-size-xl);
    color: var(--color-text);
    font-weight: 600;
  }

  .back-link,
  .link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: transparent;
    border: none;
    color: var(--color-primary);
    font-size: var(--font-size-sm);
    cursor: pointer;
  }

  .hero-card,
  .card {
    background-color: var(--color-bg-elevated);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
  }

  .hero-card {
    min-height: 136px;
    padding: var(--spacing-lg);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-lg);
  }

  .user-block {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
  }

  .avatar-shell {
    width: 88px;
    height: 88px;
    position: relative;
    border-radius: 50%;
    border: 1px solid color-mix(in srgb, var(--color-primary) 50%, transparent);
    background:
      radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--color-primary) 28%, transparent), transparent 42%),
      var(--color-bg-base);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .camera-btn {
    position: absolute;
    right: 2px;
    bottom: 4px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1px solid var(--color-border-secondary);
    background-color: var(--color-bg-elevated);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .user-meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .name-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .user-name {
    font-size: 24px;
    color: var(--color-text);
    font-weight: 600;
  }

  .pro-badge,
  .verified,
  .safe-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 20px;
    padding: 0 8px;
    border-radius: var(--border-radius-sm);
    font-size: 11px;
  }

  .pro-badge {
    background: linear-gradient(135deg, #d4a44a, #b8862c);
    color: #1a1a1a;
    font-weight: 600;
  }

  .verified {
    color: var(--color-primary);
    background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
  }

  .safe-badge {
    color: var(--color-success);
    background-color: color-mix(in srgb, var(--color-success) 14%, transparent);
  }

  .user-sub,
  .muted,
  .user-meta p {
    margin: 0;
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
  }

  .hero-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(110px, 1fr));
    gap: var(--spacing-sm);
  }

  .hero-stat {
    min-width: 110px;
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-bg-container);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .hero-stat span {
    color: var(--color-text-tertiary);
    font-size: 11px;
  }

  .hero-stat strong,
  .big-number {
    color: var(--color-primary);
    font-weight: 700;
    text-shadow: 0 0 18px color-mix(in srgb, var(--color-primary) 28%, transparent);
  }

  .hero-stat strong {
    font-size: var(--font-size-xl);
  }

  .profile-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr);
    gap: var(--spacing-lg);
    min-height: 0;
  }

  .profile-main,
  .profile-side {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .card {
    overflow: hidden;
  }

  .card-head {
    height: 44px;
    padding: 0 var(--spacing-lg);
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .card-head h2 {
    margin: 0;
    color: var(--color-text);
    font-size: var(--font-size);
    font-weight: 500;
  }

  .balance-body {
    padding: var(--spacing-lg);
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: var(--spacing-lg);
    align-items: end;
  }

  .big-number {
    font-size: 40px;
    line-height: 1;
  }

  .quota-visual {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: var(--spacing-sm);
    padding-bottom: var(--spacing-sm);
  }

  .quota-bar {
    height: 10px;
    border-radius: 5px;
    background-color: color-mix(in srgb, var(--color-border) 60%, transparent);
    overflow: hidden;
  }

  .quota-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 70%, white 30%));
    border-radius: 5px;
    transition: width var(--motion-duration-mid) var(--motion-ease-base);
  }

  .quota-labels {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--color-text-tertiary);
  }

  .card-actions {
    min-height: 48px;
    padding: 0 var(--spacing-lg) var(--spacing-md);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-md);
  }

  .card-actions > div {
    display: flex;
    gap: var(--spacing-sm);
  }

  .btn-primary,
  .btn-secondary {
    height: 32px;
    padding: 0 var(--spacing-md);
    border-radius: var(--border-radius);
    font-size: var(--font-size-sm);
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .btn-primary {
    background-color: var(--color-primary);
    color: #fff;
  }

  .btn-secondary {
    background-color: transparent;
    border: 1px solid var(--color-border-secondary);
    color: var(--color-text-secondary);
  }

  .member-card {
    padding: var(--spacing-lg);
    display: grid;
    grid-template-columns: 88px 1fr 1.1fr auto;
    align-items: center;
    gap: var(--spacing-lg);
  }

  .member-badge {
    width: 72px;
    height: 72px;
    border-radius: 18px;
    background: linear-gradient(135deg, #d4a44a, #b8862c);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #1a1a1a;
    font-weight: 700;
  }

  .member-info h2 {
    margin: 0 0 6px;
    font-size: 24px;
    color: var(--color-text);
  }

  .member-info p {
    margin: 0;
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
  }

  .privileges {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px var(--spacing-md);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .privileges li {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .member-actions {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .invite-body {
    padding: var(--spacing-lg);
    display: grid;
    grid-template-columns: 1.3fr 0.6fr 0.8fr auto;
    gap: var(--spacing-md);
    align-items: center;
  }

  .invite-code {
    height: 44px;
    padding: 0 var(--spacing-md);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    font-family: ui-monospace, Menlo, Consolas, monospace;
    color: var(--color-text);
    font-size: 20px;
    letter-spacing: 5px;
  }

  .invite-code button {
    background: transparent;
    border: none;
    cursor: pointer;
  }

  .invite-stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .invite-stat span {
    color: var(--color-text-tertiary);
    font-size: 11px;
  }

  .invite-stat strong {
    color: var(--color-primary);
    font-size: var(--font-size-xl);
  }

  .quick-grid {
    padding: var(--spacing-md);
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-sm);
  }

  .quick-item {
    height: 76px;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    background-color: var(--color-bg-container);
    color: var(--color-text-secondary);
    font-size: 11px;
    cursor: pointer;
  }

  .quick-item:hover {
    border-color: var(--color-primary);
    color: var(--color-text);
  }

  .safe-list,
  .device-list {
    padding: var(--spacing-md);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .safe-list div,
  .device-row {
    min-height: 34px;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: 0 var(--spacing-sm);
    background-color: var(--color-bg-container);
    border-radius: var(--border-radius-sm);
    font-size: var(--font-size-sm);
  }

  .safe-list span {
    color: var(--color-text-tertiary);
    width: 72px;
    flex-shrink: 0;
  }

  .safe-list strong {
    color: var(--color-text-secondary);
    font-weight: 400;
    flex: 1;
  }

  .safe-list button,
  .device-row button {
    background: transparent;
    border: none;
    color: var(--color-primary);
    cursor: pointer;
    font-size: var(--font-size-sm);
  }

  .device-row div {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .device-row span {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .device-row small {
    color: var(--color-text-tertiary);
    font-size: 10px;
  }

  .device-row em {
    font-style: normal;
    color: var(--color-primary);
    font-size: 11px;
    background-color: color-mix(in srgb, var(--color-primary) 14%, transparent);
    padding: 1px 6px;
    border-radius: var(--border-radius-sm);
  }

  .logout-btn {
    height: 44px;
    border-radius: var(--border-radius);
    background: transparent;
    border: 1px solid var(--color-border-secondary);
    color: var(--color-error);
    cursor: pointer;
    font-size: var(--font-size);
  }
</style>
