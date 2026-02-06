<template>
  <div>
    <div class="page-header">
      <h3 class="page-title">分佣提现</h3>
      <el-radio-group v-model="withdrawFilter" size="small" @change="loadWithdrawRequests">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button label="pending">待处理</el-radio-button>
        <el-radio-button label="completed">已完成</el-radio-button>
        <el-radio-button label="rejected">已拒绝</el-radio-button>
      </el-radio-group>
    </div>
    
    <!-- 统计卡片 -->
    <div class="stat-cards" style="margin-bottom: 20px;">
      <div class="stat-card">
        <div class="stat-icon warning">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-info">
          <h3>{{ stats.pendingCount }}</h3>
          <p>待处理申请</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon primary">
          <el-icon><Money /></el-icon>
        </div>
        <div class="stat-info">
          <h3>¥{{ stats.pendingAmount }}</h3>
          <p>待处理金额</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <h3>{{ stats.completedCount }}</h3>
          <p>已完成申请</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon danger">
          <el-icon><Wallet /></el-icon>
        </div>
        <div class="stat-info">
          <h3>¥{{ stats.totalPaid }}</h3>
          <p>累计已付</p>
        </div>
      </div>
    </div>
    
    <div class="table-card">
      <el-table :data="withdrawRequests" stripe v-loading="loading" table-layout="fixed">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="user_email" label="用户" min-width="160" show-overflow-tooltip />
        <el-table-column prop="total_commission" label="累计佣金" width="100" align="center">
          <template #default="{ row }">
            <span style="color: #1890ff;">¥{{ row.total_commission }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="提现金额" width="100" align="center">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: 600;">¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="payment_method" label="方式" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.payment_method === 'wechat' ? 'success' : 'primary'" size="small">
              {{ row.payment_method === 'wechat' ? '微信' : '支付宝' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="real_name" label="姓名" width="100" />
        <el-table-column prop="created_at" label="申请时间" width="165" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
            <el-button v-if="row.status === 'pending'" type="success" link size="small" @click="processWithdraw(row)">处理</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 20px; justify-content: flex-end;"
        @size-change="loadWithdrawRequests"
        @current-change="loadWithdrawRequests"
      />
    </div>
    
    <!-- 处理对话框 -->
    <el-dialog v-model="processDialogVisible" title="处理提现申请" width="600px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="用户">{{ currentRequest.user_email }}</el-descriptions-item>
            <el-descriptions-item label="提现金额">
              <span style="color: #f56c6c; font-weight: 600; font-size: 18px;">¥{{ currentRequest.amount }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="收款方式">
              <el-tag :type="currentRequest.payment_method === 'wechat' ? 'success' : 'primary'" size="small">
                {{ currentRequest.payment_method === 'wechat' ? '微信' : '支付宝' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="真实姓名">{{ currentRequest.real_name }}</el-descriptions-item>
          </el-descriptions>
        </el-col>
        <el-col :span="12">
          <div style="text-align: center;">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 13px;">用户收款二维码</p>
            <el-image 
              v-if="currentRequest.qrcode_url" 
              :src="currentRequest.qrcode_url" 
              style="width: 180px; height: 180px; border: 1px solid #eee; border-radius: 8px;" 
              fit="contain"
              :preview-src-list="[currentRequest.qrcode_url]"
            />
            <div v-else style="width: 180px; height: 180px; border: 1px dashed #ddd; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #999; margin: 0 auto;">
              用户未上传二维码
            </div>
          </div>
        </el-col>
      </el-row>
      
      <el-divider />
      
      <el-form style="max-width: 400px;" label-width="100px">
        <el-form-item label="处理结果">
          <el-radio-group v-model="processForm.action">
            <el-radio label="approve">扫码打款</el-radio>
            <el-radio label="reject">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="processForm.action === 'approve'" label="转账截图">
          <el-upload
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleScreenshotChange"
            accept="image/*"
          >
            <el-button type="primary" size="small">上传截图</el-button>
          </el-upload>
          <div v-if="processForm.screenshot" style="margin-top: 10px;">
            <el-image :src="processForm.screenshot" style="width: 120px; height: 120px; border-radius: 4px;" fit="contain" />
          </div>
          <p style="margin: 5px 0 0 0; color: #999; font-size: 12px;">请扫描上方二维码付款后，上传转账截图</p>
        </el-form-item>
        <el-form-item v-if="processForm.action === 'reject'" label="拒绝原因">
          <el-input v-model="processForm.reason" type="textarea" :rows="3" placeholder="请输入拒绝原因" style="width: 250px;" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="processDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProcess">确认处理</el-button>
      </template>
    </el-dialog>
    
    <!-- 详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="提现详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="申请ID">{{ currentRequest.id }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentRequest.status)" size="small">
            {{ getStatusName(currentRequest.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="用户邮箱">{{ currentRequest.user_email }}</el-descriptions-item>
        <el-descriptions-item label="累计佣金">¥{{ currentRequest.total_commission }}</el-descriptions-item>
        <el-descriptions-item label="提现金额">
          <span style="color: #f56c6c; font-weight: 600;">¥{{ currentRequest.amount }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="收款方式">
          {{ currentRequest.payment_method === 'wechat' ? '微信' : '支付宝' }}
        </el-descriptions-item>
        <el-descriptions-item label="收款账号" :span="2">{{ currentRequest.account }}</el-descriptions-item>
        <el-descriptions-item label="真实姓名">{{ currentRequest.real_name }}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ currentRequest.created_at }}</el-descriptions-item>
        <el-descriptions-item v-if="currentRequest.processed_at" label="处理时间" :span="2">
          {{ currentRequest.processed_at }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentRequest.reject_reason" label="拒绝原因" :span="2">
          {{ currentRequest.reject_reason }}
        </el-descriptions-item>
      </el-descriptions>
      
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button v-if="currentRequest.status === 'pending'" type="primary" @click="processWithdraw(currentRequest)">处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getWithdrawals, processWithdrawal } from '../api'
import logger from '../utils/logger'

const loading = ref(false)
const withdrawFilter = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const withdrawRequests = ref([])

const stats = ref({
  pendingCount: 0,
  pendingAmount: 0,
  completedCount: 0,
  totalPaid: 0
})

const processDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentRequest = ref({})
const processForm = reactive({
  action: 'approve',
  reason: '',
  screenshot: ''
})

const getStatusType = (status) => {
  const types = { pending: 'warning', completed: 'success', rejected: 'danger' }
  return types[status] || 'info'
}

const getStatusName = (status) => {
  const names = { pending: '待处理', completed: '已完成', rejected: '已拒绝' }
  return names[status] || status
}

const loadWithdrawRequests = async () => {
  loading.value = true
  try {
    const res = await getWithdrawals({
      page: page.value,
      page_size: pageSize.value,
      status: withdrawFilter.value
    })
    withdrawRequests.value = res.data.list || []
    total.value = res.data.total || 0
    if (res.data.stats) {
      stats.value.pendingCount = res.data.stats.pending_count || 0
      stats.value.pendingAmount = res.data.stats.pending_amount || 0
      stats.value.completedCount = res.data.stats.completed_count || 0
      stats.value.totalPaid = res.data.stats.total_paid || 0
    }
  } catch (e) {
    logger.error('加载提现列表失败', e)
  } finally {
    loading.value = false
  }
}

const viewDetail = (row) => {
  currentRequest.value = { ...row }
  detailDialogVisible.value = true
}

const processWithdraw = (row) => {
  currentRequest.value = { ...row }
  processForm.action = 'approve'
  processForm.reason = ''
  processForm.screenshot = ''
  detailDialogVisible.value = false
  processDialogVisible.value = true
}

const handleScreenshotChange = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    processForm.screenshot = e.target.result
  }
  reader.readAsDataURL(file.raw)
}

const submitProcess = async () => {
  if (processForm.action === 'approve') {
    if (!processForm.screenshot) {
      ElMessage.warning('请上传转账截图')
      return
    }
  } else {
    if (!processForm.reason) {
      ElMessage.warning('请输入拒绝原因')
      return
    }
  }
  
  try {
    await processWithdrawal({
      id: currentRequest.value.id,
      action: processForm.action,
      reason: processForm.reason
    })
    ElMessage.success(processForm.action === 'approve' ? '已完成打款' : '已拒绝该申请')
    processDialogVisible.value = false
    loadWithdrawRequests()
  } catch (e) {
    logger.error('处理提现失败', e)
  }
}

onMounted(() => {
  loadWithdrawRequests()
})
</script>

