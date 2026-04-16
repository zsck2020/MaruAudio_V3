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
  import { dubbing } from '$lib/stores/dubbing.svelte';

  let { children }: { children: Snippet } = $props();

  let sidebarCollapsed = $state(false);
  let desktopReady = $state(env.isTauri);

  let activeMenu: MenuKey = $derived(getMenuKeyFromPath($page.url.pathname));

  function isDesktopGuardEnabled() {
    return env.isTauri;
  }

  function isBlockedDesktopShortcut(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    const hasPrimaryModifier = event.ctrlKey || event.metaKey;

    // 禁用刷新
    if (event.key === 'F5' || event.key === 'F12') return true;
    if (hasPrimaryModifier && key === 'r') return true;

    // 禁用开发者工具
    if (hasPrimaryModifier && event.shiftKey && key === 'i') return true;
    if (hasPrimaryModifier && event.shiftKey && key === 'c') return true;
    if (hasPrimaryModifier && event.shiftKey && key === 'j') return true;

    // 禁用查看源代码
    if (hasPrimaryModifier && key === 'u') return true;

    return false;
  }

  function installDesktopInteractionGuards() {
    // 禁用快捷键
    const handleKeydown = (event: KeyboardEvent) => {
      if (!isDesktopGuardEnabled() || event.defaultPrevented || event.isComposing) return;
      if (!isBlockedDesktopShortcut(event)) return;

      event.preventDefault();
      event.stopPropagation();
    };

    // 禁用右键菜单（全局）
    const handleContextMenu = (event: MouseEvent) => {
      if (!isDesktopGuardEnabled()) return;

      // 检查是否在允许右键的元素内
      const target = event.target as HTMLElement;
      const allowContextMenu = target.closest('[data-allow-contextmenu]');

      if (!allowContextMenu) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('keydown', handleKeydown, true);
    window.addEventListener('contextmenu', handleContextMenu, true);

    return () => {
      window.removeEventListener('keydown', handleKeydown, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
    };
  }

  function handleMenuClick(menuKey: MenuKey) {
    const route = MENU_ROUTES[menuKey];
    if (route && $page.url.pathname !== route) {
      goto(route);
    }
  }
  async function hydrateDesktopSettings() {
    await appSettings.init();
    sidebarCollapsed = appSettings.settings.ui.sidebarCollapsed;
    dubbing.syncSettings();
  }
  onMount(() => {
    const cleanupEnv = env.init();
    desktopReady = env.isTauri;

    if (!desktopReady) {
      return cleanupEnv;
    }

    void hydrateDesktopSettings();
    const cleanupGuards = installDesktopInteractionGuards();

    return () => {
      cleanupGuards?.();
      cleanupEnv?.();
    };
  });
</script>

{#if desktopReady}
  <div class="window-container">
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
{:else}
  <div class="desktop-only-shell">
    <div class="desktop-only-card">
      <h1>妗岄潰瀹㈡埛绔笓鐢?/h1>
      <p>褰撳墠鐣岄潰渚濊禆 Tauri 妗岄潰杩愯鏃躲€傝鍦ㄦ闈㈠簲鐢ㄤ腑鍚姩 MaruAudio 浠ヨ幏寰楀畬鏁村姛鑳姐€?/p>
    </div>
  </div>
{/if}

<style>
  .desktop-only-shell {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px;
    background-color: var(--color-bg-base);
  }

  .desktop-only-card {
    width: min(480px, 100%);
    padding: 32px;
    border: 1px solid var(--color-border-secondary);
    border-radius: 16px;
    background-color: var(--color-bg-container);
    color: var(--color-text);
    text-align: center;
  }

  .desktop-only-card h1 {
    margin: 0 0 12px;
    font-size: 28px;
    font-weight: 600;
  }

  .desktop-only-card p {
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.7;
  }

  @media (max-width: 768px) {
    .desktop-only-card {
      padding: 24px;
    }

    .desktop-only-card h1 {
      font-size: 24px;
    }
  }

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


