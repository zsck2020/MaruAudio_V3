# MaruAudio V3 项目开发方案

## 📋 项目概述

**项目名称**: 丸子配音 (MaruAudio) V3  
**技术栈**: Tauri 2.0 + SvelteKit + TypeScript + Rust  
**项目类型**: AI 语音克隆桌面应用  
**版本**: V3.0.0

---

## 🏗️ 技术架构

### 核心技术栈

#### 前端层
- **框架**: Svelte 5 + SvelteKit
- **语言**: TypeScript
- **构建工具**: Vite 6
- **状态管理**: Svelte Stores
- **路由**: SvelteKit 文件系统路由

#### 后端层  
- **框架**: Tauri 2.0
- **语言**: Rust
- **职责**: 
  - TTS引擎管理
  - 音频处理
  - 文件系统操作
  - 系统集成

#### AI引擎层
- **轻量引擎**: IndexTTS 1.5 (本地)
  - 源码: https://github.com/index-tts/index-tts/tree/v1.5.0
  - 特点: 轻量级、快速响应
- **情感引擎**: IndexTTS 2.0 (本地)
  - 源码: https://github.com/index-tts/index-tts
  - 特点: 情感表达丰富
- **云端引擎**: 阿里云百炼 Qwen3-TTS接口
  - 价格: 1元/万字符
  - 特点: 高质量、无需本地资源

### 系统架构层次

```
┌─────────────────────────────────────────┐
│     Frontend Layer (SvelteKit + TS)     │
│  - Routes (路由页面)                     │
│  - Components (UI组件)                   │
│  - Stores (状态管理)                     │
│  - IPC优化层 (缓存/批处理/监控)          │
└─────────────────────────────────────────┘
                    ↕ (Tauri IPC + Events)
┌─────────────────────────────────────────┐
│     Backend Layer (Rust)                │
│  - Commands (Tauri命令)                  │
│  - Services (业务服务)                   │
│  - Utils (工具函数)                      │
│  - Event Emitter (事件推送)              │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│     AI Engine Layer                     │
│  - 轻量引擎 (IndexTTS 1.5)              │
│  - 情感引擎 (IndexTTS 2.0)              │
│  - 云端引擎 (阿里云百炼)                 │
└─────────────────────────────────────────┘
```

---

## 📁 项目目录结构

> ⚠️ 注意: 本文后续代码示例中的路径如 `src-tauri/src/...` 均指 `frontend/src-tauri/src/...`，
> `src/routes/...` 均指 `frontend/src/routes/...`，省略 `frontend/` 前缀以保持简洁。

```
MaruAudio_V3/
│
├── frontend/                        # 桌面端应用 (Tauri 2.0 + SvelteKit)
│   ├── src/                         # 前端源码
│   │   ├── routes/                  # SvelteKit 路由
│   │   │   ├── +layout.svelte      # 全局布局
│   │   │   ├── +layout.ts          # SSR 禁用
│   │   │   ├── +page.svelte        # 首页
│   │   │   └── +page.ts            # 首页数据加载
│   │   ├── lib/                     # 共享库
│   │   │   ├── components/          # Svelte 组件
│   │   │   │   ├── MenuItem.svelte
│   │   │   │   ├── Sidebar.svelte
│   │   │   │   ├── TitleBar.svelte
│   │   │   │   └── Tooltip.svelte
│   │   │   └── icons/               # 图标组件
│   │   │       └── Icon.svelte
│   │   ├── app.css                  # 全局样式
│   │   ├── app.d.ts                 # TypeScript 声明
│   │   ├── app.html                 # HTML 模板
│   │   └── fonts.css                # 字体定义
│   │
│   ├── src-tauri/                   # Tauri 后端 (Rust)
│   │   ├── src/
│   │   │   ├── commands/            # Tauri 命令
│   │   │   │   ├── mod.rs           # 模块导出
│   │   │   │   ├── app.rs           # 应用级命令
│   │   │   │   ├── audio.rs         # 音频处理（待实现）
│   │   │   │   ├── engine.rs        # 引擎管理（待实现）
│   │   │   │   ├── file.rs          # 文件操作（待实现）
│   │   │   │   ├── sample.rs        # 样音管理（待实现）
│   │   │   │   ├── tts.rs           # TTS 生成命令
│   │   │   │   └── user.rs          # 用户认证
│   │   │   ├── services/            # 业务服务
│   │   │   │   ├── mod.rs
│   │   │   │   └── tts/mod.rs       # TTS 引擎（待实现）
│   │   │   ├── utils/               # 工具函数
│   │   │   │   ├── mod.rs
│   │   │   │   ├── api.rs           # 后端 API 请求
│   │   │   │   ├── config.rs        # 配置管理
│   │   │   │   └── storage.rs       # 本地存储
│   │   │   ├── lib.rs               # Tauri 应用配置
│   │   │   └── main.rs              # Rust 入口
│   │   ├── capabilities/            # 权限声明
│   │   ├── icons/                   # 应用图标
│   │   ├── build.rs                 # 构建脚本
│   │   ├── Cargo.toml               # Rust 依赖
│   │   └── tauri.conf.json          # Tauri 配置
│   │
│   ├── static/                      # 静态资源
│   │   ├── fonts/                   # 字体文件
│   │   ├── banner-*.svg             # Banner 占位图
│   │   ├── favicon.png              # 网站图标
│   │   └── logo.png                 # 应用 Logo
│   │
│   ├── package.json                 # Node.js 依赖
│   ├── tsconfig.json                # TypeScript 配置
│   ├── svelte.config.js             # SvelteKit 配置
│   └── vite.config.js               # Vite 构建配置
│
├── admin_panel/                     # 管理后台
│   ├── api/                         # 后端 API (PHP 8.2)
│   │   ├── controllers/             # 控制器
│   │   ├── lib/                     # 公共库
│   │   ├── config/                  # 配置
│   │   ├── database/                # 数据库结构
│   │   ├── migrations/              # 迁移脚本
│   │   └── index.php                # API 入口
│   ├── admin-frontend/              # 管理前端 (Vue 3 + Element Plus)
│   ├── websocket/                   # WebSocket 服务 (PHP Ratchet)
│   └── deploy/                      # 部署相关
│
├── IndexTTS/                        # TTS 参考引擎（仅本地参考，禁止直接调用，不提交 Git）
│   ├── v15/                         # IndexTTS 1.5 轻量引擎
│   └── v20/                         # IndexTTS 2.0 情感引擎
│
├── backend/                         # 桌面端后端服务（待开发）
│
├── docs/                            # 项目文档
│   ├── V2项目功能分析报告.md
│   ├── MaruAudio_V3项目开发方案.md  # 本文件
│   └── 项目结构说明.md
│
├── .gitignore                       # Git 忽略配置
├── .cursorrules                     # Cursor IDE 规则
└── README.md                        # 项目说明
```

---

## 🎯 核心功能模块

### 1. 配音生成 (Voice Clone)

**前端位置**: `src/routes/voice-clone/+page.svelte`  
**后端位置**: `src-tauri/src/commands/audio.rs` + `src-tauri/src/services/tts/`

**功能特性**:
- ✅ **文本转语音 (TTS)**: 基于参考音频进行语音克隆
- ✅ **三引擎支持**:
  - 轻量引擎: 快速响应，适合短文本
  - 情感引擎: 情感表达丰富，适合长文本
  - 云端引擎: 高质量，无需本地资源
- ✅ **大文本处理**: 超过1万字符自动分批处理
- ✅ **文本预处理**: 自动分句、停顿、拼音纠错
- ✅ **参数调节**: 语速、音调、情感控制
- ✅ **参考音频管理**: 支持上传、录音、从样音库选择
- ✅ **参考文本识别**: 自动识别参考音频的文本内容 (ASR)
- ✅ **批量生成**: 支持长文本自动分批生成并合并

**技术实现**:
- 前端: Svelte 5 + SvelteKit
- 后端: Rust + Tauri Commands
- 引擎集成: 通过 Rust FFI 或 Python 子进程调用 IndexTTS

