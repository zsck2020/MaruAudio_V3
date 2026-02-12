<template>

  <div>

    <div class="page-header">

      <h3 class="page-title">用户管理</h3>

      <div class="action-buttons">

        <el-select v-model="searchType" style="width: 100px;">

          <el-option label="邮箱" value="email" />

          <el-option label="机器码" value="machine_code" />

          <el-option label="卡密" value="card_key" />

        </el-select>

        <el-input v-model="searchKeyword" :placeholder="searchPlaceholder" style="width: 180px;" clearable @clear="handleClearSearch" @keyup.enter="handleSearch">

          <template #prefix><el-icon><Search /></el-icon></template>

        </el-input>

        <el-button type="primary" @click="handleSearch">搜索</el-button>

        <el-button @click="handleExport">导出数据</el-button>

      </div>

    </div>

    

    <div class="table-card">

      <!-- 批量操作 -->

      <div v-if="selectedUsers.length > 0" style="margin-bottom: 15px; padding: 10px; background: #f0f9ff; border-radius: 6px; display: flex; align-items: center; gap: 10px;">

        <span style="color: #1890ff;">已选择 {{ selectedUsers.length }} 个用户</span>

        <el-button size="small" @click="batchSetGroup">批量设置用户组</el-button>

        <el-button size="small" type="danger" @click="batchBan">批量封禁</el-button>

        <el-button size="small" type="success" @click="batchUnban">批量解封</el-button>

        <el-button size="small" @click="selectedUsers = []">取消选择</el-button>

      </div>

      

      <el-table :data="users" stripe v-loading="loading" @selection-change="handleSelectionChange" table-layout="fixed">

        <el-table-column type="selection" width="45" />

        <el-table-column prop="id" label="ID" width="60" />

        <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />

        <el-table-column prop="user_group" label="用户组" width="100">

          <template #default="{ row }">

            <el-tag :type="getGroupType(row.user_group)" size="small">{{ getGroupName(row.user_group) }}</el-tag>

          </template>

        </el-table-column>

        <el-table-column prop="expire_time" label="到期时间" width="165">

          <template #default="{ row }">

            <span v-if="row.user_group === 'permanent'">永久</span>

            <span v-else-if="row.user_group === 'free'">-</span>

            <span v-else>{{ row.expire_time || '-' }}</span>

          </template>

        </el-table-column>

        <el-table-column prop="register_time" label="注册时间" width="165" />

        <el-table-column prop="machine_code" label="机器码" min-width="200" show-overflow-tooltip>

          <template #default="{ row }">

            <span v-if="row.machine_code">

              <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 11px;">{{ row.machine_code }}</code>

            </span>

            <span v-else style="color: #999;">-</span>

          </template>

        </el-table-column>

        <el-table-column prop="status" label="状态" width="70" align="center">

          <template #default="{ row }">

            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">

              {{ row.status === 'active' ? '正常' : '封禁' }}

            </el-tag>

          </template>

        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right" align="center">

          <template #default="{ row }">

            <el-button type="primary" link size="small" @click="showEditDialog(row)">编辑</el-button>

            <el-button type="primary" link size="small" @click="showLogsDialog(row)">日志</el-button>

            <el-button :type="row.status === 'active' ? 'danger' : 'success'" link size="small" @click="toggleStatus(row)">

              {{ row.status === 'active' ? '封禁' : '解封' }}

            </el-button>

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

        @size-change="loadUsers"

        @current-change="loadUsers"

      />

    </div>

    

    <!-- 编辑用户对话框 -->

    <el-dialog v-model="editDialogVisible" title="编辑用户" width="600px">

      <el-tabs v-model="editTab">

        <!-- 基本信息 -->

        <el-tab-pane label="基本信息" name="basic">

          <el-form :model="editForm" label-width="100px">

            <el-form-item label="用户ID">

              <el-input v-model="editForm.id" disabled />

            </el-form-item>

            <el-form-item label="邮箱">

              <el-input v-model="editForm.email" disabled />

            </el-form-item>

            <el-form-item label="头像">

              <el-input v-model="editForm.avatar" placeholder="头像URL（留空使用默认）" />

            </el-form-item>

            <el-form-item label="用户组">

              <el-select v-model="editForm.user_group" style="width: 100%;">

                <el-option label="免费用户" value="free" />

                <el-option label="试用会员" value="trial" />

                <el-option label="月卡会员" value="monthly" />

                <el-option label="年卡会员" value="yearly" />

                <el-option label="永久会员" value="permanent" />

              </el-select>

            </el-form-item>

            <el-form-item label="状态">

              <el-select v-model="editForm.status" style="width: 100%;">

                <el-option label="正常" value="active" />

                <el-option label="封禁" value="banned" />

              </el-select>

            </el-form-item>

          </el-form>

        </el-tab-pane>

        

        <!-- 使用时长 -->

        <el-tab-pane label="使用时长" name="duration">

          <el-form :model="editForm" label-width="100px">

            <!-- 免费用户提示 -->

            <el-alert v-if="editForm.user_group === 'free'" type="info" :closable="false" style="margin-bottom: 20px;">

              免费用户无需设置到期时间。如需要开通会员，请先在「基本信息」中修改用户组。
            </el-alert>

            <el-form-item label="当前到期">

              <el-tag v-if="editForm.user_group === 'permanent'" type="success">永久会员</el-tag>

              <el-tag v-else-if="editForm.user_group === 'free'" type="info">免费用户</el-tag>

              <span v-else-if="editForm.expire_time">{{ formatExpireTime(editForm.expire_time) }}</span>

              <span v-else style="color: #999;">未设置到期时间</span>

            </el-form-item>

            <el-divider v-if="editForm.user_group !== 'free'" />

            <el-form-item v-if="editForm.user_group !== 'free'" label="修改方式">

              <el-radio-group v-model="durationMode">

                <el-radio label="set">设置到期时间</el-radio>

                <el-radio label="add">增加时长</el-radio>

              </el-radio-group>

            </el-form-item>

            <el-form-item v-if="durationMode === 'set' && editForm.user_group !== 'free'" label="到期时间">

              <el-date-picker v-model="editForm.expire_time" type="datetime" style="width: 100%;" placeholder="选择到期时间" value-format="YYYY-MM-DD HH:mm:ss" />

            </el-form-item>

            <el-form-item v-if="durationMode === 'add' && editForm.user_group !== 'free'" label="增加时长">

              <el-space>

                <el-button @click="addDuration(30)">+30天</el-button>

                <el-button @click="addDuration(90)">+90天</el-button>

                <el-button @click="addDuration(365)">+1年</el-button>

                <el-button type="success" @click="setPermanent">设为永久</el-button>

              </el-space>

            </el-form-item>

            <el-form-item v-if="durationMode === 'add' && editForm.user_group !== 'free'" label="自定义天数">

              <el-input-number v-model="customDays" :min="1" :max="9999" />

              <el-button style="margin-left: 10px;" @click="addDuration(customDays)">添加</el-button>

            </el-form-item>

          </el-form>

        </el-tab-pane>

        

        <!-- 机器码管理 -->

        <el-tab-pane label="机器码" name="machine">

          <el-table :data="userMachines" stripe max-height="200">

            <el-table-column prop="machine_code" label="机器码" show-overflow-tooltip />

            <el-table-column prop="bind_time" label="绑定时间" width="180" />

            <el-table-column label="操作" width="80">

              <template #default="{ row }">

                <el-button type="danger" link size="small" @click="unbindMachine(row)">解绑</el-button>

              </template>

            </el-table-column>

          </el-table>

          <el-divider />

          <h5 style="margin: 0 0 12px 0;">机器码验证</h5>

          <div style="display: flex; align-items: center; gap: 10px;">

            <el-input v-model="verifyMachineCode" placeholder="输入用户提供的机器码进行验证" style="width: 350px;" />

            <el-button type="primary" @click="verifyMachine">验证</el-button>

          </div>

          <div v-if="verifyResult !== null" style="margin-top: 12px;">

            <el-alert v-if="verifyResult === true" title="验证通过" type="success" :closable="false" show-icon>

              该机器码已绑定到此用户
            </el-alert>

            <el-alert v-else-if="verifyResult === 'other'" title="验证失败" type="warning" :closable="false" show-icon>

              该机器码已绑定到其他用户

            </el-alert>

            <el-alert v-else title="验证失败" type="error" :closable="false" show-icon>

              该机器码未在系统中注册
            </el-alert>

          </div>

          <el-divider />

          <h5 style="margin: 0 0 12px 0;">绑定新机器码</h5>

          <div style="display: flex; align-items: center; gap: 10px;">

            <el-input v-model="newMachineCode" placeholder="输入新机器码" style="width: 350px;" />

            <el-button type="primary" @click="bindMachine">绑定</el-button>

          </div>

        </el-tab-pane>

        

        <!-- 重置密码 -->

        <el-tab-pane label="重置密码" name="password">

          <el-form label-width="100px">

            <el-alert type="warning" :closable="false" style="margin-bottom: 20px;">

              重置密码后，用户需要使用新密码登录

            </el-alert>

            <el-form-item label="新密码">

              <el-input v-model="newPassword" type="password" placeholder="输入新密码" show-password />

            </el-form-item>

            <el-form-item label="确认密码">

              <el-input v-model="confirmPassword" type="password" placeholder="确认新密码" show-password />

            </el-form-item>

            <el-form-item>

              <el-button type="danger" @click="resetPassword">重置密码</el-button>

            </el-form-item>

          </el-form>

        </el-tab-pane>

        

        <!-- 邀请记录 -->

        <el-tab-pane label="邀请记录" name="invites">

          <div style="margin-bottom: 12px;">

            <el-descriptions :column="2" border size="small">

              <el-descriptions-item label="邀请码">{{ editForm.invite_code || '未生成' }}</el-descriptions-item>

              <el-descriptions-item label="已邀请人数">{{ userInvites.length }} 人</el-descriptions-item>

            </el-descriptions>

          </div>

          <el-table :data="userInvites" stripe max-height="250" v-loading="invitesLoading">

            <el-table-column prop="email" label="被邀请用户" show-overflow-tooltip />

            <el-table-column prop="user_group" label="用户组" width="100">

              <template #default="{ row }">

                <el-tag :type="getGroupType(row.user_group)" size="small">{{ getGroupName(row.user_group) }}</el-tag>

              </template>

            </el-table-column>

            <el-table-column prop="register_time" label="注册时间" width="165" />

          </el-table>

          <el-empty v-if="userInvites.length === 0 && !invitesLoading" description="暂无邀请记录" />

        </el-tab-pane>

        

        <!-- 佣金记录 -->

        <el-tab-pane label="佣金记录" name="commissions">

          <div style="margin-bottom: 12px;">

            <el-descriptions :column="2" border size="small">

              <el-descriptions-item label="累计佣金">¥{{ commissionStats.total.toFixed(2) }}</el-descriptions-item>

              <el-descriptions-item label="可提现余额">¥{{ commissionStats.available.toFixed(2) }}</el-descriptions-item>

            </el-descriptions>

          </div>

          <el-table :data="userCommissions" stripe max-height="250" v-loading="commissionsLoading">

            <el-table-column prop="from_email" label="来源用户" show-overflow-tooltip />

            <el-table-column prop="amount" label="佣金金额" width="100">

              <template #default="{ row }">

                <span style="color: #f5222d;">+¥{{ row.amount }}</span>

              </template>

            </el-table-column>

            <el-table-column prop="rate" label="比例" width="80">

              <template #default="{ row }">{{ row.rate }}%</template>

            </el-table-column>

            <el-table-column prop="status" label="状态" width="80">

              <template #default="{ row }">

                <el-tag :type="row.status === 'available' ? 'success' : 'info'" size="small">

                  {{ row.status === 'available' ? '可用' : row.status === 'withdrawn' ? '已提现' : '冻结' }}

                </el-tag>

              </template>

            </el-table-column>

            <el-table-column prop="created_at" label="时间" width="165" />

          </el-table>

          <el-empty v-if="userCommissions.length === 0 && !commissionsLoading" description="暂无佣金记录" />

        </el-tab-pane>

      </el-tabs>

      <template #footer>

        <el-button @click="editDialogVisible = false">取消</el-button>

        <el-button type="primary" @click="saveUser">保存修改</el-button>

      </template>

    </el-dialog>

    

    <!-- 登录日志对话框 -->

    <el-dialog v-model="logsDialogVisible" title="登录日志" width="800px">

      <el-table :data="loginLogs" stripe max-height="400">

        <el-table-column prop="login_time" label="时间" width="180" />

        <el-table-column prop="login_ip" label="IP地址" width="150" />

        <el-table-column prop="device_name" label="设备" />

        <el-table-column prop="os_version" label="系统" />

        <el-table-column prop="client_version" label="版本" width="100" />

        <el-table-column prop="login_result" label="结果" width="100">

          <template #default="{ row }">

            <el-tag :type="row.login_result === 'success' ? 'success' : 'danger'">

              {{ row.login_result === 'success' ? '成功' : '失败' }}

            </el-tag>

          </template>

        </el-table-column>

      </el-table>

    </el-dialog>

  </div>

