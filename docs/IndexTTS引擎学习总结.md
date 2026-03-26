# IndexTTS 引擎学习总结

**学习目标**: 为丸子配音 V3 集成 IndexTTS 1.5 和 2.0 引擎

---

## 一、引擎架构对比

| 特性 | IndexTTS 1.5 (v15) | IndexTTS 2.0 (v20) |
|------|-------------------|-------------------|
| **定位** | 轻量极速引擎 | 情感控制引擎 |
| **核心模型** | GPT + BigVGAN | GPT-v2 + s2mel(CFM) + BigVGAN |
| **声码器** | BigVGAN | BigVGAN |
| **音色/情感** | 耦合（单一参考音频） | 解耦（音色+情感分离控制） |
| **批处理** | ✅ `infer_fast` 桶化批处理 | ❌ 逐段顺序推理 |
| **流式输出** | ❌ | ✅ `stream_return` |
| **硬件支持** | CUDA / MPS / CPU / XPU | CUDA / MPS / CPU / XPU |

---

## 二、API 详细对比

### 2.1 IndexTTS 1.5 - 基础推理

```python
from indextts.infer import IndexTTS

# 初始化
tts = IndexTTS(
    cfg_path="checkpoints/config.yaml",
    model_dir="checkpoints",
    is_fp16=True,           # 是否使用 FP16
    device="cuda:0",        # 设备选择
    use_cuda_kernel=None    # 是否使用 CUDA kernel 加速
)

# 标准推理
tts.infer(
    audio_prompt="ref.wav",     # 参考音频路径
    text="要合成的文本",
    output_path="output.wav",
    verbose=False,
    max_text_tokens_per_sentence=120,  # 每句最大 token 数
    **generation_kwargs
)

# 快速推理（批处理）
tts.infer_fast(
    audio_prompt="ref.wav",
    text="要合成的文本",
    output_path="output.wav",
    max_text_tokens_per_sentence=100,   # 分句最大 token
    sentences_bucket_max_size=4          # 桶大小（批处理数量）
)
```

#### 关键参数说明
- `max_text_tokens_per_sentence`: 分句阈值
  - 越小 → batch 越多 → 速度越快 → 内存占用大 → 可能影响质量
  - 越大 → batch 越少 → 速度越慢 → 内存占用小 → 质量更好
- `sentences_bucket_max_size`: 桶容量（仅 infer_fast）
  - 越大 → batch 越多 → 速度越快 → 内存占用大

---

### 2.2 IndexTTS 2.0 - 情感控制推理

```python
from indextts.infer_v2 import IndexTTS2

# 初始化
tts = IndexTTS2(
    cfg_path="checkpoints/config.yaml",
    model_dir="checkpoints",
    use_fp16=False,          # 注意：2.0 默认 False
    device="cuda:0",
    use_cuda_kernel=None,
    use_deepspeed=False,     # DeepSpeed 加速
    use_accel=False,         # GPT 加速引擎
    use_torch_compile=False  # torch.compile 优化
)

# 推理
tts.infer(
    spk_audio_prompt="speaker.wav",     # 音色参考音频（必须）
    text="要合成的文本",
    output_path="output.wav",

    # 情感控制（三种方式互斥）
    emo_audio_prompt=None,      # 方式1: 情感参考音频
    emo_alpha=1.0,              # 情感混合系数 (0-1)
    emo_vector=None,            # 方式2: 情感向量 [8维]
    use_emo_text=False,         # 方式3: 使用情感文本
    emo_text=None,              # 情感描述文本

    # 其他参数
    use_random=False,           # 随机情感
    interval_silence=200,       # 段落间静音（毫秒）
    max_text_tokens_per_segment=120,
    stream_return=False,        # 是否流式返回
    verbose=False
)
```

#### 情感控制详解

**方式1: 情感参考音频**
```python
tts.infer(
    spk_audio_prompt="speaker.wav",
    emo_audio_prompt="emotion.wav",  # 情感参考
    emo_alpha=0.7,                    # 70% 情感音频 + 30% 音色音频
    text="文本",
    output_path="out.wav"
)
```

**方式2: 情感向量（8维）**
```python
tts.infer(
    spk_audio_prompt="speaker.wav",
    emo_vector=[0.2, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.5],  # 8种情感强度
    emo_alpha=0.8,
    text="文本",
    output_path="out.wav"
)
# 情感顺序: happy, angry, sad, afraid, disgusted, melancholic, surprised, calm
```

**方式3: 情感文本（自动分析）**
```python
tts.infer(
    spk_audio_prompt="speaker.wav",
    use_emo_text=True,
    emo_text="温柔甜美的声音",  # 情感描述
    text="要合成的内容",
    output_path="out.wav"
)
# 内部使用 Qwen 模型分析情感文本，生成情感向量
```

---

