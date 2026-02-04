# 丸子配音 V3

AI 语音克隆桌面应用 - 基于 Tauri 2.0 + SvelteKit 构建

## 技术栈

- **前端**: Svelte 5 + SvelteKit + TypeScript
- **后端**: Tauri 2.0 + Rust
- **构建工具**: Vite 6

## 项目结构

```
MaruAudio_V3/
├── src/                    # SvelteKit 前端源码
│   ├── routes/            # 路由页面
│   └── app.html           # HTML 模板
├── src-tauri/             # Tauri 后端 (Rust)
│   ├── src/               # Rust 源代码
│   ├── Cargo.toml         # Rust 依赖配置
│   └── tauri.conf.json    # Tauri 配置
├── static/                # 静态资源
├── server/                # 管理后台 (独立系统)
│   ├── admin-frontend/    # 管理后台前端 (Vue 3)
│   ├── api/               # API 后端 (PHP)
│   └── websocket/         # WebSocket 服务 (PHP)
└── 项目开发文档/          # 项目文档
```

## 开发环境要求

- Node.js 18+
- Rust 1.70+
- Tauri CLI 2.0+

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run tauri dev
```

### 构建应用

```bash
npm run tauri build
```

## 开发命令

- `npm run dev` - 启动前端开发服务器
- `npm run build` - 构建前端
- `npm run tauri dev` - 启动 Tauri 开发模式
- `npm run tauri build` - 构建 Tauri 应用
- `npm run check` - 类型检查

## 项目特性

- AI 语音克隆 (TTS)
- 多引擎支持 (轻量引擎、情感引擎、云端引擎)
- 样音库管理
- 字幕生成
- 文件管理
- 用户认证与会员系统

## 相关文档

- [项目结构说明](./项目开发文档/项目结构说明.md)
- [开发方案](./项目开发文档/MaruAudio_V3项目开发方案.md)
- [API 文档](./server/api/API_DOCS.md)

## 许可证

MIT
