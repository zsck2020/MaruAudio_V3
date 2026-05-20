<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import BannerCarousel from '$lib/components/BannerCarousel.svelte';
  import Icon from '$lib/icons/Icon.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { invoke } from '@tauri-apps/api/core';
  import type { BannerItem } from '$lib/types';
  import { MENU_ROUTES } from '$lib/utils/navigation';
  import type { MenuKey } from '$lib/types';

  const fallbackBanners: BannerItem[] = [
    { id: 1, title: '丸子配音 · 智能语音创作平台', image_url: '/banner-1.svg', link_url: '', link_type: 'none' },
    { id: 2, title: '多角色配音 · 一键生成对话', image_url: '/banner-2.svg', link_url: '', link_type: 'none' },
    { id: 3, title: '智能字幕 · 精准对轴', image_url: '/banner-3.svg', link_url: '', link_type: 'none' },
  ];

  let banners: BannerItem[] = $state(fallbackBanners);

  const quickActions = [
    { icon: 'microphone', title: '开始配音', desc: '快速创建配音项目', route: '/dubbing', primary: true },
    { icon: 'team', title: '多角色对话', desc: '创建多角色台词内容', route: '/project' },
    { icon: 'subtitle', title: '字幕生成', desc: '智能生成字幕文件', route: '/copywriting' },
    { icon: 'sound', title: '音库管理', desc: '管理音色与音频资源', route: '/resource' },
  ];

  const recentProjects = [
    { name: '《风起云涌》第12集', time: '2026-05-13 14:32', engine: '轻量', words: '12,840', tone: 'blue' },
    { name: '《星河漫游》宣传片', time: '2026-05-12 19:07', engine: '情感', words: '8,532', tone: 'gold' },
    { name: '《时间之门》第3季 第5集', time: '2026-05-12 11:24', engine: '云端', words: '15,268', tone: 'green' },
    { name: '产品发布会解说稿', time: '2026-05-11 16:48', engine: '轻量', words: '6,721', tone: 'blue' },
    { name: '有声书《平凡的世界》片段', time: '2026-05-11 09:15', engine: '情感', words: '9,114', tone: 'gold' },
    { name: '英语教学课件配音', time: '2026-05-10 15:32', engine: '云端', words: '4,256', tone: 'green' },
  ];

  const bars = [34, 42, 38, 50, 36, 44, 72];

  async function loadBanners() {
    try {
      const data = await invoke<BannerItem[]>('get_banners');
      if (Array.isArray(data) && data.length > 0) {
        banners = data.map((b) => ({
          id: b.id,
          title: b.title,
          image_url: b.image_url?.startsWith('http') ? b.image_url : `https://auth.wzagent.cn${b.image_url?.startsWith('/') ? '' : '/'}${b.image_url}`,
          link_url: b.link_url || '',
          link_type: b.link_type || 'none',
        }));
      }
    } catch (e) {
      console.warn('加载远程Banner失败，使用本地默认Banner', e);
    }
  }

  async function handleBannerClick(banner: BannerItem) {
    if (banner.link_type === 'url' && banner.link_url) {
      let url = banner.link_url;
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      const { openUrl } = await import('@tauri-apps/plugin-opener');
      await openUrl(url);
    } else if (banner.link_type === 'page' && banner.link_url) {
      const route = MENU_ROUTES[banner.link_url as MenuKey];
      if (route) goto(route);
    }
  }

  let bannerPointerStart = { x: 0, y: 0, time: 0 };

  function handleBannerPointerDown(e: PointerEvent) {
    bannerPointerStart = { x: e.clientX, y: e.clientY, time: Date.now() };
  }

  function handleBannerPointerUp(e: PointerEvent, banner: BannerItem) {
    const dx = Math.abs(e.clientX - bannerPointerStart.x);
    const dy = Math.abs(e.clientY - bannerPointerStart.y);
    const dt = Date.now() - bannerPointerStart.time;
    if (dx < 6 && dy < 6 && dt < 400) {
      handleBannerClick(banner);
    }
  }

  onMount(() => {
    loadBanners();
  });
</script>

