# 配音页与 IndexTTS v1.5 解耦集成 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让配音页从演示态切换为真实的 Tauri 命令接缝，完成与 `IndexTTS v1.5` 外部 provider 的解耦集成准备，同时保证文档与 UI 使用简体中文并避免编码错误。

**Architecture:** 前端通过统一的 Tauri 命令桥接配音能力，Rust 侧建立最小可扩展的 TTS 契约、参考音频文件管理与结构化状态返回。首期不在仓内跑真实推理，而是先做到“状态诚实、输入可管理、输出可验证、对仓内 `IndexTTS/` 零运行期依赖”。

**Tech Stack:** Svelte 5、TypeScript、Tauri 2、Rust、Node `node:test`、`svelte-check`、`cargo test`、`cargo check`

---

## 实施前约束

- 所有新增或修改的文档、UI 文案、错误提示都必须使用简体中文。
- 所有新增或修改的文本文件统一保存为 UTF-8。
- 不使用 PowerShell 重定向写入中文内容，统一使用 `apply_patch` 修改文件。
- 如果终端显示乱码，以源码文件的 UTF-8 内容和浏览器实际渲染为准，不凭终端乱码误判文件内容。
- 任一运行链路中都不得引用仓内 `IndexTTS/`、`IndexTTS/v15`、`IndexTTS/v20`。

## 文件边界

### 前端现有文件

- `frontend/src/routes/dubbing/+page.svelte`
  - 配音页主流程，后续接入真实 `invoke()` 调用，移除假进度。
- `frontend/src/lib/stores/dubbing.svelte.ts`
  - 配音业务状态；需要拆分“业务真相字段”和“展示态字段”。
- `frontend/src/lib/types/dubbing.ts`
  - 前端配音类型；需要补齐 probe、参考音频、生成响应等类型。
- `frontend/src/lib/components/dubbing/EngineSelector.svelte`
  - 根据后端 probe 状态控制引擎模式可选性与提示文案。
- `frontend/src/lib/components/dubbing/AudioUploader.svelte`
  - 参考音频上传入口；后续交由后端受管存储。
- `frontend/src/lib/components/dubbing/TabReferenceAudio.svelte`
  - 参考音频来源切换与已上传音频状态展示。
- `frontend/src/lib/components/dubbing/AudioPlayer.svelte`
  - 预览播放器；后续只作为展示层，不作为业务真相源。
- `frontend/src/lib/components/dubbing/LeftBottomBar.svelte`
  - 生成入口与底部动作区。
- `frontend/src/lib/components/dubbing/PlayerBar.svelte`
  - 生成结果播放、重新生成、打开输出等动作。

### 前端新增文件

- `frontend/dubbing-copy.test.ts`
  - 编码与中文文案基线测试。
- `frontend/dubbing-tts.test.ts`
  - 前端请求映射与响应归一化测试。
- `frontend/src/lib/utils/dubbing-tts.ts`
  - 前端与 Tauri 交互的纯函数/桥接封装。

### Rust 现有文件

- `frontend/src-tauri/src/lib.rs`
  - 注册新 TTS 命令。
- `frontend/src-tauri/src/commands/tts.rs`
  - 暴露 `tts_probe`、`tts_prepare_reference_audio`、`tts_generate`、`tts_cancel`、`tts_open_output`。
- `frontend/src-tauri/src/services/tts/mod.rs`
  - TTS 服务模块总入口。
- `frontend/src-tauri/src/utils/error.rs`
  - 保留通用错误类型；补齐中文错误文案，必要时增加 TTS 错误码映射辅助函数。

### Rust 新增文件

- `frontend/src-tauri/src/services/tts/types.rs`
  - TTS 请求/响应/状态结构体与序列化定义。
- `frontend/src-tauri/src/services/tts/provider.rs`
  - `TtsProvider` trait、默认 `Noop` provider、probe 逻辑。
- `frontend/src-tauri/src/services/tts/reference_audio.rs`
  - 参考音频保存、扩展名校验、受管路径生成。

### 文档文件

- `docs/IndexTTS15集成开发方案.md`
  - 删除 `indextts_path`、`sys.path.insert(...)`、仓内路径直连等过时方案。
- `docs/superpowers/specs/2026-04-15-dubbing-v15-decoupled-integration-design.md`
  - 已批准 spec，只读参考，不在实施中改写核心边界。

