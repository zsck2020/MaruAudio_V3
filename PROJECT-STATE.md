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

## PChat 会话关联

- **本项目 PChat sessionId**：`180017-c903de69`（用户原话）

## 在跑的后台任务

| 任务 | 状态 |
|---|---|
| （无） | - |

## 在跑的应用 / dev server

| 服务 | 状态 |
|---|---|
| 丸子 maruaudio_v3.exe | **运行中** · PID **388**（cargo watcher 检测 Rust 变更自动重启）· Vite 1420 |
| 小蜜 xiaomi-assistant.exe | **运行中** · PID 18236 · python gateway PID 14328 · Vite 1422 |
| IndexTTS Python server | 未启动（前端调字幕/TTS 时会报 connect refused） |
| 云端引擎（仙宫云 IndexTTS 2.0 远程实例） | 未配 `XIANGONG_TTS_BASE` |

- 丸子启动命令：`cd frontend && npm run dev`（须自己重新起 task 才能监控）
- 已知警告：2 个 Rust dead_code（field `current_task_id` 与方法 `next_task_id` / `current_task_id` 未使用 · 无害）

## 已完成（已提交 · 9 个 commit）

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

- 已提交合计 86 文件 · git status 干净
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
