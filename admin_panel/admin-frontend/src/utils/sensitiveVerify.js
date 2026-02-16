/**
 * 敏感操作二次验证工具
 * 
 * 使用方式：
 * 1. App.vue 中挂载 SensitiveVerify 组件并注册 setSensitiveVerifyRef
 * 2. 需要敏感操作的地方调用 requireVerify() 获取 verify_token
 * 3. axios 拦截器自动附加 X-Verify-Token 头
 * 4. 后端返回 4010 时自动弹出验证弹窗并重试请求
 */

let verifyRef = null

export function setSensitiveVerifyRef(ref) {
  verifyRef = ref
}

/**
 * 主动要求验证（用于在操作前预先验证）
 * @returns {Promise<string>} verify_token
 */
export async function requireVerify() {
  // 检查是否有未过期的 verify_token（5分钟有效）
  const token = sessionStorage.getItem('verify_token')
  const tokenTime = parseInt(sessionStorage.getItem('verify_token_time') || '0')
  if (token && Date.now() - tokenTime < 4.5 * 60 * 1000) {
    return token
  }
  
  // 弹出验证弹窗
  if (!verifyRef) {
    throw new Error('验证组件未初始化')
  }
  return verifyRef.open()
}

/**
 * 处理 4010 错误：弹出验证弹窗，验证成功后重试原请求
 * @param {object} originalConfig axios 原始请求配置
 * @param {object} api axios 实例
 * @returns {Promise} 重试后的响应
 */
export async function handleSensitiveError(originalConfig, api) {
  if (!verifyRef) {
    throw new Error('验证组件未初始化')
  }
  
  try {
    const token = await verifyRef.open()
    // 重试原请求，附加 verify_token
    originalConfig.headers['X-Verify-Token'] = token
    originalConfig._retried = true
    return api(originalConfig)
  } catch (e) {
    throw new Error('操作已取消')
  }
}
