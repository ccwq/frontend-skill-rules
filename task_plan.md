# task_plan.md

## 目标

固化本轮前端规范 skill 重构经验，确保后续 Claude Code 能按项目约定维护 `.claude/skills` 与项目级说明文件。

## 当前阶段

- [x] 创建项目级 `CLAUDE.md`
- [x] 创建并重构项目内前端规范 skills
- [x] 删除旧 skill 名称，避免触发冲突
- [x] 移除 code-style 与 tech-stack 中的 TypeScript 强制约束
- [x] 创建 planning-with-files 三文件：`task_plan.md`、`findings.md`、`progress.md`

## 已确认决策

### 三层必跑顺序

前端开发、生成、重构、审查任务默认按以下顺序执行：

1. `frontend-tech-stack`
2. `frontend-project-structure`
3. `frontend-code-style`

冲突优先级同上：

```text
frontend-tech-stack > frontend-project-structure > frontend-code-style
```

### skill 语义边界

- `frontend-tech-stack`：只管技术选型、依赖边界、动态推导；开发语言跟随项目现状，可用 JS 或 TS，不强制 TypeScript。
- `frontend-project-structure`：只管目录结构、目录命名、文件命名、文件归属；不管 API 语义、Mock 字段、编码风格、技术选型。
- `frontend-code-style`：只管编码可读性与交互完整性；不约束 TS 类型系统；优先节省 token、人类阅读友好。

### 废弃名称

以下旧 skill 名称已废弃，不保留兼容别名：

- `frontend-file-structure`
- `frontend-project-style`
- `frontend-product-style`

## 后续维护计划

1. 修改规范时优先改对应 `.claude/skills/<skill>/SKILL.md`。
2. 每次修改 skill 后同步更新其“版本与变更记录”。
3. 如果新增项目级经验，同步更新 `CLAUDE.md`。
4. 如果继续使用 planning-with-files，重要过程记录写入 `progress.md`，研究结论写入 `findings.md`。

## 验收清单

- [x] `CLAUDE.md` 存在于项目根目录。
- [x] `.claude/skills/frontend-tech-stack/SKILL.md` 存在。
- [x] `.claude/skills/frontend-project-structure/SKILL.md` 存在。
- [x] `.claude/skills/frontend-code-style/SKILL.md` 存在。
- [x] `task_plan.md` 存在。
- [x] `findings.md` 存在。
- [x] `progress.md` 存在。