## Chunk 1: 编码护栏与中文文案基线

### Task 1: 为配音相关 UI 建立中文与 UTF-8 基线

**Files:**
- Create: `frontend/dubbing-copy.test.ts`
- Modify: `frontend/src/routes/dubbing/+page.svelte`
- Modify: `frontend/src/lib/components/dubbing/AudioUploader.svelte`
- Modify: `frontend/src/lib/components/dubbing/TabReferenceAudio.svelte`
- Modify: `frontend/src/lib/components/dubbing/EngineSelector.svelte`
- Modify: `frontend/src/lib/components/dubbing/PlayerBar.svelte`
- Modify: `frontend/src-tauri/src/utils/error.rs`

- [ ] **Step 1: 写一个会失败的中文文案/编码测试**

```ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const files = [
  'src/routes/dubbing/+page.svelte',
  'src/lib/components/dubbing/AudioUploader.svelte',
  'src/lib/components/dubbing/TabReferenceAudio.svelte',
  'src/lib/components/dubbing/EngineSelector.svelte',
  'src/lib/components/dubbing/PlayerBar.svelte',
];

test('配音页关键文件使用 UTF-8 中文文案', () => {
  for (const relativePath of files) {
    const text = readFileSync(new URL(`./${relativePath}`, import.meta.url), 'utf8');
    assert.equal(text.includes('\uFFFD'), false, `${relativePath} 含有替换字符`);
  }

  const page = readFileSync(new URL('./src/routes/dubbing/+page.svelte', import.meta.url), 'utf8');
  assert.match(page, /开始生成|生成配音|导入文案/);
});
```

- [ ] **Step 2: 运行测试确认它先失败**

Run: `node --test frontend/dubbing-copy.test.ts`  
Expected: FAIL，指出至少一个文件含有错误文案、缺少中文标签，或存在替换字符检查未通过。

- [ ] **Step 3: 用 `apply_patch` 统一修正本批次会触达文件中的中文文案**

修正原则：

- UI 按钮、提示、toast、错误消息全部使用简体中文。
- 注释可保留简短中文，不保留乱码注释。
- Rust 错误枚举中的用户可见消息改为正常中文。
- 不触碰与本批次无关的文件。

示例目标文案：

```svelte
toast.warning('请先输入要生成的文案');
toast.info('当前尚未配置可用的配音引擎');
toast.success('参考音频已上传，可用于后续生成');
```

- [ ] **Step 4: 回跑测试与静态检查**

Run: `node --test frontend/dubbing-copy.test.ts`  
Expected: PASS

Run: `npm.cmd run check`
Expected: PASS，`svelte-check found 0 errors and 0 warnings`

- [ ] **Step 5: 提交这一小步**

```bash
git add frontend/dubbing-copy.test.ts frontend/src/routes/dubbing/+page.svelte frontend/src/lib/components/dubbing/AudioUploader.svelte frontend/src/lib/components/dubbing/TabReferenceAudio.svelte frontend/src/lib/components/dubbing/EngineSelector.svelte frontend/src/lib/components/dubbing/PlayerBar.svelte frontend/src-tauri/src/utils/error.rs
git commit -m "test: add chinese copy guard for dubbing flow"
```

## Chunk 2: Rust TTS 契约与受管文件入口

### Task 2: 建立 Rust 侧 TTS 类型与默认 provider

**Files:**
- Create: `frontend/src-tauri/src/services/tts/types.rs`
- Create: `frontend/src-tauri/src/services/tts/provider.rs`
- Modify: `frontend/src-tauri/src/services/tts/mod.rs`
- Test: `frontend/src-tauri/src/services/tts/provider.rs`

- [ ] **Step 1: 先写会失败的 Rust 单测**

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn noop_provider_probe_reports_not_configured() {
        let probe = NoopTtsProvider::default().probe();
        assert!(!probe.available);
        assert_eq!(probe.code.as_deref(), Some("not_configured"));
    }
}
```

- [ ] **Step 2: 运行测试确认它先失败**

Run: `cargo test noop_provider_probe_reports_not_configured --manifest-path frontend/src-tauri/Cargo.toml`
Expected: FAIL，提示 `probe` 或相关类型尚不存在。

- [ ] **Step 3: 写最小实现**

```rust
#[derive(Debug, Clone, Serialize)]
pub struct ProviderProbe {
    pub provider: String,
    pub available: bool,
    pub code: Option<String>,
    pub message: Option<String>,
}

