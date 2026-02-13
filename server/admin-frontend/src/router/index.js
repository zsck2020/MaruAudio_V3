import { createRouter, createWebHistory } from 'vue-router'

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
        path: 'software',
        name: 'Software',
        component: () => import('../views/Software.vue'),
        meta: { title: '软件配置' }
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
        path: 'banner-manage',
        name: 'BannerManage',
        component: () => import('../views/BannerManage.vue'),
        meta: { title: 'Banner 管理' }
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

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  
  if (to.path !== '/login' && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
