/**
 * 日志工具类
 * 生产环境自动移除console语句，开发环境保留
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

class Logger {
  /**
   * 日志输出（开发环境）
   */
  log(...args) {
    if (isDevelopment) {
      console.log('[LOG]', ...args);
    }
  }

  /**
   * 信息输出（开发环境）
   */
  info(...args) {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  }

  /**
   * 警告输出（开发环境）
   */
  warn(...args) {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  }

  /**
   * 错误输出（始终输出，但生产环境可配置）
   */
  error(...args) {
    // 错误日志在生产环境也应该记录，但可以发送到日志服务
    if (isDevelopment) {
      console.error('[ERROR]', ...args);
    } else {
      // 生产环境：可以发送到日志服务
      // 这里暂时使用console.error，但可以通过配置发送到远程日志服务
      console.error('[ERROR]', ...args);
    }
  }

  /**
   * 调试输出（仅开发环境）
   */
  debug(...args) {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  }
}

// 导出单例
export default new Logger();


 * 日志工具类
 * 生产环境自动移除console语句，开发环境保留
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

class Logger {
  /**
   * 日志输出（开发环境）
   */
  log(...args) {
    if (isDevelopment) {
      console.log('[LOG]', ...args);
    }
  }

  /**
   * 信息输出（开发环境）
   */
  info(...args) {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  }

  /**
   * 警告输出（开发环境）
   */
  warn(...args) {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  }

  /**
   * 错误输出（始终输出，但生产环境可配置）
   */
  error(...args) {
    // 错误日志在生产环境也应该记录，但可以发送到日志服务
    if (isDevelopment) {
      console.error('[ERROR]', ...args);
    } else {
      // 生产环境：可以发送到日志服务
      // 这里暂时使用console.error，但可以通过配置发送到远程日志服务
      console.error('[ERROR]', ...args);
    }
  }

  /**
   * 调试输出（仅开发环境）
   */
  debug(...args) {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  }
}

// 导出单例
export default new Logger();