pub trait TtsProvider: Send + Sync {
    fn name(&self) -> &'static str;
    fn probe(&self) -> ProviderProbe;
}

#[derive(Default)]
pub struct NoopTtsProvider;

impl TtsProvider for NoopTtsProvider {
    fn name(&self) -> &'static str { "v15" }

    fn probe(&self) -> ProviderProbe {
        ProviderProbe {
            provider: self.name().to_string(),
            available: false,
            code: Some("not_configured".into()),
            message: Some("当前未配置可用的 v1.5 引擎".into()),
        }
    }
}
```

- [ ] **Step 4: 回跑测试**

Run: `cargo test noop_provider_probe_reports_not_configured --manifest-path frontend/src-tauri/Cargo.toml`
Expected: PASS

- [ ] **Step 5: 提交这一小步**

```bash
git add frontend/src-tauri/src/services/tts/types.rs frontend/src-tauri/src/services/tts/provider.rs frontend/src-tauri/src/services/tts/mod.rs
git commit -m "feat: add rust tts contract types"
```

### Task 3: 增加参考音频受管保存能力

**Files:**
- Create: `frontend/src-tauri/src/services/tts/reference_audio.rs`
- Modify: `frontend/src-tauri/src/services/tts/mod.rs`
- Test: `frontend/src-tauri/src/services/tts/reference_audio.rs`

- [ ] **Step 1: 先写会失败的 Rust 单测**

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn prepare_reference_audio_rejects_unsupported_extension() {
        let result = prepare_reference_audio("demo.txt", b"abc").await;
        assert!(result.is_err());
    }
}
```

- [ ] **Step 2: 运行测试确认它先失败**

Run: `cargo test prepare_reference_audio_rejects_unsupported_extension --manifest-path frontend/src-tauri/Cargo.toml`
Expected: FAIL，提示 `prepare_reference_audio` 尚不存在。

- [ ] **Step 3: 写最小实现**

```rust
pub async fn prepare_reference_audio(file_name: &str, bytes: &[u8]) -> anyhow::Result<PreparedReferenceAudio> {
    let extension = Path::new(file_name)
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();

    if !matches!(extension.as_str(), "wav" | "mp3" | "flac") {
        anyhow::bail!("仅支持 WAV、MP3、FLAC 参考音频");
    }

    // 保存到应用受管目录，例如 app_data_dir()/tts/reference
    // 返回 referenceId、filePath、displayName
}
```

- [ ] **Step 4: 回跑测试，再补一个成功路径测试**

Run: `cargo test prepare_reference_audio --manifest-path frontend/src-tauri/Cargo.toml`
Expected: PASS，至少覆盖非法扩展名与正常保存两个分支。

- [ ] **Step 5: 提交这一小步**

```bash
git add frontend/src-tauri/src/services/tts/reference_audio.rs frontend/src-tauri/src/services/tts/mod.rs
git commit -m "feat: add managed reference audio storage"
```

### Task 4: 暴露最小 Tauri 命令集并注册到应用

**Files:**
- Modify: `frontend/src-tauri/src/commands/tts.rs`
- Modify: `frontend/src-tauri/src/lib.rs`
- Modify: `frontend/src-tauri/src/services/tts/types.rs`
- Modify: `frontend/src-tauri/src/services/tts/provider.rs`
- Modify: `frontend/src-tauri/src/services/tts/reference_audio.rs`

