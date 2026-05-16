<script lang="ts">
  import { goto } from '$app/navigation';
  import Icon from '$lib/icons/Icon.svelte';
  import { toast } from '$lib/stores/toast.svelte';

  const stats = [
    { label: '本月生成字符', value: '128,400' },
    { label: '配音时长', value: '12h 28m' },
    { label: '累计项目', value: '46' },
  ];

  const quickLinks = [
    { icon: 'project-box', label: '我的项目', count: '46' },
    { icon: 'sound', label: '我的样音', count: '12' },
    { icon: 'subtitle', label: '我的字幕', count: '238' },
    { icon: 'download', label: '我的下载', count: '584' },
    { icon: 'star', label: '收藏夹', count: '24' },
    { icon: 'delete', label: '回收站', count: '' },
    { icon: 'message', label: '消息中心', count: '3' },
    { icon: 'help', label: '帮助中心', count: '' },
  ];

  const privileges = ['高速生成队列', '云端引擎不限量', '专属客服通道', '新功能尝鲜'];

  const devices = [
    { icon: 'windows', name: 'Windows · MaruPC', time: '2026-05-13 19:42', current: true },
    { icon: 'apple', name: 'MacBook Pro · macOS', time: '2026-05-12 21:15', current: false },
    { icon: 'tablet', name: 'iPad mini', time: '2026-05-10 18:47', current: false },
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
        <button type="button" class="camera-btn" aria-label="更换头像" onclick={() => toast.info('头像更换开发中')}>
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
      {#each stats as stat (stat.label)}
        <div class="hero-stat">
          <span>{stat.label}</span>
          <strong>{stat.value}</strong>
        </div>
      {/each}
    </div>
  </section>

  <div class="profile-grid">
    <main class="profile-main">
      <article class="card balance-card">
        <header class="card-head">
          <h2>账户余额</h2>
          <button type="button" class="link" onclick={() => toast.info('字符流水开发中')}>查看明细</button>
        </header>
        <div class="balance-body">
          <div>
            <div class="big-number">128,420</div>
            <div class="muted">剩余字符</div>
          </div>
          <div class="line-chart" aria-label="近 30 日消耗趋势">
            <span style="height: 30%"></span>
            <span style="height: 44%"></span>
            <span style="height: 38%"></span>
            <span style="height: 58%"></span>
            <span style="height: 51%"></span>
            <span style="height: 68%"></span>
            <span style="height: 76%"></span>
            <span style="height: 64%"></span>
            <span style="height: 82%"></span>
            <span style="height: 91%"></span>
          </div>
        </div>
        <footer class="card-actions">
          <span class="muted">本月已使用 18,200 字符</span>
          <div>
            <button type="button" class="btn-secondary" onclick={() => toast.info('字符流水开发中')}>字符流水</button>
            <button type="button" class="btn-primary" onclick={() => toast.info('充值中心开发中')}>
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
          <button type="button" class="btn-secondary" onclick={() => toast.info('会员续费开发中')}>续费</button>
          <button type="button" class="btn-primary" onclick={() => toast.info('企业版咨询请联系客服')}>升级至企业版</button>
        </div>
      </article>

      <article class="card invite-card">
        <header class="card-head">
          <h2>邀请有礼</h2>
          <button type="button" class="link" onclick={() => toast.info('邀请记录开发中')}>邀请记录</button>
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
          <button type="button" class="btn-secondary" onclick={() => toast.info('分享海报开发中')}>分享海报</button>
        </div>
      </article>
    </main>

    <aside class="profile-side">
      <article class="card">
        <header class="card-head"><h2>快捷入口</h2></header>
        <div class="quick-grid">
          {#each quickLinks as item (item.label)}
            <button type="button" class="quick-item" onclick={() => toast.info(`${item.label} 即将开放`)}>
              <Icon name={item.icon} size={20} color="var(--color-primary)" />
              <span>{item.label}</span>
              {#if item.count}<em>{item.count}</em>{/if}
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
                <button type="button" onclick={() => toast.info('设备移除开发中')}>移除</button>
              {/if}
            </div>
          {/each}
        </div>
      </article>

      <button type="button" class="logout-btn" onclick={() => toast.warning('退出登录功能即将开放')}>退出登录</button>
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

  .line-chart {
    height: 92px;
    display: flex;
    align-items: flex-end;
    gap: 8px;
    padding: 0 var(--spacing-sm);
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .line-chart span {
    flex: 1;
    min-width: 8px;
    background: linear-gradient(to top, color-mix(in srgb, var(--color-primary) 25%, transparent), var(--color-primary));
    border-radius: 999px 999px 0 0;
    opacity: 0.8;
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

  .quick-item em {
    position: absolute;
    right: 8px;
    top: 6px;
    font-style: normal;
    font-size: 10px;
    color: var(--color-primary);
    background-color: color-mix(in srgb, var(--color-primary) 16%, transparent);
    border-radius: 999px;
    padding: 1px 6px;
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
