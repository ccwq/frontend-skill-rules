# Frontend Agent Rules Lite

一套可复用的前端 Claude Code skills 规范集合，用于约束项目结构、复用治理与编码风格，并通过 `docs/frontend-tech-stack.md` 维护项目技术栈上下文。适合在 Vue / React 前端项目中复制、安装和按项目事实调整。

## 快速上手

```bash
# claude安装方式
# 1-1 安装全部 frontend skills（推荐：Claude Code plugins）
claude plugin marketplace add https://github.com/ccwq/frontend-skill-rules.git --scope user
claude plugin install frontend-skill-rules@frontend-skill-rules-marketplace --scope user

# 其他agent工具安装方式, 比如codex
# 1-2
npx -y skills add https://github.com/ccwq/frontend-skill-rules

# 2. 复制技术栈上下文到目标项目后按项目事实调整
cp docs/frontend-tech-stack.md <your-project>/docs/frontend-tech-stack.md

# 3. 在目标项目 CLAUDE.md / AGENTS.md 写入上方约束，并重载 skills
/reload-skills
```

使用时先让 Claude Code 读取 `docs/frontend-tech-stack.md`，再按 `frontend-project-structure` → `frontend-reuse-governance` → `frontend-code-style` 的顺序执行。


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
