import { browser } from '$app/environment';

let isTauri = $state(false);
let isMobile = $state(false);
let isTablet = $state(false);

function checkScreenSize() {
  if (!browser) return;
  const width = window.innerWidth;
  isMobile = width < 768;
  isTablet = width >= 768 && width < 1024;
}

function init() {
  if (!browser) return;
  isTauri = !!window.__TAURI__;
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
}

export const env = {
  get isTauri() { return isTauri; },
  get isMobile() { return isMobile; },
  get isTablet() { return isTablet; },
  get isWeb() { return !isTauri; },
  init,
};
