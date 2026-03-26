import { Store } from '@tauri-apps/plugin-store';

// 全局 store 实例
let store: Store | null = null;

async function getStore(): Promise<Store> {
  if (!store) {
    store = await Store.load('settings.json');
  }
  return store;
}

// 默认设置
const defaultSettings = {
  // 配音设置
  dubbing: {
    engineMode: 'lightweight' as 'lightweight' | 'emotion' | 'cloud',
    intervalSilence: 200,
    maxTextTokens: 100,
    bucketMaxSize: 4,
    temperature: 1.0,
    topP: 0.8,
    topK: 30,
    emoAlpha: 0.6,
  },
  // UI 设置
  ui: {
    sidebarCollapsed: false,
  },
};

// 使用 $state 的响应式设置
let settings = $state({ ...defaultSettings });

// 初始化：从持久化存储加载
async function initSettings(): Promise<void> {
  const s = await getStore();

  const savedDubbing = await s.get('dubbing');
  if (savedDubbing) {
    settings.dubbing = { ...defaultSettings.dubbing, ...savedDubbing };
  }

  const savedUi = await s.get('ui');
  if (savedUi) {
    settings.ui = { ...defaultSettings.ui, ...savedUi };
  }
}

// 配音设置类型
type DubbingSettings = typeof defaultSettings.dubbing;

// 保存配音设置（支持部分更新）
async function saveDubbingSettings(dubbingSettings: Partial<DubbingSettings>): Promise<void> {
  settings.dubbing = { ...settings.dubbing, ...dubbingSettings };
  const s = await getStore();
  await s.set('dubbing', settings.dubbing);
  await s.save();
}

// 保存 UI 设置
async function saveUiSettings(uiSettings: typeof defaultSettings.ui): Promise<void> {
  settings.ui = { ...settings.ui, ...uiSettings };
  const s = await getStore();
  await s.set('ui', settings.ui);
  await s.save();
}

// 重置为默认设置
async function resetSettings(): Promise<void> {
  settings = { ...defaultSettings };
  const s = await getStore();
  await s.set('dubbing', settings.dubbing);
  await s.set('ui', settings.ui);
  await s.save();
}

export const appSettings = {
  get settings() { return settings; },
  init: initSettings,
  saveDubbing: saveDubbingSettings,
  saveUi: saveUiSettings,
  reset: resetSettings,
};
