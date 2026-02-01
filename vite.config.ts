import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  
  // 路径别名
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  
  // 开发服务器配置
  server: {
    host: '0.0.0.0', // 监听所有网络接口，确保IPv4和IPv6都能访问
    port: 1421,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
    // HMR 配置 - 确保桌面端和浏览器端都能接收热更新
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 1421,
      clientPort: 1421,
      // 确保浏览器端也能正常连接 HMR
      overlay: true,
    },
    // 启用 CORS，确保浏览器访问时能正常加载资源
    cors: true,
  },
  
  // 构建配置
  build: {
    target: ['es2021', 'chrome100', 'safari13'],
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
  
  // 清除控制台
  clearScreen: false,
  
  // Tauri 环境变量
  envPrefix: ['VITE_', 'TAURI_'],
})
