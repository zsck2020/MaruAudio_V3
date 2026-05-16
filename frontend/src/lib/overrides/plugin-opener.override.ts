import { openExternalUrl } from './open-external-url';
import type * as OpenerModule from '@tauri-apps/plugin-opener';

type RealOpenerModule = typeof OpenerModule;

async function getRealOpenerModule(): Promise<RealOpenerModule> {
  return await import('../../../node_modules/@tauri-apps/plugin-opener/dist-js/index.js') as RealOpenerModule;
}

export async function openUrl(url: string): Promise<void> {
  await openExternalUrl(url, {
    openUrl: async (normalizedUrl) => {
      const opener = await getRealOpenerModule();
      await opener.openUrl(normalizedUrl);
    },
    fallbackOpenUrl: (normalizedUrl) => {
      if (typeof window !== 'undefined') {
        window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
      }
    },
  });
}

export async function openPath(path: string): Promise<void> {
  const opener = await getRealOpenerModule();
  await opener.openPath(path);
}

export async function revealItemInDir(path: string): Promise<void> {
  const opener = await getRealOpenerModule();
  await opener.revealItemInDir(path);
}
