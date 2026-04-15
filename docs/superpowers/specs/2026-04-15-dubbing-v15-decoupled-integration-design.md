# 配音页与 IndexTTS v1.5 解耦集成设计

## 1. 背景

当前项目的配音页已经具备较完整的 UI 结构，但配音生成链路仍停留在演示态：

- 前端生成流程使用定时器模拟进度，并未真实调用 Tauri 后端。
- 引擎可用状态由前端硬编码，不能反映真实运行环境。
- 参考音频仅保存在浏览器内存的 blob URL 中，不能作为真实推理输入。
- Rust 侧仅存在 `tts_health()` 与 `NoopTtsProvider`，尚未建立可扩展的 TTS 契约。

同时，本项目有一条明确约束：

- `IndexTTS/`、`IndexTTS/v15`、`IndexTTS/v20` 仅可作为技术参考阅读。
- 开发中禁止实际调用这些目录及目录下文件。
- 未来项目完成后，该目录将被删除，系统设计必须在目录删除后仍可运行。

本设计的目标，是先把“配音页 <-> Tauri <-> 外部 TTS provider”的边界设计稳定，再进入实现与后续真实引擎接入。

## 2. 目标与非目标

### 2.1 目标

1. 让配音页从“假生成”切换为“真实命令调用”。
2. 建立与具体引擎实现解耦的 TTS 命令契约与数据结构。
3. 让参考音频从浏览器态转为后端可管理的文件态。
4. 让 UI 中的引擎状态、失败原因、进度反馈与后端真实状态一致。
5. 确保未来删除仓内 `IndexTTS/` 目录后，系统架构不受影响。

### 2.2 非目标

1. 本阶段不要求仓内直接跑通真实 `IndexTTS` 推理。
2. 本阶段不实现 `v20` 接入。
3. 本阶段不做录音、字幕导出、Word 导入等周边功能闭环。
4. 本阶段不引入必须依赖仓内参考目录的任何方案。

## 3. 约束

### 3.1 硬约束

- 禁止在任何运行链路中引用仓内 `IndexTTS/` 路径。
- 禁止通过 `sys.path.insert(...)`、相对路径 import、子进程工作目录等方式偷接仓内参考代码。
- 前端不得再以 toast 或假进度营造“生成成功”的误导性体验。
- 若引擎未配置，UI 必须明确显示“未配置 / 不可用 / 启动失败”的真实状态。

### 3.2 工程约束

- 需遵循现有 Tauri + Svelte 架构。
- 优先最小诚实切片，先立契约，再落真实引擎。
- 后续真实 provider 可以是外部 Python 环境、CLI 或服务，但都必须位于仓外。

## 4. 方案比较

### 方案 A：外部 provider 适配层

Tauri 只暴露统一命令，Rust 服务层只依赖抽象 provider，真实 `IndexTTS v1.5` 由仓外 provider 承接。

优点：

- 完全符合“参考目录不可运行依赖”的要求。
- 后续可替换为本地 CLI、Python 环境或独立服务，不伤 UI 与命令层。
- 删除仓内 `IndexTTS/` 后，系统仍成立。

缺点：

- 第一阶段只能先做到“可探测、可报错、可接入”，不一定立刻真实出音。

### 方案 B：Rust 内嵌 Python 进程桥

Tauri 直接拉起 Python 进程，通过 stdin/stdout 与之通信。

优点：

- 命令链路短，桌面端控制力强。

缺点：

- 容易在实现细节中误连仓内参考目录。
- Python 环境发现、依赖隔离、生命周期管理更复杂。
- 与“先解耦再落实现”的阶段目标不完全一致。

### 方案 C：独立 HTTP TTS 服务

桌面端仅请求本地或远端 HTTP 服务。

优点：

- 架构边界最清晰。
- 最利于后期多客户端复用。

缺点：

- 对当前桌面项目而言跨度偏大。
- 会引入更多部署与运维问题，不适合作为眼下第一阶段。

### 结论

采用方案 A。  
它最符合当前约束，也最能减少返工。

## 5. 总体设计

### 5.1 架构边界

系统拆分为四层：

1. 配音页 UI 层  
负责用户输入、按钮状态、错误提示、进度显示、音频预览。

2. 前端 store / action 层  
负责把页面动作转换为结构化请求，并同步后端返回状态。

