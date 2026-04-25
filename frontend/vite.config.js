import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

/**
 * @param {string} relativePath
 */
function fromConfigRoot(relativePath) {
  const pathname = new URL(relativePath, import.meta.url).pathname;
  return pathname.replace(/^\/([A-Za-z]:\/)/, "$1");
}

const settingsOverride = fromConfigRoot("./src/lib/overrides/settings-store.override.svelte.ts");
const openerOverride = fromConfigRoot("./src/lib/overrides/plugin-opener.override.ts");

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;
// @ts-expect-error process is a nodejs global
const isTauri = !!process.env.TAURI_PLATFORM || !!process.env.TAURI_DEV_HOST;

export default defineConfig(() => ({
  plugins: [
    {
      name: "codex-frontend-overrides",
      enforce: "pre",
      resolveId(source, importer) {
        if (source === "$lib/stores/settings.svelte") {
          return settingsOverride;
        }

        if (
          source === "./settings.svelte" &&
          importer &&
          /[\\/]src[\\/]lib[\\/]stores[\\/]dubbing\.svelte\.ts$/.test(importer)
        ) {
          return settingsOverride;
        }

        if (source === "@tauri-apps/plugin-opener") {
          return openerOverride;
        }

        return null;
      },
    },
    sveltekit(),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || (isTauri ? "localhost" : true),
    fs: {
      allow: ["."],
    },
    hmr: {
      protocol: "ws",
      host: host || "localhost",
      port: 1421,
      clientPort: 1421,
    },
    watch: {
      ignored: ["**/src-tauri/**"],
      usePolling: false,
      interval: 100,
    },
  },
  build: {
    target: "esnext",
    // @ts-expect-error process is a nodejs global
    sourcemap: !!process.env.TAURI_DEBUG,
  },
}));
