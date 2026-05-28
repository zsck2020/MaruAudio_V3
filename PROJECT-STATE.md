# 丸子配音 V3 · AI 工作状态实时快照

> **接力 SOP**：任何 AI 会话在丸子仓里干活前，**必须**先读 `AGENTS.md` + 本文件 + `README.md`。
> 本文件**每次重要动作后由当前主 agent 立即更新**。详见 `AGENTS.md` §3。

## 更新约定

- 字段值过时 / 任务转状态 → **立即重写本文件**
- "重要动作"定义：见 `AGENTS.md` §3 Step 3
- 不要等"批量"才更新；每一个 commit-worthy 改动都立即更新
- 用户口头改需求 → 立即把新需求记到"当前用户指令"

## 当前用户指令（最新）

- **2026-05-16 09:35** 猫总要求：「看一下当前项目开发到什么进度了」→ 主 agent 出全景报告
- **2026-05-16 10:01** 猫总要求继续推进 → 主 agent 启动 dev server 验证现状
- **2026-05-16 10:08** 猫总要求执行 C + D → 主 agent 先做 D（拆 commit）后做 C（页面切 ui/）
- **2026-05-16 10:15** D 完成（9 个 commit 全部落盘） → 进入 C 阶段
- **2026-05-16 10:28** 对话中断→恢复到 sessionId 180017-c903de69 · 主 agent 按 SOP 接力，确认 C 阶段未推进、dev server 仍在跑
- **2026-05-16 10:33** 猫总要求「重启小蜜的开发版且不影响丸子」→ 主 agent 处理（小蜜运行在端口 1422 · 与丸子 1420 物理隔离），首次启动遇孤儿 python gateway PID 16312 锁住 runtime/python/DLLs/_asyncio.pyd · 杀进程后二次启动成功，小蜜 xiaomi-assistant.exe PID 13644 已运行 · 丸子 maruaudio_v3.exe PID 21080 不受影响
- **2026-05-16 10:35** 猫总澄清「我说的是重启」→ 主 agent 用 taskkill /F /T 整树杀掉小蜜全部进程（21 个，含 cargo/rustc/gateway/桌面端/vite/tauri-cli）后再次启动，小蜜新 PID xiaomi-assistant.exe 11784 + python gateway 23740 · 丸子 21080 仍在原位
- **2026-05-16 11:59** 对话中断再次恢复（同 sessionId 180017-c903de69）· 接力时核对：丸子 maruaudio_v3.exe 与小蜜 xiaomi-assistant.exe 都已退出，仅小蜜 python gateway PID 23740 残留（孤儿，下次启动小蜜会触发 process_manager 自动清 lock 但需先杀它避免文件锁）
- **2026-05-16 12:22** 对话再次中断后恢复（仍同 sessionId 180017-c903de69）· 接力时核对：丸子 maruaudio_v3.exe 已重启到 PID 1396（推测猫总人工重启过 dev）· 小蜜 xiaomi-assistant.exe PID 18236 + python gateway PID 14328 也已重启 · 后台 task 文件 619904/13980 已被 Cursor 清理（IDE 重启过）· C 阶段仍未推进
- **2026-05-16 12:30** 猫总指令「C」→ 主 agent 执行待办#3「前端 lib/subtitle/mock-provider 替换为 Tauri invoke 桥到 backend/services/subtitle/」· 落盘：Rust 端 services/subtitle/mod.rs（SSE 流式 + 取消令牌）+ commands/subtitle.rs（3 个命令：transcribe_stream/cancel/read_output）+ services/mod.rs · commands/mod.rs · lib.rs 注册；前端 lib/subtitle/tauri-provider.ts（实现 SubtitleProvider，translate/optimize 暂透 mock）+ index.ts 改为按 env.isTauri 自动选 provider · svelte-check 0/0 · cargo check 成功（仅 2 个旧 dead_code 警告）· Tauri 自动检到 Rust 变更已重启 maruaudio_v3.exe 到 PID 388
- **2026-05-16 12:42** 猫总改云端方向：「取消阿里云对接，改为仙宫云上自部署的 IndexTTS 2.0 镜像 + API 服务」→ 主 agent 重写 cloud_engine.py（移除全部 dashscope/qwen 字样 · 改为通过 `XIANGONG_TTS_BASE` + 可选 `XIANGONG_TTS_TOKEN` 转发到远程 IndexTTS 2.0 实例 · 复用本地 SSE 协议 · 同款 server 镜像保证零适配成本）· 同步改 engine_manager.check_cloud（用 httpx GET /health 检查可用性）· 改 AGENTS.md 术语表第 17/64 行、PROJECT-STATE.md 第 43 行、backend/README.md 第 8 行、docs/MaruAudio_V3项目开发方案.md 5 处、docs/配音页面UI功能设计方案.md 2 处 · 用户可见面零残留阿里云/百炼/dashscope/Qwen3 字样（IndexTTS 内部用 Qwen3 做情感文本分析的 README 不动，那是引擎技术真相）
- **2026-05-16 12:48** 拆 2 个 commit 提交完成：`c52d333 feat(subtitle): 前端字幕模块切到 Tauri 桥接真实必剪 ASR`（7 文件 +444/-1）+ `57e185f refactor(cloud): 云端从阿里云百炼改为仙宫云上的 IndexTTS 2.0 远程实例`（7 文件 +280/-253）· git status 干净 · 总 commit 数 11
- **2026-05-16 12:50** 猫总要求「新开一个 PChat 对话并继承 180017-c903de69 的上下文」→ 主 agent 在 PROJECT-STATE.md 把旧 sessionId 标退役、新 sessionId 占位 pending · 接力 SOP 把 PROJECT-STATE.md 作为跨 session 的上下文锚点 · 准备调 sessionId="NEW" 让服务端分配新 ID
- **2026-05-16 12:51** 服务端分配新 sessionId `124734-70193510` · 主 agent 立刻回写 PROJECT-STATE.md 与 AGENTS.md · 接力链：`180017-c903de69` → `124734-70193510` · 猫总指令「继续」→ 按上轮推荐 B 推进：字幕页 UI 接入 defaultSubtitleProvider
- **2026-05-16 13:02** 字幕页接入桥接完成（最少代码方案）：发现字幕页 copywriting/+page.svelte 早就调用 lib/api/tts.ts::transcribe，但该函数走 fetch 直连 9880 端口，生产 CSP 会拦。改为在 transcribe 内部按 isTauri() 自动分流：桌面端 → invoke('subtitle_transcribe_stream') + listen 三个 subtitle-* 事件包装回 SseCallbacks 协议；其它环境保留 fetch 回落给 vitest。字幕页**零改动**自动升级。svelte-check 0/0
- **2026-05-18 20:57** 对话恢复到 sessionId `170503-0c2789f3`（猫总指定 · 通过 wanzi-mcp wait_for_user_input 接入）· 主 agent 按 SOP 接力，把新 sessionId 写入 PROJECT-STATE.md 与 AGENTS.md · 同步更新 AGENTS.md §4 的关联 sessionId 字段 · 等待猫总下一步指令
- **2026-05-19 10:30** 完成项目深度审查 v3 · 主魂亲自扫读 ~75 个文件（前端 33 / Rust 21 / Python 16 / 配置依赖等）· 落盘到 `docs/深度审查报告-2026-05-19.md` · 发现【严重】4 项 / 【高】9 项 / 【中】14 项 / 【低】10 项 / 【亮点】10 项 · 最严重 4 项：envs requirements 全空 / models.py engine pattern 不含 cloud 导致云端推理实际跑不通 / lib/subtitle provider 抽象孤儿 / Python 后端 0 自动化测试 · 等待猫总点单修复策略
- **2026-05-19 10:44** 启动丸子桌面端 `maruaudio_v3.exe` PID 18416 · Vite dev 1420 LISTENING · cargo watcher 监听 src-tauri 自动重启 · 2 个已知 dead_code 警告
- **2026-05-19 11:00** 完成前端设计深度审查 · 浏览器实地截屏 10 个业务页面（首页/配音/角色/对轴/字幕/音库/文件/设置/关于/个人中心）+ 扫读 app.css 设计令牌 307 行 · 落盘到 `docs/前端设计审查报告-2026-05-19.md` · 整体评分 ⭐⭐⭐⭐⭐ 商业产品级 · 亮点 5 项（设计令牌完整 / UI 原子库工程规范 / 对轴+文件+音库商业级 UI / 配音业务深度 / 微交互细节）· 短板 4 高（首启动引导缺 / 死按钮泛滥 / mock 未标 / DEV banner 遮挡）+ 5 中 + 4 低 · 推荐 11 小时打磨即可上架
- **2026-05-19 11:24** 猫总要求"窗口在不同屏幕自适应 + 禁止边缘拖动 resize" → 主 agent 落盘 2 处改动：① `frontend/src-tauri/tauri.conf.json` 的 windows[0].resizable 由 true 改为 false（禁止边缘 resize · 仅保留最大化/还原 toggle）· ② `frontend/src-tauri/src/lib.rs` setup() 闭包开头加智能开窗逻辑（取主屏逻辑尺寸 75%×80%、夹紧到 [1024×700, 1920×1200] 之间、再次居中）· cargo check 通过仅原有 2 dead_code warning · Tauri watcher 自动重启桌面到新 PID 59768
- **2026-05-20 01:37** 接力恢复 sessionId 170503-0c2789f3 · 核对上轮审查报告待修项 → 发现 3 项已被前序会话修好（models.py cloud pattern / SSE Error break / ParamAccordion 默认值）· 主魂一口气落盘剩余 4 项修复：① `tts.ts::transcribeViaInvoke` 透传 segmentCurrent/segmentTotal 字段到 StreamProgressEvent ② `services/tts/mod.rs` 给 current_task_id 字段与方法加 `#[allow(dead_code)]` 消除 2 个 Rust warning ③ 删除 6 个孤儿文件（lib/subtitle/{mock-provider,tauri-provider,index}.ts + mock-provider.test.ts + components/dubbing/{ParamTabs,TabReferenceAudio}.svelte）④ 修 srt.test.ts 改为直接 import `$lib/subtitle/srt` · 验证结果：svelte-check 0/0 · cargo check 0 错 **0 warning** · vitest 4 文件 57 测试全过 · npm audit 仅剩 3 low（cookie 依赖需 breaking 降级 · 不值得）
- **2026-05-20 01:44** 猫总要求"重启桌面端 + 音频播放器+波形重新设计" → 新建 2 文件 + 改造 2 组件：① 新 `lib/utils/waveform.ts`（Web Audio API 解码 + RMS 块采样 + 内存缓存）② 新 `lib/components/ui/WaveformView.svelte`（Canvas 绘制条形波形 + 已播/未播双色 + 播放指针 + 点击/拖拽 seek + 加载 skeleton + ResizeObserver 自适应宽度 + DPR 高清）③ 改造 `PlayerBar.svelte` 中间区域：原 seek slider 替换为 WaveformView（36px 高 · 保留生成中进度条 + 时间标签 · 清除旧 CSS）④ 改造 `AudioPlayer.svelte` 进度区域：原 seek-input + seek-track 替换为 WaveformView（32px 高 · 清除 6 块废弃 CSS）· 验证：svelte-check 0/0 · vitest 4/57 全过 · 桌面端重启 PID 变更
- **2026-05-20 10:19** 猫总指令「完成未完成的工作」→ 主 agent 一口气落盘 4 个 commit：① `22fd4b6 feat(ui): 波形可视化组件 + 播放器重制`（4 文件 +361/-106）② `9ac7cba refactor: 清理孤儿文件 + Rust warning 消除 + 测试修复`（9 文件 -705）③ `e0e020d feat(pages): 全页面 ui/ 组件迁移 + 导出命令 + 角色 store`（18 文件 +2297/-888）④ `c509aeb feat(backend): 字幕翻译/优化接口 + 修复 FastAPI body 解析 bug`（6 文件 +330/-33）· 具体：6 个页面切 Button/Switch/Slider 原子组件 · 后端新增 /subtitle/translate + /subtitle/optimize-timing · 修复 `from __future__ import annotations` 导致 FastAPI 内部 Pydantic Model 被当 query 参数的 422 bug（同时修好了原有 /llm-models /split-lines）· 后端全链路 API 验证通过 · svelte-check 0/0
- **2026-05-20 11:30** 猫总指令「全面优化」→ 完成竞品分析（Unitale + SonicVale）+ IndexTTS 1.5/2.0 引擎能力审计 + 两批优化共 11 项：
  - **第一批（核心缺口）**：① 台词情绪驱动合成（emotion→emotion_text 映射）② 台词行级编辑（角色/情绪/强度下拉）③ 添加/删除台词按钮 ④ 删除角色后 auto-save ⑤ 配音页取消生成按钮 ⑥ 云端音频 base64 编码传输修复
  - **第二批（性能与体验）**：⑦ 加速开关五件套（FP16/CUDA_KERNEL/DEEPSPEED/ACCEL/TORCH_COMPILE env 控制）⑧ 角色从音库选预置音色 ⑨ 批量失败重试按钮 ⑩ SSE 段级进度+duration+RTF 填充 ⑪ 分页从 6 改 15 + 省略式页码
  - **第三批（产品力增强）**：⑫ max_mel_tokens v2.0 自适应 1500 ⑬ cloud health 实际 HTTP ping ⑭ 随机情感向量按钮 ⑮ 自定义 LLM 拆分 Prompt 模板 ⑯ 术语词汇表 glossary CRUD API
  - svelte-check 0/0 · 改动文件：`project/+page.svelte`、`roles.svelte.ts`、`LeftBottomBar.svelte`、`cloud_engine.py`、`models.py`、`server.py`、`engine_manager.py`、`inference.py`、`tts.ts`