---

### 2. 样音库管理 (Sample Library)

**前端位置**: `src/routes/sample-library/+page.svelte`  
**后端位置**: `src-tauri/src/commands/file.rs`

**功能特性**:
- ✅ **样音管理**: 创建、编辑、删除样音
- ✅ **样音分类**: 支持分类标签
- ✅ **样音应用**: 一键应用到配音生成页面
- ✅ **样音预览**: 音频播放和预览
- ✅ **样音搜索**: 按名称、标签搜索

**数据存储**: 本地文件系统 (`outputs/Sample/`)

---

### 3. 字幕生成 (Subtitle Generation)

**前端位置**: `src/routes/subtitle/+page.svelte`  
**后端位置**: `src-tauri/src/services/subtitle.rs`

**功能特性**:
- ✅ **视频/音频转录**: 支持视频和音频文件转文字
- ✅ **ASR引擎**: 必剪 ASR (免费)
- ✅ **字幕翻译**: 支持多语言翻译
- ✅ **字幕格式**: 支持 SRT、VTT、ASS 等格式
- ✅ **字幕编辑**: 时间轴调整、文本编辑
- ✅ **批量处理**: 支持批量文件处理

---

### 4. 文件管理 (File Manager)

**前端位置**: `src/routes/file-manager/+page.svelte`  
**后端位置**: `src-tauri/src/commands/file.rs`

**功能特性**:
- ✅ **文件浏览**: 浏览生成的文件
- ✅ **文件分类**: 按类型分类显示
- ✅ **文件操作**: 打开、删除、重命名
- ✅ **文件搜索**: 按名称搜索
- ✅ **文件预览**: 音频文件预览播放

---

### 5. 用户认证与会员系统

**前端位置**: `src/lib/stores/user.ts` + `src/lib/components/common/LoginModal.svelte`  
**后端位置**: `src-tauri/src/commands/user.rs`

**功能特性**:
- ✅ **用户注册/登录**: 邮箱注册、登录
- ✅ **会员管理**: 
  - 免费用户: 500字符限制
  - 试用会员: 1000字符限制
  - 付费会员 (月卡/年卡/永久): 无限制
- ✅ **会话管理**: Token 持久化、自动刷新
- ✅ **设备绑定**: 机器码绑定
- ✅ **WebSocket 实时同步**: 用户状态、配置实时同步
- ✅ **用户中心**: 会员信息、邀请码、佣金余额

---

### 6. 引擎管理系统

**前端位置**: `src/lib/stores/engine.ts`  
**后端位置**: `src-tauri/src/services/tts/`

**功能特性**:
- ✅ **三引擎支持**: 轻量引擎 + 情感引擎 + 云端引擎
- ✅ **热切换**: 运行时切换引擎，无需重启
- ✅ **引擎管理器**: 统一的引擎生命周期管理
- ✅ **引擎状态**: 实时显示引擎加载状态

**引擎代号策略** (面向用户隐藏真实模型信息):
- 轻量引擎 → 显示为: "快速模式"
- 情感引擎 → 显示为: "标准模式"
- 云端引擎 → 显示为: "高质量模式"

---

## 🔒 模型信息隐藏策略

### 原则
面向客户完全规避暴露以下信息:
- IndexTTS1.5
- IndexTTS2.0
- 阿里云百炼
- Qwen3-TTS

### 实施策略

#### 1. 用户界面层面
- **引擎选择器**: 使用通用名称
  - "快速模式" (轻量引擎)
  - "标准模式" (情感引擎)
  - "高质量模式" (云端引擎)
- **错误提示**: 使用通用错误信息，不暴露引擎细节
- **日志输出**: 生产环境不输出模型相关信息

#### 2. 代码层面
- **常量定义**: 使用代号而非真实名称
```typescript
// src/lib/utils/constants.ts
export const ENGINE_TYPES = {
  LIGHTWEIGHT: 'lightweight',  // 内部代号
  EMOTION: 'emotion',          // 内部代号
  CLOUD: 'cloud'               // 内部代号
} as const;

export const ENGINE_DISPLAY_NAMES = {
  [ENGINE_TYPES.LIGHTWEIGHT]: '快速模式',
  [ENGINE_TYPES.EMOTION]: '标准模式',
  [ENGINE_TYPES.CLOUD]: '高质量模式'
} as const;
```

#### 3. 配置文件
- **配置文件**: 不包含模型真实名称
- **环境变量**: 使用代号

#### 4. 日志和调试
- **开发环境**: 可以输出详细信息
- **生产环境**: 完全隐藏模型信息
- **用户日志**: 不包含模型相关信息

---

## 🛠️ 技术实现方案

### 1. Tauri 2.0 集成

#### 前端调用后端
```typescript
// src/lib/utils/api.ts
import { invoke } from '@tauri-apps/api/core';

// 调用 Rust 命令
export async function generateAudio(text: string, engine: string) {
  return await invoke('generate_audio', { text, engine });
}
```

#### Rust 命令定义
```rust
// src-tauri/src/commands/audio.rs
#[tauri::command]
pub async fn generate_audio(
    text: String,
    engine: String,
    app_handle: AppHandle,
) -> Result<String, String> {
    // 调用 TTS 服务
    let audio_path = tts_service::generate(text, engine).await?;
    Ok(audio_path)
}
```

### 1.1 IPC 通信优化策略

**目标**: 减少前端与后端之间的通信延迟，提升用户体验

#### 优化原则
1. **减少IPC调用次数**: 批量操作合并为单次调用
2. **使用事件系统**: 后端主动推送，避免前端轮询
3. **数据序列化优化**: 减少传输数据量
4. **异步非阻塞**: 长时间操作使用事件通知
5. **本地缓存**: 减少重复数据请求

#### 优化方案

##### 1. 批量操作优化
```typescript
// src/lib/utils/api.ts
// ❌ 不推荐: 多次IPC调用
for (const file of files) {
  await invoke('delete_file', { path: file.path });
}

// ✅ 推荐: 单次批量调用
await invoke('batch_delete_files', { paths: files.map(f => f.path) });
```

```rust
// src-tauri/src/commands/file.rs
#[tauri::command]
pub async fn batch_delete_files(
    paths: Vec<String>,
) -> Result<Vec<String>, String> {
    let mut results = Vec::new();
    for path in paths {
        match std::fs::remove_file(&path) {
            Ok(_) => results.push(path),
            Err(e) => return Err(e.to_string()),
        }
    }
    Ok(results)
}
```

##### 2. 事件系统替代轮询
```typescript
// src/lib/utils/api.ts
// ❌ 不推荐: 前端轮询
setInterval(async () => {
  const status = await invoke('get_generation_status');
  updateProgress(status);
}, 500);

// ✅ 推荐: 后端主动推送事件
import { listen } from '@tauri-apps/api/event';

// 监听生成进度事件
listen('generation-progress', (event) => {
  updateProgress(event.payload);
});

// 监听生成完成事件
listen('generation-completed', (event) => {
  handleCompleted(event.payload);
});
```

```rust
// src-tauri/src/commands/audio.rs
use tauri::Emitter;

#[tauri::command]
pub async fn generate_audio(
    text: String,
    engine: String,
    app_handle: AppHandle,
) -> Result<String, String> {
    // 在后台任务中发送进度事件
    let app_handle_clone = app_handle.clone();
    tokio::spawn(async move {
        // 生成过程中发送进度事件
        for progress in 0..=100 {
            app_handle_clone.emit("generation-progress", progress).unwrap();
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        }
        
        // 生成完成发送完成事件
        let audio_path = generate_audio_internal(text, engine).await;
        app_handle_clone.emit("generation-completed", audio_path).unwrap();
    });
    
    Ok("started".to_string())
}
```

