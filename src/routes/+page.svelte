<script lang="ts">
  import Icon from '../lib/icons/Icon.svelte';
  import Tooltip from '../lib/components/Tooltip.svelte';
  import { onMount } from 'svelte';
  import { getCurrentWindow } from '@tauri-apps/api/window';

  let isMobile = false;
  let isTablet = false;
  let sidebarCollapsed = false;
  let isMaximized = false;
  let isTauriApp = false;
  
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
  let activeMenu: MenuKey = 'home';
  
  // 菜单配置
  const menuConfig: Record<MenuKey, { name: string; icon: string }> = {
    home: { name: '首页', icon: 'home' },
    // 左侧主菜单
    dubbing: { name: '配音', icon: 'dubbing' },
    project: { name: '角色', icon: 'project' },
    video: { name: '声播', icon: 'video' },
    resource: { name: '音库', icon: 'resource' },
    copywriting: { name: '字幕', icon: 'copywriting' },
    cover: { name: '文件', icon: 'cover' },
    // 底部菜单
    setting: { name: '设置', icon: 'setting' },
    about: { name: '关于', icon: 'about' }
  };
  
  // 菜单点击处理函数
  function handleMenuClick(menuKey: MenuKey) {
    activeMenu = menuKey;
  }

  onMount(() => {
    // 尝试使用Tauri API - 如果失败则说明在web环境
    (async () => {
      try {
        const appWindow = getCurrentWindow();
        isMaximized = await appWindow.isMaximized();
        isTauriApp = true;
      } catch (e) {
        isTauriApp = false;
        console.log('Running in browser mode (not Tauri app)');
      }
    })();

    // 检测屏幕尺寸
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

  // 窗口控制函数
  async function handleMinimize() {
    if (!isTauriApp) return;

    try {
      const appWindow = getCurrentWindow();
      await appWindow.minimize();
    } catch (e) {
      console.error('Failed to minimize window:', e);
    }
  }

  async function handleMaximize() {
    if (!isTauriApp) return;

    try {
      const appWindow = getCurrentWindow();
      await appWindow.toggleMaximize();
      isMaximized = await appWindow.isMaximized();
    } catch (e) {
      console.error('Failed to toggle maximize window:', e);
    }
  }

  async function handleClose() {
    if (!isTauriApp) return;

    try {
      const appWindow = getCurrentWindow();
      await appWindow.close();
    } catch (e) {
      console.error('Failed to close window:', e);
    }
  }

  // 双击标题栏最大化/还原
  function handleHeaderDoubleClick(event: MouseEvent) {
    // 确保不是点击按钮区域
    const target = event.target as HTMLElement;
    if (target.closest('button, .header-right')) {
      return;
    }
    handleMaximize();
  }
</script>

<!-- 主页面 -->
<div class="page">
  <!-- 顶部标题栏 -->
  <div class="header" on:dblclick={handleHeaderDoubleClick} role="banner">
    <div class="header-left">
      <div class="logo-section">
        <div class="logo-icon">
          <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
            <path d="M122.709333 626.432c0 27.050667-24.96 48.512-57.216 48.512S11.562667 653.312 11.562667 621.013333v-161.749333c0-26.88 21.632-53.930667 53.930666-53.930667 27.050667 0 57.216 21.632 57.216 53.930667v167.168z m217.258667 129.28c0 32.298667-24.96 53.930667-57.216 53.930667-32.298667 0-53.930667-21.632-53.930667-53.930667V324.736c0-26.88 21.461333-53.930667 53.930667-53.930667 26.88 0 57.216 21.461333 57.216 53.930667v430.976z m215.466667 107.690667c0 32.256-21.461333 53.930667-53.930667 53.930666-32.298667 0-53.930667-21.461333-53.930667-53.930666V217.088c0-27.050667 21.632-53.930667 53.930667-53.930667 27.050667 0 53.930667 21.461333 53.930667 53.930667v646.314667z m218.965333-107.690667c0 32.298667-21.632 53.930667-53.930667 53.930667-32.256 0-53.930667-21.632-53.930666-53.930667V324.736c0-26.88 21.632-53.930667 53.930666-53.930667 26.88 0 53.930667 21.461333 53.930667 53.930667v430.976z m215.338667-129.28c0 27.050667-21.461333 48.512-53.930667 48.512-32.298667 0-53.930667-21.632-53.930667-53.930667v-161.749333c0-26.88 21.632-53.930667 53.930667-53.930667 27.050667 0 53.930667 21.632 53.930667 53.930667v167.168z"/>
          </svg>
        </div>
        <div class="app-title">丸子配音</div>
      </div>
    </div>
    
    <div class="header-right">
      <Tooltip text="用户中心" position="bottom">
        <button class="icon-btn avatar-btn">
          <Icon name="avatar" size={32} color="#515151" />
        </button>
      </Tooltip>
      <Tooltip text="教程" position="bottom">
        <button class="tutorial-btn active">
          <Icon name="tutorial" size={20} color="#9ca3af" />
          <span class="tutorial-text">教程</span>
        </button>
      </Tooltip>
      <Tooltip text="通知" position="bottom">
        <button class="icon-btn">
          <Icon name="bell" size={20} color="#9ca3af" />
        </button>
      </Tooltip>
      <div class="divider"></div>
      <Tooltip text="最小化" position="bottom">
        <button class="window-btn minimize-btn" on:click={handleMinimize}>
          <Icon name="minimize" size={20} color="#9ca3af" />
        </button>
      </Tooltip>
      <Tooltip text="最大化" position="bottom">
        <button class="window-btn maximize-btn" on:click={handleMaximize}>
          <Icon name={isMaximized ? "restore" : "maximize"} size={20} color="#9ca3af" />
        </button>
      </Tooltip>
      <Tooltip text="关闭" position="bottom">
        <button class="window-btn close-btn" on:click={handleClose}>
          <Icon name="close" size={20} color="#9ca3af" />
        </button>
      </Tooltip>
    </div>
  </div>
  
  <!-- 主内容区域 -->
  <div class="main-container">
    <!-- 左侧菜单栏 -->
    <div class="sidebar" class:mobile={isMobile} class:collapsed={sidebarCollapsed && isTablet}>
      <div class="main-menu">
        <Tooltip text="返回首页" position={isMobile ? "top" : "right"} delay={100}>
          <div 
            class="menu-item" 
            class:active={activeMenu === 'home'} 
            role="button"
            tabindex="0"
            on:click={() => handleMenuClick('home')}
            on:keydown={(e) => e.key === 'Enter' && handleMenuClick('home')}
          >
            <div class="menu-icon">
              <Icon name="home" size={20} color={activeMenu === 'home' ? '#ffffff' : '#9ca3af'} />
            </div>
            <div class="menu-text">首页</div>
          </div>
        </Tooltip>
        <Tooltip text="通用配音" position={isMobile ? "top" : "right"} delay={100}>
          <div 
            class="menu-item" 
            class:active={activeMenu === 'dubbing'} 
            role="button"
            tabindex="0"
            on:click={() => handleMenuClick('dubbing')}
            on:keydown={(e) => e.key === 'Enter' && handleMenuClick('dubbing')}
          >
            <div class="menu-icon">
              <Icon name="dubbing" size={20} color={activeMenu === 'dubbing' ? '#ffffff' : '#9ca3af'} />
            </div>
            <div class="menu-text">配音</div>
          </div>
        </Tooltip>
        <Tooltip text="多角色配音" position={isMobile ? "top" : "right"} delay={100}>
          <div 
            class="menu-item" 
            class:active={activeMenu === 'project'} 
            role="button"
            tabindex="0"
            on:click={() => handleMenuClick('project')}
            on:keydown={(e) => e.key === 'Enter' && handleMenuClick('project')}
          >
            <div class="menu-icon">
              <Icon name="project" size={20} color={activeMenu === 'project' ? '#ffffff' : '#9ca3af'} />
            </div>
            <div class="menu-text">角色</div>
          </div>
        </Tooltip>
        <Tooltip text="有声主播录音平台" position={isMobile ? "top" : "right"} delay={100}>
          <div 
            class="menu-item" 
            class:active={activeMenu === 'video'} 
            role="button"
            tabindex="0"
            on:click={() => handleMenuClick('video')}
            on:keydown={(e) => e.key === 'Enter' && handleMenuClick('video')}
          >
            <div class="menu-icon">
              <Icon name="video" size={20} color={activeMenu === 'video' ? '#ffffff' : '#9ca3af'} />
            </div>
            <div class="menu-text">声播</div>
          </div>
        </Tooltip>
        <Tooltip text="本地样音库" position={isMobile ? "top" : "right"} delay={100}>
          <div 
            class="menu-item" 
            class:active={activeMenu === 'resource'} 
            role="button"
            tabindex="0"
            on:click={() => handleMenuClick('resource')}
            on:keydown={(e) => e.key === 'Enter' && handleMenuClick('resource')}
          >
            <div class="menu-icon">
              <Icon name="resource" size={20} color={activeMenu === 'resource' ? '#ffffff' : '#9ca3af'} />
            </div>
            <div class="menu-text">音库</div>
          </div>
        </Tooltip>
        <Tooltip text="字幕生成/编辑" position={isMobile ? "top" : "right"} delay={100}>
          <div 
            class="menu-item" 
            class:active={activeMenu === 'copywriting'} 
            role="button"
            tabindex="0"
            on:click={() => handleMenuClick('copywriting')}
            on:keydown={(e) => e.key === 'Enter' && handleMenuClick('copywriting')}
          >
            <div class="menu-icon">
              <Icon name="copywriting" size={20} color={activeMenu === 'copywriting' ? '#ffffff' : '#9ca3af'} />
            </div>
            <div class="menu-text">字幕</div>
          </div>
        </Tooltip>
        <Tooltip text="生成文件管理" position={isMobile ? "top" : "right"} delay={100}>
          <div 
            class="menu-item" 
            class:active={activeMenu === 'cover'} 
            role="button"
            tabindex="0"
            on:click={() => handleMenuClick('cover')}
            on:keydown={(e) => e.key === 'Enter' && handleMenuClick('cover')}
          >
            <div class="menu-icon">
              <Icon name="cover" size={20} color={activeMenu === 'cover' ? '#ffffff' : '#9ca3af'} />
            </div>
            <div class="menu-text">文件</div>
          </div>
        </Tooltip>
      </div>
      
      <div class="bottom-menu">
        <Tooltip text="软件设置" position={isMobile ? "top" : "right"} delay={100}>
          <div 
            class="menu-item" 
            class:active={activeMenu === 'setting'} 
            role="button"
            tabindex="0"
            on:click={() => handleMenuClick('setting')}
            on:keydown={(e) => e.key === 'Enter' && handleMenuClick('setting')}
          >
            <div class="menu-icon">
              <Icon name="setting" size={20} color={activeMenu === 'setting' ? '#ffffff' : '#9ca3af'} />
            </div>
            <div class="menu-text">设置</div>
          </div>
        </Tooltip>
        <Tooltip text="关于我们" position={isMobile ? "top" : "right"} delay={100}>
          <div 
            class="menu-item" 
            class:active={activeMenu === 'about'} 
            role="button"
            tabindex="0"
            on:click={() => handleMenuClick('about')}
            on:keydown={(e) => e.key === 'Enter' && handleMenuClick('about')}
          >
            <div class="menu-icon">
              <Icon name="about" size={20} color={activeMenu === 'about' ? '#ffffff' : '#9ca3af'} />
            </div>
            <div class="menu-text">关于</div>
          </div>
        </Tooltip>
      </div>
    </div>
    
    <!-- 右侧内容区域 -->
    <div class="content">
      <div class="content-body">
        <div class="coming-soon-container">
          <p class="content-subtitle">功能开发中，敬请期待......</p>
        </div>
      </div>
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
  
  .header {
    height: 55px;
    min-height: 55px;
    background-color: var(--color-bg-base);
    border-bottom: 1px solid var(--color-border-secondary);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--spacing-lg);
    flex-shrink: 0;
    -webkit-app-region: drag;
    position: relative;
    z-index: 100;
  }
  
  @media (max-width: 768px) {
    .header {
      padding: 0 var(--spacing-md);
      height: 50px;
      min-height: 50px;
    }
  }
  
  .header-left {
    display: flex;
    align-items: center;
  }
  
  .logo-section {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .logo-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    flex-shrink: 0;
  }
  
  .logo-icon svg path {
    fill: var(--color-text);
  }
  
  .app-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-text);
    letter-spacing: 0.3px;
  }
  
  @media (max-width: 768px) {
    .app-title {
      font-size: var(--font-size);
    }
  }
  
  @media (max-width: 480px) {
    .tutorial-text {
      display: none;
    }
  }
  
  .header-right {
    display: flex;
    align-items: center;
    -webkit-app-region: no-drag;
  }
  
  .header-right > :global(.tooltip-wrapper) {
    margin-top: 0 !important;
    margin-right: 0 !important;
    margin-bottom: 0 !important;
    margin-left: 0 !important;
    display: flex !important;
    align-items: center;
    flex-shrink: 0;
  }
  
  /* 使用 margin 确保所有相邻元素之间的间距（8px） */
  .header-right > :global(.tooltip-wrapper) + :global(.tooltip-wrapper) {
    margin-left: var(--spacing-sm) !important;
  }
  
  /* 处理 tooltip-wrapper 后面紧跟 divider 的情况 */
  :global(.header-right > .tooltip-wrapper + .divider) {
    margin-left: var(--spacing-sm) !important;
  }
  
  /* 处理 divider 后面紧跟 tooltip-wrapper 的情况 */
  :global(.header-right > .divider + .tooltip-wrapper) {
    margin-left: var(--spacing-sm) !important;
  }
  
  .avatar-btn {
    transform: translateX(-5px);
    width: auto;
    height: auto;
    padding: 0;
  }
  
  .tutorial-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 var(--spacing-md);
    background: transparent;
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all var(--transition-duration) var(--transition-timing);
    -webkit-app-region: no-drag;
    flex-shrink: 0;
  }

  .tutorial-btn:hover {
    background-color: var(--color-bg-spotlight);
  }

  .tutorial-btn.active {
    background-color: var(--color-bg-spotlight);
  }

  .tutorial-btn.active .tutorial-text {
    color: var(--color-text-secondary);
  }

  .tutorial-btn.active :global(svg path) {
    fill: var(--color-text-secondary);
  }

  .tutorial-text {
    font-size: var(--font-size);
    color: var(--color-text-secondary);
    font-weight: 400;
    line-height: 1;
  }
  
  .icon-btn {
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-duration) var(--transition-timing);
    -webkit-app-region: no-drag;
    flex-shrink: 0;
  }

  .icon-btn:hover {
    background-color: var(--color-bg-spotlight);
  }

  .icon-btn:hover :global(svg path) {
    fill: var(--color-text);
  }

  .divider {
    width: 1px;
    height: 20px;
    background-color: var(--color-border);
    margin: 0 var(--spacing-xs);
    flex-shrink: 0;
  }
  
  .window-btn {
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius);
    transition: all var(--transition-duration) var(--transition-timing);
    -webkit-app-region: no-drag;
    flex-shrink: 0;
  }

  .window-btn:hover {
    background-color: var(--color-bg-spotlight);
  }

  .window-btn:hover :global(svg path) {
    fill: var(--color-text);
  }

  .close-btn:hover {
    background-color: var(--color-error);
  }

  .close-btn:hover :global(svg path) {
    fill: #ffffff;
  }
  
  .main-container {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
  }
  
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
  
  .sidebar.mobile .main-menu .menu-item {
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
  
  .sidebar.mobile .bottom-menu .menu-item {
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
  
  .menu-item {
    width: 52px;
    height: 52px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all var(--transition-duration) var(--transition-timing);
    position: relative;
    -webkit-app-region: no-drag;
    gap: var(--spacing-xs);
    margin: 0 auto;
  }
  
  .sidebar.mobile .menu-item {
    width: 100%;
    height: 60px;
    border-radius: 0;
    margin: 0;
  }
  
  @media (max-width: 768px) {
    .menu-item {
      width: 100%;
      height: 60px;
    }
  }

  .menu-item:hover {
    background-color: var(--color-bg-spotlight);
  }

  .menu-item.active {
    background-color: #2D2F38;
  }

  .menu-item.active::before {
    content: '';
    position: absolute;
    left: -16px;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 32px;
    background-color: #2D2F38;
    border-radius: 0 var(--border-radius-sm) var(--border-radius-sm) 0;
  }
  
  .sidebar.mobile .menu-item.active::before {
    display: none;
  }
  
  .sidebar.mobile .menu-item.active {
    border-top: 2px solid #2D2F38;
  }
  
  @media (max-width: 768px) {
    .menu-item.active::before {
      display: none;
    }
    
    .menu-item.active {
      border-top: 2px solid #2D2F38;
    }
  }
  
  .menu-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 24px;
    height: 24px;
  }
  
  /* 强制统一左侧菜单图标的视觉大小并确保垂直居中 */
  .menu-icon :global(svg) {
    width: 20px !important;
    height: 20px !important;
    min-width: 20px !important;
    min-height: 20px !important;
    max-width: 20px !important;
    max-height: 20px !important;
    flex-shrink: 0;
    display: block;
    margin: 0 auto;
  }
  
  .menu-text {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    font-weight: 400;
    text-align: center;
    line-height: 1.2;
    letter-spacing: 0.5px;
  }
  
  .menu-item.active .menu-text {
    color: #ffffff;
  }
  
  @media (max-width: 480px) {
    .menu-text {
      font-size: 10px;
    }
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
  
  .content {
    flex: 1;
    background-color: #1A1A1A;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .content-body {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
  }
  
  .coming-soon-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-lg);
  }
  
  .content-subtitle {
    font-size: 24px;
    color: var(--color-text-secondary);
    margin: 0;
    letter-spacing: 0.5px;
    font-weight: 400;
  }
  
  @media (max-width: 768px) {
    .content {
      padding-bottom: 120px; /* 为底部导航留出空间（主菜单+底部菜单） */
    }
    
    .content-body {
      padding: var(--spacing-lg);
    }
    
    .content-subtitle {
      font-size: 18px;
    }
  }
  
  /* 响应式调整 */
  @media (max-width: 1024px) {
    .header-right {
      gap: var(--spacing-xs);
    }
    
    .icon-btn,
    .window-btn {
      width: 32px;
      height: 32px;
    }
    
    .tutorial-btn {
      height: 28px;
    }
  }
  
  @media (max-width: 480px) {
    .logo-icon {
      width: 28px;
      height: 28px;
    }
    
    .header-right {
      gap: 4px;
    }
  }
</style>
