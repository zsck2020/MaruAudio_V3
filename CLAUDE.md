# MaruAudio V3 开发规则

## 代码读取规则

### 使用 augment-context-engine 工具

在读取代码文件时，**必须**调用 `augment-context-engine` 工具。

**原因**：
- `augment-context-engine` 使用服务器语言协议（LSP）而不是简单的文本搜索
- 能够提供精确的代码语义理解
- 可以分析代码结构、依赖关系、类型信息等

**执行方式**：
```bash
auggie --mcp --mcp-auto-workspace
```

**何时触发**：
- 使用 Read 工具读取任何代码文件时
- 分析代码结构或查找符号定义时
- 需要理解代码语义而非文本内容时

**已配置自动触发**：
已在 `~/.claude/settings.json` 中配置 PreToolUse hook，当 Read 工具被调用时会自动执行 augment-context-engine。
