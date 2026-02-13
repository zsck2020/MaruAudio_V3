<template>
  <div>
    <div class="page-header">
      <h3 class="page-title">系统设置</h3>
    </div>
    
    <el-row :gutter="20">
      <!-- 发信邮箱配置 -->
      <el-col :span="24" style="margin-bottom: 20px;">
        <div class="table-card">
          <h4 style="margin-top: 0;">
            <el-icon><Message /></el-icon> 发信邮箱配置
          </h4>
          <el-form :model="mailForm" label-width="130px">
            <el-form-item label="SMTP 服务器">
              <el-input v-model="mailForm.smtp_host" placeholder="如: smtp.qq.com" style="width: 320px;" />
            </el-form-item>
            <el-form-item label="SMTP 端口">
              <el-input-number v-model="mailForm.smtp_port" :min="1" :max="65535" style="width: 180px;" />
            </el-form-item>
            <el-form-item label="发件邮箱">
              <el-input v-model="mailForm.smtp_user" placeholder="如: noreply@example.com" style="width: 320px;" />
            </el-form-item>
            <el-form-item label="邮箱密码/授权码">
              <el-input v-model="mailForm.smtp_pass" type="password" show-password placeholder="SMTP授权码" style="width: 320px;" />
            </el-form-item>
            <el-form-item label="发件人名称">
              <el-input v-model="mailForm.from_name" placeholder="如: 丸子配音" style="width: 320px;" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveMailSettings">保存配置</el-button>
              <el-button @click="testMail">测试发送</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-col>
      
      <!-- 管理员设置 -->
      <el-col :span="24" style="margin-bottom: 20px;">
        <div class="table-card">
          <h4 style="margin-top: 0;">管理员设置</h4>
          <el-form :model="adminForm" label-width="130px">
            <el-form-item label="用户名">
              <el-input v-model="adminForm.username" disabled style="width: 320px;" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="adminForm.email" style="width: 320px;" />
            </el-form-item>
            <el-form-item label="新密码">
              <el-input v-model="adminForm.new_password" type="password" placeholder="留空则不修改" show-password style="width: 320px;" />
            </el-form-item>
            <el-form-item label="确认密码">
              <el-input v-model="adminForm.confirm_password" type="password" placeholder="确认新密码" show-password style="width: 320px;" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveAdminSettings">保存</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-col>
      
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getSettings, updateSettings, updateAdminProfile } from '../api'

const adminForm = reactive({
  username: '',
  email: '',
  new_password: '',
  confirm_password: ''
})

const systemForm = reactive({
  registration_enabled: true,
  machine_code_limit: 1,
  machine_change_cooldown: 30,
  login_fail_limit: 5,
  login_lock_duration: 30
})

const mailForm = reactive({
  smtp_host: 'smtp.qq.com',
  smtp_port: 465,
  smtp_user: 'qilane@foxmail.com',
  smtp_pass: '',
  from_name: '丸子配音'
})

const loadSettings = async () => {
  // 加载管理员信息
  const adminInfo = localStorage.getItem('admin_info')
  if (adminInfo) {
    const info = JSON.parse(adminInfo)
    adminForm.username = info.username
    adminForm.email = info.email
  }
  
  // 从 API 加载系统设置
  try {
    const res = await getSettings()
    if (res.data) {
      systemForm.registration_enabled = res.data.registration_enabled === '1' || res.data.registration_enabled === true
      systemForm.machine_code_limit = parseInt(res.data.machine_code_limit) || 1
      systemForm.machine_change_cooldown = parseInt(res.data.machine_change_cooldown) || 30
      systemForm.login_fail_limit = parseInt(res.data.login_fail_limit) || 5
      systemForm.login_lock_duration = parseInt(res.data.login_lock_duration) || 30
      // 邮件设置
      mailForm.smtp_host = res.data.smtp_host || 'smtp.qq.com'
      mailForm.smtp_port = parseInt(res.data.smtp_port) || 465
      mailForm.smtp_user = res.data.smtp_user || ''
      mailForm.smtp_pass = res.data.smtp_pass || ''
      mailForm.from_name = res.data.from_name || '丸子配音'
    }
  } catch (e) {
    console.error('加载设置失败', e)
  }
}

const saveAdminSettings = async () => {
  if (adminForm.new_password && adminForm.new_password !== adminForm.confirm_password) {
    ElMessage.error('两次输入的密码不一致')
    return
  }
  try {
    await updateAdminProfile({
      email: adminForm.email,
      new_password: adminForm.new_password || undefined
    })
    ElMessage.success('保存成功')
    adminForm.new_password = ''
    adminForm.confirm_password = ''
  } catch (e) {
    // 错误已在拦截器处理
  }
}

const saveSystemSettings = async () => {
  try {
    await updateSettings({
      registration_enabled: systemForm.registration_enabled ? '1' : '0',
      machine_code_limit: String(systemForm.machine_code_limit),
      machine_change_cooldown: String(systemForm.machine_change_cooldown),
      login_fail_limit: String(systemForm.login_fail_limit),
      login_lock_duration: String(systemForm.login_lock_duration)
    })
    ElMessage.success('保存成功')
  } catch (e) {
    // 错误已在拦截器处理
  }
}

const saveMailSettings = async () => {
  try {
    await updateSettings({
      smtp_host: mailForm.smtp_host,
      smtp_port: String(mailForm.smtp_port),
      smtp_user: mailForm.smtp_user,
      smtp_pass: mailForm.smtp_pass,
      from_name: mailForm.from_name
    })
    ElMessage.success('邮箱配置已保存')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const testMail = async () => {
  if (!mailForm.smtp_user) {
    ElMessage.error('请先配置发件邮箱')
    return
  }
  
  const testEmail = adminForm.email || mailForm.smtp_user
  
  try {
    const response = await fetch('/api/admin/test-mail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      },
      body: JSON.stringify({
        to: testEmail,
        smtp_host: mailForm.smtp_host,
        smtp_port: mailForm.smtp_port,
        smtp_user: mailForm.smtp_user,
        smtp_pass: mailForm.smtp_pass,
        from_name: mailForm.from_name
      })
    })
    
    const result = await response.json()
    if (result.code === 0) {
      ElMessage.success(`测试邮件已发送到 ${testEmail}`)
    } else {
      ElMessage.error(result.message || '发送失败')
    }
  } catch (e) {
    ElMessage.error('发送失败: ' + e.message)
  }
}

onMounted(() => {
  loadSettings()
})
</script>
