# Frontend Agent Rules

一套可复用的前端 Claude Code skills 规范集合，用于约束项目结构、复用治理与编码风格，并通过 `docs/frontend-tech-stack.md` 维护项目技术栈上下文。适合在 Vue / React 前端项目中复制、安装和按项目事实调整。

## 需要写入 CLAUDE.md / AGENTS.md 的内容

```md
# 严格按照下面技能约束项目新建和开发的过程
- frontend-code-style
- frontend-project-structure
- frontend-reuse-governance

# 技术栈要求
docs/frontend-tech-stack.md
引入的重要第三方组件时候，先判断是否符合技术栈；引入新的功能需要在文件中登记。
```

## Skill 说明

### frontend-project-structure

约束前端项目的目录结构、目录命名、文件命名与文件归属。它负责判断页面、业务组件、通用组件、API、Mock、store、样式和基础设施文件应该放在哪里；不处理技术选型、API 字段语义、编码风格或是否复用。

### frontend-reuse-governance

约束开发前的复用检查，避免重复造轮子。新建业务组件、通用组件、hook / composable、store、utils、API 或 Mock 前，需要先搜索同 feature、全局组件和逻辑资产；能扩展先扩展，相似度高时优先重构适配。

### frontend-code-style

约束前端代码可读性与交互完整性。重点检查命名、格式、中文注释、异步错误处理、弹窗表单重置、副作用和 timer 清理、搜索/筛选/按钮等 UI 是否有真实行为；不强制 TypeScript 类型系统。

## 执行模式

三套 skill 都按任务意图选择执行模式。用户明确指定模式时，以用户指定为准；未指定时按提示词语义自动判定。

| 模式 | 适用场景 | FAIL 处理 | 适合提示词 |
| --- | --- | --- | --- |
| 生成模式 | 新建 / 实现 / 修改前端内容 | 默认阻塞，修到 `PASS` 或记录用户确认例外 | “新增一个数据源页面，并按规范放置文件” |
| 审查模式 | 只检查、列问题、评估规范符合度 | 不阻塞报告输出，只列问题、影响和建议 | “检查这些文件哪里不符合规范，先不要改” |
| YOLO 模式 | 希望快速推进、不要等待确认 | 记录原因、风险和后续建议后继续，不静默忽略 | “按规范改，遇到需要确认的地方 yolo 自行通过并记录原因” |

YOLO 不是忽略规范，而是把阻塞项转为“记录后继续”，用于减少等待用户决策造成的效率损耗。

## 安装命令

### Claude Code plugins 安装（推荐）

```bash
claude plugin marketplace add https://github.com/ccwq/frontend-skill-rules.git --scope user
claude plugin install frontend-skill-rules@frontend-skill-rules-marketplace --scope user
```

安装完成后，重启 Claude Code，或在会话内执行 `/reload-skills`。

### npx skills 安装（保留）

本地仓库安装：

```bash
npx -y skills add ./agent-skills/frontend-project-structure
npx -y skills add ./agent-skills/frontend-reuse-governance
npx -y skills add ./agent-skills/frontend-code-style
```

公开仓库安装：

```bash
npx -y skills add https://github.com/ccwq/frontend-skill-rules/tree/main/agent-skills/frontend-project-structure
npx -y skills add https://github.com/ccwq/frontend-skill-rules/tree/main/agent-skills/frontend-reuse-governance
npx -y skills add https://github.com/ccwq/frontend-skill-rules/tree/main/agent-skills/frontend-code-style
```
