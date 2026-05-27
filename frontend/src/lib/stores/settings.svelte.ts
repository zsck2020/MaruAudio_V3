import { Store } from '@tauri-apps/plugin-store';
import { invoke } from '@tauri-apps/api/core';

let store: Store | null = null;
let initPromise: Promise<void> | null = null;

async function getStore(): Promise<Store> {
  if (!store) {
    store = await Store.load('settings.json');
  }
  return store;
}

/**
 * LLM API Key 走 Rust 端加密 store（与 auth_token 同款 AES-256-GCM）；
 * Web/vitest 环境下 fallback 到内存缓存，避免明文落 settings.json
 */
let _llmApiKeyMemoryCache: string = '';

async function loadLlmApiKey(): Promise<string> {
  try {
    const key = await invoke<string | null>('llm_get_api_key');
    return key ?? '';
  } catch {
    // 非 Tauri 环境（vitest jsdom）或调用失败，用内存值兜底
    return _llmApiKeyMemoryCache;
  }
}

async function persistLlmApiKey(apiKey: string): Promise<void> {
  _llmApiKeyMemoryCache = apiKey;
  try {
    await invoke('llm_save_api_key', { apiKey });
  } catch {
    // 非 Tauri 环境，仅保留内存值
  }
}

const defaultSettings = {
  dubbing: {
    engineMode: 'lightweight' as 'lightweight' | 'emotion' | 'cloud',
    intervalSilence: 200,
    maxTextTokens: 100,
    bucketMaxSize: 4,
    temperature: 1.0,
    topP: 0.8,
    topK: 30,
    emoAlpha: 0.6,
    /** 计算设备：auto / gpu / cpu */
    device: 'auto' as 'auto' | 'gpu' | 'cpu',
    /** 显存使用上限百分比 50-95 */
    vramLimit: 85,
    /** 并行推理任务数 1-8 */
    parallelTasks: 2,
    /** 半精度推理 FP16 */
    halfPrecision: true,
  },
  ui: {
    sidebarCollapsed: false,
  },
  llm: {
    apiBaseUrl: 'https://api.deepseek.com/v1',
    /** API Key 不写入 settings.json，运行时由 Rust 端加密 store 加载 */
    apiKey: '',
    model: 'deepseek-chat',
  },
};

export type DubbingSettings = typeof defaultSettings.dubbing;
export type UiSettings = typeof defaultSettings.ui;
export type LlmSettings = typeof defaultSettings.llm;
export type AppSettingsState = {
  dubbing: DubbingSettings;
  ui: UiSettings;
  llm: LlmSettings;
};

function createSettingsState(): AppSettingsState {
  return {
    dubbing: { ...defaultSettings.dubbing },
    ui: { ...defaultSettings.ui },
    llm: { ...defaultSettings.llm },
  };
}

let settings = $state(createSettingsState());

async function loadSettings(): Promise<void> {
  const s = await getStore();

  const savedDubbing = await s.get<DubbingSettings>('dubbing');
  settings.dubbing = savedDubbing
    ? { ...defaultSettings.dubbing, ...savedDubbing }
    : { ...defaultSettings.dubbing };

  const savedUi = await s.get<UiSettings>('ui');
  settings.ui = savedUi
    ? { ...defaultSettings.ui, ...savedUi }
    : { ...defaultSettings.ui };

  // 读取 LLM 非敏感字段（base url / model）— 注意：旧版本可能在 settings.json 里残留 apiKey 明文，
  // 这里读后立即丢弃明文，由 Rust store 提供加密 apiKey
  const savedLlm = await s.get<LlmSettings>('llm');
  let migratedLlmKey: string | null = null;
  if (savedLlm) {
    if (savedLlm.apiKey && savedLlm.apiKey.trim().length > 0) {
      // 一次性迁移：把残留明文搬到加密 store，然后从 settings.json 删除
      migratedLlmKey = savedLlm.apiKey;
    }
    settings.llm = {
      ...defaultSettings.llm,
      apiBaseUrl: savedLlm.apiBaseUrl ?? defaultSettings.llm.apiBaseUrl,
      model: savedLlm.model ?? defaultSettings.llm.model,
      apiKey: '',
    };
  } else {
    settings.llm = { ...defaultSettings.llm };
  }

  if (migratedLlmKey) {
    await persistLlmApiKey(migratedLlmKey);
    // 重写 settings.json 把 apiKey 字段清空
    await s.set('llm', {
      apiBaseUrl: settings.llm.apiBaseUrl,
      model: settings.llm.model,
      apiKey: '',
    });
    await s.save();
  }

  // 从加密 store 加载 apiKey 到内存 state
  settings.llm.apiKey = await loadLlmApiKey();

  // 加载字符用量
  await loadUsage();
}

