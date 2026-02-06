<template>
  <div>
    <div class="page-header">
      <h3 class="page-title">卡密管理</h3>
      <div class="action-buttons">
        <el-button @click="showPriceDialog">
          <el-icon><PriceTag /></el-icon>价格设置
        </el-button>
        <el-button @click="exportCards">
          <el-icon><Download /></el-icon>导出
        </el-button>
        <el-button type="primary" @click="showGenerateDialog">
          <el-icon><Plus /></el-icon>生成卡密
        </el-button>
      </div>
    </div>
    
    <div class="table-card">
      <!-- 筛选 -->
      <div style="margin-bottom: 16px; display: flex; gap: 10px;">
        <el-select v-model="filterStatus" placeholder="状态" style="width: 100px;" clearable @change="loadCards">
          <el-option label="未使用" value="unused" />
          <el-option label="已使用" value="used" />
          <el-option label="已禁用" value="disabled" />
        </el-select>
        <el-select v-model="filterType" placeholder="类型" style="width: 100px;" clearable @change="loadCards">
          <el-option label="月卡" value="monthly" />
          <el-option label="年卡" value="yearly" />
          <el-option label="永久" value="permanent" />
        </el-select>
      </div>
      
      <el-table :data="cards" stripe v-loading="loading" table-layout="fixed">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="card_key" label="卡密" width="200">
          <template #default="{ row }">
            <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 12px;">{{ row.card_key }}</code>
            <el-button type="primary" link size="small" @click="copyCard(row.card_key)">
              <el-icon><CopyDocument /></el-icon>
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="card_type" label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.card_type)" size="small">{{ getTypeName(row.card_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration_days" label="时长" width="70" align="center">
          <template #default="{ row }">{{ row.duration_days || '永久' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.status)" size="small">{{ getStatusName(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="used_by_email" label="激活用户" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.status === 'used' && row.used_by_email">{{ row.used_by_email }}</span>
            <span v-else style="color: #999;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="machine_code" label="绑定机器码" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.status === 'used' && row.machine_code">
              <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 11px;">{{ row.machine_code }}</code>
            </span>
            <span v-else style="color: #999;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="165" />
        <el-table-column prop="used_at" label="使用时间" width="165">
          <template #default="{ row }">{{ row.used_at || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-if="row.status === 'unused'" type="warning" link size="small" @click="disableCard(row)">禁用</el-button>
            <el-button type="danger" link size="small" @click="deleteCard(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 20px; justify-content: flex-end;"
        @size-change="loadCards"
        @current-change="loadCards"
      />
    </div>
    
    <!-- 生成卡密对话框 -->
    <el-dialog v-model="generateDialogVisible" :title="currentProductName + ' - 生成卡密'" width="500px">
      <el-form :model="generateForm" label-width="100px">
        <el-form-item label="卡密类型">
          <el-select v-model="generateForm.card_type" style="width: 280px;">
            <el-option label="月卡 (30天)" value="monthly" />
            <el-option label="年卡 (365天)" value="yearly" />
            <el-option label="永久" value="permanent" />
            <el-option label="自定义天数" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="generateForm.card_type === 'custom'" label="自定义天数">
          <el-input-number v-model="generateForm.duration_days" :min="1" :max="9999" style="width: 180px;" />
          <span style="margin-left: 12px; color: #666;">天</span>
        </el-form-item>
        <el-form-item label="生成数量">
          <el-input-number v-model="generateForm.count" :min="1" :max="100" style="width: 180px;" />
          <span style="margin-left: 12px; color: #666;">张</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="generateForm.remark" placeholder="可选，用于标记卡密用途" style="width: 280px;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="generateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleGenerate" :loading="generating">生成卡密</el-button>
      </template>
    </el-dialog>
    
    <!-- 生成结果对话框 -->
    <el-dialog v-model="resultDialogVisible" title="生成成功" width="600px">
      <p>成功生成 {{ generatedCards.length }} 张卡密：</p>
      <el-input type="textarea" :rows="10" :model-value="generatedCards.join('\n')" readonly />
      <template #footer>
        <el-button @click="copyAllCards">复制全部</el-button>
        <el-button type="primary" @click="resultDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
    
    <!-- 价格设置对话框 -->
    <el-dialog v-model="priceDialogVisible" :title="currentProductName + ' - 卡密价格设置'" width="500px">
      <el-form :model="currentPriceForm" label-width="100px">
        <el-form-item label="月卡价格">
          <el-input-number v-model="currentPriceForm.monthly" :min="0" :precision="2" style="width: 180px;" />
          <span style="margin-left: 12px; color: #666;">元</span>
        </el-form-item>
        <el-form-item label="年卡价格">
          <el-input-number v-model="currentPriceForm.yearly" :min="0" :precision="2" style="width: 180px;" />
          <span style="margin-left: 12px; color: #666;">元</span>
        </el-form-item>
        <el-form-item label="永久价格">
          <el-input-number v-model="currentPriceForm.permanent" :min="0" :precision="2" style="width: 180px;" />
          <span style="margin-left: 12px; color: #666;">元</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="priceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePriceSettings">保存设置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCards, generateCards, disableCard as apiDisableCard, deleteCard as apiDeleteCard, getSettings, updateSettings } from '../api'
import { useProductStore } from '../stores/product'
import logger from '../utils/logger'

const productStore = useProductStore()

// 当前产品名称
const currentProductName = computed(() => {
  return productStore.currentProduct === 'comic' ? '丸子漫剧' : '丸子配音'
})

