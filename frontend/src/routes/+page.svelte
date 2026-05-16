<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import BannerCarousel from '$lib/components/BannerCarousel.svelte';
  import Icon from '$lib/icons/Icon.svelte';
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
        <button type="button" onclick={() => goto('/cover')}>全部项目</button>
      </header>
      <div class="recent-table">
        <div class="table-head">
          <span>项目名称</span><span>修改时间</span><span>引擎</span><span>字符数</span><span>操作</span>
        </div>
        {#each recentProjects as project, i (project.name)}
          <div class="project-row">
            <div class="project-name">
              <span class="thumb" style="--i: {i}"></span>
              <span>{project.name}</span>
            </div>
            <span>{project.time}</span>
            <span class="engine-badge {project.tone}">{project.engine}</span>
            <span>{project.words}</span>
            <button type="button" onclick={() => goto('/dubbing')}>打开</button>
          </div>
        {/each}
      </div>
    </article>

    <aside class="side-stack">
      <article class="panel stat-panel">
        <header class="panel-head"><h2>今日生成字符</h2><span class="gain">+18%</span></header>
        <div class="stat-number">12,840</div>
        <div class="bars">
          {#each bars as bar, i (i)}
            <span style="height: {bar}%"><em>5/{13 + i}</em></span>
          {/each}
        </div>
      </article>

      <article class="panel health-panel">
        <header class="panel-head"><h2>引擎健康状态</h2></header>
        <div class="health-row"><span class="dot ok"></span><strong>轻量引擎</strong><em>可用</em><small>显存 45%</small><i style="width:45%"></i></div>
        <div class="health-row"><span class="dot ok"></span><strong>情感引擎</strong><em>可用</em><small>显存 72%</small><i style="width:72%"></i></div>
        <div class="health-row"><span class="dot"></span><strong>云端引擎</strong><em>未登录</em><button type="button" onclick={() => goto('/profile')}>去登录</button></div>
      </article>
    </aside>
  </section>

  <footer class="notice-bar">
    <span class="version-pill">v3.0.0</span>
    <span>全新多引擎架构，性能提升 20%，新增情感引擎与对轴工具。</span>
    <button type="button" onclick={() => goto('/about')}>查看详情</button>
  </footer>
</div>

<style>
  .home-page {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding: var(--spacing-lg);
    background-color: var(--color-bg-container);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
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

  .notice-bar button,
  .panel-head button,
  .project-row button {
    border: none;
    background: transparent;
    color: var(--color-primary);
    cursor: pointer;
  }

  .quick-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--spacing-md);
  }

  .quick-card {
    min-height: 92px;
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
    grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.55fr);
    gap: var(--spacing-md);
  }

  .side-stack {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
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

  .recent-table {
    padding: var(--spacing-sm) var(--spacing-lg) var(--spacing-md);
  }

  .table-head,
  .project-row {
    display: grid;
    grid-template-columns: minmax(220px, 1.5fr) 160px 80px 90px 50px;
    align-items: center;
    gap: var(--spacing-md);
    min-height: 38px;
    font-size: var(--font-size-sm);
  }

  .table-head {
    color: var(--color-text-tertiary);
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .project-row {
    color: var(--color-text-secondary);
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .project-row:last-child {
    border-bottom: none;
  }

  .project-name {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--color-text);
    min-width: 0;
  }

  .thumb {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    border-radius: var(--border-radius-sm);
    background: linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 70%, transparent), var(--color-bg-spotlight));
    opacity: calc(0.55 + var(--i) * 0.08);
  }

  .engine-badge {
    justify-self: start;
    padding: 2px 7px;
    border-radius: var(--border-radius-sm);
    font-size: 11px;
  }
  .engine-badge.blue { color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 16%, transparent); }
  .engine-badge.gold { color: var(--color-warning); background: color-mix(in srgb, var(--color-warning) 14%, transparent); }
  .engine-badge.green { color: var(--color-success); background: color-mix(in srgb, var(--color-success) 14%, transparent); }

  .stat-panel {
    padding-bottom: var(--spacing-md);
  }

  .gain {
    color: var(--color-success);
    background: color-mix(in srgb, var(--color-success) 14%, transparent);
    border-radius: var(--border-radius-sm);
    padding: 2px 8px;
    font-size: 11px;
  }

  .stat-number {
    padding: var(--spacing-md) var(--spacing-lg) 0;
    color: var(--color-primary);
    font-size: 40px;
    font-weight: 700;
    text-shadow: 0 0 18px color-mix(in srgb, var(--color-primary) 25%, transparent);
  }

  .bars {
    display: flex;
    align-items: flex-end;
    gap: var(--spacing-sm);
    height: 86px;
    padding: var(--spacing-md) var(--spacing-lg) 0;
  }

  .bars span {
    flex: 1;
    position: relative;
    min-height: 12px;
    background: var(--color-primary);
    border-radius: 3px 3px 0 0;
    opacity: 0.65;
  }

  .bars span:last-child {
    opacity: 1;
  }

  .bars em {
    position: absolute;
    left: 50%;
    bottom: -18px;
    transform: translateX(-50%);
    font-style: normal;
    color: var(--color-text-tertiary);
    font-size: 10px;
  }

  .health-panel {
    padding-bottom: var(--spacing-sm);
  }

  .health-row {
    position: relative;
    min-height: 38px;
    margin: 0 var(--spacing-lg);
    display: grid;
    grid-template-columns: 12px 1fr 52px 70px;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .health-row:last-child { border-bottom: none; }
  .health-row strong { color: var(--color-text-secondary); font-weight: 400; }
  .health-row em { color: var(--color-success); font-style: normal; }
  .health-row small { color: var(--color-text-tertiary); }
  .health-row i {
    position: absolute;
    right: 0;
    bottom: 7px;
    height: 3px;
    background: var(--color-success);
    border-radius: 999px;
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background-color: var(--color-text-tertiary);
  }
  .dot.ok { background-color: var(--color-success); }

  .notice-bar {
    min-height: 50px;
    padding: 0 var(--spacing-lg);
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .version-pill {
    color: #fff;
    background: var(--color-primary);
    padding: 3px 10px;
    border-radius: var(--border-radius-sm);
    font-size: 11px;
  }

  .notice-bar button {
    margin-left: auto;
  }
</style>