function initSettings(): Promise<void> {
  if (!initPromise) {
    initPromise = loadSettings();
  }
  return initPromise;
}

async function saveDubbingSettings(dubbingSettings: Partial<DubbingSettings>): Promise<void> {
  await initSettings();
  settings.dubbing = { ...settings.dubbing, ...dubbingSettings };
  const s = await getStore();
  await s.set('dubbing', settings.dubbing);
  await s.save();
}

async function saveUiSettings(uiSettings: Partial<UiSettings>): Promise<void> {
  await initSettings();
  settings.ui = { ...settings.ui, ...uiSettings };
  const s = await getStore();
  await s.set('ui', settings.ui);
  await s.save();
}

async function saveLlmSettings(llmSettings: Partial<LlmSettings>): Promise<void> {
  await initSettings();
  settings.llm = { ...settings.llm, ...llmSettings };

  // apiKey 单独走加密 store，不写到 settings.json
  if (Object.prototype.hasOwnProperty.call(llmSettings, 'apiKey')) {
    await persistLlmApiKey(llmSettings.apiKey ?? '');
  }

  // 仅持久化非敏感字段
  const s = await getStore();
  await s.set('llm', {
    apiBaseUrl: settings.llm.apiBaseUrl,
    model: settings.llm.model,
    apiKey: '',
  });
  await s.save();
}

async function resetSettings(): Promise<void> {
  settings = createSettingsState();
  const s = await getStore();
  await s.set('dubbing', settings.dubbing);
  await s.set('ui', settings.ui);
  // llm.apiKey 不入 settings.json，单独清加密 store
  await s.set('llm', {
    apiBaseUrl: settings.llm.apiBaseUrl,
    model: settings.llm.model,
    apiKey: '',
  });
  await s.save();
  await persistLlmApiKey('');
}

// ==================== 字符用量跟踪 ====================

export interface UsageData {
  totalCharsGenerated: number;
  totalDurationMs: number;
  totalProjects: number;
  monthlyCharsGenerated: number;
  monthlyResetDate: string;
  quota: number;
}

const defaultUsage: UsageData = {
  totalCharsGenerated: 0,
  totalDurationMs: 0,
  totalProjects: 0,
  monthlyCharsGenerated: 0,
  monthlyResetDate: new Date().toISOString().slice(0, 7),
  quota: 500_000,
};

let usage = $state<UsageData>({ ...defaultUsage });

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

async function loadUsage(): Promise<void> {
  const s = await getStore();
  const saved = await s.get<UsageData>('usage');
  if (saved) {
    usage = { ...defaultUsage, ...saved };
    if (usage.monthlyResetDate !== currentMonth()) {
      usage.monthlyCharsGenerated = 0;
      usage.monthlyResetDate = currentMonth();
      await s.set('usage', usage);
      await s.save();
    }
  }
}

async function saveUsage(): Promise<void> {
  const s = await getStore();
  await s.set('usage', usage);
  await s.save();
}

async function trackCharUsage(chars: number): Promise<void> {
  await initSettings();
  if (usage.monthlyResetDate !== currentMonth()) {
    usage.monthlyCharsGenerated = 0;
    usage.monthlyResetDate = currentMonth();
  }
  usage.totalCharsGenerated += chars;
  usage.monthlyCharsGenerated += chars;
  await saveUsage();
}

async function trackDuration(durationMs: number): Promise<void> {
  await initSettings();
  usage.totalDurationMs += durationMs;
  await saveUsage();
}

async function incrementProjects(): Promise<void> {
  await initSettings();
  usage.totalProjects += 1;
  await saveUsage();
}

export const appSettings = {
  get settings() { return settings; },
  get defaults() { return defaultSettings; },
  get usage() { return usage; },
  init: initSettings,
  saveDubbing: saveDubbingSettings,
  saveUi: saveUiSettings,
  saveLlm: saveLlmSettings,
  reset: resetSettings,
  trackCharUsage,
  trackDuration,
  incrementProjects,
};