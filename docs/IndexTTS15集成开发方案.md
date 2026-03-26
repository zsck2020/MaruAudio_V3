# IndexTTS 1.5（极速引擎）集成开发方案

> **重要说明**: 项目中的 `IndexTTS/` 目录（含 v15、v20）**仅作为集成参考和学习资料**，不直接调用。Python TTS 服务需要通过 pip 安装或用户独立部署的方式获取 IndexTTS 库。

## 一、总体架构

```
┌─────────────────────────────────────────────────────────────┐
│                     丸子配音 V3（Tauri）                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   UI 前端    │  │  Rust 后端   │  │  Python TTS 服务 │   │
│  │  Svelte     │◄─┤  Commands   │◄─┤  子进程通信      │   │
│  │             │  │             │  │  stdin/stdout    │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  IndexTTS 1.5   │
                    │  Python 库      │
                    └─────────────────┘
```

## 二、文件结构规划

```
frontend/src-tauri/
├── src/
│   ├── commands/
│   │   ├── mod.rs           # 命令模块导出
│   │   └── tts.rs           # TTS 相关命令
│   ├── services/
│   │   ├── mod.rs           # 服务模块
│   │   ├── tts/
│   │   │   ├── mod.rs       # TTS 服务 trait
│   │   │   ├── engine.rs    # 引擎管理器
│   │   │   ├── local_v15.rs # IndexTTS 1.5 实现
│   │   │   └── types.rs     # TTS 类型定义
│   │   └── python/
│   │       ├── mod.rs       # Python 进程管理
│   │       ├── process.rs   # 子进程管理
│   │       └── ipc.rs       # 进程间通信
│   └── utils/
│       └── paths.rs         # 路径工具
│
python/
├── tts_service.py           # TTS 服务端入口
├── requirements.txt         # Python 依赖（IndexTTS 通过 pip 安装或外部路径）
└── config.yaml             # 引擎配置（模型路径等）
```

**注意**: IndexTTS 不作为子目录嵌入，需通过以下方式之一提供：
- **方式 A**: 用户通过 `pip install indextts` 安装（官方发布时）
- **方式 B**: 用户在配置中指定 IndexTTS 源码路径
- **方式 C**: 打包时通过 requirements.txt 从 git 仓库安装

## 三、开发阶段与任务

### 阶段 1: 基础架构（第 1-2 天）

#### 任务 1.1: Python TTS 服务端
- **文件**: `python/tts_service.py`
- **功能**:
  - 启动 IndexTTS 1.5 引擎
  - 监听 stdin 接收 JSON 命令
  - 输出 JSON 响应到 stdout
  - 支持进度回调（通过 stderr 或 stdout）
  - 支持取消操作

**IndexTTS 导入方式**:
```python
# 方式1: 如果 IndexTTS 已通过 pip 安装
try:
    from indextts.infer import IndexTTS
except ImportError:
    # 方式2: 从配置的路径动态加载
    import sys
    config = load_config()
    if config.get("indextts_path"):
        sys.path.insert(0, config["indextts_path"])
    from indextts.infer import IndexTTS
```

**接口设计**:
```python
# 请求格式
{
    "id": "uuid",
    "method": "synthesize",  # 或 "synthesize_batch"
    "params": {
        "reference_audio": "/path/to/ref.wav",
        "text": "要合成的文本",
        "output_path": "/path/to/output.wav",
        "max_tokens": 120
    }
}

# 响应格式
{
    "id": "uuid",
    "status": "success",  # 或 "error"
    "data": {
        "output_path": "/path/to/output.wav",
        "duration": 5.2
    },
    "error": null
}

# 进度通知（stdout 逐行输出）
{
    "type": "progress",
    "data": {
        "percent": 0.5,
        "message": "处理文本..."
    }
}
```

#### 任务 1.2: Rust Python 进程管理
- **文件**: `src/services/python/process.rs`
- **功能**:
  - 启动 Python 子进程
  - 管理进程生命周期
  - 健康检查（ping/pong）
  - 自动重启机制

#### 任务 1.3: IPC 通信层
- **文件**: `src/services/python/ipc.rs`
- **功能**:
  - JSON 序列化/反序列化
  - 请求-响应匹配（通过 uuid）
  - 超时处理
  - 错误处理

### 阶段 2: TTS 引擎实现（第 3-4 天）

#### 任务 2.1: TTS 类型定义
- **文件**: `src/services/tts/types.rs`
- **内容**:
```rust
pub struct TTSParams {
    pub reference_audio: PathBuf,
    pub text: String,
    pub output_path: PathBuf,
    pub max_tokens: u32,
}

pub struct TTSResult {
    pub output_path: PathBuf,
    pub duration: f64,
}

pub struct TTSProgress {
    pub percent: f64,
    pub message: String,
}

pub trait TTSEngine: Send + Sync {
    async fn synthesize(&self, params: TTSParams) -> Result<TTSResult>;
    async fn synthesize_batch(&self, params: Vec<TTSParams>) -> Result<Vec<TTSResult>>;
    fn supports_batch(&self) -> bool;
}
```

