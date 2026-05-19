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

## PChat 会话关联

- **本项目当前 PChat sessionId**：`170503-0c2789f3`（自 2026-05-18 20:57 起 · 猫总指定恢复）
- **历史 sessionId（接力链）**：
  - `180017-c903de69`（2026-05-14 至 2026-05-16 12:50 · 已退役）
  - `124734-70193510`（2026-05-16 12:51 至 2026-05-18 20:57 · 已退役）

## 在跑的后台任务

| 任务 | 状态 |
|---|---|
| （无） | - |

## 在跑的应用 / dev server

| 服务 | 状态 |
|---|---|
| 丸子 maruaudio_v3.exe | **运行中** · PID **59768**（2026-05-19 11:24 cargo watcher 重启 · 因 lib.rs / tauri.conf.json 改动）· Vite 1420 LISTENING |
| 小蜜 xiaomi-assistant.exe | 运行中 · PID 30600（无 python gateway） · Vite 1422 |
| IndexTTS Python server | 未启动（前端调字幕/TTS 时会报 connect refused） |
| 云端引擎（仙宫云 IndexTTS 2.0 远程实例） | 未配 `XIANGONG_TTS_BASE` · **且 models.py engine pattern 当前不含 cloud 会被 Pydantic 422 拒绝**（见 docs/深度审查报告-2026-05-19.md #2） |

- 丸子启动命令：`cd frontend && npm run dev`（concurrently 同时跑 vite + tauri dev · 含 predev 清理）
- 已知警告：2 个 Rust dead_code（field `current_task_id` 与方法 `next_task_id` / `current_task_id` 未使用 · 无害 · 见审查报告 #20）

## 已完成（已提交 · 11 个 commit）

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
| 高 | 9 个页面切 ui/ 原子组件（目前只 setting 切了 · C 阶段进行中） |
| 高 | 后端全链路跑通验证（cloud + 本地 2 引擎都加载） |
| ~~中~~ | ~~前端 lib/subtitle/mock-provider 替换为 Tauri invoke 桥到 backend/services/subtitle/~~ ✅ 12:30 完成 |
| 中 | 字幕页 UI 接入 defaultSubtitleProvider（让按钮调真实 ASR）|
| 中 | 后端补 translate/optimize 接口（前端 tauri-provider 已留位） |
| 中 | 会员字符限额 + 账户中心 UI |
| 中 | dev server 跑通后视觉验收 |

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