</template>

<script setup>

import { ref, onMounted, watch, computed } from 'vue'

import { ElMessage, ElMessageBox } from 'element-plus'

import { getUsers, updateUser, toggleUserStatus as apiToggleStatus, getUserLogs, getUserInvites, getUserCommissions, exportUsers, resetUserPassword, getUserMachines, unbindUserMachine, bindUserMachine, verifyUserMachine } from '../api'

import { useProductStore } from '../stores/product'

const productStore = useProductStore()

// 监听全局产品切换

watch(() => productStore.currentProduct, () => {

  resetSearch()

})

const loading = ref(false)

const users = ref([])

const page = ref(1)

const pageSize = ref(10)

const total = ref(0)

const searchType = ref('email')

const searchKeyword = ref('')

const selectedUsers = ref([])

const isSearching = ref(false)  // 标记是否在搜索状态

// 搜索占位符
const searchPlaceholder = computed(() => {

  const placeholders = {

    email: '输入邮箱搜索',

    machine_code: '输入机器码搜索',

    card_key: '输入卡密搜索'

  }

  return placeholders[searchType.value] || '搜索'

})

// 重置搜索

const resetSearch = () => {

  searchKeyword.value = ''

  searchType.value = 'email'

  isSearching.value = false

  page.value = 1

  loadUsers()

}