#### 任务 2.2: IndexTTS 1.5 实现
- **文件**: `src/services/tts/local_v15.rs`
- **功能**:
  - 实现 `TTSEngine` trait
  - 调用 Python 服务
  - 处理进度回调
  - 错误转换

#### 任务 2.3: 引擎管理器
- **文件**: `src/services/tts/engine.rs`
- **功能**:
  - 管理引擎实例
  - 引擎状态监控
  - 自动重连

### 阶段 3: Tauri 命令层（第 5 天）

#### 任务 3.1: TTS 命令
- **文件**: `src/commands/tts.rs`
- **命令**:
  - `start_tts_engine` - 启动引擎
  - `stop_tts_engine` - 停止引擎
  - `tts_synthesize` - 单条合成
  - `tts_synthesize_batch` - 批量合成
  - `cancel_tts` - 取消合成
  - `get_tts_status` - 获取状态

#### 任务 3.2: 进度事件
- **事件**: `tts://progress`
- **前端监听**: `listen('tts://progress', callback)`

### 阶段 4: 前端集成（第 6-7 天）

#### 任务 4.1: TTS Store 更新
- **文件**: `src/lib/stores/tts.svelte.ts`
- **功能**:
  - 调用 Rust 命令
  - 监听进度事件
  - 管理生成状态

#### 任务 4.2: 生成按钮功能
- 绑定到左下角"生成配音"按钮
- 调用批量推理（当选择极速引擎时）
- 显示进度条

#### 任务 4.3: 音频播放器
- 生成完成后自动播放
- 支持重新生成

### 阶段 5: 测试与优化（第 8-10 天）

#### 任务 5.1: 单元测试
- Python 服务端测试
- Rust IPC 测试
- 集成测试

#### 任务 5.2: 性能优化
- 音频文件缓存
- 连接池管理
- 错误重试机制

#### 任务 5.3: 文档编写
- API 文档
- 部署指南

## 四、关键技术决策

### 4.1 通信方式选择
**方案**: stdin/stdout JSON 通信
- ✅ 简单可靠
- ✅ 跨平台
- ✅ 易于调试
- ❌ 不适合大文件传输（音频路径传递，不是内容）

### 4.2 进程管理策略
- 应用启动时延迟启动 Python 服务（按需）
- 空闲 5 分钟后自动关闭
- 异常退出自动重启（最多 3 次）

### 4.3 IndexTTS 依赖管理策略
**重要约束**: `IndexTTS/` 目录仅作为参考，不作为运行时依赖

**依赖提供方式**（按优先级）：
1. **pip 安装**（首选）：`pip install indextts`（官方发布后）
2. **git 安装**：`pip install git+https://github.com/...`
3. **本地路径配置**：用户在设置中指定已下载的 IndexTTS 路径
4. **自动检测**：启动时尝试多种方式导入，失败时提示用户配置

**配置管理**:
```yaml
# config.yaml
indextts:
  type: "pip"           # pip / git / local
  version: "1.5.0"      # pip 安装时的版本
  local_path: ""        # type=local 时的路径
  device: "cuda:0"      # 推理设备
  model_dir: ""         # 模型目录路径（用户需单独下载）
```

### 4.4 错误处理策略
- Python 错误转换为 Rust Result
- 前端显示友好错误信息
- 日志记录详细错误

## 五、风险与应对

| 风险 | 可能性 | 影响 | 应对措施 |
|------|--------|------|----------|
| Python 环境配置复杂 | 高 | 中 | 提供自动安装脚本；支持配置 IndexTTS 路径；提供详细手动部署文档 |
| IndexTTS 未 pip 发布 | 中 | 高 | 支持从 git 仓库安装；提供备选加载方式（配置本地路径）|
| 模型文件过大 | 中 | 高 | 模型单独下载，不在代码库中 |
| 内存占用过高 | 中 | 中 | 流式处理，及时释放资源 |
| Windows 兼容性问题 | 中 | 中 | 使用 cross 交叉编译测试 |

## 六、验收标准

### 功能验收
- [ ] 极速引擎正常启动
- [ ] 单条文本合成成功
- [ ] 批量文本合成成功
- [ ] 进度回调正常显示
- [ ] 取消操作有效
- [ ] 错误提示友好

### 性能验收
- [ ] 首次启动 < 30 秒
- [ ] 单条合成速度 > 实时率（RTF < 1）
- [ ] 批量合成比单条快 20%+
- [ ] 内存占用 < 4GB

### 稳定性验收
- [ ] 连续运行 1 小时无崩溃
- [ ] 异常恢复后正常工作
- [ ] 100 次合成无内存泄漏

## 七、下一步行动

确认方案后，开始执行 **阶段 1 任务 1.1**：创建 Python TTS 服务端。
