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
- **未决项**：拆 commit（52 文件 / +7058 行需拆）/ 9 个页面切 ui/ 原子组件 / 必剪 ASR 真实接入

## PChat 会话关联

- **本项目 PChat sessionId**：`180017-c903de69`（用户原话）

## 在跑的后台任务

| 任务 | 状态 |
|---|---|
| （无） | - |

## 在跑的应用 / dev server

| 服务 | 状态 |
|---|---|
| 前端 Vite dev server | **运行中** · Vite v6.4.2 ready in 1375 ms · http://localhost:1420/ |
| Tauri 桌面 cargo dev | **运行中** · cargo dev finished in 1.18s · maruaudio_v3.exe 已启动 |
| IndexTTS Python server | 未启动 |
| DashScope 云端引擎 | 未配 `DASHSCOPE_API_KEY` |

- 启动命令：`cd frontend && npm run dev`
- 后台 task id：`619904` / PID 8620
- 启动时间：2026-05-16 09:57
- 已知警告：2 个 Rust dead_code（field `current_task_id` 与方法 `next_task_id` / `current_task_id` 未使用 · 无害）

## 已完成（落盘 · 未提交）

- 52 个文件 / +7058 / -400 行 · svelte-check 0/0
- 前端 ui/ 原子组件库 11 件（Button/IconButton/Card/Empty/Input/Modal/Slider/Spin/Switch/Tag + index + 合同测试）
- 配音区三引擎差异化（EngineSelector / ParamAccordion / ReferenceAudioPanel）
- 设置页 +1225 行 · 资源页 +839 · 字幕页 +754 · 项目页 +545 · 等
- 全局：滑动条隐藏 + 播放器美化 + Ctrl+Shift+E 切换引擎
- 后端 `cloud_engine.py` Qwen3-TTS 接入（check/sync/stream 三件套）
- 后端 `services/vocal_separator.py` 人声分离（demucs+librosa+ffmpeg）
- 前端 `lib/subtitle/` 字幕生成 SRT（仍 mock provider）
- 文档 `docs/UI设计图生成prompt归档.md` 41KB（12 张设计图 prompt 全档案）

## 待办（按优先级）

| 优先级 | 项 |
|---|---|
| 高 | 52 文件拆分 commit |
| 高 | 后端全链路跑通验证（cloud + 本地 2 引擎都加载） |
| 中高 | 9 个页面切 ui/ 原子组件（目前只 setting 切了） |
| 中 | 必剪 ASR 真实接入（替换 mock-provider） |
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
