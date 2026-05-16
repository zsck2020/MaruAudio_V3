# 配音页面 UI/功能设计方案

> 基于现有 Tauri + SvelteKit 前端框架  
> Ant Design 暗色主题，Svelte 5 Runes  
> 最后更新: 2026-03-18

---

## 一、页面布局

左右两栏 + 下方通栏（通栏宽度覆盖左右两栏）：

```
┌──────────────────────────────────────────┬───────────────────────┐
│ 左栏 — 文本编辑 + 工具 (80%)              │ 右栏 — 参数面板 (20%)  │
│                                          │                       │
│ [文义分段][插入停顿][拼音标注][数字读法]    │ [参考音频][参数][情感]   │
│ ┌──────────────────────────────────────┐ │ ┌───────────────────┐ │
│ │                                      │ │ │                   │ │
│ │  文本编辑器                           │ │ │  TAB 内容区        │ │
│ │                                      │ │ │                   │ │
│ │                                      │ │ │  (参考音频 /       │ │
│ │                                      │ │ │   参数控制 /       │ │
│ │                                      │ │ │   情感控制)        │ │
│ │                                      │ │ │                   │ │
│ └──────────────────────────────────────┘ │ └───────────────────┘ │
│                                          │                       │
│ 生成:[普通▾]  [导入文本]  120字  [生成配音]│                       │
├──────────────────────────────────────────┴───────────────────────┤
│ 下方通栏 — 播放器功能区                                           │
│ ▶ ━━━━━━━━━━━━━━━ 00:00/00:30   [波形] [下载] [字幕生成]         │
└─────────────────────────────────────────────────────────────────┘
```

左栏工具栏和底部操作栏均为单行布局。

---

## 二、左栏 — 文本编辑 + 工具

### 2.1 顶部工具栏

高度 40px，背景 `var(--color-bg-elevated)`，圆角上方 8px。**单行水平排列**所有按钮。

| 按钮 | 图标 | 功能 |
|------|------|------|
| 文义分段 | `ant-design:scissor-outlined` | 按语义自动切分段落 |
| 插入停顿 | `ant-design:pause-circle-outlined` | 在光标位置插入停顿标记 |
| 拼音标注 | `ant-design:font-size-outlined` | 选中文字后标注拼音 |
| 数字读法 | `ant-design:number-outlined` | 切换数字朗读规则 |

按钮样式参考 TitleBar 中的 `icon-btn`（32x32，hover 背景 `var(--color-bg-spotlight)`）。

工具栏右侧放置**引擎选择器**：
- 下拉选择：普通模式 / 情感模式 / 云端模式
- 引擎状态标识：绿色圆点=可用，黄色=加载中，红色=不可用

### 2.2 文本编辑器

