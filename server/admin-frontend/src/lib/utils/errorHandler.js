/**
 * 统一错误处理工具
 * 用于统一处理前端错误，向用户展示友好提示
 */

import logger from './logger';

// 错误码映射表 - 将后端错误码映射为用户友好的提示信息
const ERROR_MESSAGES = {
  // 认证相关
  4001: '登录已过期，请重新登录',
  4002: '未授权访问',
  4003: '签名验证失败',
  
  // 参数相关
  1001: '参数错误',
  1002: '缺少必要参数',
  1003: '参数格式不正确',
  
  // 用户相关
  2001: '用户不存在',
  2002: '密码错误',
  2003: '账号已禁用',
  2004: '用户已存在',
  
  // 卡密相关
  3001: '卡密无效',
  3002: '卡密已使用',
  3003: '卡密已过期',
  
  // 请求频率
  4029: '请求过于频繁，请稍后再试',
  
  // 服务器错误
  5000: '服务器配置错误',
  5001: '服务器内部错误',
  5002: '邮件发送失败',
  5003: '数据库操作失败',
  
  // 网络错误
  'NETWORK_ERROR': '网络连接失败，请检查网络设置',
  'TIMEOUT_ERROR': '请求超时，请稍后重试',
  'UNKNOWN_ERROR': '未知错误，请联系管理员'
};

/**
 * 获取用户友好的错误消息
 * @param {Error|string|object} error - 错误对象或消息
 * @returns {string} 用户友好的错误消息
 */
export function getErrorMessage(error) {
  // 如果是字符串，直接返回
  if (typeof error === 'string') {
    return error;
  }
  
  // 如果是Error对象
  if (error instanceof Error) {
    // 检查是否是网络错误
    if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    if (error.message.includes('timeout')) {
      return ERROR_MESSAGES.TIMEOUT_ERROR;
    }
    return error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
  }
  
  // 如果是响应对象
  if (error && typeof error === 'object') {
    // 优先使用code查找错误消息
    if (error.code && ERROR_MESSAGES[error.code]) {
      return ERROR_MESSAGES[error.code];
    }
    // 其次使用message
    if (error.message) {
      return error.message;
    }
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

// 消息提示状态管理
let messageQueue = [];

function showMessage(type, message, duration = 3000) {
  const id = Date.now();
  const msg = { id, type, message, duration };
  messageQueue.push(msg);
  
  // 触发自定义事件
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('show-message', { detail: msg }));
  }
  
  // 自动移除
  setTimeout(() => {
    messageQueue = messageQueue.filter(m => m.id !== id);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hide-message', { detail: { id } }));
    }
  }, duration);
}

/**
 * 显示错误提示
 * @param {Error|string|object} error - 错误对象或消息
 * @param {object} options - 选项
 * @param {number} options.duration - 显示时长（毫秒）
 * @param {boolean} options.showStackTrace - 是否显示堆栈信息（开发环境）
 */
export function showError(error, options = {}) {
  const message = getErrorMessage(error);
  const duration = options.duration || 3000;
  const showStackTrace = options.showStackTrace || false;
  
  // 开发环境可以显示详细错误信息
  const isDev = import.meta.env?.MODE === 'development';
  
  if (isDev && showStackTrace && error instanceof Error) {
    logger.error('[Error Handler]', error);
  }
  
  showMessage('error', message, duration);
}

/**
 * 显示成功提示
 * @param {string} message - 成功消息
 * @param {number} duration - 显示时长（毫秒）
 */
export function showSuccess(message, duration = 2000) {
  showMessage('success', message, duration);
}

/**
 * 显示警告提示
 * @param {string} message - 警告消息
 * @param {number} duration - 显示时长（毫秒）
 */
export function showWarning(message, duration = 3000) {
  showMessage('warning', message, duration);
}

/**
 * 显示信息提示
 * @param {string} message - 信息消息
 * @param {number} duration - 显示时长（毫秒）
 */
export function showInfo(message, duration = 2000) {
  showMessage('info', message, duration);
}

/**
 * 统一错误处理包装器
 * 用于包装异步函数，自动捕获并显示错误
 * @param {Function} asyncFn - 异步函数
 * @param {object} options - 选项
 * @param {string} options.errorMessage - 自定义错误消息
 * @param {boolean} options.silent - 是否静默处理（不显示错误提示）
 * @returns {Function} 包装后的函数
 */
export function withErrorHandler(asyncFn, options = {}) {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      if (!options.silent) {
        const message = options.errorMessage || getErrorMessage(error);
        showError(message);
      }
      throw error;
    }
  };
}

/**
 * 处理API错误响应
 * @param {object} response - API响应对象
 * @param {boolean} silent - 是否静默处理
 */
export function handleApiError(response, silent = false) {
  if (silent) {
    return;
  }
  
  const message = response?.message || getErrorMessage(response);
  showError(message);
}

