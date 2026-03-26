/**
 * 配音模块类型定义
 * 集中管理所有与配音相关的类型
 */

/** 引擎模式 */
export type EngineMode = 'lightweight' | 'emotion' | 'cloud';

/** 情感输入方式 */
export type EmotionMethod = 'slider' | 'text' | 'audio';

/** 右侧面板标签 */
export type RightTab = 'audio' | 'params' | 'emotion';

/** 生成模式 */
export type GenerationMode = 'normal' | 'batch';

/** 样音来源类型 */
export type VoiceSourceType = 'upload' | 'preset';

/** 情感滑块值 */
export interface EmotionSliders {
  happy: number;
  angry: number;
  sad: number;
  afraid: number;
  disgusted: number;
  melancholic: number;
  surprised: number;
  calm: number;
}

/** 引擎可用状态 */
export interface EngineAvailability {
  lightweight: boolean;
  emotion: boolean;
  cloud: boolean;
}

/** 生成进度信息 */
export interface GenerationProgress {
  isGenerating: boolean;
  progress: number;
  progressMessage: string;
  segmentCurrent: number;
  segmentTotal: number;
}

/** 音频播放状态 */
export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

/** 参考音频信息 */
export interface VoiceSample {
  id: string | null;
  name: string;
  audioUrl: string | null;
}

/** IndexTTS 情感向量归一化上限 */
export const EMOTION_SLIDER_SUM_MAX = 0.8;
