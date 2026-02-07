import { writable } from 'svelte/store';

// 当前选中的产品：'dubbing' = 丸子配音, 'comic' = 丸子漫剧
export const currentProduct = writable('dubbing');

// 产品名称映射
const productNames = {
  'dubbing': '丸子配音',
  'comic': '丸子漫剧'
};

/**
 * 设置当前产品
 */
export function setProduct(product) {
  if (product === 'dubbing' || product === 'comic') {
    currentProduct.set(product);
    // 保存到 localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('current_product', product);
    }
  }
}

/**
 * 初始化产品（从 localStorage 读取）
 */
export function initProduct() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('current_product');
    if (saved && (saved === 'dubbing' || saved === 'comic')) {
      currentProduct.set(saved);
    } else {
      currentProduct.set('dubbing');
    }
  }
}

/**
 * 获取产品名称
 */
export function getProductName(product) {
  return productNames[product] || '丸子配音';
}
