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
          <Carousel autoplay={false} arrows={false} dots={false}>
            <div class="carousel-item">
              <img src="/banner-placeholder.svg" alt="Banner" class="carousel-image" />
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
    border-radius: 5px;
    overflow: hidden;
    flex-shrink: 0;
    border: 1px solid var(--color-border-secondary);
  }

  @media (max-width: 768px) {
    .carousel-container {
      margin-left: 20px;
    }
  }

  .carousel-item {
    width: 100%;
    height: 225px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .carousel-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 5px;
  }

  @media (max-width: 768px) {
    .content {
      padding-bottom: 120px;
    }
  }
</style>
