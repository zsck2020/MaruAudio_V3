/**
 * 轻量消息提示（与 `Message.svelte` 组件配套使用）。
 *
 * - 本文件负责派发浏览器事件
 * - `Message.svelte` 负责监听事件并渲染 UI
 */

let seq = 0;

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.dispatchEvent === 'function';
}

function normalizeType(type) {
  const t = String(type || '').toLowerCase();
  if (t === 'success' || t === 'error' || t === 'warning' || t === 'info') return t;
  return 'info';
}

export function showMessage(message, type = 'info', duration = 3000) {
  if (!isBrowser()) return;

  const id = `${Date.now()}_${++seq}`;
  const detail = {
    id,
    type: normalizeType(type),
    message: String(message ?? '')
  };

  window.dispatchEvent(new CustomEvent('show-message', { detail }));

  if (duration && duration > 0) {
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('hide-message', { detail: { id } }));
    }, duration);
  }
}

const Message = {
  success(msg, duration) {
    showMessage(msg, 'success', duration);
  },
  error(msg, duration) {
    showMessage(msg, 'error', duration);
  },
  warning(msg, duration) {
    showMessage(msg, 'warning', duration);
  },
  info(msg, duration) {
    showMessage(msg, 'info', duration);
  }
};

export default Message;



 * 轻量消息提示（与 `Message.svelte` 组件配套使用）。
 *
 * - 本文件负责派发浏览器事件
 * - `Message.svelte` 负责监听事件并渲染 UI
 */

let seq = 0;

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.dispatchEvent === 'function';
}

function normalizeType(type) {
  const t = String(type || '').toLowerCase();
  if (t === 'success' || t === 'error' || t === 'warning' || t === 'info') return t;
  return 'info';
}

export function showMessage(message, type = 'info', duration = 3000) {
  if (!isBrowser()) return;

  const id = `${Date.now()}_${++seq}`;
  const detail = {
    id,
    type: normalizeType(type),
    message: String(message ?? '')
  };

  window.dispatchEvent(new CustomEvent('show-message', { detail }));

  if (duration && duration > 0) {
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('hide-message', { detail: { id } }));
    }, duration);
  }
}

const Message = {
  success(msg, duration) {
    showMessage(msg, 'success', duration);
  },
  error(msg, duration) {
    showMessage(msg, 'error', duration);
  },
  warning(msg, duration) {
    showMessage(msg, 'warning', duration);
  },
  info(msg, duration) {
    showMessage(msg, 'info', duration);
  }
};

export default Message;


