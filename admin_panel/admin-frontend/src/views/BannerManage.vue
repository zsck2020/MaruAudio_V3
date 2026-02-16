<template>
  <div>
    <div class="page-header">
      <h3 class="page-title">Banner 管理</h3>
      <el-button type="primary" @click="showBannerDialog()">
        <el-icon><Plus /></el-icon>添加 Banner
      </el-button>
    </div>
    
    <el-alert type="info" :closable="false" style="margin-bottom: 20px;">
      <template #title>管理客户端首页轮播图，支持启用/禁用、配置跳转链接、调整排序权重</template>
    </el-alert>
    
    <div class="table-card">
      <el-table :data="bannerList" style="width: 100%" v-loading="bannerLoading" empty-text="暂无Banner">
        <el-table-column label="排序" width="70" align="center">
          <template #default="{ row }">
            <span style="color: #999;">{{ row.sort_order }}</span>
          </template>
        </el-table-column>
        <el-table-column label="预览" width="200">
          <template #default="{ row }">
            <div class="banner-preview">
              <img :src="getBannerImageUrl(row.image_url)" :alt="row.title" />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="标题" prop="title" min-width="160" />
        <el-table-column label="跳转" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.link_type === 'none'" type="info" size="small">无动作</el-tag>
            <el-tag v-else-if="row.link_type === 'url'" type="warning" size="small">外部链接</el-tag>
            <el-tag v-else-if="row.link_type === 'page'" type="success" size="small">内部页面</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="链接地址" min-width="180">
          <template #default="{ row }">
            <span v-if="row.link_url" style="color: #409eff; font-size: 12px;">{{ row.link_url }}</span>
            <span v-else style="color: #999;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch 
              :model-value="row.is_enabled == 1" 
              @change="handleToggleBanner(row)" 
              active-text="启用" 
              inactive-text="禁用"
              inline-prompt
            />
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="165" prop="updated_at" />
        <el-table-column label="操作" width="150" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="showBannerDialog(row)">编辑</el-button>
            <el-popconfirm title="确定删除此Banner？" @confirm="handleDeleteBanner(row.id)">
              <template #reference>
                <el-button type="danger" link size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- Banner 编辑弹窗 -->
    <el-dialog 
      v-model="bannerDialogVisible" 
      :title="bannerForm.id ? '编辑 Banner' : '添加 Banner'" 
      width="600px"
      destroy-on-close
    >
      <el-form :model="bannerForm" label-width="100px">
        <el-form-item label="标题" required>
          <el-input v-model="bannerForm.title" placeholder="Banner标题" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="图片" required>
          <div>
            <el-upload
              class="banner-uploader"
              :show-file-list="false"
              :before-upload="beforeBannerUpload"
              :http-request="uploadBannerImage"
              accept="image/*"
            >
              <div v-if="bannerForm.image_url" class="banner-upload-preview">
                <img :src="getBannerImageUrl(bannerForm.image_url)" />
                <div class="banner-upload-overlay">
                  <el-icon><Upload /></el-icon>
                  <span>更换图片</span>
                </div>
              </div>
              <div v-else class="banner-upload-placeholder">
                <el-icon><Plus /></el-icon>
                <span>上传图片</span>
              </div>
            </el-upload>
            <div style="color: #999; font-size: 12px; margin-top: 8px;">建议尺寸 1200×225，支持 JPG/PNG/SVG/WEBP，不超过 2MB</div>
          </div>
        </el-form-item>
        <el-form-item label="跳转类型">
          <el-radio-group v-model="bannerForm.link_type">
            <el-radio value="none">无动作</el-radio>
            <el-radio value="url">外部链接</el-radio>
            <el-radio value="page">内部页面</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="bannerForm.link_type !== 'none'" label="跳转地址">
          <el-input 
            v-model="bannerForm.link_url" 
            :placeholder="bannerForm.link_type === 'url' ? 'https://example.com' : '页面路径，如 dubbing'" 
          />
        </el-form-item>
        <el-form-item label="排序权重">
          <el-input-number v-model="bannerForm.sort_order" :min="0" :max="999" />
          <span style="margin-left: 12px; color: #999; font-size: 12px;">数值越大越靠前</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="bannerForm.is_enabled" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bannerDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBanner" :loading="bannerSaving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Upload } from '@element-plus/icons-vue'
