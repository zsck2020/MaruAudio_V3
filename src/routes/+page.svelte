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

  onMount(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      isMobile = width < 768;
      isTablet = width >= 768 && width < 1024;
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

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
            pauseOnFocus
            arrows={false}
            dots={true}
            swiping={true}
            duration={500}
          >
            <div class="carousel-item">
              <img src="/banner-1.svg" alt="丸子配音 · 智能语音创作平台" class="carousel-image" />
            </div>
            <div class="carousel-item">
              <img src="/banner-2.svg" alt="多角色配音 · 一键生成对话" class="carousel-image" />
            </div>
            <div class="carousel-item">
              <img src="/banner-3.svg" alt="智能字幕 · 精准对轴" class="carousel-image" />
            </div>
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
