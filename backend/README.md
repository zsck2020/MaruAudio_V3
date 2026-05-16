# AI 引擎层（待开发）

此目录用于 MaruAudio AI 引擎后端服务，当前为空。

## 规划中的功能

- IndexTTS 1.5 / 2.0 引擎封装（仅参考 IndexTTS/ 目录，禁止直接调用）
- 云端引擎对接（默认通过仙宫云上自部署的 IndexTTS 2.0 远程实例，环境变量 `XIANGONG_TTS_BASE` + 可选 `XIANGONG_TTS_TOKEN`）
- 统一 TTS 引擎接口 Trait
- 文本预处理管线（分词、正则化、拼音纠错）

> 注意：管理后台 API 仍在 `admin_panel/` 中（PHP），此目录专指 AI 引擎层。
