import { createRouter, createWebHistory } from 'vue-router'
import api from '../api'
import logger from '../utils/logger'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '控制台' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('../views/Users.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'cards',
        name: 'Cards',
        component: () => import('../views/Cards.vue'),
        meta: { title: '卡密管理' }
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('../views/Products.vue'),
        meta: { title: '产品列表' }
      },
      {
        path: 'software',
        name: 'Software',
        component: () => import('../views/Software.vue'),
        meta: { title: '软件管理' }
      },
      {
        path: 'marketing',
        name: 'Marketing',
        component: () => import('../views/Marketing.vue'),
        meta: { title: '营销活动' }
      },
      {
        path: 'commission',
        name: 'Commission',
        component: () => import('../views/Commission.vue'),
        meta: { title: '分佣提现' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('../views/Settings.vue'),
        meta: { title: '系统设置' }
      },
      {
        path: 'announcements',
        name: 'Announcements',
        component: () => import('../views/Announcements.vue'),
        meta: { title: '公告管理' }
      },
      {
        path: 'logs',
        name: 'Logs',
        component: () => import('../views/Logs.vue'),
        meta: { title: '操作日志' }
      },
      {
        path: 'character-packs',
        name: 'CharacterPacks',
        component: () => import('../views/CharacterPacks.vue'),
        meta: { title: '字符包管理' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes
})

// Token验证缓存（避免频繁验证）
let tokenValidationCache = {
  isValid: false,
  timestamp: 0,
  cacheDuration: 5 * 60 * 1000 // 5分钟缓存
}

/**
 * 验证token有效性
 */
async function validateToken(token) {
  // 检查缓存
  const now = Date.now()
  if (tokenValidationCache.isValid && (now - tokenValidationCache.timestamp) < tokenValidationCache.cacheDuration) {
    return true
  }
  
  try {
    // 使用轻量级API验证token
    const response = await api.get('/admin/stats', {
      validateStatus: (status) => status < 500 // 只处理服务器错误，401/403由拦截器处理
    })
    
    if (response.status === 200) {
      tokenValidationCache.isValid = true
      tokenValidationCache.timestamp = now
      return true
    }
    return false
  } catch (error) {
    logger.error('Token验证失败:', error)
    return false
  }
}

/**
 * 清除token和缓存
 */
function clearAuth() {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_info')
  tokenValidationCache.isValid = false
  tokenValidationCache.timestamp = 0
}

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('admin_token')
  
  // 如果访问登录页且已有token，验证token有效性
  if (to.path === '/login' && token) {
    const isValid = await validateToken(token)
    if (isValid) {
      next('/dashboard')
      return
    } else {
      clearAuth()
    }
  }
  
  // 需要登录的页面
  if (to.path !== '/login' && !token) {
    next('/login')
    return
  }
  
  if (to.path !== '/login' && token) {
    // 验证token有效性
    const isValid = await validateToken(token)
    if (!isValid) {
      clearAuth()
      next('/login')
      return
    }
  }
  
  next()
})

export default router
