# IndexTTS 引擎深度学习报告

> 最后更新: 2026-03-18  
> 基于本地源码逐行审查 + GitHub 仓库 + arXiv 论文  
> ⚠️ 本报告仅供丸子配音引擎开发参考，IndexTTS 源码禁止直接调用

---

## 一、整体架构对比

### IndexTTS 1.5（轻量引擎）—— 类名 `IndexTTS`

```
文本 → TextNormalizer → BPE Tokenizer → 分句
                                          ↓
参考音频 → Resample(24kHz) → MelSpectrogram → cond_mel
                                               ↓
                        GPT (UnifiedVoice) ← [cond_mel + text_tokens]
                              ↓
                     speech codes (自回归生成)
                              ↓
                     GPT forward (latent 提取)
                              ↓
                     BigVGAN (vocoder)
                              ↓
                         WAV 音频输出 (24kHz)
```

**核心三件套**: GPT → Codes → BigVGAN

### IndexTTS 2.0（情感引擎）—— 类名 `IndexTTS2`

```
文本 → TextNormalizer → BPE Tokenizer → 分段
                                          ↓
说话人音频 → Resample → W2V-BERT → Semantic Embedding → spk_cond
                     → CAMPPlus → style (全局风格)
                     → MelSpectrogram → ref_mel
                                          ↓
情感音频 → Resample → W2V-BERT → Semantic Embedding → emo_cond
    或                                                    ↓
情感文本 → QwenEmotion(Qwen3) → emotion_vector → emo_matrix 混合
                                                      ↓
                GPT (UnifiedVoice V2) ← [spk_cond + emo_cond + emovec + text_tokens]
                        ↓
               speech codes + speech_conditioning_latent
                        ↓
               GPT forward → latent
                        ↓
               Semantic Codec (MaskGCT VQ) → S_infer
                        ↓
               S2Mel (CFM Diffusion, 25 steps) → mel
                        ↓
               BigVGAN (vocoder)
                        ↓
                   WAV 音频输出 (22.05kHz)
```

**核心链路**: GPT → Codes → Semantic Codec → CFM Diffusion → BigVGAN

---

## 附：IndexTTS 生态版本

| 版本 | 定位 | GitHub Stars | 发布时间 |
|------|------|-------------|---------|
| **IndexTTS 1.5** | 轻量快速 | 19,400+ | 2024 |
| **IndexTTS 2.0** | 情感引擎 | (同仓库) | 2025-09 |
| **IndexTTS 2.5** | 多语言+极速 | (同仓库) | 2026-01 (arXiv:2601.03888) |

**IndexTTS 2.5 关键改进** (未在本地参考代码中，仅论文):
1. 语义编码压缩: 帧率 50Hz → 25Hz，序列长度减半
2. 架构升级: U-DiT → Zipformer，参数更少速度更快
3. 多语言: 中文/英文/日语/西班牙语 + 零样本跨语言情感迁移
4. GRPO 强化学习: 优化发音准确性和自然度
5. 性能: RTF 提升 2.28x

---

## 二、核心模块详解

### 2.1 文本前端 (TextNormalizer + TextTokenizer)

| 特性 | v1.5 | v2.0 |
|------|------|------|
| 文本正则化 | TextNormalizer (WeTextProcessing) | 同 + 术语词汇表(glossary.yaml) |
| BPE 分词 | sentencepiece (bpe.model) | 同 |
| 分句策略 | `split_sentences()` 按 max_tokens 分句 | `split_segments()` + 流式快速分段 |
| 拼音纠错 | 支持 (字符-拼音混合建模) | 同 |
| 未知 token 检测 | 无 | 有 (警告 unk_token) |

**关键技术**:
- 中文使用字符-拼音混合编码，允许通过拼音标注纠正多音字
- 例: `晕 XUAN4 是 一 种 GAN3 觉` → 指定"眩"和"感"的读音
- 标点符号控制停顿：逗号=短停，句号=中停，省略号=长停

### 2.2 参考音频处理

