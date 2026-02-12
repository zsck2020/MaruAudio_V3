<template>
  <div>
    <div class="page-header">
      <h3 class="page-title">营销活动</h3>
    </div>
    
    <el-row :gutter="20">
      <!-- 免费试用 -->
      <el-col :span="24" style="margin-bottom: 20px;">
        <div class="table-card">
          <h4 style="margin-top: 0;">
            <el-icon><Clock /></el-icon> 免费试用
          </h4>
          <el-form :model="trialForm" label-width="130px">
            <el-form-item label="开启免费试用">
              <el-switch v-model="trialForm.enabled" />
              <span style="margin-left: 12px; color: #666;">{{ trialForm.enabled ? '新用户注册后可免费试用' : '已关闭免费试用' }}</span>
            </el-form-item>
            <el-form-item label="试用时长">
              <el-input-number v-model="trialForm.duration_days" :min="1" :max="30" :disabled="!trialForm.enabled" style="width: 180px;" />
              <span style="margin-left: 12px; color: #666;">天</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveTrialSettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-col>
      
      <!-- 邀请奖励 -->
      <el-col :span="24" style="margin-bottom: 20px;">
        <div class="table-card">
          <h4 style="margin-top: 0;">
            <el-icon><UserFilled /></el-icon> 邀请奖励（专属邀请码）
          </h4>
          <el-alert type="info" :closable="false" style="margin-bottom: 15px;">
            每个用户拥有固定的专属邀请码，好友通过邀请码注册后，邀请人累计获得奖励天数
          </el-alert>
          <el-form :model="inviteForm" label-width="130px">
            <el-form-item label="开启邀请奖励">
              <el-switch v-model="inviteForm.enabled" />
            </el-form-item>
            <el-form-item label="奖励规则">
              <div>
                <div v-for="(rule, index) in inviteForm.rules" :key="index" style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                  <span>邀请</span>
                  <el-input-number v-model="rule.invite_count" :min="1" :max="100" style="width: 120px;" />
                  <span>人注册，送</span>
                  <el-input-number v-model="rule.reward_days" :min="1" :max="365" style="width: 120px;" />
                  <span>天会员</span>
                  <el-button type="danger" link @click="removeInviteRule(index)" v-if="inviteForm.rules.length > 1">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
                <el-button type="primary" link @click="addInviteRule">
                  <el-icon><Plus /></el-icon> 添加规则
                </el-button>
              </div>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveInviteSettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-col>
      
      <!-- 推广佣金 -->
      <el-col :span="24" style="margin-bottom: 20px;">
        <div class="table-card">
          <h4 style="margin-top: 0;">
            <el-icon><Money /></el-icon> 推广佣金（专属邀请码）
          </h4>
          <el-alert type="info" :closable="false" style="margin-bottom: 15px;">
            好友通过邀请码注册并开通会员，邀请人获得佣金，可申请提现
          </el-alert>
          <el-form :model="commissionForm" label-width="130px">
            <el-form-item label="开启推广佣金">
              <el-switch v-model="commissionForm.enabled" />
            </el-form-item>
            <el-form-item label="推广门槛">
              <el-radio-group v-model="commissionForm.threshold">
                <el-radio label="all">所有人都可推广</el-radio>
                <el-radio label="vip">开通会员才能推广</el-radio>
                <el-radio label="level">指定会员等级可推广</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="commissionForm.threshold === 'level'" label="最低会员等级">
              <el-select v-model="commissionForm.min_level" style="width: 180px;">
                <el-option label="月卡会员" value="monthly" />
                <el-option label="年卡会员" value="yearly" />
                <el-option label="永久会员" value="permanent" />
              </el-select>
            </el-form-item>
            <el-form-item label="佣金比例">
              <el-input-number v-model="commissionForm.rate" :min="1" :max="50" :disabled="!commissionForm.enabled" style="width: 180px;" />
              <span style="margin-left: 12px; color: #666;">%（好友开通会员费用的百分比）</span>
            </el-form-item>
            <el-form-item label="最低提现金额">
              <el-input-number v-model="commissionForm.min_withdraw" :min="1" :max="1000" :disabled="!commissionForm.enabled" style="width: 180px;" />
              <span style="margin-left: 12px; color: #666;">元</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveCommissionSettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getSettings, updateSettings } from '../api'

// 免费试用设置
const trialForm = reactive({
  enabled: true,
  duration_days: 3
})

// 邀请奖励设置
const inviteForm = reactive({
  enabled: true,
  rules: [
    { invite_count: 1, reward_days: 3 },
    { invite_count: 3, reward_days: 7 },
    { invite_count: 5, reward_days: 15 }
  ]
})

// 推广佣金设置
const commissionForm = reactive({
  enabled: true,
  threshold: 'all',
  min_level: 'monthly',
  rate: 10,
  min_withdraw: 50
})

const addInviteRule = () => {
  const lastRule = inviteForm.rules[inviteForm.rules.length - 1]
  inviteForm.rules.push({
    invite_count: lastRule.invite_count + 2,
    reward_days: lastRule.reward_days + 7
  })
}

const removeInviteRule = (index) => {
  inviteForm.rules.splice(index, 1)
}

const loadSettings = async () => {
  try {
    const res = await getSettings()
    if (res.data) {
      trialForm.enabled = res.data.trial_enabled === '1' || res.data.trial_enabled === true
      trialForm.duration_days = parseInt(res.data.trial_duration_days) || 3
      inviteForm.enabled = res.data.invite_enabled === '1' || res.data.invite_enabled === true
      if (res.data.invite_rules) {
        try {
          inviteForm.rules = JSON.parse(res.data.invite_rules)
        } catch (e) {}
      }
      commissionForm.enabled = res.data.commission_enabled === '1' || res.data.commission_enabled === true
      commissionForm.threshold = res.data.commission_threshold || 'all'
      commissionForm.min_level = res.data.commission_min_level || 'monthly'
      commissionForm.rate = parseInt(res.data.commission_rate) || 10
      commissionForm.min_withdraw = parseInt(res.data.commission_min_withdraw) || 50
    }
  } catch (e) {
    console.error('加载设置失败', e)
  }
}

const saveTrialSettings = async () => {
  try {
    await updateSettings({
      trial_enabled: trialForm.enabled ? '1' : '0',
      trial_duration_days: String(trialForm.duration_days)
    })
    ElMessage.success('免费试用设置已保存')
  } catch (e) {}
}

const saveInviteSettings = async () => {
  try {
    await updateSettings({
      invite_enabled: inviteForm.enabled ? '1' : '0',
      invite_rules: JSON.stringify(inviteForm.rules)
    })
    ElMessage.success('邀请奖励设置已保存')
  } catch (e) {}
}

const saveCommissionSettings = async () => {
  try {
    await updateSettings({
      commission_enabled: commissionForm.enabled ? '1' : '0',
      commission_threshold: commissionForm.threshold,
      commission_min_level: commissionForm.min_level,
      commission_rate: String(commissionForm.rate),
      commission_min_withdraw: String(commissionForm.min_withdraw)
    })
    ElMessage.success('推广佣金设置已保存')
  } catch (e) {}
}

onMounted(() => {
  loadSettings()
})
</script>
