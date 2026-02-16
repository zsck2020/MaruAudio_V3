<template>
  <el-dialog
    v-model="visible"
    title="安全验证"
    width="400px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @closed="onClosed"
  >
    <div style="text-align: center; margin-bottom: 16px;">
      <el-icon :size="48" color="#E6A23C"><Lock /></el-icon>
      <p style="color: #666; margin-top: 8px;">此操作需要验证管理员密码</p>
    </div>
    <el-form @submit.prevent="onSubmit">
      <el-form-item>
        <el-input
          ref="passwordInput"
          v-model="password"
          type="password"
          placeholder="请输入管理员密码"
          show-password
          size="large"
          @keyup.enter="onSubmit"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="onCancel">取消</el-button>
      <el-button type="primary" :loading="loading" @click="onSubmit">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { verifyAdminPassword } from '../api'

const visible = ref(false)
const password = ref('')
const loading = ref(false)
const passwordInput = ref(null)

let resolvePromise = null
let rejectPromise = null

const open = () => {
  return new Promise((resolve, reject) => {
    resolvePromise = resolve
    rejectPromise = reject
    password.value = ''
    visible.value = true
    nextTick(() => {
      passwordInput.value?.focus()
    })
  })
}

const onSubmit = async () => {
  if (!password.value) {
    ElMessage.warning('请输入密码')
    return
  }
  loading.value = true
  try {
    const res = await verifyAdminPassword(password.value)
    const token = res.data.verify_token
    // 存储 verify_token，5分钟内有效
    sessionStorage.setItem('verify_token', token)
    sessionStorage.setItem('verify_token_time', String(Date.now()))
    visible.value = false
    resolvePromise?.(token)
  } catch (e) {
    // 错误已在拦截器处理
  } finally {
    loading.value = false
  }
}

const onCancel = () => {
  visible.value = false
  rejectPromise?.('cancelled')
}

const onClosed = () => {
  password.value = ''
  loading.value = false
}

defineExpose({ open })
</script>
