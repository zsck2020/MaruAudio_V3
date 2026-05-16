import { Store } from '@tauri-apps/plugin-store';
import {
  createRetriableInitializer,
  createSettingsState,
  defaultSettings,
  loadSettingsSnapshot,
  type AppSettingsState,
  type DubbingSettings,
  type UiSettings,
} from './settings-core';

let store: Store | null = null;

async function getStore(): Promise<Store> {
  if (!store) {
    store = await Store.load('settings.json');
  }
  return store;
}

let settings = $state(createSettingsState());

async function loadSettings(): Promise<void> {
  const s = await getStore();
  settings = await loadSettingsSnapshot({
    loadDubbing: async () => await s.get<DubbingSettings>('dubbing'),
    loadUi: async () => await s.get<UiSettings>('ui'),
  });
}

const initSettings = createRetriableInitializer(loadSettings);

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

export type { AppSettingsState, DubbingSettings, UiSettings };