##### 3. 数据序列化优化
```rust
// ✅ 使用紧凑的数据结构
#[derive(Serialize)]
pub struct AudioInfo {
    #[serde(rename = "p")]  // 使用短字段名
    pub path: String,
    #[serde(rename = "s")]
    pub size: u64,
    #[serde(rename = "t")]
    pub timestamp: i64,
}

// ❌ 避免传输大文件内容
// 只传输文件路径，需要时再读取
#[tauri::command]
pub async fn get_audio_info(path: String) -> Result<AudioInfo, String> {
    let metadata = std::fs::metadata(&path)?;
    Ok(AudioInfo {
        path,
        size: metadata.len(),
        timestamp: metadata.modified()?.duration_since(UNIX_EPOCH)?.as_secs() as i64,
    })
}
```

##### 4. 状态缓存机制
```typescript
// src/lib/utils/api.ts
// 前端缓存，减少重复请求
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5000; // 5秒缓存

export async function getEngineStatus(engine: string) {
  const cacheKey = `engine_status_${engine}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const status = await invoke('get_engine_status', { engine });
  cache.set(cacheKey, { data: status, timestamp: Date.now() });
  return status;
}
```

##### 5. 流式数据传输
```rust
// 对于大文本生成，使用流式传输
use tauri::State;
use std::sync::Arc;
use tokio::sync::mpsc;

#[tauri::command]
pub async fn generate_audio_stream(
    text: String,
    engine: String,
    app_handle: AppHandle,
) -> Result<(), String> {
    let (tx, mut rx) = mpsc::channel(100);
    
    tokio::spawn(async move {
        // 分批生成并发送
        let chunks = split_text(&text);
        for (index, chunk) in chunks.iter().enumerate() {
            let audio_chunk = generate_chunk(chunk, &engine).await;
            tx.send((index, audio_chunk)).await.unwrap();
            
            // 发送进度事件
            let progress = (index + 1) * 100 / chunks.len();
            app_handle.emit("generation-progress", progress).unwrap();
        }
    });
    
    Ok(())
}
```

##### 6. 命令合并与批处理
```typescript
// src/lib/utils/api.ts
// 命令批处理工具
export class CommandBatcher {
  private queue: Array<{ command: string; args: any; resolve: Function; reject: Function }> = [];
  private timer: number | null = null;
  
  async batchInvoke(command: string, args: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ command, args, resolve, reject });
      
      if (this.timer === null) {
        this.timer = window.setTimeout(() => this.flush(), 50); // 50ms批处理窗口
      }
    });
  }
  
  private async flush() {
    if (this.queue.length === 0) return;
    
    const batch = this.queue.splice(0);
    this.timer = null;
    
    try {
      const results = await invoke('batch_execute', {
        commands: batch.map(item => ({ command: item.command, args: item.args }))
      });
      
      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(item => item.reject(error));
    }
  }
}

export const commandBatcher = new CommandBatcher();
```

##### 7. 预加载与预热
```typescript
// src/lib/stores/engine.ts
// 应用启动时预加载引擎状态
import { writable } from 'svelte/store';

export const engineStore = writable({
  status: null,
  config: null,
  history: []
});