import { getBanners, createBanner, updateBanner, deleteBanner, toggleBanner } from '../api'

const bannerList = ref([])
const bannerLoading = ref(false)
const bannerDialogVisible = ref(false)
const bannerSaving = ref(false)
const bannerForm = reactive({
  id: null,
  title: '',
  image_url: '',
  link_url: '',
  link_type: 'none',
  sort_order: 0,
  is_enabled: 1
})

const loadBanners = async () => {
  bannerLoading.value = true
  try {
    const res = await getBanners()
    if (res.data) {
      bannerList.value = res.data.list || []
    }
  } catch (e) {
    console.error('加载Banner列表失败', e)
  } finally {
    bannerLoading.value = false
  }
}

const showBannerDialog = (row = null) => {
  if (row) {
    Object.assign(bannerForm, {
      id: row.id,
      title: row.title,
      image_url: row.image_url,
      link_url: row.link_url || '',
      link_type: row.link_type || 'none',
      sort_order: parseInt(row.sort_order) || 0,
      is_enabled: parseInt(row.is_enabled)
    })
  } else {
    Object.assign(bannerForm, {
      id: null,
      title: '',
      image_url: '',
      link_url: '',
      link_type: 'none',
      sort_order: 0,
      is_enabled: 1
    })
  }
  bannerDialogVisible.value = true
}

const saveBanner = async () => {
  if (!bannerForm.title) {
    ElMessage.error('请输入Banner标题')
    return
  }
  if (!bannerForm.image_url) {
    ElMessage.error('请上传Banner图片')
    return
  }
  
  bannerSaving.value = true
  try {
    if (bannerForm.id) {
      await updateBanner({ ...bannerForm })
    } else {
      await createBanner({ ...bannerForm })
    }
    ElMessage.success(bannerForm.id ? '更新成功' : '创建成功')
    bannerDialogVisible.value = false
    await loadBanners()
  } catch (e) {
    // 错误已在拦截器处理
  } finally {
    bannerSaving.value = false
  }
}

const handleDeleteBanner = async (id) => {
  try {
    await deleteBanner(id)
    ElMessage.success('删除成功')
    await loadBanners()
  } catch (e) {}
}

const handleToggleBanner = async (row) => {
  try {
    await toggleBanner(row.id)
    await loadBanners()
  } catch (e) {}
}

const getBannerImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return url
}

const beforeBannerUpload = (file) => {
  const isImage = file.type.startsWith('image/') || file.name.endsWith('.svg')
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
    return false
  }
  return true
}

const uploadBannerImage = async ({ file }) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'banner')
    
    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      },
      body: formData
    })
    
    const result = await response.json()
    if (result.code === 0 && result.data?.url) {
      bannerForm.image_url = result.data.url
      ElMessage.success('图片上传成功')
    } else {
      ElMessage.error(result.message || '上传失败')
    }
  } catch (e) {
    ElMessage.error('上传失败: ' + e.message)
  }
}

onMounted(() => {
  loadBanners()
})
</script>

<style scoped>
.banner-preview {
  width: 180px;
  height: 55px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #eee;
}

.banner-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-uploader {
  width: 100%;
}

.banner-upload-preview {
  width: 100%;
  height: 120px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
}

.banner-upload-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-upload-preview:hover .banner-upload-overlay {
  opacity: 1;
}

.banner-upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s;
}

.banner-upload-overlay .el-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.banner-upload-placeholder {
  width: 100%;
  height: 120px;
  border: 1px dashed #ddd;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  cursor: pointer;
  transition: border-color 0.3s;
}

.banner-upload-placeholder:hover {
  border-color: #409eff;
  color: #409eff;
}

.banner-upload-placeholder .el-icon {
  font-size: 28px;
  margin-bottom: 8px;
}
</style>
