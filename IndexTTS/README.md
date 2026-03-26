# IndexTTS 本地参考

与 `docs/IndexTTS引擎深度学习报告.md` 对照使用。

| 目录 | 对应版本 | 说明 |
|------|----------|------|
| `v15/` | **IndexTTS 1.5** | 轻量引擎，支持桶化批处理 `infer_fast` 等 |
| `v20/` | **IndexTTS 2.0** | 情感引擎，音色/情感解耦，Qwen 情感文本等 |

**Git**：仓库根目录 `.gitignore` 已改为仅忽略 `checkpoints/`、权重文件与缓存，**源码可被跟踪与 IDE 索引**。请勿将大权重提交到远程（`checkpoints/` 已忽略）。
