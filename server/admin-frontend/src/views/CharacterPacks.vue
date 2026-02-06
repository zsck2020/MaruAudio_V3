<template>
  <div>
    <div class="page-header">
      <h3 class="page-title">字符包管理</h3>
      <div class="action-buttons">
        <el-button @click="showStatsDialog">
          <el-icon><DataAnalysis /></el-icon>统计数据
        </el-button>
        <el-button type="primary" @click="showGenerateDialog">
          <el-icon><Plus /></el-icon>生成激活码
        </el-button>
      </div>
    </div>
    
    <!-- 统计卡片 -->
    <div class="stats-row" style="margin-bottom: 20px;">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ stats.codes?.total || 0 }}</div>
            <div class="stat-label">激活码总数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value" style="color: #67c23a;">{{ stats.codes?.unused || 0 }}</div>
            <div class="stat-label">未使用</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value" style="color: #409eff;">{{ stats.codes?.used || 0 }}</div>
            <div class="stat-label">已使用</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value" style="color: #e6a23c;">{{ formatCharacters(stats.balance?.total_balance) }}</div>
            <div class="stat-label">用户总余额</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <!-- 套餐设置 -->
      <el-tab-pane label="套餐设置" name="packages">
        <div class="table-card">
          <div style="margin-bottom: 16px;">
            <span style="color: #909399; font-size: 14px;">设置字符包套餐的价格和字符数量，修改后将同步到客户端显示</span>
          </div>
          
          <el-table :data="packages" stripe v-loading="packagesLoading" table-layout="fixed">
            <el-table-column prop="pack_type" label="套餐类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getPackTypeColor(row.pack_type)" size="small">{{ row.name }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="characters" label="字符数" width="150">
              <template #default="{ row }">
                <el-input-number 
                  v-model="row.characters" 
                  :min="1000" 
                  :max="10000000" 
                  :step="10000"
                  size="small"
                  style="width: 130px;"
                />
              </template>
            </el-table-column>
            <el-table-column prop="price" label="售价 (元)" width="120">
              <template #default="{ row }">
                <el-input-number 
                  v-model="row.price" 
                  :min="0" 
                  :max="9999" 
                  :precision="2"
                  size="small"
                  style="width: 100px;"
                />
              </template>
            </el-table-column>
            <el-table-column prop="validity_days" label="有效期 (天)" width="120">
              <template #default="{ row }">
                <el-input-number 
                  v-model="row.validity_days" 
                  :min="1" 
                  :max="3650"
                  size="small"
                  style="width: 100px;"
                />
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="200">
              <template #default="{ row }">
                <el-input v-model="row.description" size="small" placeholder="套餐描述" />
              </template>
            </el-table-column>
          </el-table>
          
          <div style="margin-top: 20px; text-align: right;">
            <el-button type="primary" @click="savePackages" :loading="savingPackages">保存套餐设置</el-button>
          </div>
        </div>
      </el-tab-pane>
      
      <!-- 激活码管理 -->
      <el-tab-pane label="激活码管理" name="codes">
        <div class="table-card">
          <div style="margin-bottom: 16px; display: flex; gap: 10px;">
            <el-select v-model="codeFilter.status" placeholder="状态" style="width: 100px;" clearable @change="loadCodes">
              <el-option label="未使用" value="unused" />
              <el-option label="已使用" value="used" />
              <el-option label="已禁用" value="disabled" />
            </el-select>
            <el-select v-model="codeFilter.pack_type" placeholder="套餐类型" style="width: 120px;" clearable @change="loadCodes">
              <el-option label="基础版" value="basic" />
              <el-option label="标准版" value="standard" />
              <el-option label="专业版" value="professional" />
            </el-select>
            <el-input v-model="codeFilter.code" placeholder="搜索激活码" style="width: 200px;" clearable @keyup.enter="handleCodeSearch">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-button type="primary" @click="handleCodeSearch">搜索</el-button>
          </div>
          
          <el-table :data="codes" stripe v-loading="codesLoading" table-layout="fixed">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="code" label="激活码" width="200">
              <template #default="{ row }">
                <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 12px;">{{ row.code }}</code>
                <el-button type="primary" link size="small" @click="copyCode(row.code)">
                  <el-icon><CopyDocument /></el-icon>
                </el-button>
              </template>
            </el-table-column>
            <el-table-column prop="pack_type" label="套餐" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="getPackTypeColor(row.pack_type)" size="small">{{ getPackTypeName(row.pack_type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="characters" label="字符数" width="100" align="right">
              <template #default="{ row }">{{ formatCharacters(row.characters) }}</template>
            </el-table-column>
            <el-table-column prop="price" label="价格" width="80" align="right">
              <template #default="{ row }">¥{{ row.price }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusColor(row.status)" size="small">{{ getStatusName(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="used_by_email" label="使用者" min-width="150" show-overflow-tooltip>
              <template #default="{ row }">
                <span v-if="row.used_by_email">{{ row.used_by_email }}</span>
                <span v-else style="color: #999;">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="165" />
            <el-table-column label="操作" width="120" fixed="right" align="center">
              <template #default="{ row }">
                <template v-if="row.status !== 'used'">
                  <el-button v-if="row.status === 'unused'" type="warning" link size="small" @click="disableCode(row)">禁用</el-button>
                  <el-button type="danger" link size="small" @click="deleteCode(row)">删除</el-button>
                </template>
                <span v-else style="color: #999;">-</span>
              </template>
            </el-table-column>
          </el-table>
          
          <el-pagination
            v-model:current-page="codePage"
            v-model:page-size="codePageSize"
            :total="codeTotal"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            style="margin-top: 20px; justify-content: flex-end;"
            @size-change="loadCodes"
            @current-change="loadCodes"
          />
        </div>
      </el-tab-pane>
      
      <!-- 用户余额管理 -->
      <el-tab-pane label="用户余额" name="users">
        <div class="table-card">
          <div style="margin-bottom: 16px; display: flex; gap: 10px;">
            <el-input v-model="userFilter.email" placeholder="搜索邮箱" style="width: 200px;" clearable @keyup.enter="loadUsers">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-checkbox v-model="userFilter.has_balance" @change="loadUsers">仅显示有余额</el-checkbox>
          </div>
          
          <el-table :data="users" stripe v-loading="usersLoading" table-layout="fixed">
            <el-table-column prop="user_id" label="用户ID" width="80" />
            <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
            <el-table-column prop="total_characters" label="总充值" width="100" align="right">
              <template #default="{ row }">{{ formatCharacters(row.total_characters) }}</template>
            </el-table-column>
            <el-table-column prop="used_characters" label="已使用" width="100" align="right">
              <template #default="{ row }">{{ formatCharacters(row.used_characters) }}</template>
            </el-table-column>
            <el-table-column prop="balance" label="余额" width="100" align="right">
              <template #default="{ row }">
                <span :style="{ color: row.balance > 0 ? '#67c23a' : '#999' }">{{ formatCharacters(row.balance) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="expire_time" label="到期时间" width="165">
              <template #default="{ row }">
                <span :style="{ color: isExpired(row.expire_time) ? '#f56c6c' : '' }">{{ row.expire_time || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right" align="center">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="showAdjustDialog(row)">调整</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <el-pagination
            v-model:current-page="userPage"
            v-model:page-size="userPageSize"
            :total="userTotal"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            style="margin-top: 20px; justify-content: flex-end;"
            @size-change="loadUsers"
            @current-change="loadUsers"
          />
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <!-- 生成激活码对话框 -->
    <el-dialog v-model="generateDialogVisible" title="生成字符包激活码" width="500px">
      <el-form :model="generateForm" label-width="100px">
        <el-form-item label="套餐类型">
          <el-select v-model="generateForm.pack_type" style="width: 100%;">
            <el-option label="基础版 (10万字符 ¥38)" value="basic" />
            <el-option label="标准版 (50万字符 ¥158)" value="standard" />
            <el-option label="专业版 (100万字符 ¥288)" value="professional" />
          </el-select>
        </el-form-item>
        <el-form-item label="生成数量">
          <el-input-number v-model="generateForm.count" :min="1" :max="100" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="generateForm.remark" placeholder="可选，用于标记批次用途" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="generateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="generateCodes" :loading="generating">生成</el-button>
      </template>
    </el-dialog>
    
    <!-- 生成结果对话框 -->
    <el-dialog v-model="resultDialogVisible" title="生成成功" width="600px">
      <div style="margin-bottom: 16px;">
        <el-tag type="success">批次号: {{ generateResult.batch_id }}</el-tag>
        <el-tag style="margin-left: 8px;">{{ getPackTypeName(generateResult.pack_type) }}</el-tag>
        <el-tag style="margin-left: 8px;">{{ generateResult.count }} 个</el-tag>
      </div>
      <el-input
        type="textarea"
        :model-value="generateResult.codes?.join('\n')"
        :rows="10"
        readonly
        style="font-family: monospace;"
      />
      <template #footer>
        <el-button @click="copyAllCodes">复制全部</el-button>
        <el-button type="primary" @click="resultDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
    
    <!-- 调整余额对话框 -->
    <el-dialog v-model="adjustDialogVisible" title="调整用户余额" width="450px">
      <el-form :model="adjustForm" label-width="80px">
        <el-form-item label="用户">
          <el-input :model-value="adjustForm.email" disabled />
        </el-form-item>
        <el-form-item label="当前余额">
          <el-input :model-value="formatCharacters(adjustForm.current_balance)" disabled />
        </el-form-item>
        <el-form-item label="调整数量">
          <el-input-number v-model="adjustForm.adjustment" :step="1000" style="width: 100%;" />
          <div style="font-size: 12px; color: #909399; margin-top: 4px;">正数增加，负数扣减</div>
        </el-form-item>
        <el-form-item label="调整原因">
          <el-input v-model="adjustForm.reason" placeholder="请输入调整原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="adjustBalance" :loading="adjusting">确认调整</el-button>
      </template>
    </el-dialog>
    
    <!-- 统计数据对话框 -->
    <el-dialog v-model="statsDialogVisible" title="字符包统计数据" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="激活码总数">{{ stats.codes?.total || 0 }}</el-descriptions-item>
        <el-descriptions-item label="未使用">{{ stats.codes?.unused || 0 }}</el-descriptions-item>
        <el-descriptions-item label="已使用">{{ stats.codes?.used || 0 }}</el-descriptions-item>
        <el-descriptions-item label="已禁用">{{ stats.codes?.disabled || 0 }}</el-descriptions-item>
        <el-descriptions-item label="有余额用户数">{{ stats.balance?.total_users || 0 }}</el-descriptions-item>
        <el-descriptions-item label="用户总余额">{{ formatCharacters(stats.balance?.total_balance) }}</el-descriptions-item>
        <el-descriptions-item label="总消耗字符">{{ formatCharacters(stats.balance?.total_used) }}</el-descriptions-item>
        <el-descriptions-item label="总充值字符">{{ formatCharacters(stats.balance?.total_recharged) }}</el-descriptions-item>
        <el-descriptions-item label="今日消耗次数">{{ stats.today?.consume_count || 0 }}</el-descriptions-item>
        <el-descriptions-item label="今日消耗字符">{{ formatCharacters(stats.today?.consume_total) }}</el-descriptions-item>
      </el-descriptions>
      
      <div style="margin-top: 20px;">
        <h4>套餐销售统计</h4>
        <el-table :data="stats.packs || []" stripe size="small">
          <el-table-column prop="pack_type" label="套餐" width="100">
            <template #default="{ row }">{{ getPackTypeName(row.pack_type) }}</template>
          </el-table-column>
          <el-table-column prop="sold" label="已售" width="80" align="right" />
          <el-table-column prop="total_characters" label="总字符" align="right">
            <template #default="{ row }">{{ formatCharacters(row.total_characters) }}</template>
          </el-table-column>
          <el-table-column prop="total_revenue" label="总收入" align="right">
            <template #default="{ row }">¥{{ row.total_revenue }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, CopyDocument, DataAnalysis } from '@element-plus/icons-vue'
import api from '../api'
import logger from '../utils/logger'

// 状态
const activeTab = ref('packages')
const stats = ref({})

// 套餐设置相关
const packages = ref([])
const packagesLoading = ref(false)
const savingPackages = ref(false)

// 激活码相关
const codes = ref([])
const codesLoading = ref(false)
const codePage = ref(1)
const codePageSize = ref(20)
const codeTotal = ref(0)
const codeFilter = ref({
  status: '',
  pack_type: '',
  code: ''
})

// 用户余额相关
const users = ref([])
const usersLoading = ref(false)
const userPage = ref(1)
const userPageSize = ref(20)
const userTotal = ref(0)
const userFilter = ref({
  email: '',
  has_balance: false
})

// 生成激活码
const generateDialogVisible = ref(false)
const generating = ref(false)
const generateForm = ref({
  pack_type: 'basic',
  count: 10,
  remark: ''
})
const resultDialogVisible = ref(false)
const generateResult = ref({})

// 调整余额
const adjustDialogVisible = ref(false)
const adjusting = ref(false)
const adjustForm = ref({
  user_id: 0,
  email: '',
  current_balance: 0,
  adjustment: 0,
  reason: ''
})

// 统计对话框
const statsDialogVisible = ref(false)

// 工具函数
const getPackTypeName = (type) => {
  const names = { basic: '基础版', standard: '标准版', professional: '专业版' }
  return names[type] || type
}

const getPackTypeColor = (type) => {
  const colors = { basic: '', standard: 'warning', professional: 'danger' }
  return colors[type] || ''
}

const getStatusName = (status) => {
  const names = { unused: '未使用', used: '已使用', disabled: '已禁用' }
  return names[status] || status
}

const getStatusColor = (status) => {
  const colors = { unused: 'success', used: 'info', disabled: 'warning' }
  return colors[status] || ''
}

const formatCharacters = (num) => {
  if (!num) return '0'
  if (num >= 10000) return (num / 10000).toFixed(1) + '万'
  if (num >= 1000) return (num / 1000).toFixed(1) + '千'
  return num.toString()
}

const isExpired = (expireTime) => {
  if (!expireTime) return true
  return new Date(expireTime) < new Date()
}

// 加载数据
const loadStats = async () => {
  try {
    const res = await api.get('/admin/character-pack/stats')
    stats.value = res.data
  } catch (e) {
    logger.error('加载统计失败', e)
  }
}

const handleCodeSearch = () => {
  codePage.value = 1
  loadCodes()
}

const loadCodes = async () => {
  codesLoading.value = true
  try {
    const res = await api.get('/admin/character-pack/codes', {
      params: {
        page: codePage.value,
        page_size: codePageSize.value,
        ...codeFilter.value
      }
    })
    codes.value = res.data.codes
    codeTotal.value = res.data.total
  } catch (e) {
    ElMessage.error('加载激活码失败')
  } finally {
    codesLoading.value = false
  }
}

const loadUsers = async () => {
  usersLoading.value = true
  try {
    const res = await api.get('/admin/character-pack/users', {
      params: {
        page: userPage.value,
        page_size: userPageSize.value,
        ...userFilter.value
      }
    })
    users.value = res.data.users
    userTotal.value = res.data.total
  } catch (e) {
    ElMessage.error('加载用户余额失败')
  } finally {
    usersLoading.value = false
  }
}

// 加载套餐设置
const loadPackages = async () => {
  packagesLoading.value = true
  try {
    const res = await api.get('/admin/character-pack/packages')
    packages.value = res.data.packages || []
  } catch (e) {
    ElMessage.error('加载套餐设置失败')
  } finally {
    packagesLoading.value = false
  }
}

// 保存套餐设置
const savePackages = async () => {
  savingPackages.value = true
  try {
    await api.post('/admin/character-pack/packages/update', { packages: packages.value })
    ElMessage.success('套餐设置已保存')
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    savingPackages.value = false
  }
}

// 标签页切换
const handleTabChange = (tab) => {
  if (tab === 'packages') {
    loadPackages()
  } else if (tab === 'codes') {
    loadCodes()
  } else if (tab === 'users') {
    loadUsers()
  }
}

// 复制激活码
const copyCode = (code) => {
  navigator.clipboard.writeText(code)
  ElMessage.success('已复制')
}

const copyAllCodes = () => {
  navigator.clipboard.writeText(generateResult.value.codes?.join('\n') || '')
  ElMessage.success('已复制全部激活码')
}

// 生成激活码
const showGenerateDialog = () => {
  generateForm.value = { pack_type: 'basic', count: 10, remark: '' }
  generateDialogVisible.value = true
}

const generateCodes = async () => {
  generating.value = true
  try {
    const res = await api.post('/admin/character-pack/codes/generate', generateForm.value)
    generateDialogVisible.value = false
    generateResult.value = res.data
    resultDialogVisible.value = true
    loadCodes()
    loadStats()
  } catch (e) {
    ElMessage.error('生成失败')
  } finally {
    generating.value = false
  }
}

// 禁用激活码
const disableCode = async (row) => {
  try {
    await ElMessageBox.confirm('确定要禁用此激活码吗？', '提示', { type: 'warning' })
    await api.post('/admin/character-pack/codes/disable', { id: row.id })
    ElMessage.success('已禁用')
    loadCodes()
    loadStats()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

// 删除激活码
const deleteCode = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除此激活码吗？删除后无法恢复！', '警告', { type: 'error' })
    await api.post('/admin/character-pack/codes/delete', { id: row.id })
    ElMessage.success('已删除')
    loadCodes()
    loadStats()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

// 调整余额
const showAdjustDialog = (row) => {
  adjustForm.value = {
    user_id: row.user_id,
    email: row.email,
    current_balance: row.balance,
    adjustment: 0,
    reason: ''
  }
  adjustDialogVisible.value = true
}

const adjustBalance = async () => {
  if (!adjustForm.value.adjustment) {
    ElMessage.warning('请输入调整数量')
    return
  }
  if (!adjustForm.value.reason) {
    ElMessage.warning('请输入调整原因')
    return
  }
  
  adjusting.value = true
  try {
    const res = await api.post('/admin/character-pack/users/adjust', {
      user_id: adjustForm.value.user_id,
      adjustment: adjustForm.value.adjustment,
      reason: adjustForm.value.reason
    })
    ElMessage.success(`调整成功，新余额: ${formatCharacters(res.data.balance_after)}`)
    adjustDialogVisible.value = false
    loadUsers()
    loadStats()
  } catch (e) {
    ElMessage.error('调整失败')
  } finally {
    adjusting.value = false
  }
}

// 统计对话框
const showStatsDialog = () => {
  loadStats()
  statsDialogVisible.value = true
}

// 初始化
onMounted(() => {
  loadStats()
  loadPackages()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.table-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}
</style>