// 当前产品价格表单
const currentPriceForm = computed(() => {
  return productStore.currentProduct === 'comic' ? priceForm.comic : priceForm.dubbing
})

// 监听全局产品切换
watch(() => productStore.currentProduct, () => {
  loadCards()
})

const loading = ref(false)
const cards = ref([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const filterStatus = ref('')
const filterType = ref('')

const generateDialogVisible = ref(false)
const generating = ref(false)
const generateForm = reactive({
  card_type: 'monthly',
  duration_days: 30,
  count: 10,
  remark: ''
})

const resultDialogVisible = ref(false)
const generatedCards = ref([])

const priceDialogVisible = ref(false)
const savingPrice = ref(false)
const priceForm = reactive({
  dubbing: { monthly: 29.9, yearly: 199, permanent: 399 },
  comic: { monthly: 19.9, yearly: 149, permanent: 299 }
})

const getTypeColor = (type) => {
  const colors = { monthly: '', yearly: 'warning', permanent: 'success', custom: 'info' }
  return colors[type] || ''
}

const getTypeName = (type) => {
  const names = { monthly: '月卡', yearly: '年卡', permanent: '永久', custom: '自定义' }
  return names[type] || type
}

const getStatusColor = (status) => {
  const colors = { unused: 'success', used: 'info', disabled: 'danger' }
  return colors[status] || ''
}

const getStatusName = (status) => {
  const names = { unused: '未使用', used: '已使用', disabled: '已禁用' }
  return names[status] || status
}

const loadCards = async () => {
  loading.value = true
  
  try {
    const res = await getCards({
      page: page.value,
      page_size: pageSize.value,
      status: filterStatus.value,
      card_type: filterType.value,
      product_code: productStore.currentProduct
    })
    if (res.data) {
      cards.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch (e) {
    logger.error('加载卡密列表失败', e)
    cards.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const copyCard = (card) => {
  navigator.clipboard.writeText(card)
  ElMessage.success('已复制')
}

const showGenerateDialog = () => {
  generateForm.product_code = 'dubbing'
  generateForm.card_type = 'monthly'
  generateForm.duration_days = 30
  generateForm.count = 10
  generateForm.remark = ''
  generateDialogVisible.value = true
}

const handleGenerate = async () => {
  generating.value = true
  try {
    const res = await generateCards({
      card_type: generateForm.card_type,
      count: generateForm.count,
      duration_days: generateForm.duration_days,
      remark: generateForm.remark,
      product_code: productStore.currentProduct
    })
    generatedCards.value = res.data.cards
    generateDialogVisible.value = false
    resultDialogVisible.value = true
    loadCards()
  } catch (e) {
    // 错误已在拦截器处理
  } finally {
    generating.value = false
  }
}

const copyAllCards = () => {
  navigator.clipboard.writeText(generatedCards.value.join('\n'))
  ElMessage.success('已复制全部卡密')
}

const disableCard = async (row) => {
  await ElMessageBox.confirm(`确定要禁用卡密 ${row.card_key} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
  try {
    await apiDisableCard(row.id)
    ElMessage.success('禁用成功')
    loadCards()
  } catch (e) {
    // 错误已在拦截器处理
  }
}

const deleteCard = async (row) => {
  await ElMessageBox.confirm(`确定要删除卡密 ${row.card_key} 吗？此操作不可恢复！`, '警告', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'error'
  })
  try {
    await apiDeleteCard(row.id)
    ElMessage.success('删除成功')
    loadCards()
  } catch (e) {
    // 错误已在拦截器处理
  }
}

const showPriceDialog = () => {
  priceDialogVisible.value = true
}

const savePriceSettings = async () => {
  savingPrice.value = true
  try {
    const prefix = productStore.currentProduct === 'comic' ? 'comic_' : ''
    await updateSettings({
      [`${prefix}card_price_monthly`]: String(currentPriceForm.value.monthly),
      [`${prefix}card_price_yearly`]: String(currentPriceForm.value.yearly),
      [`${prefix}card_price_permanent`]: String(currentPriceForm.value.permanent)
    })
    ElMessage.success('价格设置已保存')
    priceDialogVisible.value = false
  } catch (e) {
    // 错误已在拦截器处理
  } finally {
    savingPrice.value = false
  }
}

const loadPriceSettings = async () => {
  try {
    const res = await getSettings()
    if (res.data) {
      priceForm.dubbing.monthly = parseFloat(res.data.card_price_monthly) || 29.9
      priceForm.dubbing.yearly = parseFloat(res.data.card_price_yearly) || 199
      priceForm.dubbing.permanent = parseFloat(res.data.card_price_permanent) || 399
      priceForm.comic.monthly = parseFloat(res.data.comic_card_price_monthly) || 19.9
      priceForm.comic.yearly = parseFloat(res.data.comic_card_price_yearly) || 149
      priceForm.comic.permanent = parseFloat(res.data.comic_card_price_permanent) || 299
    }
  } catch (e) {}
}

const exportCards = () => {
  // 导出未使用的卡密
  const unusedCards = cards.value.filter(c => c.status === 'unused')
  if (unusedCards.length === 0) {
    ElMessage.warning('没有可导出的未使用卡密')
    return
  }
  
  const content = unusedCards.map(c => `${c.card_key}\t${getTypeName(c.card_type)}\t${c.duration_days}天`).join('\n')
  const header = '卡密\t类型\t时长\n'
  const blob = new Blob([header + content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `卡密导出_${new Date().toISOString().slice(0, 10)}.txt`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`已导出 ${unusedCards.length} 张未使用卡密`)
}

onMounted(() => {
  loadCards()
  loadPriceSettings()
})
</script>

