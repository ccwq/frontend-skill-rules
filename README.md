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

## 安装命令

```bash
npx -y skills add ./.claude/skills/frontend-project-structure
npx -y skills add ./.claude/skills/frontend-reuse-governance
npx -y skills add ./.claude/skills/frontend-code-style
```
