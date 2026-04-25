import { openExternalUrl } from './open-external-url.ts';

async function getRealOpenerModule() {
  return await import('./node_modules/@tauri-apps/plugin-opener/dist-js/index.js');
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
