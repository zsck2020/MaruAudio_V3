import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createRetriableInitializer,
  createSettingsState,
  defaultSettings,
  loadSettingsSnapshot,
} from './settings-core.ts';

test('createRetriableInitializer retries after a failed initialization', async () => {
  let attempts = 0;
  const init = createRetriableInitializer(async () => {
    attempts += 1;
    if (attempts === 1) {
      throw new Error('transient store failure');
    }

    return 'ready';
  });

  await assert.rejects(init, /transient store failure/);
  await assert.doesNotReject(init);
  assert.equal(attempts, 2);
});

test('loadSettingsSnapshot merges persisted values onto defaults', async () => {
  const settings = await loadSettingsSnapshot({
    loadDubbing: async () => ({ topP: 0.95, topK: 64 }),
    loadUi: async () => ({ sidebarCollapsed: true }),
  });

  assert.deepEqual(settings, {
    dubbing: {
      ...defaultSettings.dubbing,
      topP: 0.95,
      topK: 64,
    },
    ui: {
      ...defaultSettings.ui,
      sidebarCollapsed: true,
    },
  });
  assert.notDeepEqual(settings, createSettingsState());
});
