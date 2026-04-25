export type ExternalUrlHandlers = {
  openUrl: (url: string) => Promise<void>;
  fallbackOpenUrl: (url: string) => void;
};

export function normalizeExternalUrl(rawUrl: string): string {
  const trimmedUrl = rawUrl.trim();
  if (/^https?:\/\//i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  return `https://${trimmedUrl}`;
}

export async function openExternalUrl(
  rawUrl: string,
  handlers: ExternalUrlHandlers,
): Promise<string> {
  const normalizedUrl = normalizeExternalUrl(rawUrl);

  try {
    await handlers.openUrl(normalizedUrl);
  } catch {
    handlers.fallbackOpenUrl(normalizedUrl);
  }

  return normalizedUrl;
}