- 组件：`<textarea>` 或自定义富文本编辑器
- 背景：`var(--color-bg-base)` (#141414)
- 边框：`1px solid var(--color-border-secondary)` (#303030)
- 圆角：0（与工具栏衔接），底部 `var(--border-radius-lg)`
- 内边距：16px
- 字体：`var(--font-family)`, `var(--font-size)` (14px)
- placeholder: "在此输入或粘贴要配音的文案..."
- 占据左栏主体高度（`flex: 1`）
- 拼音标注可视化：标注的拼音以小字显示在汉字上方（如有富文本支持）
- 停顿标记高亮：以特殊颜色显示停顿符号

### 2.3 左栏底部

高度 48px，背景 `var(--color-bg-elevated)`，**单行水平排列**所有元素：

| 元素 | 说明 |
|------|------|
| 生成模式选择器 | 下拉：普通生成（逐句） / 批次生成（分桶并行） |
| 导入文本 | 按钮，打开文件选择器（.txt / .docx） |
| 字数统计 | 文字显示 "120字"，超限变红 |
| **生成配音** | 主按钮，背景 `var(--color-primary)` (#1677ff)，白色文字，靠右对齐 |

---

## 三、右栏 — 参数面板 (TAB 模式)

### 3.1 TAB 标签

| TAB | 图标 | 始终显示 | 说明 |
|-----|------|:---:|------|
| 参考音频 | `ant-design:sound-outlined` | ✅ | 选择/上传/录制参考音频 |
| 参数控制 | `ant-design:sliders-outlined` | ✅ | 引擎参数（根据引擎类型显示不同内容） |
| 情感控制 | `ant-design:heart-outlined` | 仅情感/云端 | 轻量引擎下隐藏此 TAB |

TAB 样式：文字 + 下划线指示器，active 时文字 `var(--color-primary)`，下划线 2px。

### 3.2 TAB 1 — 参考音频

| 元素 | 说明 |
|------|------|
| 音色选择下拉 | 已上传的音色列表，含"默认音色" |
| 上传音频按钮 | 选择本地文件（wav/mp3/flac，≤15秒） |
| 录制音频按钮 | 打开录音弹窗（倒计时 + 波形实时预览） |
| 从音库选择 | 打开音库弹窗，选择样音 |
| 波形预览 | 选中音色后显示波形 + 播放按钮 + 时长 |
| 音频信息 | 采样率、时长、格式 |

### 3.3 TAB 2 — 参数控制

根据当前引擎类型显示不同参数：

**轻量引擎（内部 = IndexTTS 1.5，本地）**：

| 参数 | 控件 | 默认值 | 范围 |
|------|------|--------|------|
| 段间静音 | 滑块 + 数字输入 | 200ms | 0~1000ms |
| 单段最大 Token | 滑块 | 100 | 50~200 |

**情感引擎（内部 = IndexTTS 2.0，本地）** — 在轻量引擎基础上新增：

| 参数 | 控件 | 默认值 | 范围 |
|------|------|--------|------|
| 温度 | 滑块 | 0.8 | 0.1~1.5 |
| Top-P | 滑块 | 0.8 | 0.1~1.0 |
| Top-K | 滑块 | 30 | 1~100 |
| 情感强度 | 滑块 | 0.6 | 0.0~1.0 |

**云端引擎（内部 = 阿里云百炼 Qwen3-TTS，远程）**：同情感引擎，额外增加队列优先级、失败重试、生成后回传等云端任务字段。

### 3.4 TAB 3 — 情感控制

仅在情感引擎/云端引擎下显示此 TAB。

提供三种情感输入方式，通过 radio 切换：

**方式一：滑块模式**（默认）

8 个水平滑块：

| 情感 | 控件 | 范围 |
|------|------|------|
| 开心 | 滑块 + 数值 | 0.0~1.2 |
| 愤怒 | 滑块 + 数值 | 0.0~1.2 |
| 悲伤 | 滑块 + 数值 | 0.0~1.2 |
| 害怕 | 滑块 + 数值 | 0.0~1.2 |
| 厌恶 | 滑块 + 数值 | 0.0~1.2 |
| 忧郁 | 滑块 + 数值 | 0.0~1.2 |
| 惊讶 | 滑块 + 数值 | 0.0~1.2 |
| 平静 | 滑块 + 数值 | 0.0~1.2 |

底部提示："所有情感值总和不超过 1.5"

**方式二：文本模式**

- 输入框："描述你想要的情感语气"
- placeholder: "例: 用温柔关怀的语气"
- 引擎自动通过 Qwen3 分析文本情感

**方式三：音频模式**

- 上传情感参考音频（wav/mp3，5~30秒）
- 波形预览 + 播放
- 情感强度滑块（0.0~1.0）

---

## 四、下方通栏 — 播放器功能区

高度 64px，背景 `var(--color-bg-elevated)`，顶部边框 `1px solid var(--color-border-secondary)`。

全宽覆盖左右两栏。

### 4.1 未生成状态

```
配音就绪 — 输入文案并选择音色后点击"生成配音"
```

灰色文字居中显示。

### 4.2 生成中状态

```
▌▌  生成中... 第 2/5 段  ━━━━━━━━━━━━━━━━━━━━ 40%
```

进度条 + 步骤提示。

### 4.3 生成完成状态

```
▷  ━━━●━━━━━━━━━━━━━━━━━━━━  00:12 / 00:30   [波形▾] [↓ 下载] [字幕] [重新生成]
```

| 元素 | 说明 |
|------|------|
| 播放/暂停按钮 | ▷ / ▌▌ 切换 |
| 进度条 | 可拖动，显示播放位置 |
| 时间显示 | 当前时间 / 总时长 |
| 波形预览 | 展开/收起音频波形图 |
| 下载按钮 | 保存 wav/mp3 到本地 |
| 字幕生成 | 跳转字幕页或弹窗生成字幕 |
| 重新生成 | 使用相同参数重新生成 |

---

## 五、引擎切换行为

| 切换动作 | 界面变化 |
|---------|---------|
| 切换到普通模式 | 隐藏情感控制 TAB，参数面板简化 |
| 切换到情感模式 | 显示情感控制 TAB，参数面板完整 |
| 切换到云端模式 | 同情感模式 + 显示余额信息 |

引擎不可用时的处理：
- 普通模式不可用（无 GPU）→ 提示 "当前设备不支持普通模式"，引导选云端模式
- 情感模式不可用（显存不足）→ 提示 "显存不足，建议使用普通模式或云端模式"
- 云端模式不可用（未登录/余额不足）→ 提示登录或充值

---

## 六、组件拆分

```
frontend/src/routes/dubbing/+page.svelte     # 配音页面容器
frontend/src/lib/components/dubbing/
  ├── TextToolbar.svelte       # 左栏顶部工具栏
  ├── TextEditor.svelte        # 文本编辑器
  ├── LeftBottomBar.svelte     # 左栏底部（引擎/导入/字数/生成按钮）
  ├── ParamTabs.svelte         # 右栏 TAB 容器
  ├── TabReferenceAudio.svelte # TAB1 - 参考音频
  ├── TabParamControl.svelte   # TAB2 - 参数控制
  ├── TabEmotionControl.svelte # TAB3 - 情感控制
  ├── PlayerBar.svelte         # 下方通栏播放器
  └── AudioUploader.svelte     # 音频上传组件（复用）
```

---

## 七、Svelte 5 状态管理

```typescript
// frontend/src/lib/stores/dubbing.svelte.ts

export type EngineMode = 'lightweight' | 'emotion' | 'cloud';
export type EmotionMethod = 'none' | 'slider' | 'text' | 'audio';

// 引擎状态
let engineMode = $state<EngineMode>('lightweight');
let engineAvailable = $state({ lightweight: false, emotion: false, cloud: false });

// 文本
let text = $state('');
let wordCount = $derived(text.replace(/\s/g, '').length);

// 参考音频
let voiceId = $state<string | null>(null);
let voiceName = $state('默认音色');

// 参数
let intervalSilence = $state(200);
let maxTextTokens = $state(100);
let temperature = $state(0.8);
let topP = $state(0.8);
let topK = $state(30);
let emoAlpha = $state(0.6);

// 情感控制
let emotionMethod = $state<EmotionMethod>('none');
let emotionSliders = $state({
  happy: 0, angry: 0, sad: 0, afraid: 0,
  disgusted: 0, melancholic: 0, surprised: 0, calm: 0.5
});
let emotionText = $state('');
let emotionAudioPath = $state<string | null>(null);

// 生成状态
let isGenerating = $state(false);
let progress = $state(0);
let progressMessage = $state('');
let generatedAudioPath = $state<string | null>(null);

// 播放器
let isPlaying = $state(false);
let currentTime = $state(0);
let duration = $state(0);

// 是否显示情感 TAB
let showEmotionTab = $derived(engineMode !== 'lightweight');
```

---

## 八、CSS 样式规范

所有组件复用现有 CSS 变量：

| 用途 | 变量 |
|------|------|
| 面板背景 | `var(--color-bg-elevated)` (#262626) |
| 编辑器背景 | `var(--color-bg-base)` (#141414) |
| 内容区背景 | `var(--color-bg-container)` (#1f1f1f) |
| 主按钮 | `var(--color-primary)` (#1677ff) |
| 主文字 | `var(--color-text)` (rgba 255,255,255,0.85) |
| 次要文字 | `var(--color-text-secondary)` (rgba 255,255,255,0.65) |
| 边框 | `var(--color-border-secondary)` (#303030) |
| 圆角 | `var(--border-radius)` (6px) / `var(--border-radius-lg)` (8px) |
| 间距 | `var(--spacing-sm)` (8px) / `var(--spacing-md)` (12px) / `var(--spacing-lg)` (16px) |

滑块样式：
- 轨道：高度 4px，背景 `var(--color-border)` (#424242)
- 已填充：`var(--color-primary)`
- 滑块手柄：宽 12px，高 12px，圆形，白色，阴影

TAB 样式：
- 未选中：`var(--color-text-tertiary)`
- 选中：`var(--color-primary)` + 底部 2px 下划线
- hover：`var(--color-text-secondary)`

---

## 九、Tauri Commands 对接

| 前端调用 | Rust Command | 说明 |
|---------|-------------|------|
| `invoke('tts_synthesize', {...})` | `tts_synthesize` | 生成配音 |
| `invoke('tts_upload_voice', {...})` | `tts_upload_voice` | 上传参考音频 |
| `invoke('tts_list_voices')` | `tts_list_voices` | 获取音色列表 |
| `invoke('tts_engine_status')` | `tts_engine_status` | 引擎状态 |
| `invoke('tts_detect_gpu')` | `tts_detect_gpu` | GPU 检测 |
| `listen('generation-progress')` | Tauri Event | 生成进度推送 |
| `listen('generation-completed')` | Tauri Event | 生成完成推送 |
| `listen('generation-failed')` | Tauri Event | 生成失败推送 |
