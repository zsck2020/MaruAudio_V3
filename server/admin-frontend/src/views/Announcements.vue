<template>
  <div>
    <div class="page-header">
      <h3 class="page-title">公告管理</h3>
      <div class="action-buttons">
        <el-button type="primary" @click="showEditDialog()">
          <el-icon><Plus /></el-icon>发布公告
        </el-button>
      </div>
    </div>
    
    <div class="table-card">
      <el-table :data="announcements" stripe v-loading="loading" table-layout="fixed">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.type)" size="small">{{ getTypeName(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80" align="center" />
        <el-table-column prop="is_active" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
              {{ row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="165" />
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="showEditDialog(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 编辑对话框 -->
    <el-dialog v-model="editDialogVisible" :title="editForm.id ? '编辑公告' : '发布公告'" width="600px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="标题" required>
          <el-input v-model="editForm.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input v-model="editForm.content" type="textarea" :rows="5" placeholder="请输入公告内容" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="editForm.type" style="width: 100%;">
            <el-option label="信息" value="info" />
            <el-option label="警告" value="warning" />
            <el-option label="成功" value="success" />
            <el-option label="错误" value="error" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-input-number v-model="editForm.priority" :min="0" :max="100" />
          <span style="margin-left: 10px; color: #999;">数值越大越靠前</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="editForm.is_active" active-text="启用" inactive-text="禁用" />
        </el-form-item>
        <el-form-item label="生效时间">
          <el-date-picker v-model="editForm.start_time" type="datetime" placeholder="开始时间" style="width: 48%;" />
          <span style="margin: 0 4%;">至</span>
          <el-date-picker v-model="editForm.end_time" type="datetime" placeholder="结束时间" style="width: 48%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAnnouncements, saveAnnouncement, deleteAnnouncement } from '../api'
import logger from '../utils/logger'

const loading = ref(false)
const saving = ref(false)
const announcements = ref([])
const editDialogVisible = ref(false)
const editForm = ref({
  id: 0,
  title: '',
  content: '',
  type: 'info',
  priority: 0,
  is_active: true,
  start_time: null,
  end_time: null
})

const getTypeColor = (type) => {
  const colors = { info: '', warning: 'warning', success: 'success', error: 'danger' }
  return colors[type] || ''
}

const getTypeName = (type) => {
  const names = { info: '信息', warning: '警告', success: '成功', error: '错误' }
  return names[type] || type
}

const loadAnnouncements = async () => {
  loading.value = true
  try {
    const res = await getAnnouncements()
    announcements.value = res.data?.list || []
  } catch (e) {
    logger.error('加载公告失败', e)
  } finally {
    loading.value = false
  }
}

const showEditDialog = (row = null) => {
  if (row) {
    editForm.value = { ...row, is_active: !!row.is_active }
  } else {
    editForm.value = {
      id: 0,
      title: '',
      content: '',
      type: 'info',
      priority: 0,
      is_active: true,
      start_time: null,
      end_time: null
    }
  }
  editDialogVisible.value = true
}

const handleSave = async () => {
  if (!editForm.value.title || !editForm.value.content) {
    ElMessage.error('标题和内容不能为空')
    return
  }
  
  saving.value = true
  try {
    await saveAnnouncement(editForm.value)
    ElMessage.success(editForm.value.id ? '更新成功' : '发布成功')
    editDialogVisible.value = false
    loadAnnouncements()
  } catch (e) {
    // 错误已在拦截器处理
  } finally {
    saving.value = false
  }
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm(`确定要删除公告"${row.title}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
  
  try {
    await deleteAnnouncement(row.id)
    ElMessage.success('删除成功')
    loadAnnouncements()
  } catch (e) {
    // 错误已在拦截器处理
  }
}

onMounted(() => {
  loadAnnouncements()
})
</script>
