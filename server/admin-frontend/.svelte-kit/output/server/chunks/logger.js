class Logger {
  /**
   * 日志输出（开发环境）
   */
  log(...args) {
  }
  /**
   * 信息输出（开发环境）
   */
  info(...args) {
  }
  /**
   * 警告输出（开发环境）
   */
  warn(...args) {
  }
  /**
   * 错误输出（始终输出，但生产环境可配置）
   */
  error(...args) {
    {
      console.error("[ERROR]", ...args);
    }
  }
  /**
   * 调试输出（仅开发环境）
   */
  debug(...args) {
  }
}
const logger = new Logger();
export {
  logger as l
};