- **2026-05-26 12:30** Sprint 1 五项必修落子完成（commit pending）：
  - **S1** CSP 加 `http://127.0.0.1:9880` + `asset:` + `http://asset.localhost` → 6 处 fetch 直连不再被生产 CSP 拦截
  - **S2** `subtitle_read_output` 加路径白名单（扩展名校验 + 拒绝 `..` + canonicalize + 必须落在 `output/subtitle/` + 32MB 大小上限 + **3 个 cargo test**）
  - **S3** LLM API Key 切到加密 store：新建 `commands/llm.rs` 三命令 + `Storage::save/get/clear_llm_api_key`（复用 AES-256-GCM + 同 keyring 密钥）+ 前端 settings store 加自动迁移逻辑（旧版残留明文一次性搬入加密 store 后从 settings.json 删除）
  - **H1** `capabilities/default.json` 加 `fs:scope`：allow 白名单 `$APPDATA/$RESOURCE/$DESKTOP/$DOCUMENT/$DOWNLOAD/$HOME/Music...` + 常见媒体扩展名 + `MaruAudio*/**`；deny `$HOME/.ssh/.aws/.gnupg/.config/.docker/.kube/.npmrc/.pypirc`
  - **H6** `dubbing/+page.svelte` + `project/+page.svelte` 的 `max_mel_tokens` 改为按 engine 动态：v1.5 用 600、v2.0/cloud 用 1500（与 inference.py 自适应逻辑一致）
  - 验证：svelte-check 0/0 · cargo check 0 err · vitest 57/57 · cargo test **35/35**（新增 3 个）