- [ ] **Step 1: 先写一个会失败的命令层测试**

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tts_probe_returns_unconfigured_v15_provider() {
        let response = tts_probe();
        assert_eq!(response.providers.len(), 1);
        assert_eq!(response.providers[0].code.as_deref(), Some("not_configured"));
    }
}
```

- [ ] **Step 2: 运行测试确认它先失败**

Run: `cargo test tts_probe_returns_unconfigured_v15_provider --manifest-path frontend/src-tauri/Cargo.toml`
Expected: FAIL

- [ ] **Step 3: 写最小实现**

实现目标：

- `tts_probe()`
- `tts_prepare_reference_audio(file_name, bytes_base64)` 或等价输入
- `tts_generate(request)`，首期可返回结构化 `not_configured`
- `tts_cancel(task_id)`，首期返回幂等占位
- `tts_open_output(target)`，仅在路径存在时执行打开动作

建议返回结构：

```rust
#[derive(Debug, Serialize)]
pub struct TtsCommandEnvelope<T> {
    pub ok: bool,
    pub data: Option<T>,
    pub error: Option<TtsCommandError>,
}
```

- [ ] **Step 4: 回跑测试与编译检查**

Run: `cargo test tts_probe_returns_unconfigured_v15_provider --manifest-path frontend/src-tauri/Cargo.toml`
Expected: PASS

Run: `cargo check --manifest-path frontend/src-tauri/Cargo.toml`
Expected: PASS

- [ ] **Step 5: 提交这一小步**

```bash
git add frontend/src-tauri/src/commands/tts.rs frontend/src-tauri/src/lib.rs frontend/src-tauri/src/services/tts/types.rs frontend/src-tauri/src/services/tts/provider.rs frontend/src-tauri/src/services/tts/reference_audio.rs
git commit -m "feat: add tauri tts command bridge"
```

## Chunk 3: 前端桥接、状态改造与诚实 UI

### Task 5: 建立前端 TTS 桥接与纯函数测试

**Files:**
- Create: `frontend/src/lib/utils/dubbing-tts.ts`
- Create: `frontend/dubbing-tts.test.ts`
- Modify: `frontend/src/lib/types/dubbing.ts`

- [ ] **Step 1: 先写会失败的前端测试**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import { buildGenerateRequest, normalizeProbeResponse } from './src/lib/utils/dubbing-tts.ts';

test('buildGenerateRequest drops preview-only fields', () => {
  const request = buildGenerateRequest({
    text: '主公，城外有变。',
    referenceAudioPath: 'E:/tmp/ref.wav',
    voiceAudioUrl: 'blob:preview-only',
    progress: 90,
  } as any);

  assert.equal('voiceAudioUrl' in request, false);
  assert.equal(request.referenceAudioPath, 'E:/tmp/ref.wav');
});

test('normalizeProbeResponse maps provider issue to engine statuses', () => {
  const result = normalizeProbeResponse({
    providers: [{ provider: 'v15', available: false, code: 'not_configured', message: '当前未配置可用的 v1.5 引擎' }],
  } as any);

  assert.equal(result.lightweight.available, false);
  assert.match(result.lightweight.message, /未配置/);
});
```

- [ ] **Step 2: 运行测试确认它先失败**

Run: `node --test frontend/dubbing-tts.test.ts`
Expected: FAIL，提示桥接函数或类型不存在。

- [ ] **Step 3: 写最小实现**

```ts
export function buildGenerateRequest(state: DubbingStateForRequest): TtsGenerateRequest {
  return {
    provider: 'v15',
    engineMode: state.engineMode,
    text: state.text,
    referenceAudioPath: state.referenceAudioPath,
    params: {
      intervalSilence: state.intervalSilence,
      maxTextTokens: state.maxTextTokens,
      bucketMaxSize: state.bucketMaxSize,
      temperature: state.temperature,
      topP: state.topP,
      topK: state.topK,
      emoAlpha: state.emoAlpha,
      emotionMethod: state.emotionMethod,
      emotionVector: state.emotionSliders,
      emotionText: state.emotionText,
    },
  };
}
```

- [ ] **Step 4: 回跑测试**

Run: `node --test frontend/dubbing-tts.test.ts`
Expected: PASS

- [ ] **Step 5: 提交这一小步**

```bash
git add frontend/src/lib/utils/dubbing-tts.ts frontend/dubbing-tts.test.ts frontend/src/lib/types/dubbing.ts
git commit -m "feat: add frontend dubbing bridge helpers"
```

### Task 6: 重构配音 store，区分业务真相与展示态

**Files:**
- Modify: `frontend/src/lib/stores/dubbing.svelte.ts`
- Modify: `frontend/src/lib/types/dubbing.ts`
- Modify: `frontend/src/lib/utils/dubbing-tts.ts`

- [ ] **Step 1: 先写一个会失败的状态迁移测试**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import { createInitialDubbingState, applyPreparedReferenceAudio } from './src/lib/utils/dubbing-tts.ts';

