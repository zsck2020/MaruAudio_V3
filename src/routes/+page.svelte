<script lang="ts">
  import TitleBar from '../lib/components/TitleBar.svelte';
  import Sidebar from '../lib/components/Sidebar.svelte';
  import { onMount } from 'svelte';
  import Carousel from 'svelte-carousel';

  let isMobile = $state(false);
  let isTablet = $state(false);
  let sidebarCollapsed = $state(false);

  // 菜单状态管理
  type MenuKey =
    | 'home'
    | 'video'
    | 'copywriting'
    | 'dubbing'
    | 'cover'
    | 'resource'
    | 'project'
    | 'setting'
    | 'about';
  let activeMenu: MenuKey = $state('home');

  function handleMenuClick(menuKey: MenuKey) {
    activeMenu = menuKey;
  }

  // Banner 数据
  interface BannerItem {
    id: number;
    title: string;
    image_url: string;
    link_url: string;
    link_type: 'none' | 'url' | 'page';
  }

  const fallbackBanners: BannerItem[] = [
    { id: 1, title: '丸子配音 · 智能语音创作平台', image_url: '/banner-1.svg', link_url: '', link_type: 'none' },
    { id: 2, title: '多角色配音 · 一键生成对话', image_url: '/banner-2.svg', link_url: '', link_type: 'none' },
    { id: 3, title: '智能字幕 · 精准对轴', image_url: '/banner-3.svg', link_url: '', link_type: 'none' },
  ];

  let banners: BannerItem[] = $state(fallbackBanners);

  async function loadBanners() {
    try {
      const apiUrl = 'https://auth.wzagent.cn/api/banners?product_code=dubbing';
      const response = await fetch(apiUrl);
      const result = await response.json();
      if (result.code === 0 && Array.isArray(result.data) && result.data.length > 0) {
        banners = result.data.map((b: any) => ({
          id: b.id,
          title: b.title,
          image_url: b.image_url.startsWith('http') ? b.image_url : `https://auth.wzagent.cn${b.image_url}`,
          link_url: b.link_url || '',
          link_type: b.link_type || 'none',
        }));
      }
    } catch (e) {
      console.warn('加载远程Banner失败，使用本地默认Banner', e);
    }
  }

  function handleBannerClick(banner: BannerItem) {
    if (banner.link_type === 'url' && banner.link_url) {
      window.open(banner.link_url, '_blank');
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
              <div
                class="carousel-item"
                class:clickable={banner.link_type !== 'none'}
                role={banner.link_type !== 'none' ? 'button' : undefined}
                tabindex={banner.link_type !== 'none' ? 0 : undefined}
                onpointerdown={handleBannerPointerDown}
                onpointerup={(e) => handleBannerPointerUp(e, banner)}
                onkeydown={(e) => e.key === 'Enter' && handleBannerClick(banner)}
              >
                <img src={banner.image_url} alt={banner.title} class="carousel-image" />
              </div>
            {/each}
          </Carousel>
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

  @media (max-width: 768px) {
    .content {
      padding-bottom: 120px;
    }
  }
</style>
