# MaruAudio V3

> 丸子配音 (MaruAudio) V3 - AI 语音克隆桌面应用

## 📋 项目简介

MaruAudio V3 是一款基于 Tauri 2.0 + Vue 3 + TypeScript + Rust 开发的 AI 语音克隆桌面应用，提供高质量的文本转语音服务。

## 🏗️ 技术栈

### 前端
- **框架**: Vue 3 (Composition API)
- **语言**: TypeScript
- **构建工具**: Vite 5
- **UI组件库**: Ant Design Vue 4.x
- **图标库**: Ant Design Icons Vue + Iconfont
- **状态管理**: Pinia
- **路由**: Vue Router 4

### 后端
- **框架**: Tauri 2.0
- **语言**: Rust
- **职责**: TTS引擎管理、音频处理、文件系统操作、系统集成

### AI引擎
- **轻量引擎**: IndexTTS 1.5 (本地)
- **情感引擎**: IndexTTS 2.0 (本地)
- **云端引擎**: 阿里云百炼 Qwen3-TTS接口

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- Rust >= 1.70.0
- Tauri CLI

### 安装依赖

```bash
# 安装前端依赖
npm install

# 安装 Tauri CLI (如果未安装)
npm install -g @tauri-apps/cli
```

### 开发运行

```bash
# 启动开发服务器
npm run dev

# 或使用 Tauri 开发模式
npm run tauri:dev
```

### 构建打包

```bash
# 构建前端
npm run build

# 打包 Tauri 应用
npm run tauri:build
```

## 📁 项目结构

```
MaruAudio_V3/
├── src/                    # 前端源码
│   ├── components/         # Vue 组件
│   ├── pages/             # 页面组件
│   ├── stores/            # Pinia 状态管理
│   ├── router/            # 路由配置
│   └── utils/             # 工具函数
├── src-tauri/             # Rust 后端
│   ├── src/               # Rust 源码
│   └── Cargo.toml         # Rust 依赖配置
├── 项目开发文档/          # 项目文档
└── README.md              # 项目说明
```

## 📝 开发文档

详细的项目开发方案请参考：[项目开发文档](./项目开发文档/MaruAudio_V3项目开发方案.md)

## 🔧 开发注意事项

1. **模型信息隐藏**: 所有用户可见的文本使用代号，日志中不输出模型真实名称
2. **代码规范**: TypeScript 严格模式，Rust 使用 clippy 检查
3. **性能优化**: 前端懒加载，Rust 异步处理，引擎延迟加载
4. **错误处理**: 完善的错误提示和日志记录

## 📦 发布

- **主要发布平台**: CNB.cool
- **GitHub**: 源码同步 (不用于发布)

## 📄 许可证

本项目为私有项目，不对外开源。

## 👥 贡献

本项目为内部项目，不接受外部贡献。

---

**版本**: V3.0.0  
**最后更新**: 2026