export async function preloadEngine() {
  // 并行预加载多个状态
  const [status, config, history] = await Promise.all([
    invoke('get_engine_status'),
    invoke('get_engine_config'),
    invoke('get_generation_history', { limit: 10 }),
  ]);
  
  engineStore.set({ status, config, history });
}
```

##### 8. IPC 性能监控
```typescript
// src/lib/utils/ipc-monitor.ts
// IPC调用性能监控
export async function monitoredInvoke<T>(
  command: string,
  args?: Record<string, any>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await invoke<T>(command, args);
    const duration = performance.now() - start;
    
    if (duration > 100) {
      console.warn(`Slow IPC call: ${command} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`IPC call failed: ${command} after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}
```

#### IPC优化最佳实践总结

1. **批量操作**: 合并多个操作到单次IPC调用
2. **事件驱动**: 使用Tauri事件系统替代轮询
3. **数据精简**: 只传输必要数据，避免大对象序列化
4. **本地缓存**: 前端缓存减少重复请求
5. **流式处理**: 大任务分批处理并实时反馈
6. **异步非阻塞**: 长时间操作使用后台任务+事件通知
7. **预加载**: 启动时预加载常用数据
8. **性能监控**: 监控慢IPC调用并优化

#### 性能目标
- **单次IPC调用延迟**: < 10ms (简单操作)
- **批量操作延迟**: < 50ms (10个文件操作)
- **事件推送延迟**: < 5ms
- **大任务响应**: 立即返回，通过事件推送进度

### 2. IndexTTS 引擎集成

#### 方案A: Python 子进程调用 (推荐初期)
- 保持 IndexTTS 的 Python 实现
- Rust 通过子进程调用 Python 脚本
- 优点: 快速集成，无需重写
- 缺点: 需要 Python 运行时

#### 方案B: Rust FFI 调用 (长期目标)
- 将 IndexTTS 核心逻辑用 Rust 重写
- 直接调用，性能更好
- 优点: 性能最优，无需 Python
- 缺点: 开发工作量大

#### 实施步骤
1. **第一阶段**: 使用 Python 子进程方案，快速实现功能
2. **第二阶段**: 逐步将核心逻辑迁移到 Rust
3. **第三阶段**: 完全 Rust 实现

### 3. 云端引擎集成

```rust
// src-tauri/src/services/tts/cloud.rs
pub struct CloudEngine {
    api_key: String,
    endpoint: String,
}

impl CloudEngine {
    pub async fn generate(&self, text: String) -> Result<String, String> {
        // 调用阿里云百炼 API
        // 注意: 代码中不暴露 "阿里云百炼"、"Qwen3-TTS" 等字样
        let client = reqwest::Client::new();
        // ... API 调用逻辑
    }
}
```

### 4. 状态管理 (Svelte Stores)

```typescript
// src/lib/stores/engine.ts
import { writable } from 'svelte/store';

export const currentEngine = writable('lightweight'); // 内部代号

export const engines = writable([
  { id: 'lightweight', name: '快速模式' },
  { id: 'emotion', name: '标准模式' },
  { id: 'cloud', name: '高质量模式' },
]);

export async function switchEngine(engineId: string) {
  // 切换引擎逻辑
  currentEngine.set(engineId);
}
```

### 6. 音频生成工作流程 (基于 V2 学习)

**V2 实现参考**: `backend/core/audio_generator.py` + `frontend/pages/voice_clone_page.py`

#### 6.1 异步任务处理架构

V2 使用 `QThread` 在后台线程执行音频生成，避免阻塞 UI。V3 应使用 Rust 的 `tokio::spawn` 实现类似效果。

```rust
// src-tauri/src/commands/audio.rs
use tauri::{AppHandle, Emitter};
use tokio::spawn;

#[tauri::command]
pub async fn generate_audio(
    text: String,
    audio_prompt: String,
    engine: String,
    generation_params: serde_json::Value,
    app_handle: AppHandle,
) -> Result<String, String> {
    // 立即返回任务ID，实际生成在后台进行
    let task_id = generate_task_id();
    
    // 在后台任务中执行生成
    let app_handle_clone = app_handle.clone();
    spawn(async move {
        // 发送开始事件
        app_handle_clone.emit("generation-started", &task_id).unwrap();
        
        // 文本预处理
        let processed_text = preprocess_text(&text);
        app_handle_clone.emit("generation-progress", (10, "文本预处理完成")).unwrap();
        
        // 调用引擎生成
        match generate_with_engine(
            &processed_text,
            &audio_prompt,
            &engine,
            &generation_params,
            |progress, message| {
                app_handle_clone.emit("generation-progress", (progress, message)).unwrap();
            }
        ).await {
            Ok(output_path) => {
                app_handle_clone.emit("generation-completed", (task_id, output_path)).unwrap();
            }
            Err(e) => {
                app_handle_clone.emit("generation-failed", (task_id, e)).unwrap();
            }
        }
    });
    
    Ok(task_id)
}
```

#### 6.2 大文本分批处理

V2 使用 `LargeTextGeneratorWorker` 处理超过1万字符的文本。V3 应实现类似的分批逻辑：

```rust
// src-tauri/src/services/tts/batch_processor.rs
pub struct BatchProcessor {
    max_chars_per_batch: usize,
}

impl BatchProcessor {
    pub fn split_text(&self, text: &str) -> Vec<String> {
        // 按标点符号智能分句
        // 每批不超过 max_chars_per_batch 字符
        // 保持句子完整性
    }
    
    pub async fn generate_batches(
        &self,
        batches: Vec<String>,
        engine: &dyn TtsEngine,
        progress_callback: impl Fn(usize, usize),
    ) -> Result<Vec<String>, String> {
        let mut results = Vec::new();
        for (index, batch) in batches.iter().enumerate() {
            progress_callback(index + 1, batches.len());
            let audio_path = engine.generate(batch).await?;
            results.push(audio_path);
        }
        Ok(results)
    }
    
    pub fn merge_audio_files(&self, audio_paths: Vec<String>, output_path: &str) -> Result<(), String> {
        // 使用 FFmpeg 合并音频文件
        // 添加适当的淡入淡出效果
    }
}
```

#### 6.3 进度反馈机制

V2 使用 Qt 信号槽机制推送进度。V3 使用 Tauri Events：

```typescript
// src/routes/voice-clone/+page.svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { listen } from '@tauri-apps/api/event';
  
  let progress = 0;
  let message = '';
  
  let unlistenProgress: () => void;
  let unlistenCompleted: () => void;
  
  onMount(async () => {
    // 监听生成进度
    unlistenProgress = await listen<[number, string]>('generation-progress', (event) => {
      const [prog, msg] = event.payload;
      progress = prog;
      message = msg;
    });
    
    // 监听生成完成
    unlistenCompleted = await listen<[string, string]>('generation-completed', (event) => {
      const [taskId, outputPath] = event.payload;
      handleCompleted(outputPath);
    });
  });
  
  onDestroy(() => {
    unlistenProgress?.();
    unlistenCompleted?.();
  });
</script>
```

### 7. 文本预处理与优化 (基于 V2 学习)

**V2 实现参考**: `backend/services/text_optimizer.py`

#### 7.1 文本预处理功能

V2 的 `TextOptimizer` 实现了丰富的文本优化功能，V3 应在 Rust 中实现：

```rust
// src-tauri/src/services/text_optimizer.rs
pub struct TextOptimizer {
    // 配置选项
}

impl TextOptimizer {
    pub fn preprocess(&self, text: &str) -> String {
        let mut result = text.to_string();
        
        // 1. 清理特殊字符（零宽字符、多余空白）
        result = self.clean_text(&result);
        
        // 2. 标准化标点符号
        result = self.normalize_punctuation(&result);
        
        // 3. 补充缺失的结尾标点
        result = self.add_missing_ending_punctuation(&result);
        
        // 4. 增强段落间停顿
        result = self.enhance_paragraph_pauses(&result);
        
        // 5. 增强句子间停顿
        result = self.enhance_sentence_pauses(&result);
        
        // 6. 优化长句换气
        result = self.optimize_breathing(&result);
        
        result
    }
    
    fn clean_text(&self, text: &str) -> String {
        // 移除零宽字符: \u200b, \u200c, \u200d, \ufeff
        // 规范化空白字符（保留换行符）
    }
    
    fn normalize_punctuation(&self, text: &str) -> String {
        // 标点符号转换映射
        // 中文标点 -> 英文标点（TTS引擎支持）
        // 例如: ：-> ,  ；-> ,  。-> .
    }
    
    fn add_missing_ending_punctuation(&self, text: &str) -> String {
        // 为缺失结尾标点的行添加标点
        // 根据语境判断：疑问句(？)、感叹句(！)、陈述句(。)
    }
    
    fn enhance_paragraph_pauses(&self, text: &str) -> String {
        // 多个连续换行符 -> 转换为长省略号(……)表示段落间长停顿
    }
    
    fn enhance_sentence_pauses(&self, text: &str) -> String {
        // 句号后直接跟中文字符 -> 添加省略号(…)表示中等停顿
    }
    
    fn optimize_breathing(&self, text: &str) -> String {
        // 超长无标点片段(>25字符) -> 在适当位置插入逗号
        // 寻找自然断句点（连接词、时间词等）
    }
}
```

#### 7.2 情感分析 (可选，基于 V2)

V2 的 `TextOptimizer` 支持情感分析，V3 可作为高级功能：

```rust
// src-tauri/src/services/text_optimizer.rs
pub struct EmotionAnalyzer {
    // 情感关键词库
    keywords: HashMap<String, Vec<(String, f32)>>,
}

impl EmotionAnalyzer {
    pub fn analyze(&self, text: &str) -> EmotionVector {
        // 1. 基于标点符号分析
        // 2. 基于关键词分析
        // 3. 返回情感向量（happy, angry, sad, calm等）
    }
    
    pub fn suggest_speed(&self, emotion: &EmotionVector) -> f32 {
        // 根据情感建议语速
        // 激动/高兴 -> 稍快(1.05)
        // 悲伤/低落 -> 稍慢(0.95)
        // 愤怒 -> 稍快(1.08)
    }
}
```

### 8. 人声分离服务 (基于 V2 学习)

**V2 实现参考**: `backend/services/vocal_separator.py`

#### 8.1 服务架构

V2 支持 Demucs（深度学习）和 librosa（基础方法）两种分离方式，V3 应实现类似降级策略：

```rust
// src-tauri/src/services/vocal_separator.rs
pub enum SeparationMethod {
    Demucs,  // 深度学习模型（高质量）
    Librosa, // 基础方法（降级方案）
    None,    // 不可用
}

pub struct VocalSeparator {
    method: SeparationMethod,
    ffmpeg_path: PathBuf,
}

impl VocalSeparator {
    pub fn new() -> Self {
        // 检测可用方法
        let method = if Self::check_demucs() {
            SeparationMethod::Demucs
        } else if Self::check_librosa() {
            SeparationMethod::Librosa
        } else {
            SeparationMethod::None
        };
        
        Self {
            method,
            ffmpeg_path: Self::find_ffmpeg(),
        }
    }
    
    pub async fn process_file(
        &self,
        file_path: &Path,
        output_path: &Path,
        progress_callback: impl Fn(usize, &str),
    ) -> Result<(), String> {
        // 1. 判断是否为视频文件
        if self.is_video(file_path) {
            progress_callback(10, "正在从视频提取音频...");
            let audio_path = self.extract_audio(file_path).await?;
            // 继续处理音频
        }
        
        // 2. 裁剪音频到15秒（参考音频限制）
        progress_callback(40, "正在裁剪音频到15秒...");
        let cut_path = self.cut_audio(file_path, 15).await?;
        
        // 3. 人声分离
        if self.method != SeparationMethod::None {
            progress_callback(60, "正在分离人声...");
            let vocal_path = self.separate_vocals(&cut_path).await?;
            // 复制到输出路径
        } else {
            // 降级：直接使用裁剪后的音频
        }
        
        Ok(())
    }
    
    async fn extract_audio(&self, video_path: &Path) -> Result<PathBuf, String> {
        // 使用 FFmpeg 从视频提取音频
        // ffmpeg -i video.mp4 -vn -acodec pcm_s16le -ar 44100 -ac 1 output.wav
    }
    
    async fn cut_audio(&self, audio_path: &Path, duration_sec: u32) -> Result<PathBuf, String> {
        // 使用 FFmpeg 裁剪音频
        // ffmpeg -i input.wav -t 15 output.wav
    }
    
    async fn separate_with_demucs(&self, audio_path: &Path) -> Result<PathBuf, String> {
        // 调用 Demucs 模型分离人声
        // 优先使用 GPU (CUDA)，降级到 CPU
        // 返回分离后的人声文件路径
    }
    
    async fn separate_with_librosa(&self, audio_path: &Path) -> Result<PathBuf, String> {
        // 使用 librosa 的 HPSS (Harmonic-Percussive Source Separation) 方法
        // 作为降级方案
    }
}
```

#### 8.2 FFmpeg 集成

V2 使用项目自带的 FFmpeg。V3 应同样打包 FFmpeg：

```rust
// src-tauri/src/utils/ffmpeg.rs
pub fn find_ffmpeg() -> Option<PathBuf> {
    // 1. 优先查找项目目录下的 tools/ffmpeg/ffmpeg.exe
    // 2. 降级到系统 PATH 中的 ffmpeg
    // 3. 返回 None 如果都找不到
}
```

### 9. 用户认证与 WebSocket 实时同步 (基于 V2 学习)

**V2 实现参考**: `backend/auth/user_manager.py` + `backend/network/websocket_client.py`

#### 9.1 用户状态管理

V2 的 `UserManager` 是单例模式，管理用户登录状态、Token、会员信息。V3 应在 Rust 中实现：

```rust
// src-tauri/src/services/user_manager.rs
use std::sync::{Arc, Mutex};

pub struct UserManager {
    user_data: Arc<Mutex<Option<UserData>>>,
    token: Arc<Mutex<Option<String>>>,
    refresh_token: Arc<Mutex<Option<String>>>,
    config_path: PathBuf,
    ws_client: Option<WebSocketClient>,
}

impl UserManager {
    pub fn new() -> Self {
        let config_path = Self::get_config_path();
        let mut manager = Self {
            user_data: Arc::new(Mutex::new(None)),
            token: Arc::new(Mutex::new(None)),
            refresh_token: Arc::new(Mutex::new(None)),
            config_path,
            ws_client: None,
        };
        
        // 加载保存的会话
        manager.load_saved_session();
        
        manager
    }
    
    fn get_config_path() -> PathBuf {
        // Windows: %APPDATA%/MaruAudio/user_session.json
        // Linux/Mac: ~/.config/MaruAudio/user_session.json
    }
    
    pub fn load_saved_session(&mut self) {
        // 从本地文件加载 Token 和用户数据
        // 验证 Token 有效性
        // 如果有效，连接 WebSocket
    }
    
    pub fn save_session(&self) {
        // 保存 Token、Refresh Token、用户数据到本地文件
    }
    
    pub fn clear_session(&mut self) {
        // 清除本地会话
        // 断开 WebSocket
    }
    
    pub fn is_logged_in(&self) -> bool {
        self.token.lock().unwrap().is_some() && 
        self.user_data.lock().unwrap().is_some()
    }
    
    pub fn get_max_chars(&self) -> usize {
        let user_data = self.user_data.lock().unwrap();
        if let Some(user) = user_data.as_ref() {
            match user.user_group.as_str() {
                "monthly" | "yearly" | "permanent" => 100000, // 无限制
                "trial" => 1000,
                _ => 500, // 免费用户
            }
        } else {
            500
        }
    }
    
    pub async fn login(&mut self, email: String, password: String) -> Result<UserData, String> {
        // 调用 API 登录
        // 保存 Token 和用户数据
        // 连接 WebSocket
        // 返回用户数据
    }
    
    pub async fn connect_websocket(&mut self) {
        // 连接 WebSocket 服务器
        // 监听用户状态更新、配置更新等事件
        // 实现断线重连机制
    }
}
```

#### 9.2 WebSocket 实时同步

V2 使用 WebSocket 实现用户状态、配置的实时同步。V3 应使用 Rust 的 WebSocket 库：

```rust
// src-tauri/src/services/websocket_client.rs
use tokio_tungstenite::{connect_async, tungstenite::Message};

pub struct WebSocketClient {
    url: String,
    token: String,
    sender: Option<mpsc::UnboundedSender<Message>>,
    reconnect_interval: Duration,
}

impl WebSocketClient {
    pub async fn connect(&mut self, token: String) -> Result<(), String> {
        self.token = token;
        self.connect_internal().await
    }
    
    async fn connect_internal(&mut self) -> Result<(), String> {
        // 建立 WebSocket 连接
        // 发送认证消息（包含 Token）
        // 启动消息接收循环
        // 实现断线重连
    }
    
    pub async fn handle_message(&self, message: Message) {
        // 解析消息类型
        // - user_updated: 用户信息更新
        // - config_updated: 配置更新
        // - announcement: 公告通知
        // 通过 Tauri Events 推送到前端
    }
    
    pub async fn reconnect(&mut self) {
        // 实现指数退避重连策略
        // 最大重连间隔限制
    }
}
```

前端监听 WebSocket 事件：

```typescript
// src/lib/stores/user.ts
import { writable } from 'svelte/store';
import { listen } from '@tauri-apps/api/event';

export const userData = writable(null);

// 监听用户更新事件
listen('user-updated', (event) => {
  userData.set(event.payload);
});

// 监听配置更新事件
listen('config-updated', (event) => {
  // 更新配置
});
```

### 10. 引擎热切换实现 (基于 V2 学习)

**V2 实现参考**: `backend/engine/manager.py`

#### 10.1 引擎管理器

V2 的 `EngineManager` 支持运行时热切换引擎，V3 应实现类似功能：

```rust
// src-tauri/src/services/engine_manager.rs
use std::sync::{Arc, Mutex};

pub struct EngineManager {
    engines: HashMap<String, Box<dyn EngineFactory>>,
    current_engine: Arc<Mutex<Option<Box<dyn TtsEngine>>>>,
    current_version: Arc<Mutex<Option<String>>>,
    switch_lock: Arc<Mutex<()>>, // 防止并发切换
}

impl EngineManager {
    pub fn new() -> Self {
        let mut manager = Self {
            engines: HashMap::new(),
            current_engine: Arc::new(Mutex::new(None)),
            current_version: Arc::new(Mutex::new(None)),
            switch_lock: Arc::new(Mutex::new(())),
        };
        
        // 注册所有可用引擎
        manager.register_engines();
        
        manager
    }
    
    fn register_engines(&mut self) {
        // 注册轻量引擎
        self.engines.insert("lightweight".to_string(), Box::new(LightweightEngineFactory));
        
        // 注册情感引擎
        self.engines.insert("emotion".to_string(), Box::new(EmotionEngineFactory));
        
        // 注册云端引擎
        self.engines.insert("cloud".to_string(), Box::new(CloudEngineFactory));
    }
    
    pub async fn switch_engine(
        &self,
        version: String,
        app_handle: AppHandle,
    ) -> Result<(), String> {
        let _lock = self.switch_lock.lock().unwrap();
        
        // 检查是否已经是当前版本
        if *self.current_version.lock().unwrap() == Some(version.clone()) {
            return Ok(());
        }
        
        // 发送切换开始事件
        app_handle.emit("engine-switch-progress", (5.0, "准备切换引擎...")).unwrap();
        
        // 1. 卸载当前引擎
        if let Some(mut engine) = self.current_engine.lock().unwrap().take() {
            app_handle.emit("engine-switch-progress", (10.0, "正在卸载旧引擎...")).unwrap();
            engine.cleanup().await?;
        }
        
        // 2. 加载新引擎
        app_handle.emit("engine-switch-progress", (15.0, "正在加载新引擎...")).unwrap();
        
        let factory = self.engines.get(&version)
            .ok_or_else(|| format!("不支持的引擎版本: {}", version))?;
        
        let mut new_engine = factory.create().await?;
        new_engine.initialize().await?;
        
        // 3. 更新当前引擎
        *self.current_engine.lock().unwrap() = Some(new_engine);
        *self.current_version.lock().unwrap() = Some(version);
        
        app_handle.emit("engine-switch-progress", (100.0, "引擎切换完成")).unwrap();
        app_handle.emit("engine-switch-finished", (true, "切换成功")).unwrap();
        
        Ok(())
    }
    
    pub fn get_current_engine(&self) -> Option<Arc<Mutex<Box<dyn TtsEngine>>>> {
        // 返回当前引擎的引用（用于生成音频）
    }
}
```

#### 10.2 引擎接口定义

```rust
// src-tauri/src/services/tts/trait.rs
pub trait TtsEngine: Send + Sync {
    async fn initialize(&mut self) -> Result<(), String>;
    async fn generate(
        &self,
        text: &str,
        audio_prompt: &str,
        output_path: &str,
        params: GenerationParams,
        progress_callback: impl Fn(usize, &str),
    ) -> Result<String, String>;
    async fn cleanup(&mut self) -> Result<(), String>;
}

pub trait EngineFactory: Send + Sync {
    async fn create(&self) -> Result<Box<dyn TtsEngine>, String>;
}
```

### 11. GPU 检测与自动模型选择 (基于 V2 学习)

**V2 实现参考**: `frontend/pages/voice_clone_page.py` 中的 `check_gpu_support()`

#### 11.1 GPU 检测

V2 使用 `nvidia-smi` 检测 GPU 和显存，V3 应在 Rust 中实现：

```rust
// src-tauri/src/utils/gpu_detector.rs
pub struct GpuInfo {
    pub has_gpu: bool,
    pub gpu_name: String,
    pub vram_gb: f32,
    pub recommended_mode: String, // "local" 或 "cloud"
    pub recommended_model: String, // "0.6B" 或 "1.7B"
}

impl GpuDetector {
    pub fn detect() -> GpuInfo {
        // 1. 尝试调用 nvidia-smi 检测 GPU
        if let Ok(output) = Command::new("nvidia-smi")
            .args(&["--query-gpu=name,memory.total", "--format=csv,noheader,nounits"])
            .output()
        {
            if let Ok(stdout) = String::from_utf8(output.stdout) {
                if let Some((name, vram_mb)) = Self::parse_nvidia_smi(&stdout) {
                    let vram_gb = vram_mb / 1024.0;
                    let (recommended_mode, recommended_model) = 
                        Self::recommend_config(vram_gb);
                    
                    return GpuInfo {
                        has_gpu: true,
                        gpu_name: name,
                        vram_gb,
                        recommended_mode,
                        recommended_model,
                    };
                }
            }
        }
        
        // 2. 未检测到 GPU
        GpuInfo {
            has_gpu: false,
            gpu_name: "未检测到".to_string(),
            vram_gb: 0.0,
            recommended_mode: "cloud".to_string(),
            recommended_model: "0.6B".to_string(),
        }
    }
    
    fn recommend_config(vram_gb: f32) -> (String, String) {
        if vram_gb > 4.0 {
            // 显存 > 4GB：推荐本地引擎 + 1.7B 模型
            ("local".to_string(), "1.7B".to_string())
        } else {
            // 显存 <= 4GB：推荐本地引擎 + 0.6B 模型（同时推荐云端）
            ("local".to_string(), "0.6B".to_string())
        }
    }
}
```

#### 11.2 自动模型选择

```rust
// src-tauri/src/services/engine_config.rs
pub struct EngineConfig {
    gpu_info: GpuInfo,
}

impl EngineConfig {
    pub fn get_local_model_size(&self) -> String {
        if self.gpu_info.has_gpu {
            self.gpu_info.recommended_model.clone()
        } else {
            "0.6B".to_string() // 默认
        }
    }
    
    pub fn get_model_dir(&self, model_size: &str) -> PathBuf {
        // 返回模型目录路径
        // models/IndexTTS-{model_size}/
    }
}
```

### 12. 参考音频处理流程 (基于 V2 学习)

**V2 实现参考**: `frontend/pages/voice_clone_page.py` + `backend/services/vocal_separator.py`

#### 12.1 参考音频上传与处理

```rust
// src-tauri/src/commands/audio.rs
#[tauri::command]
pub async fn process_reference_audio(
    file_path: String,
    enable_vocal_separation: bool,
    app_handle: AppHandle,
) -> Result<String, String> {
    let input_path = PathBuf::from(file_path);
    
    // 1. 判断文件类型（视频/音频）
    let is_video = is_video_file(&input_path);
    
    // 2. 如果是视频，先提取音频
    let audio_path = if is_video {
        app_handle.emit("reference-audio-progress", (10, "正在从视频提取音频...")).unwrap();
        extract_audio_from_video(&input_path).await?
    } else {
        input_path
    };
    
    // 3. 裁剪到15秒（参考音频限制）
    app_handle.emit("reference-audio-progress", (40, "正在裁剪音频到15秒...")).unwrap();
    let cut_path = cut_audio(&audio_path, 15).await?;
    
    // 4. 可选：人声分离
    let final_path = if enable_vocal_separation {
        app_handle.emit("reference-audio-progress", (60, "正在分离人声...")).unwrap();
        let separator = VocalSeparator::new();
        separator.process_file(&cut_path, &output_path, |progress, msg| {
            app_handle.emit("reference-audio-progress", (progress, msg)).unwrap();
        }).await?;
        output_path
    } else {
        cut_path
    };
    
    // 5. 可选：ASR 识别参考文本
    app_handle.emit("reference-audio-progress", (90, "正在识别参考文本...")).unwrap();
    let reference_text = recognize_audio_text(&final_path).await?;
    
    app_handle.emit("reference-audio-completed", (final_path, reference_text)).unwrap();
    
    Ok(final_path)
}
```

#### 12.2 ASR 参考文本识别

V2 支持自动识别参考音频的文本内容。V3 应实现类似功能：

```rust
// src-tauri/src/services/asr.rs
pub struct AsrService {
    // ASR 引擎配置
}

impl AsrService {
    pub async fn recognize(&self, audio_path: &Path) -> Result<String, String> {
        // 使用必剪 ASR 或其他 ASR 服务
        // 返回识别的文本内容
    }
}
```

### 13. 字幕生成功能细节 (基于 V2 学习)

**V2 实现参考**: `backend/subtitle/` + `frontend/pages/subtitle_page.py`

#### 13.1 视频/音频转录

```rust
// src-tauri/src/services/subtitle.rs
pub struct SubtitleService {
    asr_engine: Box<dyn AsrEngine>,
}

impl SubtitleService {
    pub async fn transcribe_file(
        &self,
        file_path: &Path,
        progress_callback: impl Fn(usize, &str),
    ) -> Result<SubtitleResult, String> {
        // 1. 判断文件类型
        let is_video = is_video_file(file_path);
        
        // 2. 如果是视频，先提取音频
        let audio_path = if is_video {
            progress_callback(10, "正在从视频提取音频...");
            extract_audio_from_video(file_path).await?
        } else {
            file_path.to_path_buf()
        };
        
        // 3. 调用 ASR 引擎转录音频
        progress_callback(30, "正在转录音频...");
        let segments = self.asr_engine.transcribe(&audio_path, |progress, msg| {
            progress_callback(30 + (progress * 0.6) as usize, msg);
        }).await?;
        
        // 4. 生成字幕文件
        progress_callback(90, "正在生成字幕文件...");
        let subtitle_file = self.generate_subtitle_file(&segments).await?;
        
        Ok(SubtitleResult {
            segments,
            subtitle_file,
        })
    }
    
    pub async fn generate_subtitle_file(
        &self,
        segments: &[SubtitleSegment],
    ) -> Result<PathBuf, String> {
        // 支持多种格式：SRT、VTT、ASS
        // 根据用户选择生成对应格式
    }
}
```

#### 13.2 字幕翻译

```rust
// src-tauri/src/services/subtitle/translator.rs
pub struct SubtitleTranslator {
    // 翻译服务配置
}

impl SubtitleTranslator {
    pub async fn translate(
        &self,
        segments: &[SubtitleSegment],
        target_lang: &str,
    ) -> Result<Vec<SubtitleSegment>, String> {
        // 批量翻译字幕片段
        // 保持时间轴不变
    }
}
```

### 14. 文件管理功能细节 (基于 V2 学习)

**V2 实现参考**: `frontend/pages/file_manager_page.py`

#### 14.1 文件分类与浏览

```rust
// src-tauri/src/commands/file.rs
#[tauri::command]
pub async fn list_files(
    category: Option<String>, // "gen", "sample", "subtitle", "other"
) -> Result<Vec<FileInfo>, String> {
    let base_dir = match category.as_deref() {
        Some("gen") => PathBuf::from("outputs/gen"),
        Some("sample") => PathBuf::from("outputs/Sample"),
        Some("subtitle") => PathBuf::from("outputs/Subtitle"),
        _ => PathBuf::from("outputs"),
    };
    
    let mut files = Vec::new();
    
    // 遍历目录，收集文件信息
    for entry in fs::read_dir(base_dir)? {
        let entry = entry?;
        let path = entry.path();
        
        if path.is_file() {
            let metadata = entry.metadata()?;
            files.push(FileInfo {
                path: path.to_string_lossy().to_string(),
                name: path.file_name().unwrap().to_string_lossy().to_string(),
                size: metadata.len(),
                created: metadata.created()?.into(),
                modified: metadata.modified()?.into(),
                file_type: detect_file_type(&path),
            });
        }
    }
    
    // 按修改时间倒序排序
    files.sort_by(|a, b| b.modified.cmp(&a.modified));
    
    Ok(files)
}

fn detect_file_type(path: &Path) -> String {
    match path.extension().and_then(|s| s.to_str()) {
        Some("wav") | Some("mp3") | Some("flac") => "audio".to_string(),
        Some("srt") | Some("vtt") | Some("ass") => "subtitle".to_string(),
        _ => "other".to_string(),
    }
}
```

#### 14.2 文件操作

```rust
#[tauri::command]
pub async fn delete_file(path: String) -> Result<(), String> {
    fs::remove_file(path)?;
    Ok(())
}

#[tauri::command]
pub async fn rename_file(old_path: String, new_name: String) -> Result<String, String> {
    let old_path = PathBuf::from(old_path);
    let mut new_path = old_path.parent().unwrap().join(new_name);
    
    // 如果新名称没有扩展名，保留原扩展名
    if new_path.extension().is_none() {
        if let Some(ext) = old_path.extension() {
            new_path.set_extension(ext);
        }
    }
    
    fs::rename(&old_path, &new_path)?;
    Ok(new_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn open_file_in_explorer(path: String) -> Result<(), String> {
    // Windows: explorer /select,path
    // Linux: xdg-open
    // Mac: open -R
    open::that(path)?;
    Ok(())
}
```

### 15. 样音库管理细节 (基于 V2 学习)

**V2 实现参考**: `frontend/pages/sample_library_page.py`

#### 15.1 样音数据结构

```rust
// src-tauri/src/models/sample.rs
#[derive(Serialize, Deserialize)]
pub struct Sample {
    pub id: String,
    pub name: String,
    pub audio_path: String,
    pub cover_path: Option<String>,
    pub tags: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Serialize, Deserialize)]
pub struct SampleMetadata {
    samples: Vec<Sample>,
}
```

#### 15.2 样音管理操作

```rust
// src-tauri/src/commands/sample.rs
#[tauri::command]
pub async fn create_sample(
    name: String,
    audio_path: String,
    cover_path: Option<String>,
    tags: Vec<String>,
) -> Result<Sample, String> {
    // 1. 复制音频文件到 outputs/Sample/ 目录
    // 2. 生成样音 ID
    // 3. 创建样音元数据
    // 4. 保存到 metadata.json
}

#[tauri::command]
pub async fn list_samples(
    search_query: Option<String>,
    tags: Option<Vec<String>>,
) -> Result<Vec<Sample>, String> {
    // 加载 metadata.json
    // 根据搜索条件和标签过滤
    // 返回样音列表
}

#[tauri::command]
pub async fn apply_sample(sample_id: String) -> Result<Sample, String> {
    // 加载样音信息
    // 通过事件推送到前端，应用到配音生成页面
}
```

### 16. 单实例应用实现 (基于 V2 学习)

**V2 实现参考**: `main.py` 中的 `QSharedMemory` 检测

V3 应使用 Tauri 的 `single-instance` 插件或系统级单实例检测：

```rust
// src-tauri/src/main.rs
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            // 如果已有实例运行，激活现有窗口
            if let Some(window) = app.get_window("main") {
                window.show().unwrap();
                window.set_focus().unwrap();
            }
        }))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 17. 配置持久化 (基于 V2 学习)