- **2026-05-26 11:30** 接力恢复 sessionId `135721-e014239b` · 猫总令「全量提交一次 git」→ 主 agent 把跨多日累积的 29 文件 +1275/-418 行未提交改动统一打包：
  - **新增**：①`lib/components/ui/MiniPlayer.svelte` 通用音频迷你播放器（带波形+seek+时间）② `.cursor/rules/component-spec.mdc` UI 组件规范文档（AI 强制遵守）
  - **后端 5 文件**：server / models / inference / engine_manager / cloud_engine — 第三批产品力优化、422 修复、加速开关、max_mel_tokens、cloud HTTP ping、glossary CRUD、自定义 prompt
  - **前端框架级 4 组件**：Modal/Slider 设计微调，MenuItem/Sidebar 体验优化
  - **配音区 4 组件**：AudioUploader（录音占位）/ LeftBottomBar（取消按钮）/ TextEditor / TextToolbar
  - **9 个页面**：+layout / +page（首页）/ dubbing / project（角色，含 440 行大改）/ setting / copywriting / cover / resource / video
  - **store / API / 样式**：roles.svelte.ts / tts.ts / app.css 配套调整
  - **依赖**：package.json 新增 pinyin-pro
  - 验证：svelte-check 0/0 · 安全扫描无密钥泄露
