import { appSettings } from './settings.svelte';

export type EngineMode = 'lightweight' | 'emotion' | 'cloud';
/** 情感输入：滑块 / 文本 / 音频（设计文档三种方式，默认滑块） */
export type EmotionMethod = 'slider' | 'text' | 'audio';
export type RightTab = 'audio' | 'params' | 'emotion';

// 从持久化设置初始化
let engineMode = $state<EngineMode>(appSettings.settings.dubbing.engineMode);
/** 引擎是否可用（绿点）；云端常因未登录为 false */
let engineAvailable = $state({ lightweight: true, emotion: true, cloud: false });
/** 引擎检测中（黄点），对接 tts_engine_status 时可置 true */
let engineChecking = $state(false);

let text = $state('');
let wordCount = $derived(text.replace(/\s/g, '').length);

let voiceId = $state<string | null>(null);
let voiceName = $state('默认音色');
let voiceAudioUrl = $state<string | null>(null);

// 从持久化设置初始化参数
let intervalSilence = $state(appSettings.settings.dubbing.intervalSilence);
/** IndexTTS：1.5/2.0 常用每段 max_text_tokens 约 100~120；UI 保守上限 200 */
let maxTextTokens = $state(appSettings.settings.dubbing.maxTextTokens);
let bucketMaxSize = $state(appSettings.settings.dubbing.bucketMaxSize);
/** IndexTTS 1.5 默认温度 1.0；2.0 默认 0.8 — 默认按当前主引擎 1.5 */
let temperature = $state(appSettings.settings.dubbing.temperature);
let topP = $state(appSettings.settings.dubbing.topP);
let topK = $state(appSettings.settings.dubbing.topK);
/** IndexTTS 2.0：文本情感建议 emo_alpha≤0.6；默认 0.6 */
let emoAlpha = $state(appSettings.settings.dubbing.emoAlpha);

export type GenerationMode = 'normal' | 'batch';
let generationMode = $state<GenerationMode>('normal');

let emotionMethod = $state<EmotionMethod>('slider');
let emotionSliders = $state({
  happy: 0, angry: 0, sad: 0, afraid: 0,
  disgusted: 0, melancholic: 0, surprised: 0, calm: 0.5
});
let emotionText = $state('');
let emotionAudioPath = $state<string | null>(null);

let isGenerating = $state(false);
let progress = $state(0);
let progressMessage = $state('');
/** 生成进度：当前段 / 总段（设计文档播放器文案） */
let generationSegmentCurrent = $state(0);
let generationSegmentTotal = $state(0);
let generatedAudioPath = $state<string | null>(null);
/** 底部栏波形区展开 */
let playerWaveformOpen = $state(false);

let isPlaying = $state(false);
let currentTime = $state(0);
let duration = $state(0);

let activeTab = $state<RightTab>('audio');

let showEmotionTab = $derived(engineMode !== 'lightweight');

/** IndexTTS 1.5 支持 infer_fast 桶化批处理；2.0 为逐段顺序推理，前端不提供批次模式 */
let supportsBatchGeneration = $derived(engineMode === 'lightweight');

function setEngine(mode: EngineMode) {
  engineMode = mode;
  // 持久化设置
  appSettings.saveDubbing({ engineMode: mode });
  if (mode === 'lightweight' && activeTab === 'emotion') {
    activeTab = 'audio';
  }
  if (mode !== 'lightweight' && generationMode === 'batch') {
    generationMode = 'normal';
  }
}

/** 保存当前参数到持久化存储 */
function saveParams() {
  appSettings.saveDubbing({
    engineMode,
    intervalSilence,
    maxTextTokens,
    bucketMaxSize,
    temperature,
    topP,
    topK,
    emoAlpha,
  });
}

function setText(value: string) {
  text = value;
}

function setVoice(id: string | null, name: string, audioUrl: string | null = null) {
  voiceId = id;
  voiceName = name;
  voiceAudioUrl = audioUrl;
}

function resetGeneration() {
  isGenerating = false;
  progress = 0;
  progressMessage = '';
  generationSegmentCurrent = 0;
  generationSegmentTotal = 0;
  generatedAudioPath = null;
  isPlaying = false;
  currentTime = 0;
  duration = 0;
  playerWaveformOpen = false;
}

