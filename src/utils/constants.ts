// 应用常量定义

export const APP_NAME = '丸子配音'
export const APP_VERSION = '3.0.0'

// 引擎类型
export const ENGINE_TYPES = {
  LIGHTWEIGHT: 'lightweight',
  EMOTION: 'emotion',
  CLOUD: 'cloud',
} as const

// 文件类型
export const FILE_TYPES = {
  AUDIO: ['wav', 'mp3', 'flac', 'm4a'],
  VIDEO: ['mp4', 'avi', 'mov', 'mkv'],
  SUBTITLE: ['srt', 'vtt', 'ass'],
} as const

// 用户组限制
export const USER_GROUP_LIMITS = {
  free: 500,
  trial: 1000,
  monthly: 100000,
  yearly: 100000,
  permanent: 100000,
} as const

// 参考音频限制
export const REFERENCE_AUDIO_MAX_DURATION = 15 // 秒

// 大文本分批阈值
export const LARGE_TEXT_THRESHOLD = 10000 // 字符数

