# MaruAudio V3 项目开发方案

## 📋 项目概述

**项目名称**: 丸子配音 (MaruAudio) V3  
**技术栈**: Tauri 2.0 + Vue 3 + TypeScript + Rust  
**组件库**: Ant Design Vue  
**图标库**: Ant Design Icons + Iconfont  
**项目类型**: AI 语音克隆桌面应用  
**版本**: V3.0.0

---

## 🏗️ 技术架构

### 核心技术栈

#### 前端层
- **框架**: Vue 3 (Composition API)
- **语言**: TypeScript
- **构建工具**: Vite 5
- **UI组件库**: Ant Design Vue 4.x
- **图标库**: 
  - Ant Design Icons Vue
  - Iconfont (自定义图标)
- **状态管理**: Pinia
- **路由**: Vue Router 4

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
│     Frontend Layer (Vue 3 + TS)         │
│  - Pages (页面组件)                      │
│  - Components (UI组件)                   │
│  - Stores (状态管理)                     │
│  - Router (路由)                        │
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

```
MaruAudio_V3/
├── src/                          # 前端源码 (Vue 3)
│   ├── assets/                   # 静态资源
│   │   ├── images/              # 图片资源
│   │   ├── icons/               # 图标资源
│   │   └── styles/              # 全局样式
│   ├── components/              # Vue组件
│   │   ├── common/              # 通用组件
│   │   ├── audio/               # 音频相关组件
│   │   └── form/                # 表单组件
│   ├── views/                   # 页面视图
│   │   ├── VoiceClone.vue      # 配音生成页
│   │   ├── SampleLibrary.vue   # 样音库页
│   │   ├── Subtitle.vue        # 字幕生成页
│   │   └── FileManager.vue     # 文件管理页
│   ├── stores/                  # Pinia状态管理
│   │   ├── user.ts             # 用户状态
│   │   ├── engine.ts           # 引擎状态
│   │   └── audio.ts            # 音频状态
│   ├── router/                  # 路由配置
│   │   └── index.ts
│   ├── utils/                   # 工具函数
│   │   ├── api.ts              # API调用
│   │   ├── format.ts           # 格式化工具
│   │   └── constants.ts        # 常量定义
│   ├── App.vue                  # 根组件
│   └── main.ts                  # 入口文件
│
├── src-tauri/                   # Tauri后端 (Rust)
│   ├── src/
│   │   ├── commands/           # Tauri命令
│   │   │   ├── audio.rs        # 音频处理命令
│   │   │   ├── engine.rs       # 引擎管理命令
│   │   │   ├── file.rs         # 文件操作命令
│   │   │   └── user.rs         # 用户相关命令
│   │   ├── services/           # 业务服务
│   │   │   ├── tts/            # TTS服务
│   │   │   │   ├── mod.rs
│   │   │   │   ├── lightweight.rs  # 轻量引擎
│   │   │   │   ├── emotion.rs      # 情感引擎
│   │   │   │   └── cloud.rs        # 云端引擎
│   │   │   ├── audio.rs        # 音频处理服务
│   │   │   └── subtitle.rs     # 字幕服务
│   │   ├── utils/              # 工具函数
│   │   │   ├── config.rs       # 配置管理
│   │   │   ├── logger.rs       # 日志
│   │   │   └── path.rs         # 路径处理
│   │   └── main.rs             # Rust入口
│   ├── Cargo.toml              # Rust依赖配置
│   └── tauri.conf.json         # Tauri配置
│
├── public/                      # 公共静态资源
│
├── 项目开发文档/                # 项目文档
│   ├── V2项目功能分析报告.md
│   └── MaruAudio_V3项目开发方案.md
│
├── .gitignore                   # Git忽略配置
├── package.json                 # Node.js依赖配置
├── tsconfig.json               # TypeScript配置
├── vite.config.ts              # Vite构建配置
└── README.md                   # 项目说明
```

---

## 🎯 核心功能模块

