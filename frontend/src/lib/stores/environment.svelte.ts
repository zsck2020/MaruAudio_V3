import { browser } from '$app/environment';
import { isTauri as detectTauri } from '@tauri-apps/api/core';

let isTauri = $state(browser ? detectTauri() : false);
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
  isTauri = detectTauri();
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
