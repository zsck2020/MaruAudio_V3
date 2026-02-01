import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/voice-clone',
  },
  {
    path: '/voice-clone',
    name: 'VoiceClone',
    component: () => import('@/views/VoiceClone.vue'),
    meta: {
      title: '配音生成',
    },
  },
  {
    path: '/sample-library',
    name: 'SampleLibrary',
    component: () => import('@/views/SampleLibrary.vue'),
    meta: {
      title: '样音库',
    },
  },
  {
    path: '/subtitle',
    name: 'Subtitle',
    component: () => import('@/views/Subtitle.vue'),
    meta: {
      title: '字幕生成',
    },
  },
  {
    path: '/file-manager',
    name: 'FileManager',
    component: () => import('@/views/FileManager.vue'),
    meta: {
      title: '文件管理',
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 丸子配音` : '丸子配音'
  next()
})

export default router

