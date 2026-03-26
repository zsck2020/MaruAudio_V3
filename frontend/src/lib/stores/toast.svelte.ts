export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

let nextId = 0;
let items = $state<ToastItem[]>([]);

function add(message: string, type: ToastType = 'info', duration = 3000) {
  const id = nextId++;
  items = [...items, { id, message, type, duration }];

  if (duration > 0) {
    setTimeout(() => remove(id), duration);
  }
}

function remove(id: number) {
  items = items.filter((t) => t.id !== id);
}

export const toast = {
  get items() { return items; },
  success: (msg: string, duration?: number) => add(msg, 'success', duration),
  error: (msg: string, duration?: number) => add(msg, 'error', duration),
  warning: (msg: string, duration?: number) => add(msg, 'warning', duration),
  info: (msg: string, duration?: number) => add(msg, 'info', duration),
  remove,
};
