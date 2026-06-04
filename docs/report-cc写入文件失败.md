# Claude Code 写入文件失败事故报告

## 1. 报告目的

本文档记录本次 `docs/project-structure-plan.md` 写入过程中出现的工具调用失败事件，梳理事故现象、工具调用参数、影响范围、原因分析与后续建议。

本文仅基于当前会话中可见的工具调用记录进行分析，不包含底层 LLM API 原始请求、响应日志、网关日志或 Claude Code 内部运行日志。

## 2. 事故摘要

在创建和更新 `docs/project-structure-plan.md` 的过程中，多次出现 Claude Code 工具调用失败。失败表现包括：

- `Write` 工具收到空参数 `{}`，缺少必填字段 `file_path` 和 `content`。
- `PowerShell` 工具收到空参数 `{}`，缺少必填字段 `command`。
- `Bash` 工具收到空参数 `{}`，缺少必填字段 `command`。
- `Read` 工具收到非法参数 `pages: ""`。

后续用户更换 LLM API 地址后，`Write` 工具调用恢复正常，能够携带完整 `file_path` 与 `content` 参数并成功写入文件。

初步结论：本次事故的直接原因是工具调用参数缺失或非法；结合更换 LLM API 地址后恢复的事实，高概率与原 LLM API 地址或其中间兼容层的 tool/function calling 参数生成、透传或解析异常有关。

## 3. 影响范围

### 3.1 受影响操作

- 文件创建。
- 文件更新。
- 文件读取。
- 命令执行。

### 3.2 受影响工具

- `Write`
- `Read`
- `PowerShell`
- `Bash`

### 3.3 未确认受影响范围

当前没有证据表明以下对象存在故障：

- Windows 文件系统。
- 项目目录权限。
- `docs` 目录权限。
- Claude Code 的 `Write` 工具实现。
- 目标文件路径本身。

## 4. 事件时间线

### 4.1 文件存在性检查

首先使用 `Glob` 检查目标文件与 `docs` 目录内容。

工具调用参数：

```json
{
  "path": "E:\\project\\tr-project-agent-rule",
  "pattern": "docs/project-structure-plan.md"
}
```

返回结果：

```text
No files found
```

随后检查：

```json
{
  "path": "E:\\project\\tr-project-agent-rule",
  "pattern": "docs/**"
}
```

返回结果：

```text
No files found
```

该阶段工具调用参数正常。

### 4.2 创建 docs 目录

使用 `PowerShell` 检查项目目录，并在 `docs` 不存在时创建目录。

工具调用参数：

```json
{
  "command": "Get-ChildItem -Path \"E:\\project\\tr-project-agent-rule\" -Directory | Select-Object -ExpandProperty Name; if (-not (Test-Path \"E:\\project\\tr-project-agent-rule\\docs\")) { New-Item -ItemType Directory -Path \"E:\\project\\tr-project-agent-rule\\docs\" | Out-Null }",
  "dangerouslyDisableSandbox": false,
  "description": "Verify project folders and create docs directory",
  "run_in_background": false,
  "timeout": 120000
}
```

返回结果显示项目根目录下存在：

```text
.claude
final-prototype
node_modules
```

该调用没有返回权限错误或路径错误。

### 4.3 Write 工具首次异常

随后多次调用 `Write` 工具时，实际参数为空对象。

异常工具调用参数：

```json
{}
```

错误信息：

```text
InputValidationError: Write failed due to the following issues:
The required parameter `file_path` is missing
The required parameter `content` is missing
```

该错误发生在工具参数校验阶段，未进入实际文件写入逻辑。

### 4.4 小文件创建成功

用户要求先创建文件后，`Write` 工具曾成功创建 `docs/project-structure-plan.md`。

成功工具调用参数：

```json
{
  "file_path": "E:\\project\\tr-project-agent-rule\\docs\\project-structure-plan.md",
  "content": "# frontend-project-structure 重构计划\n\n> 状态：待补充详细计划。\n> 目的：记录针对 `.claude/skills/frontend-project-structure/SKILL.md` 的结构规范重构方案。\n\n"
}
```

返回结果：

```text
File created successfully at: E:\project\tr-project-agent-rule\docs\project-structure-plan.md
```

该结果证明：

- `Write` 工具可正常工作。
- 目标路径可写。
- `docs` 目录可用。
- 文件系统权限不是主要问题。

### 4.5 后续 Write 再次异常

在继续写入完整内容时，`Write` 再次收到空参数。

异常工具调用参数：

```json
{}
```

错误信息：

