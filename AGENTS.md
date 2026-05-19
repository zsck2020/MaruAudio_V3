# AGENTS.md · 丸子配音 V3 · AI 编程助手必读

> 本文件遵循 [AGENTS.md 通用规范](https://agents.md/)，被 Cursor / Claude Code / OpenAI Codex 等 AI 编程工具**自动加载**作为项目级硬约束。

## 1. 术语锚定

| 用户说法 | 实际指代 | 物理路径 |
|---|---|---|
| **丸子配音 / 丸子 / MaruAudio** | AI 语音克隆桌面应用 V3 | 整个仓库 `E:\Exploitation\MaruAudio\MaruAudio_V3\` |
| **丸子前端 / 桌面壳** | Tauri 2 + SvelteKit | `frontend/` |
| **丸子后端** | Python TTS server + 桌面后端 | `backend/` |
| **TTS 引擎 / IndexTTS** | 本地 TTS 推理引擎（不入 git） | `IndexTTS/` |
| **管理后台 / admin** | 服务器端管理面板（不入 git） | 部署在远程 |
| **样音 / 音色库** | 用户上传/克隆的音色资源 | 规划中 |
| **轻量引擎** | 用户面命名 = 本地 IndexTTS 1.5 |  |
| **情感引擎** | 用户面命名 = 本地 IndexTTS 2.0 |  |
| **云端引擎** | 用户面命名 = 远程 IndexTTS 2.0 实例（默认部署在仙宫云） |  |

## 2. 项目定位

- **类型**：商业桌面 AI 工具，配音 / 语音克隆方向
- **技术栈**：Tauri 2 (Rust) + SvelteKit 5 + IndexTTS Python server
- **目标用户**：内容创作者（短视频 / 有声书 / 配音演员 / 播客主）
- **商业模式**：会员订阅 + 引擎按量
- **关联项目**：小蜜助手（`E:\Exploitation\Hermes_Agent`）— 姐妹项目，共享 PChat 工具体系
- **当前阶段**：v3 重构进行中

## 3. AI 接力 SOP（强制）

任何 AI 会话（Cursor 重连 / PChat 新 sessionId / IDE 重启 / 全新会话）在此仓干活前**必须**按下面 SOP：

### Step 1 · 启动前读 3 份文件
1. 本文件 `AGENTS.md` — 项目硬约束 + 术语 + SOP
2. `PROJECT-STATE.md` — 当前 AI 工作状态实时快照
3. `README.md` — 项目背景 + 命令速查

### Step 2 · 检查后台任务
读 `PROJECT-STATE.md` "在跑的后台任务" 表，了解：
- 是否有 explore subagent 在跑
- 是否有 dev server 在运行
- 是否有 build / cargo 后台任务

### Step 3 · 心跳写盘约定
主 agent 每次**重要动作**后**立即**重写 `PROJECT-STATE.md`：
- 重要动作 = 重大依赖变更 / Rust 改动 / Svelte 重构 / 后端服务调整 / TTS 引擎集成 / IndexTTS 升级 / subagent 启动 / 重要决策
- 不要等"批量"才更新；每个 commit-worthy 改动都立即写盘
- 用户口头改需求 → 立即记到"当前用户指令"

### Step 4 · PChat 新 sessionId 时
主 agent 在新 sessionId 的第一条 message 必须包含：
- 完整接力摘要（项目阶段 / 在跑任务 / 关键决策）
- 关键文件路径（AGENTS.md / PROJECT-STATE.md / README.md / 当前修改文件）
- "我从 PROJECT-STATE.md 接力"的明确说明

## 4. 长期规则（猫总确认 · 必守）

- 关联 PChat session：`170503-0c2789f3`（当前 · 自 2026-05-18 20:57）· 历史 `124734-70193510` ← `180017-c903de69`
- 工作时间偏好：10:00-11:30 / 13:30-17:30 / 21:00-23:00（非强制）
- 用户称呼："猫总"（自称） / "林妹妹"（AI 别名，林黛玉腔，技术回复时可不带腔）
- 文件存放：跨项目共享数据放 `E:\工作文档\黛玉妹妹\`（中文文件名）
- 回复语言：纯中文，不要中英文混杂
- IndexTTS 本地仅，**不提交 git**
- admin_panel **不在本仓**，跨仓修改前确认
- 引擎隐藏策略：UI 用"轻量/情感/云端"，**不暴露** IndexTTS / 仙宫云 / 远程实例细节等底层信息
- 配音区颜色不能动（用户硬要求 5/13）

## 5. 关键开发命令（cd frontend/）

```bash
npm run dev          # 推荐 · Tauri 桌面 + 前端供应层一起
npm run dev:frontend # 仅前端 dev server (端口 1420)
npm run dev:desktop  # 仅 Tauri 桌面 (等前端就绪)
npm run check        # TypeScript 类型检查
npm run build        # 前端静态构建
npm run tauri build  # 完整桌面应用打包
```

## 6. 跟姐妹项目小蜜助手的关系

- 都是 Tauri + SvelteKit 桌面 AI 产品
- 都用 PChat 工具体系做开发对话保活
- **小蜜内嵌 hermes Python agent**，丸子**不内嵌**任何 LLM agent（TTS only）
- 两个项目代码不共享，但 UI 经验 / 打包流程 / 商业用户洞察可互通

详见 `E:\Exploitation\Hermes_Agent\AGENTS.md`（小蜜助手对应文件）。
