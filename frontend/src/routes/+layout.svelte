<script lang="ts">
  import '../fonts.css';
  import '../app.css';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import type { Snippet } from 'svelte';
  import type { MenuKey } from '$lib/types';
  import TitleBar from '$lib/components/TitleBar.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import { getMenuKeyFromPath, MENU_ROUTES } from '$lib/utils/navigation';
  import { env } from '$lib/stores/environment.svelte';
  import { appSettings } from '$lib/stores/settings.svelte';

  let { children }: { children: Snippet } = $props();

  let sidebarCollapsed = $state(false);

  let activeMenu: MenuKey = $derived(getMenuKeyFromPath($page.url.pathname));

  function handleMenuClick(menuKey: MenuKey) {
    const route = MENU_ROUTES[menuKey];
    if (route && $page.url.pathname !== route) {
      goto(route);
    }
  }

  onMount(() => {
    env.init();
    // 初始化持久化设置
    appSettings.init();
  });
</script>

<div class="window-container" class:web={env.isWeb}>
  <div class="window">
    <div class="page">
      <TitleBar />
      <div class="main-container">
        <Sidebar
          {activeMenu}
          isMobile={env.isMobile}
          isTablet={env.isTablet}
          {sidebarCollapsed}
          onMenuClick={handleMenuClick}
        />
        <div class="content">
          {@render children()}
        </div>
      </div>
    </div>
    <Toast />
  </div>
</div>

<style>
  .window-container {
    display: flex;
    min-height: 100vh;
    min-width: 100vw;
    background-color: var(--color-bg-base);
    overflow: hidden;
  }
  
  .window {
    height: 100vh;
    width: 100vw;
    background-color: var(--color-bg-base);
    color: var(--color-text);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  :global(body:has(.window-container)) {
    overflow: hidden;
  }

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

  @media (max-width: 768px) {
    .content {
      padding-bottom: 120px;
    }
  }
</style>