```text
InputValidationError: Write failed due to the following issues:
The required parameter `file_path` is missing
The required parameter `content` is missing
```

### 4.6 Read 工具异常

尝试读取文件时，`Read` 工具携带了非法 `pages` 参数。

异常工具调用参数：

```json
{
  "file_path": "E:\\project\\tr-project-agent-rule\\docs\\project-structure-plan.md",
  "limit": 80,
  "offset": 0,
  "pages": ""
}
```

错误信息：

```text
Invalid pages parameter: "". Use formats like "1-5", "3", or "10-20". Pages are 1-indexed.
```

`pages` 参数只适用于 PDF 文件。读取 Markdown 文件时应省略该字段，而不是传入空字符串。

正确参数应为：

```json
{
  "file_path": "E:\\project\\tr-project-agent-rule\\docs\\project-structure-plan.md",
  "limit": 80,
  "offset": 0
}
```

### 4.7 PowerShell 与 Bash 工具异常

后续尝试使用其他方式写入时，`PowerShell` 与 `Bash` 也出现空参数调用。

`PowerShell` 异常参数：

```json
{}
```

错误信息：

```text
InputValidationError: PowerShell failed due to the following issue:
The required parameter `command` is missing
```

`Bash` 异常参数：

```json
{}
```

错误信息：

```text
InputValidationError: Bash failed due to the following issue:
The required parameter `command` is missing
```

该阶段表明问题不局限于 `Write` 工具，而是多个工具的参数生成或传递均出现异常。

### 4.8 更换 LLM API 地址后写入成功

用户更换 LLM API 地址后，再次使用 `Write` 工具写入完整内容成功。

成功工具调用参数结构：

```json
{
  "file_path": "E:\\project\\tr-project-agent-rule\\docs\\project-structure-plan.md",
  "content": "完整 Markdown 文档内容"
}
```

返回结果：

```text
The file E:\project\tr-project-agent-rule\docs\project-structure-plan.md has been updated successfully.
```

该结果说明，在同一 Claude Code 环境、同一路径、同一工具下，只要工具参数完整，写入可以正常完成。

## 5. 失败现象分类

### 5.1 必填参数缺失

涉及工具：

- `Write`
- `PowerShell`
- `Bash`

典型参数：

```json
{}
```

典型错误：

```text
required parameter missing
```

### 5.2 非法空字符串参数

涉及工具：

- `Read`

典型参数：

```json
{
  "pages": ""
}
```

问题：

- `pages` 不是通用文件读取参数。
- 对非 PDF 文件应省略该字段。
- 空字符串不是合法页码范围。

### 5.3 自然语言意图与工具参数不一致

部分响应中，文本表述为准备使用某工具执行写入或命令操作，但实际发出的工具调用为空参数 `{}`。

该现象说明：

- 模型自然语言层面存在操作意图。
- 工具调用结构化参数没有正确生成或传递。

## 6. 原因分析

### 6.1 直接原因

工具调用参数不符合工具 schema 要求。

具体包括：

- `Write` 缺少 `file_path` 和 `content`。
- `PowerShell` 缺少 `command`。
- `Bash` 缺少 `command`。
- `Read` 传入非法 `pages: ""`。

### 6.2 证据链

1. `Glob` 与初始 `PowerShell` 调用正常，说明工具系统并非完全不可用。
2. `Write` 小文件创建成功，说明 `Write` 工具本身、目标路径和文件系统权限正常。
3. 多个工具后续出现 `{}` 参数，说明异常不局限于单一工具。
4. 更换 LLM API 地址后，`Write` 携带完整参数并成功写入，说明问题与 LLM API 地址或兼容层高度相关。

### 6.3 高概率上游原因

结合用户说明“最后正常写入，是因为更换了 LLM API 地址”，高概率原因包括：

1. 原 LLM API 地址或中间兼容层对 Claude Code tool use 协议支持不完整。
2. tool call 的 arguments 字段在生成、转换、流式拼接或转发过程中丢失。
3. schema 到 function calling 的转换存在兼容问题。
4. 长文本 `content` 字段或结构化参数在原 API 链路中被截断、置空或解析失败。
5. 原模型或兼容服务虽然能返回工具调用名称，但不能稳定返回合法工具参数。

### 6.4 无法确认的部分

由于当前没有原始 API 请求与响应日志，无法确认以下细节：

- 原 API 返回的 tool call arguments 是否本身为空。
- arguments 是否在中间网关层被清空。
- 是否存在流式响应拼接错误。
- 是否存在模型输出 JSON 后被适配层解析失败的问题。
- 是否存在 Claude Code 与该 API 地址之间的协议兼容问题。

