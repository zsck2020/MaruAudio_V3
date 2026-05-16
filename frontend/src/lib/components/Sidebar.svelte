<script lang="ts">
  import MenuItem from './MenuItem.svelte';
  import type { MenuKey, MenuItemConfig } from '$lib/types';

  let {
    activeMenu = 'home',
    isMobile = false,
    isTablet = false,
    sidebarCollapsed = false,
    onMenuClick
  }: {
    activeMenu?: MenuKey | null;
    isMobile?: boolean;
    isTablet?: boolean;
    sidebarCollapsed?: boolean;
    onMenuClick: (key: MenuKey) => void;
  } = $props();

  // 主菜单项配置
  const mainMenuItems: MenuItemConfig[] = [
    { key: 'home', icon: 'home', label: '首页', tooltip: '返回首页' },
    { key: 'dubbing', icon: 'dubbing', label: '配音', tooltip: '通用配音' },
    { key: 'project', icon: 'project', label: '角色', tooltip: '多角色配音' },
    { key: 'video', icon: 'video', label: '对轴', tooltip: '音频/字幕对轴' },
    { key: 'copywriting', icon: 'copywriting', label: '字幕', tooltip: '字幕生成/编辑' },
    { key: 'resource', icon: 'resource', label: '音库', tooltip: '本地样音库' },
    { key: 'cover', icon: 'cover', label: '文件', tooltip: '生成文件管理' },
  ];

  // 底部菜单项配置
  const bottomMenuItems: MenuItemConfig[] = [
    { key: 'setting', icon: 'setting', label: '设置', tooltip: '软件设置' },
    { key: 'about', icon: 'about', label: '关于', tooltip: '关于我们' },
  ];
</script>

<div class="sidebar" class:mobile={isMobile} class:collapsed={sidebarCollapsed && isTablet}>
  <div class="main-menu">
    {#each mainMenuItems as item (item.key)}
      <MenuItem
        icon={item.icon}
        label={item.label}
        tooltip={item.tooltip}
        active={activeMenu === item.key}
        {isMobile}
        onclick={() => onMenuClick(item.key)}
      />
    {/each}
  </div>
  
  <div class="bottom-menu">
    {#each bottomMenuItems as item (item.key)}
      <MenuItem
        icon={item.icon}
        label={item.label}
        tooltip={item.tooltip}
        active={activeMenu === item.key}
        {isMobile}
        onclick={() => onMenuClick(item.key)}
      />
    {/each}
  </div>
</div>

<style>
  .sidebar {
    width: 70px;
    background-color: var(--color-bg-base);
    border-right: 1px solid var(--color-border-secondary);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    padding: 14px 0 var(--spacing-lg) 0;
    flex-shrink: 0;
    transition: transform 0.3s ease, width 0.3s ease;
    position: relative;
    z-index: 10;
  }
  
  /* 移动端：侧边栏改为底部导航 */
  .sidebar.mobile {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: auto;
    min-height: 60px;
    flex-direction: column;
    justify-content: flex-start;
    border-right: none;
    border-top: 1px solid var(--color-border-secondary);
    padding: 8px 0;
    z-index: 1000;
  }
  
  /* 平板端：可折叠侧边栏 */
  .sidebar.collapsed {
    width: 0;
    overflow: hidden;
    border-right: none;
  }
  
  @media (max-width: 768px) {
    .sidebar:not(.mobile) {
      display: none;
    }
  }
  
  @media (min-width: 769px) and (max-width: 1024px) {
    .sidebar {
      width: 60px;
    }
  }

  .main-menu {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-top: -3px;
  }
  
  .sidebar.mobile .main-menu {
    flex-direction: row;
    width: 100%;
    justify-content: space-around;
    margin-top: 0;
    gap: 0;
    flex-wrap: wrap;
    padding: 0 4px;
  }
  
  .sidebar.mobile .main-menu :global(.menu-item) {
    flex: 1;
    max-width: none;
    min-width: 0;
    height: 50px;
  }

  .bottom-menu {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-bottom: -5px;
  }
  
  .sidebar.mobile .bottom-menu {
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: space-around;
    margin-bottom: 0;
    margin-top: 4px;
    gap: 0;
    padding: 0 4px;
    border-top: 1px solid var(--color-border-secondary);
    padding-top: 4px;
  }
  
  .sidebar.mobile .bottom-menu :global(.menu-item) {
    flex: 1;
    max-width: none;
    min-width: 0;
    height: 50px;
  }
  
  @media (max-width: 768px) {
    .sidebar:not(.mobile) .bottom-menu {
      display: none;
    }
  }

  /* 移动端：菜单项在底部导航时的样式 */
  .sidebar.mobile :global(.menu-item) {
    width: 100%;
    height: 60px;
    border-radius: 0;
    margin: 0;
  }

  .sidebar.mobile :global(.menu-item.active::before) {
    display: none;
  }
  
  .sidebar.mobile :global(.menu-item.active) {
    border-top: 2px solid var(--color-bg-spotlight);
  }
  
  /* 移动端隐藏 Tooltip（菜单项已有文字标签） */
  @media (max-width: 768px) {
    .sidebar.mobile :global(.tooltip-wrapper) {
      pointer-events: none;
    }
    
    .sidebar.mobile :global(.tooltip-content) {
      display: none !important;
    }
  }
</style>