test('applyPreparedReferenceAudio stores backend truth separately from preview url', () => {
  const state = createInitialDubbingState();
  const next = applyPreparedReferenceAudio(state, {
    referenceId: 'ref-1',
    filePath: 'E:/app/ref/ref-1.wav',
    displayName: '旁白女声.wav',
  }, 'blob:preview');

  assert.equal(next.referenceAudioPath, 'E:/app/ref/ref-1.wav');
  assert.equal(next.voiceAudioUrl, 'blob:preview');
});
```

- [ ] **Step 2: 运行测试确认它先失败**

Run: `node --test frontend/dubbing-tts.test.ts`
Expected: FAIL

- [ ] **Step 3: 重构 store**

必加字段：

- `referenceAudioId`
- `referenceAudioPath`
- `generatedAudioPath`
- `engineStatuses`
- `lastGenerationError`

保留为展示态：

- `voiceAudioUrl`
- `progress`
- `progressMessage`
- `isPlaying`
- `playerWaveformOpen`

- [ ] **Step 4: 回跑测试与类型检查**

Run: `node --test frontend/dubbing-tts.test.ts`
Expected: PASS

Run: `npm.cmd run check`
Expected: PASS

- [ ] **Step 5: 提交这一小步**

```bash
git add frontend/src/lib/stores/dubbing.svelte.ts frontend/src/lib/types/dubbing.ts frontend/src/lib/utils/dubbing-tts.ts frontend/dubbing-tts.test.ts
git commit -m "refactor: split dubbing store business and view state"
```

### Task 7: 用真实命令替换假生成，并接通参考音频上传

**Files:**
- Modify: `frontend/src/routes/dubbing/+page.svelte`
- Modify: `frontend/src/lib/components/dubbing/AudioUploader.svelte`
- Modify: `frontend/src/lib/components/dubbing/TabReferenceAudio.svelte`
- Modify: `frontend/src/lib/components/dubbing/EngineSelector.svelte`
- Modify: `frontend/src/lib/components/dubbing/LeftBottomBar.svelte`
- Modify: `frontend/src/lib/components/dubbing/PlayerBar.svelte`
- Modify: `frontend/src/lib/components/dubbing/AudioPlayer.svelte`
- Modify: `frontend/src/lib/stores/dubbing.svelte.ts`
- Modify: `frontend/src/lib/utils/dubbing-tts.ts`

- [ ] **Step 1: 先写一个会失败的交互映射测试**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeGenerateResult } from './src/lib/utils/dubbing-tts.ts';

test('normalizeGenerateResult keeps ui honest when provider is not configured', () => {
  const result = normalizeGenerateResult({
    ok: false,
    error: { code: 'not_configured', message: '当前未配置可用的 v1.5 引擎' },
  });

  assert.equal(result.generatedAudioPath, null);
  assert.match(result.toastMessage, /未配置/);
});
```

- [ ] **Step 2: 运行测试确认它先失败**

Run: `node --test frontend/dubbing-tts.test.ts`
Expected: FAIL

- [ ] **Step 3: 改 UI 交互**

实现要点：

- 页面初始化调用 `tts_probe`
- 上传参考音频后调用 `tts_prepare_reference_audio`
- 点击生成时调用 `tts_generate`
- `tts_generate` 若返回 `not_configured`，只显示真实错误，不写假成功、不填假音频路径
- 只有真实 `generatedAudioPath` 存在时才允许播放/打开输出

示例：

```ts
const probe = await probeTts();
dubbing.engineStatuses = normalizeProbeResponse(probe);

const prepared = await prepareReferenceAudio(file);
dubbing.referenceAudioId = prepared.referenceId;
dubbing.referenceAudioPath = prepared.filePath;
dubbing.voiceAudioUrl = URL.createObjectURL(file);

const response = await generateDubbing(buildGenerateRequest(dubbing));
if (!response.ok) {
  toast.warning(response.error.message);
  dubbing.generatedAudioPath = null;
  return;
}
```

- [ ] **Step 4: 回跑测试与静态检查**

Run: `node --test frontend/dubbing-tts.test.ts`
Expected: PASS

Run: `npm.cmd run check`
Expected: PASS

- [ ] **Step 5: 提交这一小步**