### 1. 配音生成 (Voice Clone)

**前端位置**: `src/views/VoiceClone.vue`  
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
- 前端: Vue 3 Composition API + Ant Design Vue
- 后端: Rust + Tauri Commands
- 引擎集成: 通过 Rust FFI 或 Python 子进程调用 IndexTTS

---

### 2. 样音库管理 (Sample Library)

**前端位置**: `src/views/SampleLibrary.vue`  
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

**前端位置**: `src/views/Subtitle.vue`  
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

**前端位置**: `src/views/FileManager.vue`  
**后端位置**: `src-tauri/src/commands/file.rs`

**功能特性**:
- ✅ **文件浏览**: 浏览生成的文件
- ✅ **文件分类**: 按类型分类显示
- ✅ **文件操作**: 打开、删除、重命名
- ✅ **文件搜索**: 按名称搜索
- ✅ **文件预览**: 音频文件预览播放

---

### 5. 用户认证与会员系统

**前端位置**: `src/stores/user.ts` + `src/components/common/LoginModal.vue`  
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

**前端位置**: `src/stores/engine.ts`  
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
  // src/utils/constants.ts
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
// src/utils/api.ts
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
// src/utils/api.ts
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
// src/utils/api.ts
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
// src/stores/engine.ts
// 应用启动时预加载引擎状态
export const useEngineStore = defineStore('engine', {
  actions: {
    async preload() {
      // 并行预加载多个状态
      const [status, config, history] = await Promise.all([
        invoke('get_engine_status'),
        invoke('get_engine_config'),
        invoke('get_generation_history', { limit: 10 }),
      ]);
      
      this.status = status;
      this.config = config;
      this.history = history;
    },
  },
});
```

##### 8. IPC 性能监控
```typescript
// src/utils/ipc-monitor.ts
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

### 4. Ant Design Vue 集成

```typescript
// src/main.ts
import { createApp } from 'vue';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import * as Icons from '@ant-design/icons-vue';

const app = createApp(App);
app.use(Antd);

// 注册图标
Object.keys(Icons).forEach(key => {
  app.component(key, Icons[key]);
});
```

### 5. 状态管理 (Pinia)

```typescript
// src/stores/engine.ts
import { defineStore } from 'pinia';

export const useEngineStore = defineStore('engine', {
  state: () => ({
    currentEngine: 'lightweight', // 内部代号
    engines: [
      { id: 'lightweight', name: '快速模式' },
      { id: 'emotion', name: '标准模式' },
      { id: 'cloud', name: '高质量模式' },
    ],
  }),
  actions: {
    async switchEngine(engineId: string) {
      // 切换引擎逻辑
    },
  },
});
```

---

## 📋 开发执行方案

### 第一阶段: 项目基础搭建 (1-2周)

#### 1.1 初始化项目
- [ ] 创建 Tauri 2.0 项目
- [ ] 配置 Vue 3 + TypeScript
- [ ] 集成 Ant Design Vue
- [ ] 配置 Vite 构建
- [ ] 设置项目目录结构

#### 1.2 基础组件开发
- [ ] 主窗口布局
- [ ] 侧边栏导航
- [ ] 路由配置
- [ ] 状态管理 (Pinia)
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
- 使用 Ant Design Vue 组件库
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
    "vue": "^3.4.21",
    "vue-router": "^4.3.0",
    "pinia": "^2.1.7",
    "ant-design-vue": "^4.2.2",
    "@ant-design/icons-vue": "^7.0.1"
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
- [Vue 3 文档](https://vuejs.org/)
- [Ant Design Vue 文档](https://antdv.com/)
- [Rust 文档](https://doc.rust-lang.org/)

### 引擎源码
- IndexTTS 1.5: https://github.com/index-tts/index-tts/tree/v1.5.0
- IndexTTS 2.0: https://github.com/index-tts/index-tts

---

**文档版本**: 1.0  
**创建时间**: 2026-02-01
**最后更新**: 2026-02-01

