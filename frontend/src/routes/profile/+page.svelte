<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Icon from '$lib/icons/Icon.svelte';
  import PermissionBadge from '$lib/components/membership/PermissionBadge.svelte';
  import { membership, PLAN_INFO, FEATURE_INFO, type PlanId, type FeatureKey } from '$lib/stores/membership.svelte';
  import { appSettings } from '$lib/stores/settings.svelte';
  import { toast } from '$lib/stores/toast.svelte';

  onMount(() => { void appSettings.init(); });

  const planCards = Object.values(PLAN_INFO);
  const coreFeatures: FeatureKey[] = [
    'emotion_engine',
    'multi_role',
    'batch_generation',
    'smart_split',
    'watermark_free',
    'cloud_engine',
    'subtitle_pro',
    'acceleration',
  ];

  const cloudPackages = [
    { name: '体验包', chars: '1 万字', price: '¥9.9', unit: '¥0.99 / 千字' },
    { name: '日常包', chars: '5 万字', price: '¥39.9', unit: '¥0.80 / 千字' },
    { name: '创作包', chars: '20 万字', price: '¥129', unit: '¥0.65 / 千字' },
    { name: '商业包', chars: '100 万字', price: '¥499', unit: '¥0.50 / 千字' },
  ];

  let cardKeyInput = $state('');
  let cardKeyLoading = $state(false);
  let activeTab = $state<'overview' | 'history'>('overview');

  const ENGINE_LABEL: Record<string, string> = { lightweight: '轻量', emotion: '情感', cloud: '云端' };

  let recentHistory = $derived(membership.usageHistory.slice(0, 20));

  function fmt(n: number): string {
    if (!Number.isFinite(n)) return '不限';
    return n.toLocaleString('zh-CN');
  }

  function fmtDate(iso: string): string {
    const d = new Date(iso);
    return `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  function planFeature(plan: PlanId): FeatureKey {
    if (plan === 'team') return 'team_license';
    if (plan === 'creator_year') return 'cloud_chars';
    return 'watermark_free';
  }

  function handlePlanAction(plan: PlanId) {
    if (plan === membership.account.plan) {
      toast.info('当前已是该套餐');
      return;
    }
    membership.requestUpgrade(planFeature(plan));
  }

  function handleCloudPackage() {
    membership.requestUpgrade('cloud_chars');
  }

  async function handleRedeemCardKey() {
    if (!cardKeyInput.trim()) { toast.warning('请输入卡密'); return; }
    cardKeyLoading = true;
    try {
      const result = await membership.redeemCardKey(cardKeyInput);
      if (result.ok) {
        toast.success(result.message);
        cardKeyInput = '';
      } else {
        toast.warning(result.message);
      }
    } finally {
      cardKeyLoading = false;
    }
  }
</script>

<div class="profile-page">
  <header class="profile-header">
    <div>
      <h1>个人中心</h1>
      <p>套餐权益、字符余额、设备授权与升级入口</p>
    </div>
    <Button variant="ghost" size="sm" onclick={() => goto('/')}>
      返回首页
      <Icon name="arrow-right" size={12} color="currentColor" />
    </Button>
  </header>

  <section class="hero-card">
    <div class="user-block">
      <div class="avatar-shell">
        <Icon name="sound-fill" size={42} color="var(--color-primary)" />
      </div>
      <div class="user-meta">
        <div class="name-row">
          <span class="user-name">清风明月</span>
          <PermissionBadge label={membership.plan.badge} tone={membership.isPaid ? 'flagship' : 'free'} />
          <span class="verified">已认证</span>
        </div>
        <p>{membership.plan.description}</p>
      </div>
    </div>

    <div class="hero-metrics">
      <div class="metric-card">
        <span>今日免费额度</span>
        <strong>{fmt(membership.dailyRemaining)}</strong>
        <small>{membership.isPaid ? '本地生成不限字符' : `已用 ${membership.dailyPercent}%`}</small>
      </div>
      <div class="metric-card">
        <span>云端余额</span>
        <strong>{fmt(membership.account.cloudBalance)}</strong>
        <small>只用于云端引擎</small>
      </div>
      <div class="metric-card">
        <span>设备授权</span>
        <strong>{membership.account.devicesUsed}/{membership.account.devicesLimit}</strong>
        <small>{membership.isTeam ? '团队授权' : '个人授权'}</small>
      </div>
    </div>
  </section>

  <section class="plan-grid" aria-label="套餐方案">
    {#each planCards as plan (plan.id)}
      <article class="plan-card" class:active={membership.account.plan === plan.id}>
        <div class="plan-head">
          <PermissionBadge label={plan.badge} tone={plan.id === 'team' ? 'team' : plan.id === 'free' ? 'free' : 'flagship'} />
          {#if membership.account.plan === plan.id}<span class="current-pill">当前</span>{/if}
        </div>
        <strong>{plan.name}</strong>
        <span class="plan-price">{plan.price}</span>
        <p>{plan.description}</p>
        <Button
          variant={membership.account.plan === plan.id ? 'default' : 'primary'}
          size="sm"
          onclick={() => handlePlanAction(plan.id)}
          disabled={membership.account.plan === plan.id}
          block
        >
          {membership.account.plan === plan.id ? '当前套餐' : '查看权益'}
        </Button>
      </article>
    {/each}
  </section>

  <section class="content-grid">
    <article class="card usage-card">
      <header class="card-head">
        <div class="tab-row">
          <button type="button" class="tab-btn" class:active={activeTab === 'overview'} onclick={() => activeTab = 'overview'}>权益用量</button>
          <button type="button" class="tab-btn" class:active={activeTab === 'history'} onclick={() => activeTab = 'history'}>消费记录</button>
        </div>
        {#if !membership.isPaid}
          <Button variant="link" size="sm" onclick={() => membership.requestUpgrade('watermark_free')}>升级旗舰</Button>
        {/if}
      </header>

      {#if activeTab === 'overview'}
        <div class="usage-list">
          <div>
            <span>今日本地</span>
            <strong>{membership.isPaid ? '不限' : `${fmt(membership.dailyRemaining)} 字`}</strong>
            <small>{membership.isPaid ? '无限额度' : `已用 ${membership.dailyPercent}%`}</small>
          </div>
          <div>
            <span>云端余额</span>
            <strong>{fmt(membership.account.cloudBalance)} 字</strong>
            <small>已累计用 {fmt(membership.totalCloudUsed)}</small>
          </div>
          <div>
            <span>本地累计</span>
            <strong>{fmt(membership.totalLocalUsed)} 字</strong>
            <small>本月 {fmt(appSettings.usage.monthlyCharsGenerated)}</small>
          </div>
          <div>
            <span>累计项目</span>
            <strong>{fmt(appSettings.usage.totalProjects)} 个</strong>
            <small>设备 {membership.account.devicesUsed}/{membership.account.devicesLimit}</small>
          </div>
        </div>
        {#if !membership.isPaid}
          <div class="quota-bar" aria-label="免费额度使用情况">
            <span style="width:{membership.dailyPercent}%"></span>
          </div>
        {/if}
        <p class="hint">免费版每日 3,000 字符；升级后本地轻量 / 情感引擎无限生成，云端字符单独计费。</p>
      {:else}
        <div class="history-list">
          {#if recentHistory.length === 0}
            <div class="history-empty">
              <Icon name="file-text" size={20} color="var(--color-text-disabled)" />
              <span>暂无消费记录</span>
            </div>
          {:else}
            {#each recentHistory as record (record.id)}
              <div class="history-row">
                <div class="history-type" class:cloud={record.type === 'cloud'}>
                  <Icon name={record.type === 'cloud' ? 'cloud' : 'thunderbolt'} size={12} color="currentColor" />
                </div>
                <div class="history-info">
                  <span class="history-label">{record.label}</span>
                  <span class="history-meta">{ENGINE_LABEL[record.engine] ?? record.engine} · {record.lines} 段</span>
                </div>
                <div class="history-chars">-{fmt(record.chars)} 字</div>
                <div class="history-date">{fmtDate(record.date)}</div>
              </div>
            {/each}
          {/if}
        </div>
      {/if}
    </article>

    <article class="card cloud-card">
      <header class="card-head">
        <h2>云端字符包</h2>
        <PermissionBadge feature="cloud_chars" locked={!membership.canUseFeature('cloud_chars')} compact />
      </header>
      <div class="package-grid">
        {#each cloudPackages as pack (pack.name)}
          <button type="button" class="package-card" onclick={handleCloudPackage}>
            <span>{pack.name} · {pack.chars}</span>
            <strong>{pack.price}</strong>
            <small>{pack.unit}</small>
          </button>
        {/each}
      </div>
      <p class="hint">单独购买的云端字符永不过期，失败 / 取消 / 超时未产出自动返还。</p>
    </article>

    <article class="card feature-card">
      <header class="card-head">
        <h2>核心权益</h2>
        <span class="safe-badge">本地优先</span>
      </header>
      <div class="feature-grid">
        {#each coreFeatures as key (key)}
          {@const feature = FEATURE_INFO[key]}
          <button
            type="button"
            class="feature-item"
            class:locked={!membership.canUseFeature(key)}
            onclick={() => !membership.canUseFeature(key) && membership.requestUpgrade(key)}
          >
            <Icon name={feature.icon} size={16} color="currentColor" />
            <span>{feature.title}</span>
            <PermissionBadge feature={key} locked={!membership.canUseFeature(key)} compact />
          </button>
        {/each}
      </div>
    </article>

    <article class="card side-card">
      <header class="card-head">
        <h2>兑换与账号</h2>
      </header>
      <div class="redeem-section">
        <div class="redeem-row">
          <input
            type="text"
            class="redeem-input"
            bind:value={cardKeyInput}
            placeholder="输入卡密兑换权益或字符"
            onkeydown={(e) => e.key === 'Enter' && handleRedeemCardKey()}
          />
          <Button variant="primary" size="sm" loading={cardKeyLoading} onclick={handleRedeemCardKey}>兑换</Button>
        </div>
        <p class="redeem-hint">旗舰卡密以 MARU-VIP 开头，云端字符卡以 MARU-CLOUD 开头</p>
      </div>
      <div class="side-list">
        <div><Icon name="gift" size={14} color="var(--color-primary)" /><span>邀请 1 位付费，双方各得 2 万云端字符</span></div>
        <div><Icon name="desktop" size={14} color="var(--color-primary)" /><span>个人版 1-2 台设备，团队版 3 台起</span></div>
        <div><Icon name="shield" size={14} color="var(--color-primary)" /><span>样音和项目默认留在本机</span></div>
      </div>
      <div class="side-actions">
        <Button variant="default" size="sm" onclick={() => membership.requestUpgrade('team_license')} block>团队授权</Button>
        <Button variant="primary" size="sm" onclick={() => toast.success('邀请码已复制')} block>复制邀请码</Button>
      </div>
    </article>
  </section>
</div>

<style>
  .profile-page {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding: 15px;
    background: var(--color-bg-container);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .profile-header,
  .hero-card,
  .card,
  .plan-card {
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
  }

  .profile-header {
    min-height: 52px;
    padding: 0 var(--spacing-md);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .profile-header h1,
  .profile-header p {
    margin: 0;
  }

  .profile-header h1 {
    color: var(--color-text);
    font-size: var(--font-size-xl);
  }

  .profile-header p,
  .hint {
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
  }

  .hero-card {
    min-height: 116px;
    padding: var(--spacing-md);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-lg);
    flex-shrink: 0;
  }

  .user-block,
  .name-row,
  .hero-metrics,
  .plan-head,
  .card-head,
  .side-list div {
    display: flex;
    align-items: center;
  }

  .user-block {
    gap: var(--spacing-md);
    min-width: 0;
  }

  .avatar-shell {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid color-mix(in srgb, var(--color-primary) 45%, transparent);
    background:
      radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--color-primary) 28%, transparent), transparent 44%),
      var(--color-bg-base);
    flex-shrink: 0;
  }

  .user-meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .name-row {
    gap: var(--spacing-sm);
  }

  .user-name {
    color: var(--color-text);
    font-size: 22px;
    font-weight: 700;
  }

  .verified,
  .safe-badge,
  .current-pill {
    height: 20px;
    padding: 0 7px;
    border-radius: var(--border-radius-pill);
    font-size: 11px;
    display: inline-flex;
    align-items: center;
  }

  .verified {
    color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 14%, transparent);
  }

  .safe-badge,
  .current-pill {
    color: var(--color-success);
    background: color-mix(in srgb, var(--color-success) 14%, transparent);
  }

  .user-meta p {
    margin: 0;
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
  }

  .hero-metrics {
    gap: var(--spacing-sm);
  }

  .metric-card {
    width: 126px;
    min-height: 72px;
    padding: var(--spacing-sm);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    background: var(--color-bg-container);
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .metric-card span,
  .metric-card small {
    color: var(--color-text-tertiary);
    font-size: 11px;
  }

  .metric-card strong {
    color: var(--color-primary);
    font-size: var(--font-size-xl);
  }

  .plan-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--spacing-sm);
    flex-shrink: 0;
  }

  .plan-card {
    padding: var(--spacing-md);
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .plan-card.active {
    border-color: color-mix(in srgb, var(--color-primary) 58%, transparent);
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 10%, transparent), transparent 56%),
      var(--color-bg-elevated);
  }

  .plan-head,
  .card-head {
    justify-content: space-between;
  }

  .plan-card strong,
  .card-head h2 {
    color: var(--color-text);
  }

  .plan-price {
    color: var(--color-primary);
    font-weight: 700;
    font-size: var(--font-size-lg);
  }

  .plan-card p {
    min-height: 36px;
    margin: 0;
    color: var(--color-text-tertiary);
    font-size: 11px;
    line-height: 1.55;
  }

  .content-grid {
    min-height: 0;
    flex: 1;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 310px;
    grid-template-rows: 1fr 1fr;
    gap: var(--spacing-sm);
    overflow: hidden;
  }

  .usage-card { grid-column: 1; grid-row: 1 / 3; }
  .cloud-card { grid-column: 2; grid-row: 1; }
  .feature-card { grid-column: 2; grid-row: 2; }
  .side-card { grid-column: 3; grid-row: 1 / 3; }

  .card {
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .card-head {
    height: 42px;
    padding: 0 var(--spacing-md);
    border-bottom: 1px solid var(--color-border-secondary);
    flex-shrink: 0;
  }

  .card-head h2 {
    margin: 0;
    font-size: var(--font-size);
  }

  .usage-list,
  .package-grid,
  .feature-grid,
  .side-list {
    padding: var(--spacing-md);
  }

  .tab-row { display: flex; gap: 2px; }
  .tab-btn {
    height: 28px; padding: 0 var(--spacing-sm);
    background: transparent; border: none; border-radius: var(--border-radius-sm);
    color: var(--color-text-tertiary); font-size: var(--font-size-sm); cursor: pointer;
    transition: color var(--motion-duration-mid), background var(--motion-duration-mid);
  }
  .tab-btn.active { color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 12%, transparent); font-weight: 500; }
  .tab-btn:hover:not(.active) { color: var(--color-text-secondary); }

  .usage-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
  }

  .usage-list div {
    padding: var(--spacing-sm);
    border-radius: var(--border-radius);
    background: var(--color-bg-container);
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .usage-list span,
  .usage-list small,
  .package-card span,
  .package-card small {
    color: var(--color-text-tertiary);
    font-size: 11px;
  }

  .usage-list strong,
  .package-card strong {
    color: var(--color-text);
  }

  .history-list {
    flex: 1; min-height: 0; overflow-y: auto; padding: var(--spacing-sm) var(--spacing-md);
    display: flex; flex-direction: column; gap: 2px;
    scrollbar-width: thin;
    scrollbar-color: color-mix(in srgb, var(--color-border-secondary) 60%, transparent) transparent;
  }
  .history-empty {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: var(--spacing-sm); color: var(--color-text-disabled); font-size: var(--font-size-sm);
  }
  .history-row {
    display: flex; align-items: center; gap: var(--spacing-sm);
    padding: 6px var(--spacing-sm); border-radius: var(--border-radius-sm);
    transition: background var(--motion-duration-mid);
  }
  .history-row:hover { background: var(--color-bg-container); }
  .history-type {
    width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: color-mix(in srgb, var(--color-primary) 14%, transparent);
    color: var(--color-primary);
  }
  .history-type.cloud {
    background: color-mix(in srgb, var(--color-info) 14%, transparent);
    color: var(--color-info);
  }
  .history-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
  .history-label { font-size: var(--font-size-sm); color: var(--color-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .history-meta { font-size: 10px; color: var(--color-text-disabled); }
  .history-chars { font-size: var(--font-size-sm); color: var(--color-warning); font-weight: 500; white-space: nowrap; }
  .history-date { font-size: 10px; color: var(--color-text-disabled); white-space: nowrap; }

  .redeem-section {
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border-secondary);
  }
  .redeem-row { display: flex; gap: var(--spacing-xs); }
  .redeem-input {
    flex: 1; height: 32px; padding: 0 var(--spacing-sm);
    border: 1px solid var(--color-border-secondary); border-radius: var(--border-radius-sm);
    background: var(--color-bg-base); color: var(--color-text);
    font-family: ui-monospace, Menlo, Consolas, monospace; font-size: var(--font-size-sm);
    letter-spacing: 0.5px;
  }
  .redeem-input:focus { border-color: var(--color-primary); outline: none; }
  .redeem-input::placeholder { color: var(--color-text-disabled); font-family: inherit; letter-spacing: 0; }
  .redeem-hint { margin: 6px 0 0; font-size: 10px; color: var(--color-text-disabled); }

  .quota-bar {
    height: 8px;
    margin: 0 var(--spacing-md);
    border-radius: var(--border-radius-pill);
    background: var(--color-bg-base);
    overflow: hidden;
  }

  .quota-bar span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--color-primary), var(--color-warning));
  }

  .hint {
    margin: var(--spacing-sm) var(--spacing-md) 0;
  }

  .package-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-sm);
  }

  .package-card,
  .feature-item {
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    background: var(--color-bg-container);
    cursor: pointer;
  }

  .package-card {
    min-height: 66px;
    padding: var(--spacing-sm);
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .package-card:hover,
  .feature-item:hover {
    border-color: var(--color-primary);
  }

  .feature-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--spacing-sm);
  }

  .feature-item {
    min-height: 42px;
    padding: 0 var(--spacing-sm);
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .feature-item.locked {
    color: var(--color-text-tertiary);
  }

  .feature-item span {
    flex: 1;
    text-align: left;
    font-size: var(--font-size-sm);
  }

  .side-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    flex: 1;
  }

  .side-list div {
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
    border-radius: var(--border-radius);
    background: var(--color-bg-container);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    line-height: 1.55;
  }

  .side-actions {
    padding: 0 var(--spacing-md) var(--spacing-md);
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-sm);
  }
</style>
