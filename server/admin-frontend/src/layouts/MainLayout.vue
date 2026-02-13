<template>
  <div class="layout-container" :class="{ 'mobile-menu-open': mobileMenuOpen }">
    <!-- 移动端遮罩 -->
    <div class="mobile-overlay" v-if="mobileMenuOpen" @click="mobileMenuOpen = false"></div>
    
    <!-- 侧边栏 -->
    <aside class="layout-aside" :class="{ 'mobile-visible': mobileMenuOpen }">
      <div class="sidebar-logo">
        <div class="sidebar-logo-icon">丸</div>
        <h2>丸子智能</h2>
      </div>
      <div class="sidebar-menu-wrapper">
      <el-menu
        :default-active="$route.path"
        background-color="#001529"
        text-color="rgba(255,255,255,0.65)"
        active-text-color="#ffffff"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>控制台</span>
        </el-menu-item>
        
        <el-menu-item-group title="用户管理">
          <el-menu-item index="/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
        </el-menu-item-group>
        
        <el-menu-item-group title="商品与销售">
          <el-menu-item index="/cards">
            <el-icon><Ticket /></el-icon>
            <span>卡密管理</span>
          </el-menu-item>
          <el-menu-item index="/character-packs">
            <el-icon><Coin /></el-icon>
            <span>字符包管理</span>
          </el-menu-item>
        </el-menu-item-group>
        
        <el-menu-item-group title="营销推广">
          <el-menu-item index="/marketing">
            <el-icon><Promotion /></el-icon>
            <span>营销活动</span>
          </el-menu-item>
          <el-menu-item index="/commission">
            <el-icon><Wallet /></el-icon>
            <span>分佣提现</span>
          </el-menu-item>
        </el-menu-item-group>
        
        <el-menu-item-group title="内容运营">
          <el-menu-item index="/banner-manage">
            <el-icon><Picture /></el-icon>
            <span>Banner 管理</span>
          </el-menu-item>
          <el-menu-item index="/announcements">
            <el-icon><Bell /></el-icon>
            <span>公告管理</span>
          </el-menu-item>
        </el-menu-item-group>
        
        <el-menu-item-group title="系统管理">
          <el-menu-item index="/software">
            <el-icon><Monitor /></el-icon>
            <span>软件配置</span>
          </el-menu-item>
          <el-menu-item index="/settings">
            <el-icon><Setting /></el-icon>
            <span>邮箱与账号</span>
          </el-menu-item>
          <el-menu-item index="/logs">
            <el-icon><Document /></el-icon>
            <span>操作日志</span>
          </el-menu-item>
        </el-menu-item-group>
      </el-menu>
      </div>
      <div class="sidebar-footer">
        <span>© 2025 丸子智能</span>
      </div>
    </aside>
    
    <!-- 主内容区 -->
    <div class="layout-main">
      <!-- 顶部栏 -->
      <header class="layout-header">
        <div class="header-left">
          <el-button class="mobile-menu-btn" text @click="mobileMenuOpen = !mobileMenuOpen">
            <el-icon :size="22"><Menu /></el-icon>
          </el-button>
          <span style="font-size: 16px; color: #333;">{{ $route.meta.title }}</span>
        </div>
        <div class="header-right">
          <!-- 全局产品切换 -->
          <el-select 
            v-model="productStore.currentProduct" 
            class="product-selector"
            @change="productStore.setProduct"
          >
            <el-option label="丸子配音" value="dubbing">
              <div style="display: flex; align-items: center; gap: 8px;">
                <el-icon style="color: #1890ff;"><Microphone /></el-icon>
                <span>丸子配音</span>
              </div>
            </el-option>
            <el-option label="丸子漫剧" value="comic">
              <div style="display: flex; align-items: center; gap: 8px;">
                <el-icon style="color: #722ed1;"><Reading /></el-icon>
                <span>丸子漫剧</span>
              </div>
            </el-option>
          </el-select>
          
          <el-dropdown @command="handleCommand">
            <div class="user-dropdown">
              <el-avatar :size="32">
                {{ adminInfo?.username?.charAt(0)?.toUpperCase() }}
              </el-avatar>
              <span class="username">{{ adminInfo?.username }}</span>
              <el-icon style="color: #999;"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><Setting /></el-icon> 个人设置
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>
      
      <!-- 内容区 -->
      <main class="layout-content">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useProductStore } from '../stores/product'

const router = useRouter()
const route = useRoute()
const productStore = useProductStore()
const mobileMenuOpen = ref(false)

// 路由变化时关闭移动端菜单
watch(() => route.path, () => {
  mobileMenuOpen.value = false
})

onMounted(() => {
  productStore.initProduct()
})

const adminInfo = computed(() => {
  const info = localStorage.getItem('admin_info')
  return info ? JSON.parse(info) : {}
})

const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_info')
      router.push('/login')
    }).catch(() => {})
  } else if (command === 'profile') {
    router.push('/settings')
  }
}
</script>