<div class="home-page">
  <section class="hero-section">
    <BannerCarousel items={banners} autoplayDuration={5000} duration={500}>
      {#snippet children(banner)}
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <div
          class="carousel-item"
          class:clickable={banner.link_type !== 'none'}
          role={banner.link_type !== 'none' ? 'button' : 'img'}
          tabindex={banner.link_type !== 'none' ? 0 : -1}
          onpointerdown={handleBannerPointerDown}
          onpointerup={(e) => handleBannerPointerUp(e, banner as BannerItem)}
          onkeydown={(e) => e.key === 'Enter' && handleBannerClick(banner as BannerItem)}
        >
          <img src={(banner as BannerItem).image_url} alt={(banner as BannerItem).title} class="carousel-image" />
        </div>
      {/snippet}
    </BannerCarousel>
  </section>

  <section class="quick-grid" aria-label="快捷功能">
    {#each quickActions as action (action.title)}
      <button
        type="button"
        class="quick-card"
        class:primary={action.primary}
        onclick={() => goto(action.route)}
      >
        <Icon name={action.icon} size={32} color={action.primary ? '#fff' : 'var(--color-text-tertiary)'} />
        <div>
          <strong>{action.title}</strong>
          <span>{action.desc}</span>
        </div>
      </button>
    {/each}
  </section>

  <section class="dashboard-grid">
    <article class="panel recent-panel">
      <header class="panel-head">
        <h2>最近项目</h2>
        <Button variant="link" size="sm" onclick={() => goto('/cover')}>全部项目</Button>
      </header>
      <div class="recent-table">
        <div class="table-head">
          <span>项目名称</span><span>修改时间</span><span>引擎</span><span>字符数</span><span>操作</span>
        </div>
        {#each recentProjects as project, i (project.name)}
          <div class="project-row">
            <div class="project-name">
              <span class="thumb {project.tone}">{project.name.replace(/[《》]/g, '').charAt(0)}</span>
              <span>{project.name}</span>
            </div>
            <span>{project.time}</span>
            <span class="engine-badge {project.tone}">{project.engine}</span>
            <span>{project.words}</span>
            <Button variant="link" size="sm" onclick={() => goto('/dubbing')}>打开</Button>
          </div>
        {/each}
      </div>
      <div class="recent-pager">
        <span class="pager-info">共 12 个项目 · 每页 6 条</span>
        <div class="pager-btns">
          <button type="button" class="pager-btn" disabled>‹</button>
          <button type="button" class="pager-btn active">1</button>
          <button type="button" class="pager-btn">2</button>
          <button type="button" class="pager-btn">›</button>
        </div>
      </div>
    </article>

    <aside class="side-stack">
      <article class="panel stat-panel">
        <div class="stat-content">
          <div class="stat-top">
            <div class="stat-value-group">
              <span class="stat-value">12,840</span>
              <span class="stat-unit">字符</span>
            </div>
            <div class="stat-badge-row">
              <span class="stat-badge up">
                <Icon name="ant-design:rise-outlined" size={10} color="currentColor" />
                18%
              </span>
              <span class="stat-vs">vs 昨日</span>
            </div>
          </div>
          <div class="stat-meter">
            <div class="stat-meter-track">
              <div class="stat-meter-yesterday" style="width:54%"></div>
              <div class="stat-meter-today" style="width:64%"></div>
            </div>
            <div class="stat-meter-legend">
              <span><i class="legend-dot today"></i>今日</span>
              <span><i class="legend-dot yesterday"></i>昨日 10,880</span>
              <span class="stat-target">目标 20,000</span>
            </div>
          </div>
        </div>
      </article>

      <article class="panel health-panel">
        <header class="panel-head"><h2>引擎健康状态</h2></header>
        <div class="engine-rows">
          <div class="engine-row">
            <div class="engine-icon-wrap engine-icon--light">
              <Icon name="zap" size={14} color="var(--color-primary)" />
            </div>
            <div class="engine-info">
              <div class="engine-name-line">
                <strong>轻量引擎</strong>
                <span class="engine-status ok">可用</span>
              </div>
              <div class="engine-metric">
                <div class="metric-bar"><div class="metric-fill" style="width:45%"></div></div>
                <span class="metric-label">显存 45%</span>
              </div>
            </div>
          </div>
          <div class="engine-row">
            <div class="engine-icon-wrap engine-icon--emo">
              <Icon name="heart" size={14} color="var(--color-accent)" />
            </div>
            <div class="engine-info">
              <div class="engine-name-line">
                <strong>情感引擎</strong>
                <span class="engine-status ok">可用</span>
              </div>
              <div class="engine-metric">
                <div class="metric-bar"><div class="metric-fill warn" style="width:72%"></div></div>
                <span class="metric-label">显存 72%</span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </aside>
  </section>

  <footer class="notice-bar">
    <span class="version-pill">v3.0.0</span>
    <span>全新多引擎架构，性能提升 20%，新增情感引擎与对轴工具。</span>
    <Button variant="link" size="sm" onclick={() => goto('/about')}>查看详情</Button>
  </footer>
</div>

<style>
  .home-page {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding: 15px;
    background-color: var(--color-bg-container);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .hero-section {
    border-radius: var(--border-radius-lg);
    overflow: hidden;
    flex-shrink: 0;
    border: 1px solid var(--color-border-secondary);
    background-color: var(--color-bg-elevated);
  }

  @media (max-width: 768px) {
    .carousel-container {
      padding: var(--spacing-md);
    }
  }

  .carousel-item {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .carousel-item.clickable {
    cursor: pointer;
  }

  .carousel-image {
    width: 100%;
    height: 196px;
    object-fit: cover;
    display: block;
    border-radius: 8px;
  }

  

  .quick-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--spacing-sm);
  }

  .quick-card {
    min-height: 72px;
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
    background-color: var(--color-bg-elevated);
    color: var(--color-text);
    cursor: pointer;
    text-align: left;
    transition: border-color var(--transition-duration) var(--transition-timing), background-color var(--transition-duration) var(--transition-timing);
  }

  .quick-card:hover {
    border-color: var(--color-primary);
  }

  .quick-card.primary {
    background: color-mix(in srgb, var(--color-primary) 82%, var(--color-bg-elevated));
    border-color: var(--color-primary);
  }

  .quick-card div {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .quick-card strong {
    font-size: var(--font-size-lg);
  }

  .quick-card span {
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
  }

  .quick-card.primary span {
    color: rgba(255,255,255,0.75);
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.55fr);
    gap: var(--spacing-sm);
    flex: 1;
    min-height: 0;
  }

  .side-stack {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    min-height: 0;
  }

  .panel,
  .notice-bar {
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
    background-color: var(--color-bg-elevated);
  }

  .panel-head {
    height: 42px;
    padding: 0 var(--spacing-lg);
    border-bottom: 1px solid var(--color-border-secondary);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .panel-head h2 {
    margin: 0;
    font-size: var(--font-size);
    color: var(--color-text);
    font-weight: 500;
  }

  .recent-panel {
    display: flex;
    flex-direction: column;
  }

  .recent-table {
    padding: var(--spacing-xs) var(--spacing-lg) 0;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .recent-table .project-row {
    flex: 1;
  }

  .table-head,
  .project-row {
    display: grid;
    grid-template-columns: minmax(220px, 1.5fr) 160px 80px 90px 60px;
    align-items: center;
    gap: var(--spacing-md);
    min-height: 38px;
    font-size: var(--font-size-sm);
  }

  .table-head {
    color: var(--color-text-disabled);
    border-bottom: 1px solid var(--color-border-secondary);
    font-size: 11px;
    text-align: center;
  }

  .table-head span:first-child {
    text-align: left;
  }

  .project-row {
    color: var(--color-text-secondary);
    border-bottom: 1px solid var(--color-border-secondary);
    transition: background-color var(--motion-duration-mid) var(--motion-ease-base);
    text-align: center;
  }

  .project-row:last-child {
    border-bottom: none;
  }

  .project-row:hover {
    background-color: var(--color-hover-bg);
  }

  

  .project-name {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--color-text);
    min-width: 0;
  }

  .project-name span:last-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .thumb {
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    border-radius: var(--border-radius);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 600;
    color: #fff;
  }

  .thumb.blue {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-700));
  }

  .thumb.gold {
    background: linear-gradient(135deg, var(--color-warning), color-mix(in srgb, var(--color-warning) 70%, #a05a00));
  }

  .thumb.green {
    background: linear-gradient(135deg, var(--color-success), color-mix(in srgb, var(--color-success) 70%, #1a6b0a));
  }

  .engine-badge {
    justify-self: center;
    padding: 2px 8px;
    border-radius: var(--border-radius-pill);
    font-size: 11px;
    font-weight: 500;
  }
  .engine-badge.blue { color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 16%, transparent); }
  .engine-badge.gold { color: var(--color-warning); background: color-mix(in srgb, var(--color-warning) 14%, transparent); }
  .engine-badge.green { color: var(--color-success); background: color-mix(in srgb, var(--color-success) 14%, transparent); }

  .recent-pager {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-sm) var(--spacing-lg);
    border-top: 1px solid var(--color-border-secondary);
  }

  .pager-info {
    font-size: 12px;
    color: var(--color-text-disabled);
  }

  .pager-btns {
    display: flex;
    gap: 4px;
  }

  .pager-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-sm);
    background: transparent;
    color: var(--color-text-tertiary);
    font-size: 12px;
    cursor: pointer;
    transition:
      border-color var(--motion-duration-mid) var(--motion-ease-base),
      color var(--motion-duration-mid) var(--motion-ease-base),
      background-color var(--motion-duration-mid) var(--motion-ease-base);
  }

  .pager-btn:hover:not(:disabled) {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .pager-btn.active {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
    color: #fff;
  }

  .pager-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .stat-panel {
    padding: 0;
  }

  .stat-content {
    padding: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .stat-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }

  .stat-value-group {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .stat-value {
    font-size: 36px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: -1px;
    line-height: 1;
    color: var(--color-text);
  }

  .stat-unit {
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
    font-weight: 400;
  }

  .stat-badge-row {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    padding-top: 4px;
  }

  .stat-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: var(--border-radius-pill);
  }

  .stat-badge.up {
    color: var(--color-success);
    background-color: var(--color-success-bg);
  }

  .stat-vs {
    font-size: 10px;
    color: var(--color-text-disabled);
  }

  .stat-meter {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .stat-meter-track {
    position: relative;
    height: 8px;
    background-color: var(--color-border);
    border-radius: 4px;
    overflow: hidden;
  }

  .stat-meter-yesterday {
    position: absolute;
    inset: 0 auto 0 0;
    background-color: color-mix(in srgb, var(--color-text-tertiary) 40%, transparent);
    border-radius: 4px;
  }

  .stat-meter-today {
    position: absolute;
    inset: 0 auto 0 0;
    background: linear-gradient(90deg, var(--color-primary), var(--color-primary-hover));
    border-radius: 4px;
    box-shadow: 0 0 8px color-mix(in srgb, var(--color-primary) 40%, transparent);
  }

  .stat-meter-legend {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    font-size: 11px;
    color: var(--color-text-tertiary);
  }

  .stat-meter-legend span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .stat-target {
    margin-left: auto;
    color: var(--color-text-disabled);
  }

  .legend-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    display: inline-block;
    font-style: normal;
  }

  .legend-dot.today { background-color: var(--color-primary); }
  .legend-dot.yesterday { background-color: var(--color-text-tertiary); }

  .health-panel {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }

  .engine-rows {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: var(--spacing-sm) var(--spacing-md);
    flex: 1;
    justify-content: center;
  }

  .engine-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
    border-radius: var(--border-radius);
    transition: background-color var(--motion-duration-mid) var(--motion-ease-base);
  }

  .engine-row:hover {
    background-color: var(--color-bg-spotlight);
  }

  .engine-icon-wrap {
    width: 32px;
    height: 32px;
    border-radius: var(--border-radius);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .engine-icon--light { background-color: var(--color-primary-bg); }
  .engine-icon--emo   { background-color: var(--color-accent-bg); }
  .engine-icon--cloud  { background-color: var(--color-info-bg); }

  .engine-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .engine-name-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-sm);
  }

  .engine-name-line strong {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text);
  }

  .engine-status {
    font-size: 11px;
    padding: 1px 6px;
    border-radius: var(--border-radius-sm);
  }

  .engine-status.ok {
    color: var(--color-success);
    background-color: var(--color-success-bg);
  }

  .engine-metric {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .metric-bar {
    flex: 1;
    height: 4px;
    background-color: var(--color-border);
    border-radius: 2px;
    overflow: hidden;
  }

  .metric-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-success), color-mix(in srgb, var(--color-success) 75%, white 25%));
    border-radius: 2px;
    transition: width 0.5s var(--motion-ease-out);
  }

  .metric-fill.warn {
    background: linear-gradient(90deg, var(--color-warning), color-mix(in srgb, var(--color-warning) 75%, white 25%));
  }

  .metric-label {
    font-size: 11px;
    color: var(--color-text-tertiary);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .notice-bar {
    min-height: 50px;
    padding: 0 var(--spacing-lg);
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    flex-shrink: 0;
  }

  .version-pill {
    color: #fff;
    background: var(--color-primary);
    padding: 3px 10px;
    border-radius: var(--border-radius-sm);
    font-size: 11px;
  }

  .notice-bar :global(.ui-btn) {
    margin-left: auto;
  }

</style>
