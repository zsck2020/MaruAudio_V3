<script>
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { currentProduct, setProduct, initProduct, getProductName } from '$lib/stores/product';
  import Select from '$lib/components/Select.svelte';
  import Button from '$lib/components/Button.svelte';
  import adminWs from '$lib/utils/websocket';
  import logger from '$lib/utils/logger';
  import { getStats } from '$lib/api';
  
  let mobileMenuOpen = $state(false);
  let adminInfo = $state({});
  let dropdownOpen = $state(false);
  let dropdownRef;
  let currentPath = $state('');
  let currentTitle = $state('管理后台');
  let wsConnected = $state(false);
  
  const menuItems = [
    { path: '/dashboard', icon: 'DB', label: '控制台' },
    { path: '/users', icon: 'U', label: '用户管理' },
    { path: '/cards', icon: 'C', label: '卡密管理' },
    { path: '/character-packs', icon: 'CP', label: '字符包管理' },
    { path: '/marketing', icon: 'MK', label: '营销活动' },
    { path: '/commission', icon: 'CM', label: '分佣提现' },
    { path: '/software', icon: 'SW', label: '软件管理' },
    { path: '/announcements', icon: 'AN', label: '公告管理' },
    { path: '/logs', icon: 'LG', label: '操作日志' },
    { path: '/settings', icon: 'ST', label: '系统设置' }
  ];
  
  const pageTitles = {
    '/dashboard': '控制台',
    '/users': '用户管理',
    '/cards': '卡密管理',
    '/character-packs': '字符包管理',
    '/marketing': '营销活动',
    '/commission': '分佣提现',
    '/software': '软件管理',
    '/announcements': '公告管理',
    '/logs': '操作日志',
    '/settings': '系统设置'
  };
  
  onMount(() => {
    initProduct();
    if (typeof window !== 'undefined') {
      const info = localStorage.getItem('admin_info');
      if (info) {
        adminInfo = JSON.parse(info);
      }
      
      // 初始化WebSocket连接
      initWebSocket();
    }
  });
  
  onDestroy(() => {
    // 断开WebSocket连接
    adminWs.disconnect();
  });
  
  function initWebSocket() {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      logger.log('[WebSocket] 未找到token，跳过连接');
      return;
    }
    
    // 注册WebSocket事件监听
    adminWs.on('connected', () => {
      wsConnected = true;
      logger.log('[WebSocket] 已连接到服务器');
    });
    
    adminWs.on('disconnected', () => {
      wsConnected = false;
      logger.log('[WebSocket] 已断开连接');
    });
    
    adminWs.on('authenticated', () => {
      logger.log('[WebSocket] 认证成功');
    });
    
    adminWs.on('auth_error', (data) => {
      logger.error('[WebSocket] 认证失败:', data);
    });
    
    // 监听用户状态变更事件
    adminWs.on('user_status_changed', (data) => {
      logger.log('[WebSocket] 用户状态变更:', data);
      // 触发页面刷新（如果当前在用户管理页面）
      if (currentPath === '/users') {
        // 通过自定义事件通知子组件刷新
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('websocket:user_changed', { detail: data }));
        }
      }
    });
    
    // 监听配置更新事件
    adminWs.on('config_updated', (data) => {
      logger.log('[WebSocket] 配置已更新:', data);
      // 触发页面刷新（如果当前在设置页面）
      if (currentPath === '/settings') {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('websocket:config_updated', { detail: data }));
        }
      }
    });
    
    // 监听统计数据更新
    adminWs.on('stats_updated', (data) => {
      logger.log('[WebSocket] 统计数据已更新:', data);
      // 触发页面刷新（如果当前在控制台页面）
      if (currentPath === '/dashboard') {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('websocket:stats_updated', { detail: data }));
        }
      }
    });
    
    // 监听所有消息（用于调试）
    adminWs.on('message', (data) => {
      logger.log('[WebSocket] 收到消息:', data);
    });
    
    // 连接WebSocket
    adminWs.connect(token).catch((error) => {
      logger.error('[WebSocket] 连接失败:', error);
    });
  }

  $effect(() => {
    // 路由变化时更新当前路径与标题（runes 模式下禁止使用 `$:`）
    currentPath = $page.url.pathname;
    currentTitle = pageTitles[currentPath] || '管理后台';
  });
  
  
  function handleLogout() {
    if (confirm('确定要退出登录吗？')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_info');
      }
      goto('/login');
    }
  }
  
  function handleProfile() {
    goto('/settings');
  }
  
  function handleMenuClick() {
    mobileMenuOpen = !mobileMenuOpen;
  }
  
  function handleMenuItemClick(path) {
    goto(path);
    mobileMenuOpen = false;
  }
  
  function handleClickOutside(event) {
    if (dropdownRef && !dropdownRef.contains(event.target)) {
      dropdownOpen = false;
    }
  }
  
  $effect(() => {
    if (dropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  });
  
  $effect(() => {
    // 路由变化时关闭移动端菜单
    $page.url.pathname;
    mobileMenuOpen = false;
  });
  
  $effect(() => {
    // 监听产品变化
    if ($currentProduct) {
      setProduct($currentProduct);
    }
  });
</script>

<div class="layout-container" class:mobile-menu-open={mobileMenuOpen}>
  <!-- 移动端遮罩 -->
  {#if mobileMenuOpen}
    <button
      type="button"
      class="mobile-overlay"
      aria-label="关闭菜单"
      onclick={() => mobileMenuOpen = false}
    ></button>
  {/if}
  
  <!-- 侧边栏 -->
  <aside class="layout-aside" class:mobile-visible={mobileMenuOpen}>
    <div class="sidebar-logo">
      <span class="logo-icon">MA</span>
      <h2>丸子智能</h2>
    </div>
    <nav class="sidebar-menu">
      {#each menuItems as item}
        <a
          href={item.path}
          class="menu-item"
          class:active={currentPath === item.path}
          onclick={(e) => {
            e.preventDefault();
            handleMenuItemClick(item.path);
          }}
        >
          <span class="menu-icon">{item.icon}</span>
          <span class="menu-label">{item.label}</span>
        </a>
      {/each}
    </nav>
  </aside>
  
  <!-- 主内容区 -->
  <div class="layout-main">
    <!-- 顶部栏 -->
    <header class="layout-header">
      <div class="header-left">
        <button class="mobile-menu-btn" onclick={handleMenuClick} type="button">
          <span>☰</span>
        </button>
        <span class="page-title-text">{currentTitle}</span>
      </div>
      <div class="header-right">
        <!-- WebSocket连接状态指示器 -->
        <div class="ws-status" class:connected={wsConnected} title={wsConnected ? 'WebSocket已连接' : 'WebSocket未连接'}>
          <span class="ws-dot"></span>
        </div>
        
        <!-- 全局产品切换 -->
        <div class="product-selector-wrapper">
          <Select
            bind:value={$currentProduct}
            options={[
              { value: 'dubbing', label: '丸子配音' },
              { value: 'comic', label: '丸子漫剧' }
            ]}
          />
        </div>
        
        <!-- 用户下拉菜单 -->
        <div class="user-dropdown-wrapper" bind:this={dropdownRef}>
          <button
            type="button"
            class="user-dropdown"
            aria-haspopup="menu"
            aria-expanded={dropdownOpen}
            onclick={() => dropdownOpen = !dropdownOpen}
          >
            <div class="user-avatar">
              {adminInfo?.username?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <span class="username">{adminInfo?.username || '管理员'}</span>
            <span class="dropdown-arrow">▼</span>
          </button>
          {#if dropdownOpen}
            <div class="dropdown-menu" role="menu">
              <button type="button" class="dropdown-item" role="menuitem" onclick={handleProfile}>
                个人设置
              </button>
              <div class="dropdown-divider"></div>
              <button type="button" class="dropdown-item" role="menuitem" onclick={handleLogout}>
                退出登录
              </button>
            </div>
          {/if}
        </div>
      </div>
    </header>
    
    <!-- 内容区 -->
    <main class="layout-content">
      <slot />
    </main>
  </div>
</div>

<style>
  .layout-container {
    height: 100vh;
    display: flex;
  }
  
  .mobile-overlay {
    display: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
  }
  
  .layout-aside {
    width: 220px;
    background-color: #001529;
    color: white;
    box-shadow: 2px 0 8px 0 rgba(29, 35, 41, 0.05);
    display: flex;
    flex-direction: column;
  }
  
  .sidebar-logo {
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #002140;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    gap: 8px;
  }
  
  .logo-icon {
    font-size: 24px;
  }
  
  .sidebar-logo h2 {
    color: white;
    font-size: 18px;
    margin: 0;
    font-weight: 600;
    letter-spacing: 0.5px;
  }
  
  .sidebar-menu {
    flex: 1;
    padding: 8px;
    overflow-y: auto;
  }
  
  .menu-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    margin: 4px 0;
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.65);
    text-decoration: none;
    transition: all 0.3s;
    cursor: pointer;
  }
  
  .menu-item:hover {
    background-color: rgba(255, 255, 255, 0.08);
    color: #ffffff;
  }
  
  .menu-item.active {
    background-color: #1890ff;
    color: #ffffff;
    font-weight: 500;
  }
  
  .menu-icon {
    margin-right: 12px;
    font-size: 16px;
  }
  
  .menu-label {
    font-size: 14px;
  }
  
  .layout-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: #f0f2f5;
  }
  
  .layout-header {
    height: 56px;
    background: white;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  }
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .mobile-menu-btn {
    display: none;
    background: none;
    border: none;
    font-size: 22px;
    cursor: pointer;
    padding: 4px;
  }
  
  .page-title-text {
    font-size: 16px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.85);
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .ws-status {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: default;
  }
  
  .ws-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #ff4d4f;
    transition: background-color 0.3s;
  }
  
  .ws-status.connected .ws-dot {
    background-color: #52c41a;
  }
  
  .product-selector-wrapper {
    min-width: 140px;
  }
  
  .user-dropdown-wrapper {
    position: relative;
  }
  
  .user-dropdown {
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 6px 12px;
    border-radius: 8px;
    transition: all 0.2s ease;
    gap: 8px;
    border: none;
    background: none;
  }
  
  .user-dropdown:hover {
    background: rgba(0, 0, 0, 0.04);
  }
  
  .user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1890ff 0%, #722ed1 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 14px;
  }
  
  .username {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.85);
    font-weight: 500;
  }
  
  .dropdown-arrow {
    font-size: 12px;
    color: #999;
  }
  
  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    background: white;
    border: 1px solid #f0f0f0;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 160px;
    z-index: 1000;
  }
  
  .dropdown-item {
    padding: 12px 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.85);
    transition: background 0.2s;
    width: 100%;
    text-align: left;
    border: none;
    background: none;
  }
  
  .dropdown-item:hover {
    background: #f5f5f5;
  }
  
  .dropdown-divider {
    height: 1px;
    background: #f0f0f0;
    margin: 4px 0;
  }
  
  .layout-content {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
    background-color: #f0f2f5;
  }
  
  @media (max-width: 768px) {
    .mobile-menu-btn {
      display: inline-flex;
    }
    
    .layout-aside {
      position: fixed;
      left: -220px;
      top: 0;
      height: 100vh;
      z-index: 1001;
      transition: left 0.3s ease;
    }
    
    .layout-aside.mobile-visible {
      left: 0;
    }
    
    .mobile-overlay {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
    }
    
    .layout-main {
      width: 100%;
    }
    
    .layout-header {
      padding: 0 12px;
    }
    
    .username {
      display: none;
    }
    
    .product-selector-wrapper {
      min-width: 100px;
    }
    
    .layout-content {
      padding: 12px;
    }
  }
</style>