const editDialogVisible = ref(false)

const editForm = ref({})

const editTab = ref('basic')

const durationMode = ref('set')

const customDays = ref(30)

const userMachines = ref([])

const newMachineCode = ref('')

const verifyMachineCode = ref('')

const verifyResult = ref(null)

const newPassword = ref('')

const confirmPassword = ref('')

const logsDialogVisible = ref(false)

const loginLogs = ref([])

// 邀请记录和佣金记录

const userInvites = ref([])

const invitesLoading = ref(false)

const userCommissions = ref([])

const commissionsLoading = ref(false)

const commissionStats = ref({ total: 0, available: 0 })

const getGroupType = (group) => {

  const types = { free: 'info', trial: 'warning', monthly: '', yearly: 'warning', permanent: 'success' }

  return types[group] || 'info'

}

const getGroupName = (group) => {

  const names = { free: '免费用户', trial: '试用会员', monthly: '月卡会员', yearly: '年卡会员', permanent: '永久会员' }

  return names[group] || group

}

// 格式化到期时间显示
const formatExpireTime = (time) => {

  if (!time) return ''

  // 如果是 Date 对象，转换为字符串
  if (time instanceof Date) {

    return time.toLocaleString('zh-CN', { 

      year: 'numeric', month: '2-digit', day: '2-digit',

      hour: '2-digit', minute: '2-digit', second: '2-digit',

      hour12: false

    }).replace(/\//g, '-')

  }

  // 如果已经是字符串，直接返回
  return time

}

// 格式化日期用于提交到后端（MySQL 格式）
const formatDateForSubmit = (time) => {

  if (!time) return null

  

  // 如果是 Date 对象

  if (time instanceof Date) {

    const year = time.getFullYear()

    const month = String(time.getMonth() + 1).padStart(2, '0')

    const day = String(time.getDate()).padStart(2, '0')

    const hours = String(time.getHours()).padStart(2, '0')

    const minutes = String(time.getMinutes()).padStart(2, '0')

    const seconds = String(time.getSeconds()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`

  }

  

  // 如果是字符串

  if (typeof time === 'string') {

    // 如果已经是 MySQL 格式，直接返回
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(time)) {

      return time

    }

    // 如果是 ISO 格式，转换
    if (time.includes('T')) {

      const d = new Date(time)

      return formatDateForSubmit(d)

    }

    // 如果只有日期，补全时间
    if (/^\d{4}-\d{2}-\d{2}$/.test(time)) {

      return time + ' 00:00:00'

    }

  }

  

  return time

}

// 搜索处理

const handleSearch = () => {

  const keyword = searchKeyword.value.trim()

  if (!keyword) {

    ElMessage.warning('请输入搜索关键词')

    return

  }

  isSearching.value = true

  page.value = 1

  loadUsers()

}

// 清除搜索

const handleClearSearch = () => {

  searchKeyword.value = ''

  isSearching.value = false

  page.value = 1

  loadUsers()

}

const loadUsers = async () => {

  loading.value = true

  

  try {

    const params = {

      page: page.value,

      page_size: pageSize.value

    }

    

    // 只有在搜索状态且有关键词时才传递搜索参数
    const keyword = searchKeyword.value.trim()

    if (keyword) {

      params.keyword = keyword

      params.search_type = searchType.value

    }

    

    console.log('[Users] 加载用户列表, 参数:', params)

    

    const res = await getUsers(params)

    if (res.data) {

      users.value = res.data.list || []

      total.value = res.data.total || 0

      

      // 搜索结果为空时提示
      if (keyword && users.value.length === 0) {

        ElMessage.info('未找到匹配的用户')

      }

    }

  } catch (e) {

    console.error('加载用户列表失败', e)

    users.value = []

    total.value = 0

  } finally {

    loading.value = false

  }

}

const showEditDialog = (row) => {

  editForm.value = { ...row }

  editTab.value = 'basic'

  durationMode.value = 'set'

  newPassword.value = ''

  confirmPassword.value = ''

  newMachineCode.value = ''

  verifyMachineCode.value = ''

  verifyResult.value = null

  // 重置机器码列表
  userMachines.value = []

  // 重置邀请和佣金数据

  userInvites.value = []

  userCommissions.value = []

  commissionStats.value = { total: 0, available: 0 }

  // 加载邀请和佣金记录

  loadUserInvites(row.id)

  loadUserCommissions(row.id)

  // 加载机器码绑定列表
  loadUserMachines(row.id)

  editDialogVisible.value = true

}

const loadUserMachines = async (userId) => {

  try {

    const res = await getUserMachines(userId)

    userMachines.value = res.data?.list || []

  } catch (e) {

    console.error('加载机器码列表失败', e)

    userMachines.value = []

  }

}

const loadUserInvites = async (userId) => {

  invitesLoading.value = true

  try {

    const res = await getUserInvites(userId)

    userInvites.value = res.data?.list || []

  } catch (e) {

    console.error('加载邀请记录失败', e)

  } finally {

    invitesLoading.value = false

  }

}

const loadUserCommissions = async (userId) => {

  commissionsLoading.value = true

  try {

    const res = await getUserCommissions(userId)

    userCommissions.value = res.data?.list || []

    commissionStats.value = {

      total: res.data?.total || 0,

      available: res.data?.available || 0

    }

  } catch (e) {

    console.error('加载佣金记录失败', e)

  } finally {

    commissionsLoading.value = false

  }

}

const addDuration = (days) => {

  const current = editForm.value.expire_time ? new Date(editForm.value.expire_time) : new Date()

  if (current < new Date()) {

    current.setTime(Date.now())

  }

  current.setDate(current.getDate() + days)

  editForm.value.expire_time = current.toISOString().slice(0, 19).replace('T', ' ')

  ElMessage.success(`已增加 ${days} 天`)

}

const setPermanent = () => {

  editForm.value.user_group = 'permanent'

  editForm.value.expire_time = null

  ElMessage.success('已设为永久会员')

}

const unbindMachine = async (row) => {

  try {

    await ElMessageBox.confirm(`确定要解绑机器码 ${row.machine_code} 吗？`, '提示', {

      confirmButtonText: '确定',

      cancelButtonText: '取消',

      type: 'warning'

    })

    await unbindUserMachine({

      user_id: editForm.value.id,

      machine_code: row.machine_code

    })

    ElMessage.success('解绑成功')

    loadUserMachines(editForm.value.id)

  } catch (e) {

    // 用户取消或接口错误时无需额外处理

  }

}

const bindMachine = async () => {

  if (!newMachineCode.value) {

    ElMessage.error('请输入机器码')

    return

  }

  try {

    await bindUserMachine({

      user_id: editForm.value.id,

      machine_code: newMachineCode.value.trim()

    })

    ElMessage.success('绑定成功')

    newMachineCode.value = ''

    loadUserMachines(editForm.value.id)

  } catch (e) {

    // 错误已在拦截器处理
  }

}

const verifyMachine = async () => {

  if (!verifyMachineCode.value) {

    ElMessage.error('请输入要验证的机器码')

    return

  }

  try {

    const res = await verifyUserMachine({

      user_id: editForm.value.id,

      machine_code: verifyMachineCode.value.trim()

    })

    const status = res.data?.status

    if (status === 'self') {

      verifyResult.value = true

      ElMessage.success('验证通过：该机器码已绑定到此用户')

    } else if (status === 'other') {

      verifyResult.value = 'other'

      ElMessage.warning('该机器码已绑定到其他用户')

    } else {

      verifyResult.value = false

      ElMessage.error('该机器码未在系统中注册')

    }

  } catch (e) {

    // 错误已在拦截器处理
  }

}

const resetPassword = async () => {

  if (!newPassword.value) {

    ElMessage.error('请输入新密码')

    return

  }

  if (newPassword.value !== confirmPassword.value) {

    ElMessage.error('两次输入的密码不一致')

    return

  }

  ElMessageBox.confirm('确定要重置该用户的密码吗？', '提示', {

    confirmButtonText: '确定',

    cancelButtonText: '取消',

    type: 'warning'

  }).then(() => {

    return resetUserPassword({

      user_id: editForm.value.id,

      new_password: newPassword.value

    })

  }).then(() => {

    ElMessage.success('密码重置成功')

    newPassword.value = ''

    confirmPassword.value = ''

  }).catch(() => {

    // 用户取消或接口错误时无需额外处理

  })

}

const saveUser = async () => {

  try {

    // 准备提交数据

    const submitData = {

      user_id: editForm.value.id,

      user_group: editForm.value.user_group,

      status: editForm.value.status

    }

    

    // 免费用户不发送到期时间（后端会自动清空）

    // 非免费用户才发送到期时间
    if (editForm.value.user_group !== 'free') {

      // 格式化到期时间为 MySQL 格式

      if (editForm.value.expire_time) {

        submitData.expire_time = formatDateForSubmit(editForm.value.expire_time)

      } else {

        submitData.expire_time = null

      }

    }

    

    await updateUser(submitData)

    ElMessage.success('保存成功')

    editDialogVisible.value = false

    loadUsers()

  } catch (e) {

    // 错误已在拦截器处理
  }

}

const showLogsDialog = async (row) => {

  try {

    const res = await getUserLogs(row.id)

    loginLogs.value = res.data

    logsDialogVisible.value = true

  } catch (e) {

    console.error('获取日志失败', e)

  }

}

const toggleStatus = async (row) => {

  const action = row.status === 'active' ? '封禁' : '解封'

  await ElMessageBox.confirm(`确定要${action}用户 ${row.email} 吗？`, '提示', {

    confirmButtonText: '确定',

    cancelButtonText: '取消',

    type: 'warning'

  })

  try {

    await apiToggleStatus(row.id)

    ElMessage.success(`${action}成功`)

    loadUsers()

  } catch (e) {

    // 错误已在拦截器处理
  }

}

const handleSelectionChange = (selection) => {

  selectedUsers.value = selection

}

const batchSetGroup = async () => {

  const { value } = await ElMessageBox.prompt('请选择用户组', '批量设置用户组', {

    inputType: 'select',

    inputPlaceholder: '选择用户组',

    inputValue: 'monthly',

    confirmButtonText: '确定',

    cancelButtonText: '取消'

  }).catch(() => ({ value: null }))

  

  if (!value) return

  

  try {

    let successCount = 0

    for (const user of selectedUsers.value) {

      try {

        await updateUser({

          user_id: user.id,

          user_group: value

        })

        successCount += 1

      } catch (e) {

        // 单个用户失败忽略，继续下一个
      }

    }

    ElMessage.success(`已成功更新 ${successCount} 个用户的用户组`)

    loadUsers()

  } finally {

    selectedUsers.value = []

  }

}

const batchBan = async () => {

  await ElMessageBox.confirm(`确定要封禁选中的 ${selectedUsers.value.length} 个用户吗？`, '批量封禁', {

    confirmButtonText: '确定',

    cancelButtonText: '取消',

    type: 'warning'

  })

  try {

    let successCount = 0

    for (const user of selectedUsers.value) {

      try {

        await updateUser({

          user_id: user.id,

          status: 'banned'

        })

        successCount += 1

      } catch (e) {

        // 单个失败忽略

      }

    }

    ElMessage.success(`已封禁 ${successCount} 个用户`)

    loadUsers()

  } finally {

    selectedUsers.value = []

  }

}

const handleExport = async () => {

  try {

    const res = await exportUsers()

    if (res.data && res.data.csv) {

      const blob = new Blob(['\ufeff' + res.data.csv], { type: 'text/csv;charset=utf-8;' })

      const link = document.createElement('a')

      link.href = URL.createObjectURL(blob)

      link.download = res.data.filename || 'users.csv'

      link.click()

      ElMessage.success('导出成功')

    }

  } catch (e) {

    ElMessage.error('导出失败')

  }

}

const batchUnban = async () => {

  await ElMessageBox.confirm(`确定要解封选中的 ${selectedUsers.value.length} 个用户吗？`, '批量解封', {

    confirmButtonText: '确定',

    cancelButtonText: '取消',

    type: 'success'

  })

  try {

    let successCount = 0

    for (const user of selectedUsers.value) {

      try {

        await updateUser({

          user_id: user.id,

          status: 'active'

        })

        successCount += 1

      } catch (e) {

        // 单个失败忽略

      }

    }

    ElMessage.success(`已解封 ${successCount} 个用户`)

    loadUsers()

  } finally {

    selectedUsers.value = []

  }

}

onMounted(() => {

  loadUsers()

})

</script>