**V2 实现参考**: `backend/utils/path_config.py` + `backend/auth/user_manager.py`

#### 17.1 用户配置存储

```rust
// src-tauri/src/utils/config.rs
pub struct ConfigManager {
    config_dir: PathBuf,
}

impl ConfigManager {
    pub fn new() -> Self {
        let config_dir = Self::get_config_dir();
        fs::create_dir_all(&config_dir).unwrap();
        
        Self { config_dir }
    }
    
    fn get_config_dir() -> PathBuf {
        // Windows: %APPDATA%/MaruAudio
        // Linux: ~/.config/MaruAudio
        // Mac: ~/Library/Application Support/MaruAudio
    }
    
    pub fn save_user_session(&self, session: &UserSession) -> Result<(), String> {
        let path = self.config_dir.join("user_session.json");
        let json = serde_json::to_string_pretty(session)?;
        fs::write(path, json)?;
        Ok(())
    }
    
    pub fn load_user_session(&self) -> Option<UserSession> {
        let path = self.config_dir.join("user_session.json");
        if path.exists() {
            if let Ok(content) = fs::read_to_string(path) {
                if let Ok(session) = serde_json::from_str(&content) {
                    return Some(session);
                }
            }
        }
        None
    }
    
    pub fn save_path_memory(&self, path_type: &str, path: &Path) -> Result<(), String> {
        // 记住用户选择的文件路径（上传文本、保存音频等）
        let path_memory = self.load_path_memory();
        // 更新并保存
    }
}
```