| 特性 | v1.5 | v2.0 |
|------|------|------|
| 采样率 | 24kHz | 说话人: 原始SR → 22.05kHz/16kHz，情感: 16kHz |
| 特征提取 | MelSpectrogram → cond_mel | W2V-BERT(semantic) + CAMPPlus(style) + Mel |
| 音频缓存 | 缓存 cond_mel | 缓存 spk_cond, emo_cond, style, mel 等 |
| 最大长度 | 无限制(但推荐15秒内) | 硬性截断15秒 |
| 音色/情感分离 | ❌ 不支持 | ✅ spk_cond 与 emo_cond 完全分离 |

**v2.0 关键新增**:
- **W2V-BERT 2.0** (`facebook/w2v-bert-2.0`): 提取 17 层隐藏状态作为语义特征
- **CAMPPlus**: 提取 80 维 fbank → 192 维全局说话人风格向量
- **MaskGCT Semantic Codec**: 语义特征 → 离散 token → VQ 编码

### 2.3 GPT 模型 (自回归语音 token 生成)

| 特性 | v1.5 (UnifiedVoice) | v2.0 (UnifiedVoice V2) |
|------|------|------|
| 骨干网络 | GPT-2 | GPT-2 (自定义 transformers 副本) |
| 条件编码器 | Conformer Encoder | Conformer Encoder |
| 感知器 | Perceiver Resampler | Perceiver Resampler |
| 输入条件 | cond_mel (参考音频 mel) | spk_cond + emo_cond + emo_vec |
| 情感向量 | ❌ | ✅ `merge_emovec()` 混合说话人和情感 |
| 加速引擎 | ❌ | ✅ AccelEngine (CUDA Graph + KV Cache 管理) |
| torch.compile | ❌ | ✅ 支持 |
| DeepSpeed | ✅ (可选 fp16) | ✅ (可选) |
| 批处理推理 | ✅ `infer_fast()` 桶化批处理 | ❌ 逐段顺序推理 |
| 流式输出 | ❌ | ✅ `stream_return=True` |

**v1.5 批处理加速机制** (`infer_fast`):
1. 文本分句后按长度排序
2. 相近长度的句子分桶 (bucket_max_size=4)
3. 同一桶内 pad 后批量送入 GPT → 并行生成 codes
4. latent 提取后，BigVGAN 分 chunk (chunk_size=2) 解码
5. 多句长文本可实现 2~10 倍速度提升

**v2.0 情感混合机制**:
1. `merge_emovec()`: 按 alpha 权重混合 spk_cond 和 emo_cond
2. 如果有 emo_vector（8 维情感向量）:
   - 从预计算的 emo_matrix 中按说话人风格找最近邻
   - `emovec = emo_matrix * weight + (1 - sum(weight)) * 原始emovec`
3. 情感向量 8 维: [happy, angry, sad, afraid, disgusted, melancholic, surprised, calm]

### 2.4 音频解码

| 特性 | v1.5 | v2.0 |
|------|------|------|
| codes → 音频 | GPT latent → BigVGAN 直出 | Semantic Codec + S2Mel(CFM) → BigVGAN |
| BigVGAN 版本 | BigVGAN (自带) | bigvgan (HuggingFace预训练) |
| 中间步骤 | 无 | CFM Diffusion (25 步) |
| 输出采样率 | 24kHz | 22.05kHz |
| CUDA kernel | 可选 (alias_free_activation) | 可选 (alias_free_activation) |

**v2.0 S2Mel 流程**:
1. `gpt_layer(latent)` → 投影 GPT latent
2. `semantic_codec.quantizer.vq2emb(codes)` → VQ 解码
3. `S_infer = VQ_emb + latent` → 语义+GPT 特征融合
4. `length_regulator` → 时长对齐 (code_lens * 1.72)
5. `CFM diffusion` (25 步) → 生成 mel
6. `BigVGAN(mel)` → 波形

### 2.5 情感控制系统 (v2.0 独有)

三种情感输入方式：

1. **情感参考音频** (`emo_audio_prompt`):
   - 提供一段带情感的音频
   - 通过 W2V-BERT 提取情感特征
   - `emo_alpha` 控制情感强度 (0~1)