## 7. 排除项

### 7.1 排除文件系统权限问题

依据：

- `docs` 目录创建命令未报错。
- `Write` 曾成功创建文件。
- 更换 API 地址后，同一路径写入成功。

### 7.2 排除目标路径错误

依据：

最终成功写入路径与目标路径一致：

```text
E:\project\tr-project-agent-rule\docs\project-structure-plan.md
```

### 7.3 排除 Write 工具实现不可用

依据：

`Write` 在参数完整时能够成功创建和更新文件。

### 7.4 排除文件已存在导致写入失败

依据：

失败错误为必填参数缺失，而不是覆盖限制、文件锁定或文件状态错误。

## 8. LLM 响应差异

### 8.1 异常阶段

异常阶段的工具调用表现为：

```json
{}
```

或包含非法空字符串字段：

```json
{
  "pages": ""
}
```

特征：

- 工具名称可以被触发。
- 工具参数缺失或非法。
- 自然语言说明与实际工具参数不一致。
- 多个工具均出现参数异常。

### 8.2 正常阶段

正常阶段的工具调用表现为：

```json
{
  "file_path": "E:\\project\\tr-project-agent-rule\\docs\\project-structure-plan.md",
  "content": "..."
}
```

特征：

- 工具参数完整。
- 字段名称符合 schema。
- 字段值类型正确。
- 工具执行成功。

### 8.3 差异结论

异常阶段与正常阶段的核心差异是：

```text
tool call arguments 是否完整、合法、符合 schema
```

不是工具名称、目标路径或文件系统状态的差异。

## 9. 根因判断

### 9.1 直接根因

Claude Code 工具调用收到缺失或非法参数，导致参数校验失败。

### 9.2 高概率根因

原 LLM API 地址或其中间兼容层对 Claude Code 工具调用协议支持不稳定，导致 tool call arguments 丢失、置空或生成异常。

### 9.3 根因置信度

- 工具参数缺失导致失败：高置信度。
- 文件系统、路径、权限不是主因：高置信度。
- 与原 LLM API 地址或兼容层相关：高置信度，但需原始 API 日志进一步确认。
- 具体是模型生成问题、网关转发问题还是流式拼接问题：当前无法确认。

## 10. 后续验证建议

### 10.1 最小工具调用测试

测试 `Glob`：

```text
请使用 Glob 查找当前项目下的 package.json。
```

期望参数：

```json
{
  "path": "E:\\project\\tr-project-agent-rule",
  "pattern": "package.json"
}
```

异常信号：

```json
{}
```

### 10.2 命令工具测试

测试 `PowerShell`：

```text
请使用 PowerShell 执行 Get-Location。
```

期望参数结构：

```json
{
  "command": "Get-Location",
  "description": "Show current working directory",
  "run_in_background": false,
  "timeout": 120000,
  "dangerouslyDisableSandbox": false
}
```

异常信号：

```json
{}
```

### 10.3 短文本写入测试

测试 `Write`：

```text
请创建 docs/tool-call-test.md，内容为 tool call test。
```

期望参数结构：

```json
{
  "file_path": "E:\\project\\tr-project-agent-rule\\docs\\tool-call-test.md",
  "content": "tool call test"
}
```

### 10.4 长文本写入测试

测试较长 `content` 字段，验证原 API 链路是否存在长 arguments 截断或清空问题。

## 11. 预防措施

1. 使用明确支持 Claude Code tool use 的 LLM API 地址或网关。
2. 对新 API 地址进行最小工具调用测试，包括 `Glob`、`PowerShell`、`Write`。
3. 如使用中间代理层，确认其不会丢弃或改写 tool call arguments。
4. 对长文本写入场景进行单独验证。
5. 当连续出现 `{}` 参数调用时，应停止重试，先检查 LLM API 或工具调用兼容层。
6. 避免把工具参数异常误判为文件系统、权限或路径问题。

## 12. 结论

本次事故属于 Claude Code 工具调用参数异常事件。

直接表现是多个工具收到空参数或非法参数，导致工具 schema 校验失败。由于同一工具在参数完整时可以成功写入同一路径，文件系统、权限、路径和工具实现本身不是主要原因。

结合用户更换 LLM API 地址后写入恢复正常的事实，高概率判断：原 LLM API 地址或其中间兼容层对工具调用参数的生成、传递或解析存在异常，导致 tool call arguments 丢失或不合法。