### 18. 版本管理与更新检测 (基于 V2 学习)

**V2 实现参考**: `backend/utils/version.py` + `backend/utils/updater.py`

#### 18.1 版本检测

```rust
// src-tauri/src/utils/version.rs
pub struct VersionManager {
    current_version: String,
    update_check_url: String,
}

impl VersionManager {
    pub async fn check_update(&self) -> Result<UpdateInfo, String> {
        // 从 CNB.cool 或 GitHub 检测更新
        // 返回最新版本信息
    }
    
    pub async fn download_update(&self, update_url: &str) -> Result<PathBuf, String> {
        // 下载更新包
        // 返回下载路径
    }
    
    pub async fn install_update(&self, update_path: &Path) -> Result<(), String> {
        // 安装更新（可能需要重启应用）
    }
}
```

---

### 第一阶段: 项目基础搭建 (1-2周)

#### 1.1 初始化项目
- [ ] 创建 Tauri 2.0 项目
- [ ] 配置 SvelteKit + TypeScript
- [ ] 配置 Vite 构建
- [ ] 设置项目目录结构

#### 1.2 基础组件开发
- [ ] 主窗口布局
- [ ] 侧边栏导航
- [ ] 路由配置 (SvelteKit 文件系统路由)
- [ ] 状态管理 (Svelte Stores)
- [ ] 主题配置 (暗色主题)

