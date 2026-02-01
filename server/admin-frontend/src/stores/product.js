import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useProductStore = defineStore('product', () => {
  // 当前选中的产品：'dubbing' = 丸子配音, 'comic' = 丸子漫剧
  const currentProduct = ref('dubbing')
  
  const setProduct = (product) => {
    currentProduct.value = product
    // 保存到 localStorage
    localStorage.setItem('current_product', product)
  }
  
  const initProduct = () => {
    const saved = localStorage.getItem('current_product')
    if (saved && (saved === 'dubbing' || saved === 'comic')) {
      currentProduct.value = saved
    } else {
      currentProduct.value = 'dubbing'
    }
  }
  
  const getProductName = () => {
    const names = {
      'dubbing': '丸子配音',
      'comic': '丸子漫剧'
    }
    return names[currentProduct.value] || '丸子配音'
  }
  
  return {
    currentProduct,
    setProduct,
    initProduct,
    getProductName
  }
})
