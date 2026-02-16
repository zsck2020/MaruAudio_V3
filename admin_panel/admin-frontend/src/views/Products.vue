<template>
  <div>
    <div class="page-header">
      <h3 class="page-title">产品列表</h3>
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>添加产品
      </el-button>
    </div>
    
    <div class="stat-cards">
      <div v-for="product in products" :key="product.id" class="product-card" @click="selectProduct(product)">
        <div class="product-icon" :style="{ background: product.color }">
          {{ product.icon }}
        </div>
        <div class="product-info">
          <h3>{{ product.name }}</h3>
          <p>{{ product.description }}</p>
          <div class="product-stats">
            <span><el-icon><User /></el-icon> {{ product.user_count }} 用户</span>
            <span><el-icon><Ticket /></el-icon> {{ product.card_count }} 卡密</span>
          </div>
        </div>
        <div class="product-actions">
          <el-tag :type="product.status === 'active' ? 'success' : 'info'">
            {{ product.status === 'active' ? '运营中' : '开发中' }}
          </el-tag>
          <el-dropdown @command="(cmd) => handleCommand(cmd, product)">
            <el-button text><el-icon><MoreFilled /></el-icon></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit">编辑</el-dropdown-item>
                <el-dropdown-item command="settings">设置</el-dropdown-item>
                <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>
    
    <!-- 添加/编辑产品对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑产品' : '添加产品'" width="500px">
      <el-form :model="productForm" label-width="100px">
        <el-form-item label="产品代码">
          <el-input v-model="productForm.code" placeholder="如: dubbing, comic" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="productForm.name" placeholder="如: 丸子配音" />
        </el-form-item>
        <el-form-item label="产品描述">
          <el-input v-model="productForm.description" type="textarea" placeholder="产品简介" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="productForm.icon" placeholder="Emoji图标，如: 🎙️" />
        </el-form-item>
        <el-form-item label="主题色">
          <el-color-picker v-model="productForm.color" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="productForm.status" style="width: 100%;">
            <el-option label="运营中" value="active" />
            <el-option label="开发中" value="developing" />
            <el-option label="已下线" value="offline" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProduct">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()
const dialogVisible = ref(false)
const isEdit = ref(false)

const products = ref([
  {
    id: 1,
    code: 'dubbing',
    name: '丸子配音',
    description: '智能AI配音工具，支持多种音色',
    icon: '🎙️',
    color: 'rgba(59, 130, 246, 0.1)',
    status: 'active',
    user_count: 128,
    card_count: 500
  },
  {
    id: 2,
    code: 'comic',
    name: '丸子漫剧',
    description: '漫画剧本创作与配音工具',
    icon: '📚',
    color: 'rgba(245, 158, 11, 0.1)',
    status: 'developing',
    user_count: 0,
    card_count: 0
  }
])

const productForm = reactive({
  id: null,
  code: '',
  name: '',
  description: '',
  icon: '🎯',
  color: 'rgba(59, 130, 246, 0.1)',
  status: 'developing'
})

const showAddDialog = () => {
  isEdit.value = false
  Object.assign(productForm, {
    id: null,
    code: '',
    name: '',
    description: '',
    icon: '🎯',
    color: 'rgba(59, 130, 246, 0.1)',
    status: 'developing'
  })
  dialogVisible.value = true
}

const selectProduct = (product) => {
  // 存储当前选中的产品
  localStorage.setItem('current_product', JSON.stringify(product))
  ElMessage.success(`已切换到 ${product.name}`)
}

const handleCommand = (cmd, product) => {
  if (cmd === 'edit') {
    isEdit.value = true
    Object.assign(productForm, product)
    dialogVisible.value = true
  } else if (cmd === 'settings') {
    localStorage.setItem('current_product', JSON.stringify(product))
    router.push('/software')
  } else if (cmd === 'delete') {
    ElMessageBox.confirm(`确定要删除产品 ${product.name} 吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    }).then(() => {
      products.value = products.value.filter(p => p.id !== product.id)
      ElMessage.success('删除成功')
    }).catch(() => {})
  }
}

const saveProduct = () => {
  if (!productForm.code || !productForm.name) {
    ElMessage.error('请填写产品代码和名称')
    return
  }
  
  if (isEdit.value) {
    const index = products.value.findIndex(p => p.id === productForm.id)
    if (index !== -1) {
      products.value[index] = { ...productForm }
    }
    ElMessage.success('保存成功')
  } else {
    products.value.push({
      ...productForm,
      id: Date.now(),
      user_count: 0,
      card_count: 0
    })
    ElMessage.success('添加成功')
  }
  dialogVisible.value = false
}

onMounted(() => {
  // TODO: 从 API 加载产品列表
})
</script>

<style scoped>
.product-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.product-card:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.product-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin-right: 16px;
}

.product-info {
  flex: 1;
}

.product-info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
}

.product-info p {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 14px;
}

.product-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #999;
}

.product-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.product-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
