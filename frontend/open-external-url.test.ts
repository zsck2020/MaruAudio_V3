import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeExternalUrl, openExternalUrl } from './open-external-url.ts';

test('normalizeExternalUrl prefixes https when protocol is missing', () => {
  assert.equal(normalizeExternalUrl('example.com/docs'), 'https://example.com/docs');
  assert.equal(normalizeExternalUrl('https://example.com/docs'), 'https://example.com/docs');
});

test('openExternalUrl falls back to browser open when desktop opener fails', async () => {
  const opened: string[] = [];

  await openExternalUrl('example.com', {
    openUrl: async () => {
      throw new Error('plugin unavailable');
    },
    fallbackOpenUrl: (url) => {
      opened.push(url);
    },
  });

  assert.deepEqual(opened, ['https://example.com']);
});
