<script lang="ts">
  import TitleBar from '../lib/components/TitleBar.svelte';
  import Sidebar from '../lib/components/Sidebar.svelte';
  import Icon from '../lib/icons/Icon.svelte';
  import { onMount } from 'svelte';
  import Carousel from 'svelte-carousel';
  import { openUrl } from '@tauri-apps/plugin-opener';
  import { invoke } from '@tauri-apps/api/core';
  import type { MenuKey, BannerItem } from '$lib/types';

  let isMobile = $state(false);
  let isTablet = $state(false);
  let sidebarCollapsed = $state(false);

  let activeMenu: MenuKey = $state('home');

  const menuLabels: Record<MenuKey, string> = {
    home: '首页',
    dubbing: '配音',
    project: '多角色配音',
    video: '对轴',
    copywriting: '文案',
    resource: '资源',
    cover: '文件',
    setting: '设置',
    about: '关于',
  };

  function handleMenuClick(menuKey: MenuKey) {
    activeMenu = menuKey;
  }

  // Banner 数据
  const fallbackBanners: BannerItem[] = [
    { id: 1, title: '丸子配音 · 智能语音创作平台', image_url: '/banner-1.svg', link_url: '', link_type: 'none' },
    { id: 2, title: '多角色配音 · 一键生成对话', image_url: '/banner-2.svg', link_url: '', link_type: 'none' },
    { id: 3, title: '智能字幕 · 精准对轴', image_url: '/banner-3.svg', link_url: '', link_type: 'none' },
  ];

  let banners: BannerItem[] = $state(fallbackBanners);

  async function loadBanners() {
    try {
      const data: any[] = await invoke('get_banners');
      if (Array.isArray(data) && data.length > 0) {
        banners = data.map((b: any) => ({
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
      try {
        await openUrl(url);
      } catch {
        window.open(url, '_blank');
      }
    } else if (banner.link_type === 'page' && banner.link_url) {
      activeMenu = banner.link_url as MenuKey;
    }
  }

  // svelte-carousel (Svelte 3) 的 swipeable action 会拦截 mousedown，
  // 导致 Svelte 5 的 onclick 无法触发，改用 pointerdown/pointerup 手动检测点击
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
    const checkScreenSize = () => {
      const width = window.innerWidth;
      isMobile = width < 768;
      isTablet = width >= 768 && width < 1024;
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    loadBanners();

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  });
</script>

<!-- 主页面 -->
<div class="page">
  <!-- 顶部标题栏 -->
  <TitleBar />
  
  <!-- 主内容区域 -->
  <div class="main-container">
    <!-- 左侧菜单栏 -->
    <Sidebar
      {activeMenu}
      {isMobile}
      {isTablet}
      {sidebarCollapsed}
      onMenuClick={handleMenuClick}
    />
    
    <!-- 右侧内容区域 -->
    <div class="content">
      {#if activeMenu === 'home'}
        <!-- 仅在首页显示的 Banner Carousel -->
        <div class="carousel-container">
          <Carousel
            autoplay
            autoplayDuration={5000}
            autoplayDirection="prev"
            pauseOnFocus
            arrows={false}
            dots={banners.length > 1}
            swiping={true}
            duration={500}
          >
            {#each banners as banner (banner.id)}
              <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
              <div
                class="carousel-item"
                class:clickable={banner.link_type !== 'none'}
                role={banner.link_type !== 'none' ? 'button' : 'img'}
                tabindex={banner.link_type !== 'none' ? 0 : -1}
                onpointerdown={handleBannerPointerDown}
                onpointerup={(e) => handleBannerPointerUp(e, banner)}
                onkeydown={(e) => e.key === 'Enter' && handleBannerClick(banner)}
              >
                <img src={banner.image_url} alt={banner.title} class="carousel-image" />
              </div>
            {/each}
          </Carousel>
        </div>
      {:else}
        <div class="empty-state">
          <Icon name={activeMenu} size={48} color="var(--color-text-quaternary)" />
          <p class="empty-state-text">{menuLabels[activeMenu] || activeMenu}</p>
          <p class="empty-state-hint">功能开发中，敬请期待</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .page {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  .main-container {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
  }

  .content {
    flex: 1;
    background-color: var(--color-bg-container);
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
  }

  .carousel-container {
    margin-left: 20px;
    margin-right: 20px;
    margin-top: 11px;
    height: 225px;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
    border: 1px solid var(--color-border-secondary);
  }

  /* 轮播圆点指示器样式 */
  .carousel-container :global(.sc-carousel-dots__container) {
    bottom: 12px;
    gap: 6px;
  }

  .carousel-container :global(.sc-carousel-dots__dot-container) {
    padding: 0;
  }

  .carousel-container :global(.sc-carousel-dots__dot) {
    width: 8px;
    height: 8px;
    background-color: rgba(255, 255, 255, 0.3);
    border: none;
    transition: all 0.3s ease;
  }

  .carousel-container :global(.sc-carousel-dots__dot_active) {
    background-color: rgba(255, 255, 255, 0.9);
    width: 20px;
    border-radius: 4px;
  }

  @media (max-width: 768px) {
    .carousel-container {
      margin-left: 12px;
      margin-right: 12px;
      height: 160px;
    }
  }

  .carousel-item {
    width: 100%;
    height: 225px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (max-width: 768px) {
    .carousel-item {
      height: 160px;
    }
  }

  .carousel-item.clickable {
    cursor: pointer;
  }

  .carousel-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    opacity: 0.6;
  }

  .empty-state-text {
    font-size: var(--font-size-lg, 16px);
    font-weight: 500;
    color: var(--color-text-secondary);
    margin: 0;
  }

  .empty-state-hint {
    font-size: var(--font-size-sm, 12px);
    color: var(--color-text-tertiary);
    margin: 0;
  }

  @media (max-width: 768px) {
    .content {
      padding-bottom: 120px;
    }
  }
</style>