export default {
  showError,
  showSuccess,
  showWarning,
  showInfo,
  getErrorMessage,
  withErrorHandler,
  handleApiError
};


 * 统一错误处理工具
 * 用于统一处理前端错误，向用户展示友好提示
 */

import logger from './logger';

// 错误码映射表 - 将后端错误码映射为用户友好的提示信息
const ERROR_MESSAGES = {
  // 认证相关
  4001: '登录已过期，请重新登录',
  4002: '未授权访问',
  4003: '签名验证失败',
  
  // 参数相关
  1001: '参数错误',
  1002: '缺少必要参数',
  1003: '参数格式不正确',
  
  // 用户相关
  2001: '用户不存在',
  2002: '密码错误',
  2003: '账号已禁用',
  2004: '用户已存在',
  
  // 卡密相关
  3001: '卡密无效',
  3002: '卡密已使用',
  3003: '卡密已过期',
  
  // 请求频率
  4029: '请求过于频繁，请稍后再试',
  
  // 服务器错误
  5000: '服务器配置错误',
  5001: '服务器内部错误',
  5002: '邮件发送失败',
  5003: '数据库操作失败',
  
  // 网络错误
  'NETWORK_ERROR': '网络连接失败，请检查网络设置',
  'TIMEOUT_ERROR': '请求超时，请稍后重试',
  'UNKNOWN_ERROR': '未知错误，请联系管理员'
};

/**
 * 获取用户友好的错误消息
 * @param {Error|string|object} error - 错误对象或消息
 * @returns {string} 用户友好的错误消息
 */
export function getErrorMessage(error) {
  // 如果是字符串，直接返回
  if (typeof error === 'string') {
    return error;
  }
  
  // 如果是Error对象
  if (error instanceof Error) {
    // 检查是否是网络错误
    if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    if (error.message.includes('timeout')) {
      return ERROR_MESSAGES.TIMEOUT_ERROR;
    }
    return error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
  }
  
  // 如果是响应对象
  if (error && typeof error === 'object') {
    // 优先使用code查找错误消息
    if (error.code && ERROR_MESSAGES[error.code]) {
      return ERROR_MESSAGES[error.code];
    }
    // 其次使用message
    if (error.message) {
      return error.message;
    }
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

// 消息提示状态管理
let messageQueue = [];

function showMessage(type, message, duration = 3000) {
  const id = Date.now();
  const msg = { id, type, message, duration };
  messageQueue.push(msg);
  
  // 触发自定义事件
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('show-message', { detail: msg }));
  }
  
  // 自动移除
  setTimeout(() => {
    messageQueue = messageQueue.filter(m => m.id !== id);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hide-message', { detail: { id } }));
    }
  }, duration);
}

/**
 * 显示错误提示
 * @param {Error|string|object} error - 错误对象或消息
 * @param {object} options - 选项
 * @param {number} options.duration - 显示时长（毫秒）
 * @param {boolean} options.showStackTrace - 是否显示堆栈信息（开发环境）
 */
export function showError(error, options = {}) {
  const message = getErrorMessage(error);
  const duration = options.duration || 3000;
  const showStackTrace = options.showStackTrace || false;
  
  // 开发环境可以显示详细错误信息
  const isDev = import.meta.env?.MODE === 'development';
  
  if (isDev && showStackTrace && error instanceof Error) {
    logger.error('[Error Handler]', error);
  }
  
  showMessage('error', message, duration);
}

/**
 * 显示成功提示
 * @param {string} message - 成功消息
 * @param {number} duration - 显示时长（毫秒）
 */
export function showSuccess(message, duration = 2000) {
  showMessage('success', message, duration);
}

/**
 * 显示警告提示
 * @param {string} message - 警告消息
 * @param {number} duration - 显示时长（毫秒）
 */
export function showWarning(message, duration = 3000) {
  showMessage('warning', message, duration);
}

/**
 * 显示信息提示
 * @param {string} message - 信息消息
 * @param {number} duration - 显示时长（毫秒）
 */
export function showInfo(message, duration = 2000) {
  showMessage('info', message, duration);
}

/**
 * 统一错误处理包装器
 * 用于包装异步函数，自动捕获并显示错误
 * @param {Function} asyncFn - 异步函数
 * @param {object} options - 选项
 * @param {string} options.errorMessage - 自定义错误消息
 * @param {boolean} options.silent - 是否静默处理（不显示错误提示）
 * @returns {Function} 包装后的函数
 */
export function withErrorHandler(asyncFn, options = {}) {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      if (!options.silent) {
        const message = options.errorMessage || getErrorMessage(error);
        showError(message);
      }
      throw error;
    }
  };
}

/**
 * 处理API错误响应
 * @param {object} response - API响应对象
 * @param {boolean} silent - 是否静默处理
 */
export function handleApiError(response, silent = false) {
  if (silent) {
    return;
  }
  
  const message = response?.message || getErrorMessage(response);
  showError(message);
}

export default {
  showError,
  showSuccess,
  showWarning,
  showInfo,
  getErrorMessage,
  withErrorHandler,
  handleApiError
};