3. Tauri command / service 层  
负责参数校验、文件管理、provider 调度、错误映射、事件转发。

4. 外部 TTS provider 层  
真实推理能力所在。可由将来安装在仓外的运行环境提供，但不属于当前仓库的一部分。

### 5.2 关键原则

- UI 不感知具体引擎实现。
- Store 不保存只对浏览器有效的 blob URL 作为业务真相源。
- Tauri 只对前端暴露稳定契约，不暴露 provider 细节。
- provider 配置必须指向仓外资源。

## 6. 前后端契约设计

### 6.1 命令一览

首期定义以下命令：

1. `tts_probe() -> TtsProbeResponse`  
返回引擎可用性、支持能力、失败原因。

2. `tts_prepare_reference_audio(input) -> PreparedReferenceAudio`  
接收前端上传的文件内容或临时文件信息，将其保存到应用可管理目录，并返回标准化路径与元数据。

3. `tts_generate(request) -> TtsGenerateResponse`  
发起一次配音生成；若 provider 未配置，则返回结构化错误，不允许伪成功。

4. `tts_cancel(task_id) -> TtsCancelResponse`  
为后续长任务取消预留接口。

5. `tts_open_output(target) -> ()`  
用于打开输出文件或输出目录，替代当前“下载按钮只有提示”的演示态行为。

### 6.2 事件

保留事件通道用于长任务进度，例如：

- `tts://progress`
- `tts://state`

首期即使真实 provider 未接入，也允许不产生进度事件；但事件名与数据结构应先稳定。

### 6.3 数据结构

#### TtsProbeResponse

- `providers`: provider 状态列表
- `defaultProvider`: 默认 provider 标识
- `availableModes`: 前端可显示的模式
- `issues`: 环境问题列表

#### PreparedReferenceAudio

- `referenceId`: 后端生成的稳定标识
- `filePath`: 后端受管文件路径
- `displayName`: 用于 UI 展示
- `durationMs`: 可选
- `sampleRate`: 可选

#### TtsGenerateRequest

- `provider`
- `engineMode`
- `text`
- `referenceAudioPath`
- `params`
  - `intervalSilence`
  - `maxTextTokens`
  - `bucketMaxSize`
  - `temperature`
  - `topP`
  - `topK`
  - `emoAlpha`
  - `emotionMethod`
  - `emotionVector`
  - `emotionText`

#### TtsGenerateResponse

- `taskId`
- `status`
- `outputAudioPath`
- `durationMs`
- `message`

#### AppError 映射

统一映射为以下前端可识别类别：

- `not_configured`
- `provider_unavailable`
- `invalid_reference_audio`
- `invalid_text`
- `generation_failed`
- `cancelled`
- `internal_error`

## 7. 配音页行为调整

### 7.1 生成按钮

当前问题：

- 点击后直接走前端假进度。
- 结束后弹出“成功”提示，但并无真实产物。

目标行为：

1. 先校验文本与参考音频是否满足要求。
2. 调用 `tts_generate`。
3. 若后端返回未配置或失败，则展示真实错误。
4. 仅在拿到真实 `outputAudioPath` 时才进入可播放态。

### 7.2 引擎模式

当前问题：

- `engineAvailable` 由前端默认值写死。

目标行为：

1. 页面初始化时调用 `tts_probe`。
2. 根据后端返回状态决定模式是否可选。
3. 对不可用模式显示原因，而不是只 toast 一句再允许继续切换。

### 7.3 参考音频

当前问题：

- 上传后仅生成 object URL。
- Store 仅保存 `voiceAudioUrl`，无法参与真实推理。

目标行为：

1. 上传文件后立刻交给 `tts_prepare_reference_audio`。
2. Store 保存后端返回的 `referenceAudioPath/referenceId`。
3. 预览播放器可以继续使用 object URL 或转换后的受管文件 URL，但其角色仅是展示层。
4. 删除参考音频时，需要同时清理 store 中的后端句柄。

### 7.4 下载 / 打开输出

当前问题：

- 只有 toast 提示，没有真实动作。

目标行为：

- 当 `generatedAudioPath` 存在时，触发 `tts_open_output` 或导出动作。

## 8. Store 设计调整

建议把当前配音 store 中与“展示层 URL”强绑定的字段拆分为两类：