2. **情感向量** (`emo_vector`):
   - 直接指定 8 维情感权重: `[happy, angry, sad, afraid, disgusted, melancholic, surprised, calm]`
   - 例: `[0.8, 0, 0, 0, 0, 0, 0, 0.2]` → 80%开心 + 20%平静
   - `normalize_emo_vec()` 进行 bias 校正:
     - `emo_bias = [0.9375, 0.875, 1.0, 1.0, 0.9375, 0.9375, 0.6875, 0.5625]`
     - surprised(0.6875) 和 calm(0.5625) 被大幅削弱，避免产生异常语音
     - 总和限制在 0.8 以下（超过则等比缩放）
   - `use_random=True` 可引入随机性（降低音色克隆保真度）
   - `emo_alpha` 可预缩放情感向量强度 (0.0~1.0)

3. **情感文本** (`use_emo_text=True`):
   - 通过微调的 **Qwen3** 模型分析文本情感
   - 输出 JSON 格式的情感分类向量
   - 自动转换为 8 维 emo_vector
   - 可通过 `emo_text` 参数独立指定情感描述文本（与生成文本分离）
   - 建议 `emo_alpha=0.6` 或更低，以获得更自然的效果

**QwenEmotion 类** (实际实现细节):
- 基于 Qwen3 的情感分类模型，fp16 推理，`device_map="auto"`
- 系统提示: `"文本情感分类"`
- 输入: 文本 → 输出: `{高兴: 0.7, 自然: 0.3, ...}` (JSON 格式)
- 情感类别映射: 高兴→happy, 愤怒→angry, 悲伤→sad, 恐惧→afraid, 反感→disgusted, 低落→melancholic, 惊讶→surprised, 自然→calm
- 分值范围: `min_score=0.0, max_score=1.2`
- **"低落"workaround**: QwenEmotion 无法区分"悲伤"和"低落"，代码通过 `melancholic_words` 集合（低落/melancholy/gloomy/depressed等）检测文本关键词，匹配时交换"悲伤"和"低落"的向量值
- 全部情感为零时默认 `calm=1.0`（中性语气）

---

## 三、推理参数对比

| 参数 | v1.5 默认值 | v2.0 默认值 | 说明 |
|------|------------|------------|------|
| do_sample | True | True | 是否采样 |
| top_p | 0.8 | 0.8 | nucleus sampling |
| top_k | 30 | 30 | top-k sampling |
| temperature | 1.0 | 0.8 | 温度 (v2.0 更保守) |
| num_beams | 3 | 3 | beam search |
| repetition_penalty | 10.0 | 10.0 | 重复惩罚 |
| max_mel_tokens | 600 | 1500 | 最大 mel token 数 (v2.0 更长) |
| max_text_tokens | 100/120 | 120 | 每段最大文本 token |
| sampling_rate | 24000 | 22050 | 输出采样率 |

### v2.0 新增 API 参数（源码实际）

| 参数 | 默认值 | 说明 |
|------|---------|------|
| `spk_audio_prompt` | 必填 | 说话人参考音频（音色源） |
| `emo_audio_prompt` | None | 情感参考音频（与说话人分离） |
| `emo_alpha` | 1.0 | 情感强度 (0.0~1.0) |
| `emo_vector` | None | 8 维情感向量 |
| `use_emo_text` | False | 是否用文本自动推断情感 |
| `emo_text` | None | 独立的情感描述文本 |
| `use_random` | False | 是否引入随机性（降低克隆保真度） |
| `interval_silence` | 200 | 段间静音时长 (ms) |
| `stream_return` | False | 是否流式返回 (generator 模式) |
| `quick_streaming_tokens` | 0 | 快速流式分段 token 数 |
| `verbose` | False | 详细日志输出 |

### v2.0 流式推理实现

`infer()` 方法内部委托给 `infer_generator()`，通过 Python generator (`yield`) 实现流式输出：
- `stream_return=True` 时，每生成一段音频即 `yield wav` + `yield silence`
- 非流式模式时，`list(generator)[0]` 获取完整音频
- 段间自动插入 `interval_silence` ms 静音

### v2.0 AccelEngine 加速引擎

`AccelInferenceEngine` 类（`indextts/accel/accel_engine.py`）：
- **CUDA Graph**: 预编译计算图避免重复 kernel launch 开销
- **KV Cache Manager**: 块式 KV 缓存管理 (`block_size=256, num_blocks=128`)
- **Sampler**: 使用 `@torch.compile` 优化的采样器，支持温度控制 + greedy/sampling 切换
- 仅在 `use_accel=True` 时启用，需要 CUDA 环境

