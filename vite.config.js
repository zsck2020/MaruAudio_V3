import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;
// @ts-expect-error process is a nodejs global
const isTauri = !!process.env.TAURI_PLATFORM || !!process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [sveltekit()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || (isTauri ? "localhost" : true),
    hmr: {
      protocol: "ws",
      host: host || "localhost",
      port: 1421,
      clientPort: 1421,
    },
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
      // 启用轮询以确保文件变化被检测到
      usePolling: false,
      interval: 100,
    },
  },
  // 优化构建性能
  build: {
    target: "esnext",
    minify: false,
    sourcemap: true,
  },
}));
