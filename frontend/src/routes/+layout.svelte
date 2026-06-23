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
  import UpgradeModal from '$lib/components/membership/UpgradeModal.svelte';
  import { getMenuKeyFromPath, MENU_ROUTES } from '$lib/utils/navigation';
  import { env } from '$lib/stores/environment.svelte';
  import { appSettings } from '$lib/stores/settings.svelte';
  import { dubbing, type EngineMode } from '$lib/stores/dubbing.svelte';
  import { membership } from '$lib/stores/membership.svelte';
  import { requestEngineChange } from '$lib/utils/entitlements';
  import { toast } from '$lib/stores/toast.svelte';

  const ENGINE_CYCLE: EngineMode[] = ['lightweight', 'emotion', 'cloud'];
  const ENGINE_LABELS: Record<EngineMode, string> = {
    lightweight: '轻量',
    emotion: '情感',
    cloud: '云端',
  };

  let { children }: { children: Snippet } = $props();

  let sidebarCollapsed = $state(false);
  let desktopReady = $state(env.isTauri);

  let activeMenu: MenuKey | null = $derived(
    $page.url.pathname === '/profile' ? null : getMenuKeyFromPath($page.url.pathname)
  );

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

  function installAppShortcuts() {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      const hasPrimaryModifier = event.ctrlKey || event.metaKey;
      if (!hasPrimaryModifier || !event.shiftKey) return;

      const key = event.key.toLowerCase();
      if (key === 'e') {
        event.preventDefault();
        const idx = ENGINE_CYCLE.indexOf(dubbing.engineMode);
        const next = ENGINE_CYCLE[(idx + 1) % ENGINE_CYCLE.length];
        if (requestEngineChange(next)) {
          toast.success(`已切换到${ENGINE_LABELS[next]}引擎`);
        }
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
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
    await membership.init();
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
    const cleanupShortcuts = installAppShortcuts();

    return () => {
      cleanupGuards?.();
      cleanupShortcuts?.();
      cleanupEnv?.();
    };
  });
</script>

<script lang="ts" module>
  const IS_DEV_BACKDOOR =
    typeof window !== 'undefined' &&
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).has('dev_force_tauri');
</script>

{#if desktopReady}
  {#if IS_DEV_BACKDOOR}
    <div class="dev-banner" role="status">
      DEV · 浏览器模拟桌面环境 · Tauri API 调用将失败 · 仅供自动化测试
    </div>
  {/if}
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
      <UpgradeModal />
      <Toast />
    </div>
  </div>
{:else}
  <div class="desktop-only-shell">
    <div class="desktop-only-card">
      <h1>桌面客户端专用</h1>
      <p>当前界面依赖 Tauri 桌面运行时。请在桌面应用中启动丸子配音以获得完整功能。</p>
    </div>
  </div>
{/if}

<style>
  .dev-banner {
    width: 100%;
    text-align: center;
    padding: 3px 12px;
    font-size: var(--font-size-xs);
    color: #fff;
    background: linear-gradient(90deg, var(--color-warning), color-mix(in srgb, var(--color-warning) 70%, var(--color-error)));
    letter-spacing: 0.5px;
    pointer-events: none;
    flex-shrink: 0;
  }

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
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
  }

  :global(.content > .profile-page),
  :global(.content > .roles-page),
  :global(.content > .library-page),
  :global(.content > .files-page),
  :global(.content > .subtitle-page),
  :global(.content > .align-page),
  :global(.content > .about-page),
  :global(.content > .settings-page) {
    padding: 15px;
  }

  @media (max-width: 768px) {
    .content {
      padding-bottom: 120px;
    }
  }
</style>