---

## 四、模型文件清单

### v1.5 模型 (checkpoints/)
| 文件 | 用途 |
|------|------|
| config.yaml | 模型配置 |
| gpt.pth | GPT 模型权重 |
| dvae.pth | VQ-VAE (调试用) |
| bigvgan_generator.pth | BigVGAN vocoder |
| bigvgan_discriminator.pth | BigVGAN 判别器 |
| bpe.model | BPE 分词模型 |
| unigram_12000.vocab | 词汇表 |

### v2.0 模型 (checkpoints/)
| 文件 | 用途 |
|------|------|
| config.yaml | 模型配置 |
| gpt.pth | GPT V2 模型权重 |
| s2mel.pth | S2Mel (CFM diffusion) 模型 |
| emo_matrix | 情感嵌入矩阵 |
| spk_matrix | 说话人嵌入矩阵 |
| bpe.model | BPE 分词模型 |
| qwen_emo/ | Qwen3 情感分类模型 |
| glossary.yaml | 术语词汇表（可选） |
| pinyin.vocab | 拼音控制词表 |
| + HuggingFace 依赖: facebook/w2v-bert-2.0, amphion/MaskGCT, funasr/campplus, bigvgan |

---

## 五、关键技术差异总结

| 维度 | v1.5 | v2.0 |
|------|------|------|
| **定位** | 轻量快速 | 情感表达丰富 |
| **推理管线** | GPT → BigVGAN (2步) | GPT → Semantic Codec → CFM → BigVGAN (4步) |
| **音色/情感** | 合并在同一参考音频 | 完全解耦 (独立控制) |
| **情感控制** | 不支持 | 音频/向量/文本 三种方式 |
| **批处理** | ✅ 桶化批处理 | ❌ 逐段顺序 |
| **流式输出** | ❌ | ✅ generator 模式 |
| **设备支持** | CUDA, MPS, CPU | CUDA, XPU, MPS, CPU |
| **加速** | DeepSpeed, CUDA kernel | DeepSpeed, CUDA kernel, AccelEngine, torch.compile |
| **模型依赖** | 自包含 (3 个 pth) | 依赖 HuggingFace 多模型 + Qwen3 |
| **VRAM 需求** | ~4GB | ~8GB+ |
| **推理速度** | 快 (RTF < 0.3) | 较慢 (多阶段+扩散) |
| **音质** | 高 (WER 最优) | 更高 (情感保真度更强) |

---

## 六、对丸子配音引擎开发的启示

### 6.1 架构设计建议

1. **统一引擎接口**: v1.5 和 v2.0 的 `infer()` 方法签名差异大，丸子引擎应设计统一的 Trait/Interface：
   - `generate(text, voice_prompt, options) -> audio`
   - options 中可选: 情感参考、情感向量、温度、采样参数等

2. **管线抽象**: 两个版本的管线步骤不同，应将每个阶段抽象为可插拔模块：
   - TextFrontend (分词、正则化)
   - ConditionEncoder (参考音频编码)
   - AutoregressiveModel (GPT 生成 codes)
   - Decoder (codes → audio)

3. **缓存策略**: 两个版本都实现了参考音频缓存，丸子引擎应：
   - 缓存参考音频的编码结果
   - 在同一说话人多次生成时跳过编码步骤
   - 注意 v2.0 需要分别缓存 spk 和 emo

### 6.2 性能优化建议

1. **批处理**: 参考 v1.5 的 `infer_fast()` 桶化策略，对长文本分句后按长度分桶批处理
2. **流式输出**: 参考 v2.0 的 generator 模式，逐段生成逐段返回
3. **GPU 内存管理**: 两个版本都在推理后调用 `torch.cuda.empty_cache()`
4. **DeepSpeed / torch.compile**: 可选加速手段

### 6.3 情感控制建议

参考 v2.0 的三层情感控制设计：
1. **音频驱动**: 提供情感参考音频（最直观）
2. **向量驱动**: 8 维情感滑块（精确控制）
3. **文本驱动**: 自然语言描述情感（最易用）

