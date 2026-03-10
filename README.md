# 丸子配音 V3

AI 语音克隆桌面应用 - 基于 Tauri 2.0 + SvelteKit 构建

## 技术栈

| 层面 | 技术选型 | 说明 |
|------|---------|------|
| **客户前端** | Tauri 2.0 (Rust + Web) | 体积小、性能好、单exe交付 |
| **前端框架** | SvelteKit + TypeScript | 轻量、高性能、编译优化 |
| **UI设计规范** | 参考 Element Plus 设计风格 | 组件设计参考其设计语言 |
| **图标库** | Ant Design Icons | @iconify/svelte + @iconify-json/ant-design 离线使用 |
| **字体** | HarmonyOS Sans SC | woff2 离线内嵌 |
| **构建工具** | Vite 6 | 快速开发与构建 |

## 项目结构

```
MaruAudio_V3/
├── frontend/              # 桌面端应用 (Tauri 2.0 + SvelteKit)
│   ├── src/               # SvelteKit 前端源码
│   │   ├── routes/        # 路由页面
│   │   ├── lib/           # 共享组件和工具
│   │   ├── app.html       # HTML 模板
│   │   └── app.css        # 全局样式（设计令牌）
│   ├── src-tauri/         # Tauri 后端 (Rust)
│   │   ├── src/           # Rust 源代码
│   │   ├── Cargo.toml     # Rust 依赖配置
│   │   ├── tauri.conf.json# Tauri 配置
│   │   └── capabilities/  # Tauri 权限配置
│   ├── static/            # 静态资源（字体、logo、favicon）
│   └── package.json       # 前端依赖配置
├── backend/               # 桌面端后端服务 (待开发)
├── docs/                  # 项目文档
└── IndexTTS/              # TTS 引擎参考（仅本地，不提交 Git）
```

## 开发环境要求

- Node.js 18+
- Rust 1.70+
- Tauri CLI 2.0+

## 快速开始

### 安装依赖

```bash
cd frontend
npm install
```

### 开发模式

启动完整的开发环境（前端 + Tauri 桌面应用）：

```bash
cd frontend
npm run dev
```

或者分别启动：

```bash
cd frontend

# 仅启动前端开发服务器（端口 1420）
npm run dev:web-only

# 启动 Tauri 开发模式（会自动等待前端服务器就绪）
npm run dev:desktop
```

### 构建应用

```bash
cd frontend

# 构建前端
npm run build

# 构建 Tauri 桌面应用
npm run tauri build
```

## 开发命令

所有命令需在 `frontend/` 目录下执行：

- `npm run dev` - 同时启动前端开发服务器和 Tauri 开发模式（推荐）
- `npm run dev:web` - 启动前端开发服务器（端口 1420）
- `npm run dev:desktop` - 启动 Tauri 开发模式（自动等待前端就绪）
- `npm run dev:web-only` - 仅启动前端开发服务器（不等待 desktop）
- `npm run build` - 构建前端
- `npm run preview` - 预览构建后的前端
- `npm run check` - 运行 TypeScript 类型检查
- `npm run check:watch` - 运行 TypeScript 类型检查（监听模式）
- `npm run tauri build` - 构建 Tauri 桌面应用

## 项目特性

- AI 语音克隆 (TTS)
- 多引擎支持 (轻量引擎、情感引擎、云端引擎)
- 样音库管理
- 字幕生成
- 文件管理
- 用户认证与会员系统

## 许可证

MIT
