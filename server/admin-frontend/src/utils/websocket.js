/**
 * 管理后台 WebSocket 客户端
 */

import logger from './logger'

// 安全修复：从环境变量或配置读取WebSocket地址，避免硬编码
function getWebSocketUrl() {
  // 优先使用环境变量
  if (import.meta.env && import.meta.env.VITE_WEBSOCKET_URL) {
    return import.meta.env.VITE_WEBSOCKET_URL
  }
  // 其次使用window配置
  if (window.WEBSOCKET_URL) {
    return window.WEBSOCKET_URL
  }
  // 默认值（开发环境）
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.hostname
  const port = import.meta.env && import.meta.env.VITE_WEBSOCKET_PORT ? import.meta.env.VITE_WEBSOCKET_PORT : '8080'
  return `${protocol}//${host}:${port}`
}

class AdminWebSocket {
  constructor(url = null) {
    this.url = url || getWebSocketUrl()
    this.ws = null
    this.connected = false
    this.authenticated = false
    this.token = null
    
    // 事件回调
    this.callbacks = {}
    
    // 重连配置
    this.autoReconnect = true
    this.reconnectInterval = 5000 // 毫秒
    this.reconnectTimer = null
    
    // 心跳配置
    this.heartbeatInterval = 30000 // 毫秒
    this.heartbeatTimer = null
  }
  
  /**
   * 连接 WebSocket 服务器
   */
  connect(token) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve(true)
    }
    
    this.token = token
    
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)
        
        this.ws.onopen = () => {
          this.connected = true
          logger.log('[WebSocket] 已连接')
          this._emit('connected')
          
          // 发送认证
          if (this.token) {
            this.send({
              type: 'auth',
              token: this.token,
              client_type: 'admin'
            })
          }
          
          // 启动心跳
          this._startHeartbeat()
          
          resolve(true)
        }
        
        this.ws.onmessage = (event) => {
          this._handleMessage(event.data)
        }
        
        this.ws.onerror = (error) => {
          logger.error('[WebSocket] 错误:', error)
          this._emit('error', error)
          reject(error)
        }
        
        this.ws.onclose = (event) => {
          this.connected = false
          this.authenticated = false
          logger.log('[WebSocket] 已断开:', event.code, event.reason)
          this._emit('disconnected', { code: event.code, reason: event.reason })
          
          // 停止心跳
          this._stopHeartbeat()
          
          // 自动重连
          if (this.autoReconnect) {
            this._startReconnect()
          }
        }
        
      } catch (error) {
        reject(error)
      }
    })
  }
  
  /**
   * 断开连接
   */
  disconnect() {
    this.autoReconnect = false
    this._stopReconnect()
    this._stopHeartbeat()
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    this.connected = false
    this.authenticated = false
  }
  
  /**
   * 发送消息
   */
  send(data) {
    if (!this.connected || !this.ws) {
      return false
    }
    
    try {
      this.ws.send(JSON.stringify(data))
      return true
    } catch (error) {
      logger.error('[WebSocket] 发送失败:', error)
      return false
    }
  }
  
  /**
   * 注册事件回调
   */
  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = []
    }
    this.callbacks[event].push(callback)
  }
  
  /**
   * 移除事件回调
   */
  off(event, callback = null) {
    if (this.callbacks[event]) {
      if (callback) {
        this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback)
      } else {
        this.callbacks[event] = []
      }
    }
  }
  
  /**
   * 触发事件
   */
  _emit(event, data = null) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          logger.error(`[WebSocket] 回调错误 [${event}]:`, error)
        }
      })
    }
  }
  
  /**
   * 处理消息
   */
  _handleMessage(message) {
    try {
      const data = JSON.parse(message)
      const msgType = data.type || ''
      
      logger.log('[WebSocket] 收到消息:', msgType)
      
      switch (msgType) {
        case 'auth_success':
          this.authenticated = true
          logger.log('[WebSocket] 认证成功')
          this._emit('authenticated', data)
          // 请求在线用户状态
          this.send({ type: 'user_status_request' })
          break
          
        case 'auth_error':
          this.authenticated = false
          logger.error('[WebSocket] 认证失败:', data.message)
          this._emit('auth_error', data)
          break
          
        case 'pong':
          // 心跳响应
          break
          
        case 'user_online':
          this._emit('user_online', data)
          break
          
        case 'user_offline':
          this._emit('user_offline', data)
          break
          
        case 'user_status':
          this._emit('user_status', data)
          break
          
        case 'user_status_changed':
          this._emit('user_status_changed', data)
          break
          
        default:
          this._emit(msgType, data)
          this._emit('message', data)
      }
      
    } catch (error) {
      logger.error('[WebSocket] 消息解析失败:', message)
    }
  }
  
  /**
   * 启动心跳
   */
  _startHeartbeat() {
    this._stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.connected) {
        this.send({ type: 'ping' })
      }
    }, this.heartbeatInterval)
  }
  
  /**
   * 停止心跳
   */
  _stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }
  
  /**
   * 启动重连
   */
  _startReconnect() {
    this._stopReconnect()
    logger.log(`[WebSocket] 将在 ${this.reconnectInterval / 1000} 秒后重连...`)
    this.reconnectTimer = setTimeout(() => {
      logger.log('[WebSocket] 尝试重连...')
      this.connect(this.token)
    }, this.reconnectInterval)
  }
  
  /**
   * 停止重连
   */
  _stopReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }
  
  /**
   * 广播消息给所有用户
   */
  broadcast(event, data) {
    return this.send({
      type: 'admin_broadcast',
      payload: {
        type: event,
        data: data
      }
    })
  }
  
  /**
   * 请求在线用户状态
   */
  requestUserStatus() {
    return this.send({ type: 'user_status_request' })
  }
}

// 创建单例
const adminWs = new AdminWebSocket()

export default adminWs
export { AdminWebSocket }