面向用户时应使用友好术语（如"语气"、"情绪"），避免暴露技术细节。

### 6.4 文本预处理建议

参考两个版本共同的 TextNormalizer：
- 中文数字转换、特殊符号处理
- 拼音纠错（多音字标注）
- 标点符号控制停顿
- 自动分句/分段（控制每段 token 上限）
- v2.0 的术语词汇表（glossary）支持

### 6.5 静默处理

两个版本都实现了 `remove_long_silence()`：
- 检测连续 silent_token (token=52) 超过 max_consecutive=30 时压缩
- v2.0 额外支持 `interval_silence` 参数在段间插入静默

---

## 七、依赖技术栈

### v1.5
- Python 3.10+
- **包管理**: pip / setup.py
- PyTorch ≥2.1.2 + torchaudio
- sentencepiece (BPE)
- WeTextProcessing / wetext (macOS) (文本正则化)
- OmegaConf (配置)
- transformers 4.36.2, accelerate 0.25.0
- DeepSpeed (可选加速)
- Gradio (可选 WebUI)

### v2.0 (在 v1.5 基础上新增)
- **包管理**: **uv** (官方唯一支持，不支持 pip/conda)
  - `uv sync --all-extras` 安装依赖
  - `uv run webui.py` 运行 WebUI
  - extras: `webui`, `deepspeed`
- Python ≥3.10, PyTorch 2.8.*, torchaudio 2.8.*
- transformers 4.52.1 (自定义 GPT2 副本，解决版本兼容性)
- librosa (音频加载和重采样)
- modelscope (AutoModelForCausalLM, QwenEmotion 加载)
- huggingface_hub (hf_hub_download)
- safetensors (模型权重加载)
- json5 (配置解析)
- descript-audiotools, ffmpeg-python (音频处理)
- facebook/w2v-bert-2.0 (语义特征, 第17层隐藏状态)
- amphion/MaskGCT (语义编解码, RepCodec)
- funasr/campplus (说话人风格, 80维fbank→192维embedding)
- Qwen3 (情感分析, fp16, enable_thinking=False)
- bigvgan (HuggingFace 版 vocoder, from_pretrained)
- CUDA 12.8+ 推荐用于 GPU 加速

---

## 八、源码级关键实现细节

### 8.1 初始化流程对比

**v1.5 模型加载顺序** (`IndexTTS.__init__`):
1. 设备检测: CUDA → MPS(强制关闭fp16) → CPU
2. `OmegaConf.load(cfg_path)` 加载配置
3. `UnifiedVoice(**cfg.gpt)` → `load_checkpoint(gpt, gpt_path)` → `.to(device)`
4. 可选 DeepSpeed: `gpt.post_init_gpt2_config(use_deepspeed=True, kv_cache=True, half=True)`
5. CUDA kernel 预加载: `anti_alias_activation_loader.load()`
6. `Generator(cfg.bigvgan)` → `load_state_dict(vocoder_dict["generator"])` → `remove_weight_norm()`
7. `TextNormalizer().load()` + `TextTokenizer(bpe_path, normalizer)`
8. 缓存初始化: `cache_audio_prompt=None, cache_cond_mel=None`

**v2.0 模型加载顺序** (`IndexTTS2.__init__`):
1. 设备检测: CUDA → XPU → MPS(强制关闭fp16) → CPU
2. `QwenEmotion(qwen_emo_path)` — Qwen3 情感分类器
3. `UnifiedVoice(**cfg.gpt, use_accel=use_accel)` → GPT V2
4. `SeamlessM4TFeatureExtractor.from_pretrained("facebook/w2v-bert-2.0")` — 特征提取器
5. `build_semantic_model()` + `build_semantic_codec()` — 语义模型 + MaskGCT 编解码
6. `MyModel(cfg.s2mel)` → S2Mel CFM 扩散模型 → `setup_caches(max_batch_size=1, max_seq_length=8192)`
7. `CAMPPlus(feat_dim=80, embedding_size=192)` — 说话人风格提取
8. `bigvgan.BigVGAN.from_pretrained(vocoder_name)` — HuggingFace BigVGAN
9. `TextNormalizer(enable_glossary=True)` + `TextTokenizer` + 可选 glossary.yaml
10. 加载 `emo_matrix` + `spk_matrix` → `torch.split(matrix, emo_num)`
11. 缓存初始化: 6 个独立缓存字段

