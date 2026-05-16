import { appSettings } from './settings.svelte';
import type { DubbingSettings } from './settings.svelte';
import {
  normalizeEmotionVector,
  calculateEmotionSum,
} from '$lib/utils/emotion';
import type {
  EngineMode,
  EmotionMethod,
  RightTab,
  GenerationMode,
  EmotionSliders,
} from '$lib/types/dubbing';
import { EMOTION_SLIDER_SUM_MAX } from '$lib/types/dubbing';
import * as ttsApi from '$lib/api/tts';
import type { EngineStatus } from '$lib/api/tts';

function getPersistedSettings(): DubbingSettings {
  return appSettings.settings.dubbing;
}

function applyPersistedSettings(persisted: DubbingSettings): void {
  engineMode = persisted.engineMode;
  intervalSilence = persisted.intervalSilence;
  maxTextTokens = persisted.maxTextTokens;
  bucketMaxSize = persisted.bucketMaxSize;
  temperature = persisted.temperature;
  topP = persisted.topP;
  topK = persisted.topK;
  emoAlpha = persisted.emoAlpha;
}

let engineMode = $state<EngineMode>(getPersistedSettings().engineMode);
let engineAvailable = $state({
  lightweight: { available: true, message: '本地轻量模式可用' },
  emotion: { available: true, message: '情感模式可用' },
  cloud: { available: false, message: '云端模式尚未配置' },
});
let engineChecking = $state(false);

let text = $state('');
let wordCount = $derived(text.replace(/\s/g, '').length);

let voiceId = $state<string | null>(null);
let voiceName = $state('未选择参考音频');
let voiceAudioUrl = $state<string | null>(null);

let intervalSilence = $state(getPersistedSettings().intervalSilence);
let maxTextTokens = $state(getPersistedSettings().maxTextTokens);
let bucketMaxSize = $state(getPersistedSettings().bucketMaxSize);
let temperature = $state(getPersistedSettings().temperature);
let topP = $state(getPersistedSettings().topP);
let topK = $state(getPersistedSettings().topK);
let emoAlpha = $state(getPersistedSettings().emoAlpha);

let generationMode = $state<GenerationMode>('normal');

let emotionMethod = $state<EmotionMethod>('slider');
let emotionSliders = $state<EmotionSliders>({
  happy: 0, angry: 0, sad: 0, afraid: 0,
  disgusted: 0, melancholic: 0, surprised: 0, calm: 0.5
});
let emotionText = $state('');
let emotionAudioPath = $state<string | null>(null);

let isGenerating = $state(false);
let progress = $state(0);
let progressMessage = $state('');
let generationSegmentCurrent = $state(0);
let generationSegmentTotal = $state(0);
let generatedAudioPath = $state<string | null>(null);
let playerWaveformOpen = $state(false);

// 当前流式推理的取消函数
let currentStreamCancel: (() => void) | null = null;

let isPlaying = $state(false);
let currentTime = $state(0);
let duration = $state(0);

let activeTab = $state<RightTab>('audio');

let showEmotionTab = $derived(engineMode !== 'lightweight');
let supportsBatchGeneration = $derived(engineMode === 'lightweight');

function syncSettings() {
  applyPersistedSettings(getPersistedSettings());
}

function setEngine(mode: EngineMode) {
  engineMode = mode;
  void appSettings.saveDubbing({ engineMode: mode });
  if (mode === 'lightweight' && activeTab === 'emotion') {
    activeTab = 'audio';
  }
  if (mode !== 'lightweight' && generationMode === 'batch') {
    generationMode = 'normal';
  }
}

function saveParams() {
  void appSettings.saveDubbing({
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
  currentStreamCancel = null;
}

function cancelGeneration() {
  if (currentStreamCancel) {
    currentStreamCancel();
    currentStreamCancel = null;
  }
  isGenerating = false;
  progress = 0;
  progressMessage = '已取消';
}

function emotionSliderSum(): number {
  return calculateEmotionSum(emotionSliders);
}

function clampEmotionSlidersToSumMax(): void {
  emotionSliders = normalizeEmotionVector(emotionSliders, EMOTION_SLIDER_SUM_MAX);
}

async function checkEngineAvailability(): Promise<void> {
  engineChecking = true;
  try {
    const health = await ttsApi.checkHealth();
    for (const eng of health.engines) {
      if (eng.engine === 'lightweight') {
        engineAvailable.lightweight = {
          available: eng.available,
          message: eng.available ? '轻量引擎可用' : eng.message,
        };
      } else if (eng.engine === 'emotion') {
        engineAvailable.emotion = {
          available: eng.available,
          message: eng.available ? '情感引擎可用' : eng.message,
        };
      }
    }
  } catch {
    // TTS Server 未运行
    engineAvailable.lightweight = { available: false, message: 'TTS 服务未启动' };
    engineAvailable.emotion = { available: false, message: 'TTS 服务未启动' };
  } finally {
    engineChecking = false;
  }
}

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
  set emotionSliders(v: EmotionSliders) { emotionSliders = v; },
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
  get currentStreamCancel() { return currentStreamCancel; },
  set currentStreamCancel(v: (() => void) | null) { currentStreamCancel = v; },
  syncSettings,
  setEngine,
  setText,
  setVoice,
  resetGeneration,
  cancelGeneration,
  clampEmotionSlidersToSumMax,
  checkEngineAvailability,
  saveParams,
};

export type {
  EngineMode,
  EmotionMethod,
  RightTab,
  GenerationMode,
  EmotionSliders,
} from '$lib/types/dubbing';
export { EMOTION_SLIDER_SUM_MAX } from '$lib/types/dubbing';