function emotionSliderSum(): number {
  const e = emotionSliders;
  return e.happy + e.angry + e.sad + e.afraid + e.disgusted + e.melancholic + e.surprised + e.calm;
}

function clampEmotionSlidersToSumMax(): void {
  const sum = emotionSliderSum();
  if (sum <= EMOTION_SLIDER_SUM_MAX || sum === 0) return;
  const scale = EMOTION_SLIDER_SUM_MAX / sum;
  emotionSliders = {
    happy: emotionSliders.happy * scale,
    angry: emotionSliders.angry * scale,
    sad: emotionSliders.sad * scale,
    afraid: emotionSliders.afraid * scale,
    disgusted: emotionSliders.disgusted * scale,
    melancholic: emotionSliders.melancholic * scale,
    surprised: emotionSliders.surprised * scale,
    calm: emotionSliders.calm * scale,
  };
}

/** IndexTTS 2.0 normalize_emo_vec：情感向量总和上限 0.8（与引擎一致） */
export const EMOTION_SLIDER_SUM_MAX = 0.8;

export const dubbing = {
  get engineMode() { return engineMode; },
  get engineAvailable() { return engineAvailable; },
  set engineAvailable(v: typeof engineAvailable) { engineAvailable = v; },
  get engineChecking() { return engineChecking; },
  set engineChecking(v: boolean) { engineChecking = v; },
  get text() { return text; },
  get wordCount() { return wordCount; },
  get voiceId() { return voiceId; },
  get voiceName() { return voiceName; },
  get voiceAudioUrl() { return voiceAudioUrl; },
  get intervalSilence() { return intervalSilence; },
  set intervalSilence(v: number) { intervalSilence = v; },
  get maxTextTokens() { return maxTextTokens; },
  set maxTextTokens(v: number) { maxTextTokens = v; },
  get bucketMaxSize() { return bucketMaxSize; },
  set bucketMaxSize(v: number) { bucketMaxSize = v; },
  get generationMode() { return generationMode; },
  set generationMode(v: GenerationMode) { generationMode = v; },
  get temperature() { return temperature; },
  set temperature(v: number) { temperature = v; },
  get topP() { return topP; },
  set topP(v: number) { topP = v; },
  get topK() { return topK; },
  set topK(v: number) { topK = v; },
  get emoAlpha() { return emoAlpha; },
  set emoAlpha(v: number) { emoAlpha = v; },
  get emotionMethod() { return emotionMethod; },
  set emotionMethod(v: EmotionMethod) { emotionMethod = v; },
  get emotionSliders() { return emotionSliders; },
  set emotionSliders(v: typeof emotionSliders) { emotionSliders = v; },
  get emotionText() { return emotionText; },
  set emotionText(v: string) { emotionText = v; },
  get emotionAudioPath() { return emotionAudioPath; },
  set emotionAudioPath(v: string | null) { emotionAudioPath = v; },
  get isGenerating() { return isGenerating; },
  set isGenerating(v: boolean) { isGenerating = v; },
  get progress() { return progress; },
  set progress(v: number) { progress = v; },
  get progressMessage() { return progressMessage; },
  set progressMessage(v: string) { progressMessage = v; },
  get generationSegmentCurrent() { return generationSegmentCurrent; },
  set generationSegmentCurrent(v: number) { generationSegmentCurrent = v; },
  get generationSegmentTotal() { return generationSegmentTotal; },
  set generationSegmentTotal(v: number) { generationSegmentTotal = v; },
  get generatedAudioPath() { return generatedAudioPath; },
  set generatedAudioPath(v: string | null) { generatedAudioPath = v; },
  get isPlaying() { return isPlaying; },
  set isPlaying(v: boolean) { isPlaying = v; },
  get currentTime() { return currentTime; },
  set currentTime(v: number) { currentTime = v; },
  get duration() { return duration; },
  set duration(v: number) { duration = v; },
  get activeTab() { return activeTab; },
  set activeTab(v: RightTab) { activeTab = v; },
  get showEmotionTab() { return showEmotionTab; },
  get supportsBatchGeneration() { return supportsBatchGeneration; },
  get playerWaveformOpen() { return playerWaveformOpen; },
  set playerWaveformOpen(v: boolean) { playerWaveformOpen = v; },
  setEngine,
  setText,
  setVoice,
  resetGeneration,
  clampEmotionSlidersToSumMax,
  saveParams,
};
