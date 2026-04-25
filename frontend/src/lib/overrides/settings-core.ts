export const defaultSettings = {
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

type LoadSettingsSnapshotOptions = {
  loadDubbing: () => Promise<Partial<DubbingSettings> | null | undefined>;
  loadUi: () => Promise<Partial<UiSettings> | null | undefined>;
};

export function createSettingsState(): AppSettingsState {
  return {
    dubbing: { ...defaultSettings.dubbing },
    ui: { ...defaultSettings.ui },
  };
}

export async function loadSettingsSnapshot(
  options: LoadSettingsSnapshotOptions,
): Promise<AppSettingsState> {
  const [savedDubbing, savedUi] = await Promise.all([
    options.loadDubbing(),
    options.loadUi(),
  ]);

  return {
    dubbing: {
      ...defaultSettings.dubbing,
      ...(savedDubbing ?? {}),
    },
    ui: {
      ...defaultSettings.ui,
      ...(savedUi ?? {}),
    },
  };
}

export function createRetriableInitializer<T>(
  initialize: () => Promise<T>,
): () => Promise<T> {
  let pending: Promise<T> | null = null;

  return () => {
    if (!pending) {
      pending = initialize().catch((error) => {
        pending = null;
        throw error;
      });
    }

    return pending;
  };
}