## 三、流式推理（IndexTTS 2.0）

```python
# 生成器模式
for chunk in tts.infer_generator(
    spk_audio_prompt="speaker.wav",
    text="长文本内容...",
    output_path="out.wav",
    stream_return=True
):
    # chunk 包含音频片段
    play_audio(chunk)
```

---

## 四、前端集成要点

### 4.1 引擎能力矩阵

| 功能 | 1.5 轻量 | 2.0 情感 |
|------|----------|----------|
| 普通推理 | ✅ | ✅ |
| 批量推理 | ✅ infer_fast | ❌ |
| 流式输出 | ❌ | ✅ |
| 情感向量控制 | ❌ | ✅ |
| 情感文本控制 | ❌ | ✅ |
| 音色情感分离 | ❌ | ✅ |

### 4.2 UI 适配建议

**IndexTTS 1.5 界面**
```
[参考音频]
[文本输入]
[推理模式: 普通 / 批量]
[生成按钮]
```

**IndexTTS 2.0 界面**
```
[音色参考音频]
[情感控制方式]
  ├─ 情感参考音频
  ├─ 情感向量滑块 (8个)
  └─ 情感描述文本
[文本输入]
[流式开关]
[生成按钮]
```

### 4.3 参数映射

前端参数 → 引擎参数

```typescript
// 通用参数
interface TTSParams {
  text: string;
  referenceAudio: string;      // 1.5: audio_prompt, 2.0: spk_audio_prompt
  maxTextTokens: number;       // max_text_tokens_per_sentence/segment
  intervalSilence: number;     // 仅 2.0
}

// 1.5 特有
interface IndexTTS15Params extends TTSParams {
  generationMode: 'normal' | 'batch';
  bucketMaxSize: number;       // infer_fast 桶大小
}

// 2.0 特有
interface IndexTTS20Params extends TTSParams {
  emotionMethod: 'audio' | 'vector' | 'text';
  emotionAudio?: string;       // emo_audio_prompt
  emotionVector?: number[];    // emo_vector (8维)
  emotionText?: string;        // emo_text
  emoAlpha: number;            // 情感混合系数
  useStreaming: boolean;       // stream_return
}
```

---

## 五、Rust/Tauri 集成建议

### 5.1 架构设计

```rust
// src/services/tts/mod.rs
trait TTSEngine {
    async fn synthesize(&self, params: TTSParams) -> Result<PathBuf>;
    async fn synthesize_stream(&self, params: TTSParams) -> Result<Stream>;
    fn supports_batch(&self) -> bool;
    fn supports_streaming(&self) -> bool;
}

struct IndexTTS15;
struct IndexTTS20;

impl TTSEngine for IndexTTS15 {
    // 实现...
}

impl TTSEngine for IndexTTS20 {
    // 实现...
}
```

### 5.2 Python 进程通信

由于 IndexTTS 是 Python 库，建议：
1. **子进程模式**: 启动 Python 服务进程，通过 stdin/stdout 或 HTTP 通信
2. **Python 绑定**: 使用 PyO3 将 Python 代码打包进 Rust
3. **独立服务**: 单独部署 TTS 服务，通过 gRPC/HTTP 调用

### 5.3 推荐方案

**方案A: 本地 Python 子进程**（适合桌面应用）
```rust
// 启动 Python 脚本作为子进程
let mut child = Command::new("python")
    .arg("tts_server.py")
    .stdin(Stdio::piped())
    .stdout(Stdio::piped())
    .spawn()?;

// 发送 JSON 请求
let request = json!({
    "engine": "v15",  // 或 "v20"
    "params": { ... }
});
```

**方案B: 独立服务**（适合云端部署）
```rust
// HTTP 调用远程 TTS 服务
let response = client
    .post("http://localhost:8000/tts")
    .json(&request)
    .send()
    .await?;
```

---

## 六、关键注意事项

1. **模型文件**: 需要单独下载 checkpoints，不包含在代码仓库中
2. **内存占用**:
   - 1.5 轻量，适合消费级显卡
   - 2.0 需要更多显存（额外加载 s2mel, Qwen 等模型）
3. **首次加载**: 两个引擎首次初始化都需要较长时间
4. **参考音频**:
   - 建议 3-15 秒纯净人声
   - 格式: WAV, MP3, FLAC
   - 采样率: 内部自动重采样到 24kHz
5. **情感向量归一化**: 2.0 引擎情感向量总和上限 0.8（已在 utils/emotion.ts 中实现）

---

## 七、下一步开发计划

1. [ ] 设计 TTS 服务 Python 端 API
2. [ ] 实现 Rust 端 TTS 引擎 trait
3. [ ] 添加模型路径配置管理
4. [ ] 实现进度回调机制
5. [ ] 添加音频缓存优化
6. [ ] 流式音频播放支持
