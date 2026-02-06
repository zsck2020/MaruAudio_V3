<template>
  <div>
    <!-- 统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon primary">
          <el-icon><User /></el-icon>
        </div>
        <div class="stat-info">
          <h3>{{ stats.totalUsers || 0 }}</h3>
          <p>总用户数</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success">
          <el-icon><UserFilled /></el-icon>
        </div>
        <div class="stat-info">
          <h3>{{ stats.vipUsers || 0 }}</h3>
          <p>会员用户</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning">
          <el-icon><Ticket /></el-icon>
        </div>
        <div class="stat-info">
          <h3>{{ stats.unusedCards || 0 }}</h3>
          <p>未使用卡密</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon danger">
          <el-icon><Calendar /></el-icon>
        </div>
        <div class="stat-info">
          <h3>{{ stats.todayLogins || 0 }}</h3>
          <p>今日登录</p>
        </div>
      </div>
    </div>
    
    <!-- 销售额统计 -->
    <div class="stat-cards" style="margin-top: 20px;">
      <div class="stat-card">
        <div class="stat-icon" style="background: #667eea;">
          <el-icon><Money /></el-icon>
        </div>
        <div class="stat-info">
          <h3 style="color: #667eea;">¥{{ salesStats.today.toFixed(2) }}</h3>
          <p>今日销售额</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #f5576c;">
          <el-icon><TrendCharts /></el-icon>
        </div>
        <div class="stat-info">
          <h3 style="color: #f5576c;">¥{{ salesStats.month.toFixed(2) }}</h3>
          <p>本月销售额</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #4facfe;">
          <el-icon><Coin /></el-icon>
        </div>
        <div class="stat-info">
          <h3 style="color: #4facfe;">¥{{ salesStats.total.toFixed(2) }}</h3>
          <p>累计销售额</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #43e97b;">
          <el-icon><Goods /></el-icon>
        </div>
        <div class="stat-info">
          <h3 style="color: #43e97b;">{{ salesStats.usedCards }}</h3>
          <p>已售卡密</p>
        </div>
      </div>
    </div>
    
    <!-- 最近用户 -->
    <div class="table-card" style="margin-top: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h4 style="margin: 0; font-size: 16px; font-weight: 600;">最近注册用户</h4>
        <el-button type="primary" size="small" @click="$router.push('/users')">查看全部</el-button>
      </div>
      <el-table :data="recentUsers" stripe table-layout="fixed">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
        <el-table-column prop="user_group" label="用户组" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getGroupType(row.user_group)" size="small">{{ getGroupName(row.user_group) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="register_time" label="注册时间" width="165" />
        <el-table-column prop="status" label="状态" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.status === 'active' ? '正常' : '封禁' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { getStats, getUsers } from '../api'
import { useProductStore } from '../stores/product'
import logger from '../utils/logger'

const productStore = useProductStore()

// 监听全局产品切换
watch(() => productStore.currentProduct, () => {
  loadData()
})

const stats = ref({
  totalUsers: 0,
  vipUsers: 0,
  unusedCards: 0,
  todayLogins: 0,
  todayNewUsers: 0,
  totalCommission: 0,
  pendingWithdrawals: 0,
  pendingWithdrawalsAmount: 0,
  monthlyUsedCards: 0
})

const salesStats = ref({
  today: 0,
  month: 0,
  total: 0,
  usedCards: 0
})

const recentUsers = ref([])

const getGroupType = (group) => {
  const types = {
    free: 'info',
    trial: 'warning',
    monthly: '',
    yearly: 'warning',
    permanent: 'success'
  }
  return types[group] || 'info'
}

const getGroupName = (group) => {
  const names = {
    free: '免费用户',
    trial: '试用会员',
    monthly: '月卡会员',
    yearly: '年卡会员',
    permanent: '永久会员'
  }
  return names[group] || group
}

const loadData = async () => {
  try {
    const res = await getStats()
    if (res.data) {
      stats.value = {
        totalUsers: res.data.totalUsers || 0,
        vipUsers: res.data.vipUsers || 0,
        unusedCards: res.data.unusedCards || 0,
        todayLogins: res.data.todayLogins || 0
      }
      salesStats.value = {
        today: res.data.todaySales || 0,
        month: res.data.monthSales || 0,
        total: res.data.totalSales || 0,
        usedCards: res.data.monthlyUsedCards || 0
      }
    }
  } catch (e) {
    logger.error('加载统计数据失败', e)
  }
  
  try {
    const res = await getUsers({ page: 1, page_size: 5 })
    if (res.data && res.data.list) {
      recentUsers.value = res.data.list
    }
  } catch (e) {
    logger.error('加载用户列表失败', e)
  }
}

onMounted(() => {
  loadData()
})
</script>