### 8.2 GPT 模型架构对比 (config.yaml)

| 参数 | v1.5 | v2.0 |
|------|------|------|
| `model_dim` | 1024 | **1280** |
| `layers` | 20 | **24** |
| `heads` | 16 | **20** |
| `max_mel_tokens` | 605 | **1815** |
| `max_text_tokens` | 402 | **600** |
| `activation_function` | `gelu_pytorch_tanh` | (未指定) |
| 条件模块 (spk) | 1×Conformer (6层, 8头, 512维) | 同 |
| 条件模块 (emo) | ❌ | **1×Conformer (4层, 4头, 512维)** |
| Mel 参数 | n_fft=1024, hop=256, n_mels=100, sr=24000 | n_fft=1024, hop=256, **n_mels=80**, **sr=22050** |
| Semantic Codec | ❌ | **codebook_size=8192, hidden=1024, vocos 12层** |
| S2Mel DiT | ❌ | **hidden=512, 8头, 13层深, CFM** |

### 8.3 关键常量与魔法数字

| 常量 | 值 | 用途 | 版本 |
|------|-----|------|------|
| `silent_token` | 52 | 静音 token ID | 两版 |
| `start_mel_token` | 8192 | mel 起始 token | 两版 |
| `stop_mel_token` | 8193 | mel 终止 token | 两版 |
| `number_mel_codes` | 8194 | mel codebook 大小 | 两版 |
| `start_text_token` | 0 | 文本起始 token | 两版 |
| `stop_text_token` | 1 | 文本终止 token | 两版 |
| `max_consecutive` | 30 | 最大连续静音 token 数 | 两版 |
| `1.72` | — | S2Mel 时长对齐系数 (`code_lens * 1.72`) | v2.0 |
| `inference_cfg_rate` | 0.7 | CFM classifier-free guidance 率 | v2.0 |
| `diffusion_steps` | 25 | CFM 扩散步数 | v2.0 |
| `bucket_factor` | 1.5 | 桶化分句的长度比因子 | v1.5 |
| `chunk_size` | 2 | BigVGAN 解码的 latent 块大小 | v1.5 |
| `mel_length_compression` | 1024 | mel token 到波形的压缩比 | 两版 |
| `emo_bias` | [0.9375,...,0.5625] | 情感 bias 校正数组 | v2.0 |
| `emo_sum_limit` | 0.8 | 情感向量总和上限 | v2.0 |
| `max_audio_length` | 15s | 参考音频最大长度 | v2.0 |
| `W2V-BERT layer` | 17 | 语义特征提取层索引 | v2.0 |

### 8.4 文本前端实现细节 (TextNormalizer)

**标点符号映射** (源码中的 `char_rep_map`):
```
：；;，→ ,    。→ .    ！→ !    ？→ ?
...→ …    ,,,→ …    ……→ …
"" '' () （）《》【】[] 「」→ '
—～~ → -    · → -    \n → 空格
```

**中文检测逻辑** (`use_chinese()`):
1. 包含中文字符 → 中文
2. 不含英文字母 → 中文
3. 是邮箱格式 → 中文处理
4. 含拼音标注 (如 XUAN4) → 中文
5. 其他 → 英文

**平台差异**:
- Windows/Linux: `WeTextProcessing` (tn.chinese.normalizer)
- macOS: `wetext` (Normalizer)

**拼音声调正则** (源码):
```
PINYIN_TONE_PATTERN = r"(?<![a-z])((?:[bpmfdtnlgkhjqxzcsryw]|[zcs]h)?...)(1-5])"
```
匹配: `xuan4`, `jve2`, `ying1`, `zhong4`, `shang5`
不匹配: `beta1`, `voice2`

### 8.5 v1.5 桶化批处理算法 (源码级)

```
bucket_sentences(sentences, bucket_max_size=4):
  1. 为每句附加 {idx, sent, len} 元数据
  2. 如果句数 > bucket_max_size:
     a. 按长度升序排序
     b. 遍历: 如果当前句长 ≥ 上一桶中位长 * 1.5 或桶已满 → 新开桶
     c. 否则加入当前桶，更新中位长度
     d. 合并所有只有 1 句的桶:
        - 优先塞入未满的桶
        - 剩余按 bucket_max_size 分组
  3. 如果句数 ≤ bucket_max_size: 全部放入一个桶
```