### 8.1 业务真相字段

- `referenceAudioId`
- `referenceAudioPath`
- `generatedAudioPath`
- `engineStatuses`
- `lastGenerationError`

### 8.2 展示态字段

- `voiceAudioUrl`
- `playerWaveformOpen`
- `isPlaying`
- `progress`
- `progressMessage`

原则：

- 业务流程只依赖业务真相字段。
- 展示态字段可丢失、可重建，不可作为后端调用依据。

## 9. 后端服务设计

### 9.1 Provider 抽象

Rust 侧保留统一 trait，但从“空实现占位”推进到“可探测、可报错、可调度”的抽象层：

- `probe()`
- `prepare_reference_audio()`
- `generate()`
- `cancel()`

### 9.2 Provider 配置

provider 配置必须显式指向仓外资源，例如：

- 已安装的 Python 包环境
- 外部 CLI 路径
- 外部服务地址

禁止以下做法：

- 从 `IndexTTS/` 目录拼路径
- 把仓内参考目录加入 import path
- 直接以仓内参考脚本作为子进程入口

### 9.3 文件管理

Tauri 负责：

1. 将参考音频落地到应用受管目录。
2. 为生成结果分配标准输出目录。
3. 对路径进行存在性、扩展名、可读性校验。
4. 对前端隐藏内部临时细节，只暴露必要路径与状态。

## 10. 错误处理

错误处理要求“前端可理解，后端可定位”：

1. 对用户：显示简洁、真实、可操作的提示。
2. 对日志：保留 provider、路径、参数校验等详细上下文。
3. 对状态：失败后必须停止进度动画并恢复按钮状态。

示例：

- 未配置 provider：显示“当前未配置可用的 v1.5 引擎”
- 参考音频无效：显示“参考音频无法解析，请重新上传 WAV/MP3/FLAC”
- 文本为空：前端阻断，不发命令

## 11. 测试与验收

### 11.1 前端验收

1. 打开配音页时，模式状态来自后端探测结果。
2. 未配置引擎时，点击生成得到真实失败提示，不出现伪成功。
3. 上传参考音频后，store 中出现后端受管路径，而不只是 blob URL。
4. 生成成功时，播放器仅在真实输出路径存在时可用。

### 11.2 后端验收

1. `tts_probe` 可在未配置 provider 时稳定返回结构化状态。
2. `tts_prepare_reference_audio` 能将输入音频保存到受管目录。
3. `tts_generate` 在 provider 不可用时返回明确错误分类。

### 11.3 架构验收

删除仓内 `IndexTTS/` 目录后：

1. 项目仍可编译。
2. 配音页仍可打开并正确显示“未配置”状态。
3. 代码中不存在指向 `IndexTTS/` 的运行期依赖。

## 12. 分阶段落地

### Phase 1：诚实接缝

- 去掉前端假生成
- 建立 Tauri 命令契约
- 接通参考音频受管路径
- 接通引擎探测状态

### Phase 2：provider 接口落地

- 在仓外接入真实 v1.5 provider
- 把 `tts_generate` 接到真实 provider
- 打通真实进度与输出文件

### Phase 3：周边功能闭环

- 录音输入
- 字幕导出
- 批量生成
- 更细粒度任务管理

## 13. 风险与对策

### 风险 1：实现时偷连仓内参考目录

对策：

- 在设计与代码审查中明确列为禁项。
- 验收时执行路径搜索，确保不存在运行期引用。

### 风险 2：前端展示与后端状态再次分叉

对策：

- 一切模式状态以 `tts_probe` 为准。
- 一切生成结果以 `tts_generate` 返回为准。

### 风险 3：参考音频仍被当作 UI 资源而非业务资源

对策：

- store 拆分“业务真相字段”和“展示态字段”。
- 后端路径成为唯一有效推理输入。

## 14. 结论

本设计选择“外部 provider 适配层”路线，先把配音页与 `IndexTTS v1.5` 的集成边界做实，再逐步接真实引擎。  
其核心不是立刻在仓内跑出音频，而是先保证：

- 不依赖仓内 `IndexTTS/`
- 不再向用户伪造成功
- 不再让 blob URL 充当真实输入
- 不再让前端硬编码引擎状态

在此基础上，后续不论接本地 CLI、独立 Python 环境，还是独立服务，都能平稳落子。
