# IndexTTS 引擎深度学习报告

> 最后更新: 2026-02-16  
> ⚠️ 本报告仅供丸子配音引擎开发参考，IndexTTS 源码禁止直接调用

---

## 一、整体架构对比

### IndexTTS 1.5（轻量引擎）

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

### IndexTTS 2.0（情感引擎）

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
   - 直接指定 8 维情感权重
   - 例: `[0.8, 0, 0, 0, 0, 0, 0, 0.2]` → 80%开心 + 20%平静
   - 有 bias 校正（降低容易产生异常的情感权重）
   - 总和限制在 0.8 以下

3. **情感文本** (`use_emo_text=True`):
   - 通过微调的 **Qwen3** 模型分析文本情感
   - 输出 JSON 格式的情感分类向量
   - 自动转换为 8 维 emo_vector

**QwenEmotion 类**:
- 基于 Qwen3 的情感分类模型
- 输入: 文本 → 输出: `{高兴: 0.7, 自然: 0.3, ...}`
- 情感类别映射: 高兴→happy, 愤怒→angry, 悲伤→sad, 恐惧→afraid, 反感→disgusted, 低落→melancholic, 惊讶→surprised, 自然→calm
- 有"低落"vs"悲伤"的特殊处理逻辑

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
- PyTorch + torchaudio
- sentencepiece (BPE)
- WeTextProcessing (文本正则化)
- OmegaConf (配置)
- DeepSpeed (可选加速)

### v2.0 (在 v1.5 基础上新增)
- transformers (自定义 GPT2)
- librosa
- modelscope (AutoModelForCausalLM)
- huggingface_hub
- safetensors
- facebook/w2v-bert-2.0 (语义特征)
- amphion/MaskGCT (语义编解码)
- funasr/campplus (说话人风格)
- Qwen3 (情感分析)
- bigvgan (HuggingFace 版 vocoder)
