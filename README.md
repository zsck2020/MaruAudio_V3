# 丸子配音 V3

AI 语音克隆桌面应用 - 基于 Tauri 2.0 + SvelteKit 构建

## 技术栈

| 层面 | 技术选型 | 说明 |
|------|---------|------|
| **客户前端** | Tauri 2.0 (Rust + Web) | 体积小、性能好、单exe交付 |
| **前端框架** | SvelteKit + TypeScript | 轻量、高性能、编译优化 |
| **UI设计规范** | Ant Design 暗色主题 | 基于 CSS 变量的设计令牌系统 |
| **图标库** | Ant Design Icons | @iconify/svelte + @iconify-json/ant-design 离线使用 |
| **字体** | HarmonyOS Sans SC | woff2 离线内嵌 |
| **状态管理** | Svelte 5 Runes | $state 响应式状态 |
| **构建工具** | Vite 6 | 快速开发与构建 |

## 项目结构

```
MaruAudio_V3/
├── frontend/              # 桌面端应用 (Tauri 2.0 + SvelteKit)
│   ├── src/               # SvelteKit 前端源码
│   │   ├── routes/        # 路由页面 (+layout.svelte, +page.svelte)
│   │   ├── lib/           # 共享模块
│   │   │   ├── components/# UI 组件 (TitleBar, Sidebar, MenuItem, Tooltip)
│   │   │   ├── icons/     # 图标组件 (Icon, Logo)
│   │   │   └── types.ts   # 共享类型定义
│   │   ├── app.html       # HTML 模板
│   │   └── app.css        # 全局样式（Ant Design 暗色主题 CSS 变量）
│   ├── src-tauri/         # Tauri 后端 (Rust)
│   │   ├── src/           # Rust 源代码 (commands/, services/, utils/)
│   │   ├── Cargo.toml     # Rust 依赖配置
│   │   ├── tauri.conf.json# Tauri 配置
│   │   └── capabilities/  # Tauri 权限配置
│   ├── static/            # 静态资源（字体、logo、favicon、banner SVG）
│   └── package.json       # 前端依赖配置
├── backend/               # 桌面端后端服务 (待开发)
├── docs/                  # 项目文档
├── IndexTTS/              # TTS 引擎参考（仅本地，不提交 Git）
└── admin_panel/           # 管理后台（部署在服务器，不在本地仓库中）
```

## 开发环境要求

- Node.js 18+
- Rust 1.77+
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

- ✅ 自定义无边框窗口、侧边栏导航、Ant Design 暗色主题
- ✅ 用户认证后端 API（登录/注册/Token 管理/机器码绑定）
- ✅ Banner 动态加载（后端代理 + 本地 SVG 降级）
- ⚠️ AI 语音克隆 (TTS) - 规划中
- ⚠️ 多引擎支持 (快速模式/标准模式/高质量模式) - 规划中
- ⚠️ 样音库管理 - 规划中
- ⚠️ 字幕生成 - 规划中
- ⚠️ 文件管理 - 规划中
- ⚠️ 用户中心/会员系统 UI - 规划中

## 许可证

MIT