```bash
git add frontend/src/routes/dubbing/+page.svelte frontend/src/lib/components/dubbing/AudioUploader.svelte frontend/src/lib/components/dubbing/TabReferenceAudio.svelte frontend/src/lib/components/dubbing/EngineSelector.svelte frontend/src/lib/components/dubbing/LeftBottomBar.svelte frontend/src/lib/components/dubbing/PlayerBar.svelte frontend/src/lib/components/dubbing/AudioPlayer.svelte frontend/src/lib/stores/dubbing.svelte.ts frontend/src/lib/utils/dubbing-tts.ts frontend/dubbing-tts.test.ts
git commit -m "feat: connect dubbing page to tauri tts commands"
```

## Chunk 4: 文档纠偏与最终验收

### Task 8: 清理文档中的仓内路径依赖方案

**Files:**
- Modify: `docs/IndexTTS15集成开发方案.md`

- [ ] **Step 1: 先写一个会失败的 grep 验收**

Run: `rg -n "sys\\.path\\.insert|indextts_path" docs/IndexTTS15集成开发方案.md`
Expected: FAIL，能搜到旧方案残留。

- [ ] **Step 2: 用 `apply_patch` 改文档**

改动要求：

- 全部改为中文正常表述。
- 明确写出“仓内 `IndexTTS/` 仅作技术参考，不参与运行时”。
- 删除任何把仓内路径加入 import path 的例子。

替换目标示例：

```md
运行时 provider 必须来自仓外环境，例如已安装的 Python 包、外部 CLI 或独立服务。
严禁通过 `sys.path.insert(...)` 或相对路径把仓内 `IndexTTS/` 目录接入生产链路。
```

- [ ] **Step 3: 回跑 grep 验收**

Run: `rg -n "sys\\.path\\.insert|indextts_path" docs/IndexTTS15集成开发方案.md`
Expected: PASS，无输出

- [ ] **Step 4: 提交这一小步**

```bash
git add docs/IndexTTS15集成开发方案.md
git commit -m "docs: remove local indextts runtime path guidance"
```

### Task 9: 执行最终验证并准备进入实现执行

**Files:**
- Test: `frontend/dubbing-copy.test.ts`
- Test: `frontend/dubbing-tts.test.ts`
- Test: `frontend/src-tauri/src/services/tts/provider.rs`
- Test: `frontend/src-tauri/src/services/tts/reference_audio.rs`
- Test: `frontend/src-tauri/src/commands/tts.rs`

- [ ] **Step 1: 跑前端 Node 测试**

Run: `node --test frontend/open-external-url.test.ts frontend/settings-core.test.ts frontend/dubbing-copy.test.ts frontend/dubbing-tts.test.ts`
Expected: PASS

- [ ] **Step 2: 跑前端类型检查**

Run: `npm.cmd run check`
Expected: PASS，`svelte-check found 0 errors and 0 warnings`

- [ ] **Step 3: 跑 Rust 单测**

Run: `cargo test --manifest-path frontend/src-tauri/Cargo.toml`
Expected: PASS

- [ ] **Step 4: 跑 Rust 编译检查**

Run: `cargo check --manifest-path frontend/src-tauri/Cargo.toml`
Expected: PASS

- [ ] **Step 5: 验证无仓内运行期依赖**

Run: `rg -n "IndexTTS/" frontend/src frontend/src-tauri/src`
Expected: PASS，无输出

Run: `rg -n "sys\\.path\\.insert|indextts_path" frontend/src frontend/src-tauri/src`
Expected: PASS，无输出

- [ ] **Step 6: 提交最终验收点**

```bash
git add frontend docs
git commit -m "feat: make dubbing page integration-ready for external v15 provider"
```

## 交接说明

- 若执行中发现终端中文显示异常，不直接重写源码；先用 UTF-8 方式读取文件并在浏览器/UI 中确认实际渲染，再决定是否修复。
- 若某一步需要新增真实 provider 接入能力，仍必须保持 provider 位于仓外；此计划不授权把仓内 `IndexTTS/` 目录接入运行时。
- 若 harness 不支持 subagent，则按 `superpowers:executing-plans` 分批执行，每完成一个 Chunk 停一次做人工复核。

Plan complete and saved to `docs/superpowers/plans/2026-04-16-dubbing-v15-decoupled-integration-plan.md`. Ready to execute?
