# task_plan.md

## 目标

固化前端规范 skill 与技术栈上下文的维护方式，确保后续 Claude Code 能按项目约定维护 `.claude/skills`、`docs/frontend-tech-stack.md` 与项目级说明文件。

## 当前阶段

- [x] 创建项目级 `CLAUDE.md`
- [x] 创建并重构项目内前端规范 skills
- [x] 删除旧 skill 名称，避免触发冲突
- [x] 移除 code-style 中的 TypeScript 强制约束
- [x] 新增 `frontend-reuse-governance` 复用治理 skill
- [x] 移除技术栈 skill，将技术栈迁移到 `docs/frontend-tech-stack.md`
- [x] 创建 planning-with-files 三文件：`task_plan.md`、`findings.md`、`progress.md`

## 已确认决策

### 技术栈上下文 + 三个 skill 协同顺序

前端开发、生成、重构、审查任务默认先读取技术栈上下文与当前项目事实，再执行三个前端规范 skill：

0. 技术栈上下文：`docs/frontend-tech-stack.md`、`package.json`、锁文件、Vite/UnoCSS/路由/状态管理等现有配置。
1. `frontend-project-structure`
2. `frontend-reuse-governance`
3. `frontend-code-style`

冲突优先级同上：

```text
技术栈上下文 / 项目事实 > frontend-project-structure > frontend-reuse-governance > frontend-code-style
```

### skill 语义边界

- `frontend-project-structure`：只管目录结构、目录命名、文件命名、文件归属；不管 API 语义、Mock 字段、编码风格、复用治理或技术选型。
- `frontend-reuse-governance`：只管新建前查重、扩展优先、相似度评估和复用/重构/新建决策。
- `frontend-code-style`：只管编码可读性与交互完整性；不约束 TS 类型系统；优先节省 token、人类阅读友好。

### 技术栈维护方式

- 技术栈不再作为 Claude Code skill 触发。
- 当前项目技术栈上下文维护在 `docs/frontend-tech-stack.md`。
- 技术栈变化优先更新 `docs/frontend-tech-stack.md`，不要把项目技术栈重新做成 skill。

### 废弃名称

以下旧 skill 名称已废弃，不保留兼容别名：

- `frontend-file-structure`
- `frontend-project-style`
- `frontend-product-style`

## 后续维护计划

1. 修改结构、复用、编码规范时优先改对应 `.claude/skills/<skill>/SKILL.md`。
2. 每次修改 skill 后同步更新其“版本与变更记录”。
3. 技术栈变化优先更新 `docs/frontend-tech-stack.md`。
4. 如果新增项目级经验，同步更新 `CLAUDE.md`。
5. 如果继续使用 planning-with-files，重要过程记录写入 `progress.md`，研究结论写入 `findings.md`。

## 验收清单

- [x] `CLAUDE.md` 存在于项目根目录。
- [x] `docs/frontend-tech-stack.md` 存在。
- [x] `.claude/skills/frontend-project-structure/SKILL.md` 存在。
- [x] `.claude/skills/frontend-reuse-governance/SKILL.md` 存在。
- [x] `.claude/skills/frontend-code-style/SKILL.md` 存在。
- [x] `.claude/skills/frontend-tech-stack/` 已移除。
- [x] `task_plan.md` 存在。
- [x] `findings.md` 存在。
- [x] `progress.md` 存在。
