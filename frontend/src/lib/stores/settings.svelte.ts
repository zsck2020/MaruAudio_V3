import { Store } from '@tauri-apps/plugin-store';

let store: Store | null = null;
let initPromise: Promise<void> | null = null;

async function getStore(): Promise<Store> {
  if (!store) {
    store = await Store.load('settings.json');
  }
  return store;
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
};

export type DubbingSettings = typeof defaultSettings.dubbing;
export type UiSettings = typeof defaultSettings.ui;
export type AppSettingsState = {
  dubbing: DubbingSettings;
  ui: UiSettings;
};

function createSettingsState(): AppSettingsState {
  return {
    dubbing: { ...defaultSettings.dubbing },
    ui: { ...defaultSettings.ui },
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

async function resetSettings(): Promise<void> {
  settings = createSettingsState();
  const s = await getStore();
  await s.set('dubbing', settings.dubbing);
  await s.set('ui', settings.ui);
  await s.save();
}

export const appSettings = {
  get settings() { return settings; },
  get defaults() { return defaultSettings; },
  init: initSettings,
  saveDubbing: saveDubbingSettings,
  saveUi: saveUiSettings,
  reset: resetSettings,
};