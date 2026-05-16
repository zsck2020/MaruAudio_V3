import { browser } from '$app/environment';
import { isTauri as detectTauri } from '@tauri-apps/api/core';

/**
 * 开发期后门：浏览器 URL 加 `?dev_force_tauri=1` 时假装已在 Tauri 环境运行
 * - 仅在 import.meta.env.DEV 为 true 时启用（生产构建会被 Vite 静态消除）
 * - 用于自动化测试与远程 Web 演示场景
 */
function hasDevTauriOverride(): boolean {
  if (typeof window === 'undefined') return false;
  if (!import.meta.env.DEV) return false;
  return new URLSearchParams(window.location.search).has('dev_force_tauri');
}

let isTauri = $state(browser ? (detectTauri() || hasDevTauriOverride()) : false);
let isMobile = $state(false);
let isTablet = $state(false);
let resizeListenerInstalled = false;

function checkScreenSize() {
  if (!browser) return;
  const width = window.innerWidth;
  isMobile = width < 768;
  isTablet = width >= 768 && width < 1024;
}

function init() {
  if (!browser) return () => {};
  isTauri = detectTauri() || hasDevTauriOverride();
  checkScreenSize();

  if (!resizeListenerInstalled) {
    window.addEventListener('resize', checkScreenSize);
    resizeListenerInstalled = true;
  }

  return () => {
    if (!resizeListenerInstalled) return;
    window.removeEventListener('resize', checkScreenSize);
    resizeListenerInstalled = false;
  };
}

export const env = {
  get isTauri() { return isTauri; },
  get isMobile() { return isMobile; },
  get isTablet() { return isTablet; },
  init,
};