### 8.6 v2.0 情感控制优先级逻辑 (源码级)

```
输入: spk_audio_prompt (必填), emo_audio_prompt, emo_alpha,
      emo_vector, use_emo_text, emo_text

处理:
  1. if use_emo_text OR emo_vector:
       emo_audio_prompt = None  ← 清除音频情感引用!
  2. if use_emo_text:
       emo_text ← text (默认用合成文本)
       emo_dict = QwenEmotion.inference(emo_text)
       emo_vector = list(emo_dict.values())
  3. if emo_vector:
       emo_vector *= emo_alpha  ← 预缩放
  4. if emo_audio_prompt is None:
       emo_audio_prompt = spk_audio_prompt  ← 用说话人音频代替
       emo_alpha = 1.0  ← 强制 1.0
  5. 推理时:
       emovec = merge_emovec(spk_cond, emo_cond, alpha=emo_alpha)
       if emo_vector:
         找最近邻 → 加权混合 → emovec = emovec_mat + (1-sum) * emovec
```

### 8.7 v2.0 S2Mel CFM 推理流程 (源码级)

```python
# 1. GPT latent 投影
latent = s2mel.models['gpt_layer'](latent)

# 2. Semantic Codec VQ 解码
S_infer = semantic_codec.quantizer.vq2emb(codes.unsqueeze(1))
S_infer = S_infer.transpose(1, 2)

# 3. 特征融合
S_infer = S_infer + latent

# 4. 时长对齐 (关键系数 1.72)
target_lengths = (code_lens * 1.72).long()

# 5. 长度调节 (使用 3 个 quantizer)
cond = s2mel.models['length_regulator'](S_infer, ylens=target_lengths, n_quantizers=3, f0=None)[0]

# 6. 拼接参考条件
cat_condition = torch.cat([prompt_condition, cond], dim=1)

# 7. CFM 扩散推理 (25 步, cfg_rate=0.7)
vc_target = s2mel.models['cfm'].inference(
    cat_condition, torch.LongTensor([cat_condition.size(1)]).to(device),
    ref_mel, style, None, diffusion_steps=25, inference_cfg_rate=0.7)

# 8. 裁掉参考 mel 对应的部分
vc_target = vc_target[:, :, ref_mel.size(-1):]

# 9. BigVGAN vocoder
wav = bigvgan(vc_target.float())
```

### 8.8 缓存策略对比 (源码级)

**v1.5 缓存** (2 个字段):
| 字段 | 内容 | 失效条件 |
|------|------|---------|
| `cache_audio_prompt` | 参考音频路径 | 路径变化 |
| `cache_cond_mel` | Mel 频谱 | 路径变化 |

**v2.0 缓存** (6 个字段，分说话人和情感):
| 字段 | 内容 | 失效条件 |
|------|------|---------|
| `cache_spk_audio_prompt` | 说话人音频路径 | 路径变化 |
| `cache_spk_cond` | W2V-BERT 语义嵌入 | 路径变化 |
| `cache_s2mel_style` | CAMPPlus 风格向量 | 路径变化 |
| `cache_s2mel_prompt` | S2Mel prompt_condition | 路径变化 |
| `cache_mel` | Mel 频谱 (ref_mel) | 路径变化 |
| `cache_emo_audio_prompt` + `cache_emo_cond` | 情感音频路径 + 嵌入 | 路径变化 |

缓存失效时 v2.0 主动调用 `torch.cuda.empty_cache()` 释放显存。

### 8.9 音频输出处理

两个版本的波形后处理完全相同:
```python
wav = torch.clamp(32767 * wav, -32767.0, 32767.0)
wav = wav.type(torch.int16)
torchaudio.save(output_path, wav, sampling_rate)
```

v2.0 额外的段间静音插入:
```python
sil_dur = int(sampling_rate * interval_silence / 1000.0)
sil_tensor = torch.zeros(channel_size, sil_dur)  # 默认 200ms
```
