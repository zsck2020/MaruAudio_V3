/**
 * 预置样音分类配置
 * 用于预置样音页面的快速分类入口
 */

export interface VoiceCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const VOICE_CATEGORIES: VoiceCategory[] = [
  { id: 'male', name: '男声', icon: 'user', color: '#3B82F6' },
  { id: 'female', name: '女声', icon: 'user', color: '#EC4899' },
  { id: 'movie', name: '影视', icon: 'play-circle', color: '#8B5CF6' },
  { id: 'emotion', name: '情感', icon: 'heart', color: '#EF4444' },
  { id: 'narration', name: '旁白', icon: 'mic', color: '#10B981' },
  { id: 'favorite', name: '收藏', icon: 'star', color: '#F59E0B' },
];

/**
 * 最近使用样音（模拟数据）
 * TODO: 接入实际的历史记录存储
 */
export interface RecentVoice {
  id: string;
  name: string;
  usageCount: number;
}

export const RECENT_VOICES: RecentVoice[] = [
  { id: '1', name: '男声沉稳', usageCount: 3 },
  { id: '2', name: '女声温柔', usageCount: 1 },
];