- **2026-05-27 20:27** 接力恢复 sessionId `135721-e014239b` · 猫总先令「结合市场需求更新 docs/付费方案.md」→ 已重写为免费版 + ¥198 永久旗舰 + 创作者年卡 + 团队版 + 云端字符包的完整商业方案，并清理对外底层技术名；随后猫总令「根据付费方案全面优化前端权限标识和相关界面」→ 新增 `membership.svelte.ts`、`PermissionBadge.svelte`、`UpgradeModal.svelte`，并改造首页/标题栏/个人中心/配音页/多角色页/字幕页/设置页/关于页/音库等权限展示与锁定态；验证：`npm run check` 0 error 0 warning，用户面敏感底层词扫描通过
- **2026-05-27 21:05** 猫总令「对整个项目前端进行深度审查，找到优化点」→ 已完成代码级深度审查并落盘 `docs/前端深度审查报告-2026-05-27.md`；核心结论：前端商业产品雏形已成，下一阶段重点不是继续堆页面，而是修权限/额度/云端字符单一可信数据源、快捷键绕过付费引擎、多角色行级编辑绕过、云端余额双状态、图标全量打包等问题；验证：`npm run check` 0/0，`npm run build` 成功但有 chunk size warning（Icon.js 约 729KB）
- **2026-05-27 21:18** 猫总令「进行全面优化」→ 已先落地审查报告中的 Sprint A：①新增 `lib/utils/entitlements.ts` 统一 `requireFeature/requestEngineChange/requireGeneratePermission` ②`membership.svelte.ts` 增加 Tauri store 持久化、每日额度自动重置、云端余额/本地生成校验 ③修 `Ctrl+Shift+E` 快捷键绕过付费引擎 ④修配音页生成前统一权限/额度校验 ⑤修多角色页行级角色/情绪/强度/文本编辑禁用与升级入口，批量生成/拼接导出加权益校验 ⑥设置页云端余额改为会员状态单源派生；验证：`npm run check` 0/0，`npm run build` 成功（仍有既有 chunk size warning）
- **2026-05-27 21:34** 猫总补充全页面设计硬规范：卡片隔离、四周 15px、卡片间距 10px、页面 flex column + 主区 flex:1、单屏无页面滚动、控件高度统一 → 已同步 `.cursor/rules/page-design.mdc` v3；全局 `app.css` 增加页面控件默认高度；各业务页面外边距从 `clamp(8px,1.2vw,15px)` 统一到 `15px`；清理 routes 页面级 `overflow-y:auto`（Modal 法务文本等局部滚动也先禁掉，后续超长内容应分页/弹窗内分段）；验证：`npm run check` 0/0，`npm run build` 成功（仍有既有 chunk size warning）
- **2026-05-27 21:45** 猫总反馈「音库页加载非常慢，且非常卡顿」→ 已优化 `resource/+page.svelte`：①首屏只渲染当前页 8 个样音，避免一次性渲染全部预置音色和数万根波形柱 ②搜索与真实分页接入 `filteredVoices/pagedVoices` ③预置样音加载改为 `onMount` 单次执行，首屏加载与人声分离能力检测解耦，后者延后异步执行 ④卡片波形柱从 22 降到 10，空波形从 28 降到 18 ⑤增加 skeleton 与空状态；验证：`npm run check` 0/0，`npm run build` 成功（仍有既有 Icon chunk warning）
- **2026-05-27 21:58** 猫总要求参考 `E:\Exploitation\MaruAudio\MaruAudio_V2` 样音库页面设计或直接搬运 → 已读取 V2 `frontend/pages/sample_library_page.py` 与 `components/voice_card.py`，将 V3 音库页从卡片网格重构为 V2 风格列表：顶部筛选工具栏（搜索/性别/语言/排序/上传/批量）、批量工具条、表头 + 10 行分页列表、行内头像/名称/描述/性别/标签/播放/应用/更多、底部状态栏与迷你预览；保留 V3 的 `listPresets/vocalSeparate/dubbing.setVoice` 能力，异步加载与分页继续保留；验证：`npm run check` 0/0，`npm run build` 成功（仍有既有 Icon chunk warning）
- **2026-05-27 22:08** 猫总要求「连样音文件一起搬运」→ 已从 `MaruAudio_V2\outputs\Sample\Presets` 拷贝到 V3 `backend\outputs\preset`：42 个 `.wav` + 39 个 covers + `metadata.json`；同步把 metadata 的 `file_path` 改为文件名、`cover` 改为 `covers/<文件名>`；修 `backend/maruaudio_tts/server.py::list_presets` 让 cover 相对路径正确指向 `preset/covers/`；验证：`npm run check` 0/0，`python -m py_compile backend\maruaudio_tts\server.py` 通过
- **2026-05-27 22:16** 猫总要求「美化音库页面」→ 在 V2 列表结构基础上继续润色 `resource/+page.svelte`：顶部增加「样音库」标题与统计芯片，列表头像优先显示搬运来的 cover 图片、无图则首字母渐变，选中/hover 行增加柔和主色渐变与左侧播放态，底部预览增加封面头像；同时保留 10 条分页与异步加载，避免回到卡顿网格；验证：`npm run check` 0/0，`npm run build` 成功（仍有既有 Icon chunk warning）
- **2026-05-27 22:28** 猫总反馈「样音库页面加载非常缓慢，非常消耗资源」→ 深查后确认主因不是列表 DOM，而是 TTS 后端 :9880 未运行时 `/presets` 和 `/vocal-separate/info` fetch 会阻塞数秒，且 fallback 又会再次尝试 `/output-dir`；已修：①`tts.ts` 增加 `fetchWithTimeout`，`listPresets` 900ms 超时、`vocalSeparateInfo` 900ms 超时 ②`resource/+page.svelte` fallback 不再依赖 `/output-dir`，直接读本地 `backend\outputs\preset\metadata.json`（再退 appData）③继续保留 V2 风格 10 行分页、异步加载、封面懒加载；验证：`npm run check` 0/0，`npm run build` 成功（仍有既有 Icon chunk warning）
- **2026-05-27 22:40** 猫总明确希望「通过重构样音库页面，彻底解决页面打开加载缓慢」→ 已再次重构加载链：音库页首屏完全本地优先，`loadVoices()` 不再先等 `/presets`，而是直接读 `backend\outputs\preset\metadata.json` 并立即渲染；后端 `/presets` 只作为后台刷新，不阻塞页面；搜索字段预先缓存 `searchText`，避免每次过滤拼接大字符串；继续 10 行分页 + 封面 lazy；验证：`npm run check` 0/0，`npm run build` 成功；当前 dev server 1420 LISTENING，`maruaudio_v3.exe` PID 65508
- **2026-05-27 22:50** 猫总要求「当前样音库页面需要进行 UI 美化」→ 在不牺牲性能的前提下继续美化 `resource/+page.svelte`：新增顶部 hero（样音库标题/说明/全部样音/精品/用户导入统计/上传/批量按钮），筛选栏保留为独立卡片并显示筛选数量，列表行增加封面头像阴影、选中/hover 主色渐变、精品徽标辉光、底部预览补充封面与性别/标签/精品 chips；仍保持本地优先加载、10 行分页、封面 lazy；验证：`npm run check` 0/0，`npm run build` 成功（仍有既有 Icon chunk warning）
- **2026-05-27 22:58** 猫总指出「一页显示 6 个样音 + 样音缩略图异常」→ 已改 `resource/+page.svelte`：`PAGE_SIZE` 从 10 改 6；修 cover 路径解析，后端返回相对 cover 时在前端兜底拼到 `backend\outputs\preset\covers\`，本地 metadata fallback 也保持 covers 路径；`mediaSrc` 增强 Windows 盘符路径识别；验证：`npm run check` 0/0，`npm run build` 成功（仍有既有 Icon chunk warning）
- **2026-05-27 23:04** 猫总截图确认缩略图仍异常（坏图标）→ 查 metadata 发现 43 条中 3 条 cover 文件缺失/乱码名不匹配；已给 `resource/+page.svelte` 增加 `coverBroken` 兜底：`img onerror` 后立刻标记该样音封面不可用并改显示首字母渐变头像，底部预览同样兜底，避免出现坏图标；验证：`npm run check` 0/0
- **2026-05-28 01:28** 猫总反馈「打开设置页界面会卡死，无法打开其他页面」→ 定位为 `setting/+page.svelte` 中 `syncCloudAvailability` 被 `$effect` 调用时读取并重写 `dubbing.engineAvailable`，形成自触发响应式循环；已用 `untrack` 读取当前云端状态，并在状态未变化时直接返回，避免打开设置页后持续重渲染；验证：`npm run check` 0/0，dev server HMR 正常
- **2026-05-28 01:44** 猫总要求修复关于页用户协议/隐私政策/服务条款弹窗不能上下滑动，并补充法律文本以降低风险 → 已改 `about/+page.svelte`：法律正文容器从 `overflow:hidden` 改为弹窗内局部 `overflow-y:auto`，高度限制 `min(62vh,560px)`，并完善用户协议（声音授权/深度合成标识/违约赔偿/责任边界）、隐私政策（敏感个人信息、共享委托、用户权利、未成年人、数据保留）、服务条款（计费、退款例外、授权设备、违规处理、责任限制）；验证：`npm run check` 0/0，浏览器实测用户协议弹窗可滚动到底部
- **2026-05-29 01:48** 接力恢复 sessionId `135721-e014239b`（猫总经 wanzi-mcp 指定恢复）· 猫总令「深度审查 → 全部修复」→ 主 agent 全栈扫读后端 6 文件 + 前端权限核心，落出严重2/高4/中5/低2 问题，随即落盘本仓可闭环修复：
  - **H1** 统一 output 路径：`inference.py` 运行时产物根由「项目根/output」改为「backend/output」（与 cache.py 一致、受 .gitignore 忽略），`_OUTPUT_PRESET_DIR` 指向真实样音目录 `backend/outputs/preset`，修好 `/presets` 干净环境返回空
  - **H2** 缓存单例（server 复用 `inference._cache`）+ 同步推理接入缓存 + 指纹补全（max_mel_tokens/num_beams/repetition_penalty/inference_mode/bucket/max_text_tokens + speaker 用 名:大小:mtime）
  - **H3** 云端临时文件按请求隔离（`_decode_base64_audio` 返回 tmp 路径，finally `_safe_unlink`），删全局 `_cloud_tmp_files` 除并发竞态
  - **H4** 后端异常脱敏（/synthesize、stream、cloud、check_cloud 不再外泄 str(e)/路径/栈，详情仅入日志）
  - **M1** SSRF：3 个 LLM 端点加 `_validate_api_base`（仅 http(s)，不封内网保留本地 LLM）；**M2** base64 参考音 50MB 上限（本地+云端双侧）；**M3** `check_cloud` 统一独立线程跑新 loop
  - **S2** 路径白名单（`_validate_input_file`/`_validate_output_path`：vocal-separate 输出强制落 ref_audio、transcribe/synthesize 输入校验存在+扩展名）+ CORS 收紧到 tauri 协议 + localhost:1420 + 可选 token 中间件（env `MARUAUDIO_API_TOKEN`，默认不启用零回归）
  - **S1** 前端移除随 build 自动解锁的 DEV 后门（改 `VITE_DEV_PLAN` 显式开关，默认 free）+ membership 会员态边界标注（仅客户端缓存、卡密须服务端核销）
  - 验证：`python -m py_compile` 5 文件 exit 0 · `npm run check` 0/0
  - **需重启 TTS server 方生效**（旧 :9880 进程仍跑旧码）；未闭环（需后端/admin 或属低优先）：S1 服务端签发令牌、S2 token 自动注入链路、M4 server.py 拆分、M5 云端 reserve/settle、L1 假进度、L2 mel_tokens 隐式覆盖、云端远程 output_path 本地可达性（待查 Rust）
- **2026-05-29 02:16** 猫总令「前端 UI 设计深度审查 → 开始执行」→ 主 agent 浏览器实地观阵（dev_force_tauri 绕桌面遮挡，截首页/配音/多角色）+ 精读 app.css/Button/Sidebar/roles store，出 UI 设计审查（设计系统⭐5、多角色页为标杆；短板：演示数据/死控件、组件文档脱节、长列表伸缩、a11y），随即执行 A/B/C 批次：
  - **A 首页**：最近项目改本地真实分页（5 条/页、翻页可用），消死分页与「打开」假跳转（改 toast 示例提示），「共 N 项」用真实条数
  - **B1**：修 `component-spec.mdc` Button variant 文档对齐实现（实为 default/primary/text/link/danger/ghost/dashed，无 warning/success；补 suffixIcon）
  - **B2**：新建 `membership/LockedAction.svelte` 统一锁态按钮（锁定点击弹升级，内含 Button+PermissionBadge）并登记组件规范
  - **C1**：`roles.svelte.ts` 加派生统计索引（lineStatsByRole/generatedCount/failedCount/pendingCount + roleLineStats），多角色页 6 处模板全量 filter 改用派生（降长列表卡顿）
  - 验证：`npm run check` 0/0 · 首页实地截图确认分页真实化
  - 未做（建议下批）：Select/Segmented 全量组件化与各页迁移、虚拟列表、a11y 全量（卡片键盘可达/滚动提示/轮播无障碍）、窄视口右栏策略、台词卡高度
- **2026-05-29 02:35** 续 UI 批次（猫总「继续」）：新建 `ui/Select.svelte`（原生底 + token + a11y）与 `ui/Segmented.svelte`（tablist 分段器），纳入 `ui/index.ts` barrel 导出与 `component-spec.mdc` 登记；台词卡紧凑因属布局改动、回归面大暂缓（留逐页验证）。验证 `npm run check` 0/0。组件已就绪，各页手写原生 select / 分段按钮可逐步迁移（迁移需逐页回归，故未一次性铺开）。
- **2026-05-29 02:48** 续（猫总「继续」）：设置页 `language`/`subtitleEncoding` 两处纯字符串原生 select 迁移到 Select 组件（CDP 实测选中项 zh-CN/简体中文 正确、自定义箭头渲染正常、设置页无卡死）；`sampleRate`(number)/`llmModels`(dynamic) 暂留待逐页处理。`npm run check` 0/0。**注：本会话已累积大量未提交改动（后端安全 + 前端 UI + 新组件），建议拆 commit 固化后再继续逐页迁移。**

## PChat 会话关联

- **本项目当前 PChat sessionId**：`135721-e014239b`（自 2026-05-26 11:26 起 · 猫总指定恢复）
- **历史 sessionId（接力链）**：
  - `180017-c903de69`（2026-05-14 至 2026-05-16 12:50 · 已退役）
  - `124734-70193510`（2026-05-16 12:51 至 2026-05-18 20:57 · 已退役）
  - `170503-0c2789f3`（2026-05-18 20:57 至 2026-05-26 11:26 · 已退役）

## 在跑的后台任务

| 任务 | 状态 |
|---|---|
| 多角色配音页重构 | **已完成** · 6 阶段全部落地 |

## 在跑的应用 / dev server

| 服务 | 状态 |
|---|---|
| 丸子 maruaudio_v3.exe | **运行中** · PID **1384**（2026-05-20 cargo watcher 重编译）· Vite 1420 LISTENING |
| 小蜜 xiaomi-assistant.exe | 运行中 · PID 30600（无 python gateway） · Vite 1422 |
| TTS Python server | **运行中** · :9880 · 全部 API 验证通过 |
| 云端引擎 | 未配 `XIANGONG_TTS_BASE`（models.py engine pattern 已含 cloud · 422 bug 已修） |

- 丸子启动命令：`cd frontend && npm run dev`（concurrently 同时跑 vite + tauri dev · 含 predev 清理）
- 已知警告：0 个（Rust dead_code 已 allow 消除）

## 已完成（已提交 · 19 个 commit）

| commit | 主题 | 文件数 |
|---|---|---|
| 2e433e5 | chore: 补全 .gitignore + AI 接力 SOP 文档 | 4 |
| 96e18bb | chore(infra): 基础设施与桌面壳配置升级 | 18 |
| d974138 | feat(ui): V2 设计规范的原子组件库（11 件 + 测试） | 12 |
| d9696b2 | feat(dubbing): 配音区三引擎差异化与播放器重制 | 13 |
| 9cc6af2 | feat(tts): 后端三引擎全链路 + 必剪 ASR 真实实现 | 16 |
| b51af4f | feat(subtitle): 前端字幕模块（mock + SRT） | 5 |
| 6744160 | feat(layout): 框架级 UI + Ctrl+Shift+E 快捷键 | 5 |
| fb8eb3b | feat(pages): 8 菜单页面 + profile 个人中心 | 8 |
| f9a245d | docs: 项目方案 + UI 设计图归档 | 5 |
| c52d333 | feat(subtitle): 前端字幕模块切到 Tauri 桥接真实必剪 ASR | 7 |
| 57e185f | refactor(cloud): 云端从阿里云百炼改为仙宫云上的 IndexTTS 2.0 远程实例 | 7 |

- 已提交合计 100 文件 · git status 干净
- 意外发现：必剪 ASR 真实实现已在 `backend/services/subtitle/`（不是 mock）

## 待办（按优先级）

| 优先级 | 项 |
|---|---|
| ~~高~~ | ~~9 个页面切 ui/ 原子组件~~ ✅ 2026-05-20 完成（6 页面切 Button/Switch/Slider） |
| ~~高~~ | ~~后端全链路跑通验证~~ ✅ 2026-05-20 全部 API 验证通过 |
| ~~中~~ | ~~前端 lib/subtitle/mock-provider 替换为 Tauri invoke 桥~~ ✅ |
| ~~中~~ | ~~字幕页 UI 接入真实 ASR~~ ✅ 已有桥接可用 |
| ~~中~~ | ~~后端补 translate/optimize 接口~~ ✅ 2026-05-20 新增 /subtitle/translate + /subtitle/optimize-timing |
| 中 | 会员字符限额 + 账户中心 UI |
| ~~中~~ | ~~dev server 跑通后视觉验收~~ ✅ 桌面端运行中（需丞相人工确认） |
| 低 | 前端 translate/optimize 调用层接入（后端已就绪） |

## 长期规则（猫总明确要求 · 必守）

> 详见 `AGENTS.md` §4

1. 回复语言：纯中文，不中英文混杂
2. 称呼："猫总" / "林妹妹"（林黛玉腔，技术回复可不带腔）
3. 文件存放：跨项目共享数据放 `E:\工作文档\黛玉妹妹\`
4. 不提交 git：IndexTTS / admin_panel / 任何包含训练权重 / API 密钥
5. 工作时间偏好：10:00-11:30 / 13:30-17:30 / 21:00-23:00
6. 引擎隐藏：UI 仅"轻量/情感/云端"，代码避免出现真实模型名

## 接力清单

接手 AI 进入丸子仓时按顺序读：

1. `AGENTS.md`（自动加载） — 术语 / SOP / 规则
2. `PROJECT-STATE.md`（本文件） — 实时状态
3. `README.md` — 项目背景与命令
4. 当前正在改的文件（如有）

5 秒内能上手。