#### 1.3 Rust 后端基础
- [ ] Tauri Commands 框架
- [ ] 文件系统操作
- [ ] 配置管理
- [ ] 日志系统

#### 1.4 IPC 通信优化基础
- [ ] 实现IPC性能监控工具
- [ ] 建立事件系统框架 (Tauri Events)
- [ ] 实现命令批处理工具
- [ ] 建立前端缓存机制
- [ ] 实现IPC调用封装 (monitoredInvoke)

### 第二阶段: 核心功能开发 (3-4周)

#### 2.1 用户系统
- [ ] 登录/注册界面
- [ ] 用户状态管理
- [ ] Token 管理
- [ ] 会员权限控制

#### 2.2 引擎集成
- [ ] 轻量引擎集成 (Python 子进程)
- [ ] 情感引擎集成 (Python 子进程)
- [ ] 云端引擎集成 (HTTP API)
- [ ] 引擎管理器
- [ ] 引擎切换功能

#### 2.3 配音生成功能
- [ ] 文本输入组件
- [ ] 参考音频上传
- [ ] 参数调节组件
- [ ] 音频播放器
- [ ] 生成进度显示 (使用事件系统，避免轮询)
- [ ] 批量处理逻辑 (批量IPC调用优化)

#### 2.4 IPC 通信优化实施
- [ ] 音频生成使用事件推送进度 (替代轮询)
- [ ] 文件操作批量处理优化
- [ ] 引擎状态使用事件推送 (替代定时查询)
- [ ] 实现流式数据传输 (大文本生成)

