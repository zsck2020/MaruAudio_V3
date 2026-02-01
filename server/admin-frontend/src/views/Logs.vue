<template>
  <div>
    <div class="page-header">
      <h3 class="page-title">操作日志</h3>
    </div>
    
    <div class="table-card">
      <el-table :data="logs" stripe v-loading="loading" table-layout="fixed">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="admin_username" label="操作人" width="100" />
        <el-table-column prop="action" label="操作" width="120" />
        <el-table-column prop="target_type" label="目标类型" width="100">
          <template #default="{ row }">
            {{ getTargetTypeName(row.target_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="target_id" label="目标ID" width="80">
          <template #default="{ row }">
            {{ row.target_id || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="details" label="详情" min-width="300">
          <template #default="{ row }">
            <div class="details-content">{{ formatDetails(row.details) }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP地址" width="130" />
        <el-table-column prop="created_at" label="时间" width="165" />
      </el-table>
      
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 20px; justify-content: flex-end;"
        @size-change="loadLogs"
        @current-change="loadLogs"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getOperationLogs } from '../api'

const loading = ref(false)
const logs = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const getTargetTypeName = (type) => {
  const names = {
    user: '用户',
    card: '卡密',
    announcement: '公告',
    setting: '设置',
    withdrawal: '提现'
  }
  return names[type] || type || '-'
}

const formatDetails = (details) => {
  if (!details) return '-'
  try {
    const obj = typeof details === 'string' ? JSON.parse(details) : details
    const keyNames = {
      count: '数量',
      card_type: '卡密类型',
      product_code: '产品',
      batch_id: '批次号',
      title: '标题',
      keys: '设置项',
      action: '操作',
      amount: '金额',
      reason: '原因',
      user_group: '用户组',
      expire_time: '到期时间',
      status: '状态',
      email: '邮箱'
    }
    const typeNames = {
      monthly: '月卡',
      yearly: '年卡',
      permanent: '永久',
      dubbing: '丸子配音',
      comic: '丸子漫剧',
      approve: '通过',
      reject: '拒绝'
    }
    return Object.entries(obj).map(([k, v]) => {
      const keyName = keyNames[k] || k
      const valueName = typeNames[v] || v
      return `${keyName}: ${valueName}`
    }).join(' | ')
  } catch {
    return details
  }
}

const loadLogs = async () => {
  loading.value = true
  try {
    const res = await getOperationLogs({
      page: page.value,
      page_size: pageSize.value
    })
    logs.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (e) {
    console.error('加载日志失败', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.details-content {
  white-space: normal;
  word-break: break-all;
  line-height: 1.5;
  color: #606266;
}
</style>