### 第三阶段: 扩展功能开发 (2-3周)

#### 3.1 样音库管理
- [ ] 样音列表展示
- [ ] 样音上传/删除
- [ ] 样音分类管理
- [ ] 样音搜索功能

#### 3.2 字幕生成
- [ ] 文件上传组件
- [ ] ASR 集成
- [ ] 字幕编辑界面
- [ ] 字幕导出功能

#### 3.3 文件管理
- [ ] 文件列表展示
- [ ] 文件操作 (打开/删除/重命名)
- [ ] 文件搜索
- [ ] 文件预览

### 第四阶段: 优化与测试 (2周)

#### 4.1 性能优化
- [ ] 前端性能优化
- [ ] Rust 后端优化
- [ ] 引擎加载优化
- [ ] 大文本处理优化
- [ ] IPC通信延迟优化
  - [ ] 分析慢IPC调用并优化
  - [ ] 优化批量操作性能
  - [ ] 优化事件推送延迟
  - [ ] 优化数据序列化性能
  - [ ] 验证性能目标达成 (< 10ms单次调用, < 50ms批量操作)

#### 4.2 测试
- [ ] 单元测试
- [ ] 集成测试
- [ ] 用户测试
- [ ] Bug 修复

#### 4.3 打包发布
- [ ] Tauri 打包配置
- [ ] 安装包制作
- [ ] 版本管理
- [ ] 更新机制

---

## 🎨 UI/UX 设计规范

### 设计风格
- **主题**: 暗色主题
- **颜色方案**:
  - 背景: `#1E1F22` / `#2C2E32`
  - 前景: `#FFFFFF` / `#CCCCCC`
  - 强调色: `#52C41A` (绿色)
- **圆角**: 按钮 8px、卡片 16px、弹窗 24px
- **字体**: HarmonyOS Sans, 14px 正文

### 组件规范
- 使用 Svelte 组件系统
- 自定义主题色
- 响应式布局
- 无障碍支持

---

## 🔐 安全与权限

### 用户权限
- **免费用户**: 500字符/次
- **试用会员**: 1000字符/次
- **付费会员**: 无限制

### API 安全
- **Token 认证**: 使用 JWT Token
- **设备绑定**: 机器码绑定
- **签名验证**: API 请求签名验证

### 数据安全
- **本地存储**: 敏感数据加密存储
- **网络传输**: HTTPS 加密
- **模型保护**: 模型文件加密/混淆

---

## 📦 依赖管理

### 前端依赖
```json
{
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    "@sveltejs/kit": "^2.9.0",
    "svelte": "^5.0.0"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^5.0.0",
    "typescript": "~5.6.2",
    "vite": "^6.0.3"
  }
}
```

### Rust 依赖
```toml
[dependencies]
tauri = { version = "2.0", features = ["shell-all", "dialog-all", "fs-all"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.0", features = ["full"] }
reqwest = { version = "0.11", features = ["json"] }
```

---

## 🚀 部署与发布

### 打包流程
1. **前端构建**: `npm run build`
2. **Tauri 打包**: `npm run tauri:build`
3. **安装包**: 生成 Windows 安装包
4. **版本信息**: 更新版本号和更新日志
5. **发布**: 上传到发布平台

### 发布渠道
- **CNB.cool**: 主要发布平台
- **GitHub**: 源码同步 (不用于发布)

---

## 📝 开发注意事项

### 1. 模型信息隐藏
- ✅ 所有用户可见的文本使用代号
- ✅ 日志中不输出模型真实名称
- ✅ 配置文件使用内部代号
- ✅ 错误提示使用通用信息

### 2. 代码规范
- ✅ TypeScript 严格模式
- ✅ Rust 使用 clippy 检查
- ✅ 代码格式化 (Prettier + rustfmt)
- ✅ Svelte 代码检查 (svelte-check)
- ✅ 提交前运行 lint

### 3. 性能优化
- ✅ 前端懒加载
- ✅ Rust 异步处理
- ✅ 引擎延迟加载
- ✅ 资源及时释放
- ✅ IPC通信优化
  - ✅ 避免频繁IPC调用，使用批量操作
  - ✅ 使用事件系统替代轮询
  - ✅ 减少数据传输量，只传输必要数据
  - ✅ 前端缓存减少重复请求
  - ✅ 长时间操作使用事件推送进度

### 4. 错误处理
- ✅ 完善的错误提示
- ✅ 错误日志记录
- ✅ 用户友好的错误信息
- ✅ 降级方案

---

## 📚 参考资源

### 技术文档
- [Tauri 2.0 文档](https://tauri.app/)
- [Svelte 文档](https://svelte.dev/)
- [SvelteKit 文档](https://kit.svelte.dev/)
- [Rust 文档](https://doc.rust-lang.org/)

### 引擎源码
- IndexTTS 1.5: https://github.com/index-tts/index-tts/tree/v1.5.0
- IndexTTS 2.0: https://github.com/index-tts/index-tts

---

---

## 📖 V2 项目学习总结

### 核心架构模式

1. **异步任务处理**: V2 使用 `QThread` 在后台线程执行耗时操作，V3 应使用 Rust 的 `tokio::spawn` 实现类似效果
2. **信号槽机制**: V2 使用 Qt 信号槽实现跨线程通信，V3 应使用 Tauri Events 实现事件推送
3. **单例模式**: V2 的 `UserManager`、`EngineManager` 等使用单例模式，V3 应使用 Rust 的 `Arc<Mutex<>>` 实现
4. **引擎热切换**: V2 支持运行时切换引擎，V3 应实现类似的引擎管理器
5. **降级策略**: V2 在多个地方实现降级方案（Demucs -> librosa，GPU -> CPU），V3 应保持类似的容错机制

### 关键技术点

1. **文本预处理**: V2 的 `TextOptimizer` 实现了丰富的文本优化功能，包括标点标准化、停顿增强、换气优化等
2. **人声分离**: V2 支持 Demucs（深度学习）和 librosa（基础方法）两种分离方式
3. **大文本处理**: V2 的 `LargeTextGeneratorWorker` 实现了超过1万字符的自动分批处理
4. **WebSocket 实时同步**: V2 使用 WebSocket 实现用户状态、配置的实时同步
5. **GPU 自动检测**: V2 使用 `nvidia-smi` 检测 GPU，并根据显存自动选择模型

### 迁移注意事项

1. **Python -> Rust**: 需要将 Python 的业务逻辑迁移到 Rust，保持功能一致性
2. **PySide6 -> SvelteKit**: UI 需要完全重新实现，但可以参考 V2 的页面布局和交互设计
3. **Qt 信号槽 -> Tauri Events**: 事件通信机制需要适配
4. **QThread -> tokio::spawn**: 异步任务处理方式需要调整
5. **文件路径处理**: V2 使用 Python 的 `pathlib`，V3 应使用 Rust 的 `PathBuf`

### V2 项目文件参考清单

- **音频生成**: `backend/core/audio_generator.py`
- **引擎管理**: `backend/engine/manager.py`
- **用户管理**: `backend/auth/user_manager.py`
- **文本优化**: `backend/services/text_optimizer.py`
- **人声分离**: `backend/services/vocal_separator.py`
- **字幕生成**: `backend/subtitle/transcribe.py`
- **前端页面**: `frontend/pages/voice_clone_page.py`
- **WebSocket**: `backend/network/websocket_client.py`

---

**文档版本**: 2.1  
**创建时间**: 2026-02-01  
**最后更新**: 2026-02-16  
**更新内容**: 修正项目目录结构，补充管理后台、IndexTTS 参考引擎、线上环境等信息

