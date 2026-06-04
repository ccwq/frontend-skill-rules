# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目定位

本仓库用于沉淀前端规范与可复用 Claude Code skill，当前核心资产是：

- `FE-prompts.txt`：前端规范来源材料，不作为最终 skill 的运行时依赖。
- `final-prototype/`：天润项目管理系统静态原型，用于推导当前项目的技术选型与前端能力需求。
- `agent-skills/`：项目内前端规范 skill，供后续复制、迁移、安装。

当前目录不是完整业务前端工程，而是“规范 / 原型 / skill”仓库。不要把 `final-prototype` 误判为正式 Vue / React 工程。

## 常用命令

根目录 `package.json` 当前只提供原型预览命令：

```bash
pnpm run preview
```

该命令会通过 `live-server` 预览 `final-prototype`，默认端口：

```text
http://127.0.0.1:9966
```

当前没有配置正式的 build、lint、test 脚本。不要编造不存在的命令；如需要这些能力，先补充对应工程配置。

## 原型结构

`final-prototype/` 是原生静态原型：

```text
final-prototype/
  index.html      # 原型入口，直接加载 data.js / views.js / app.js
  style.css       # 原型视觉、布局、主题、组件样式
  data.js         # 角色、菜单、权限、Mock 数据、i18n 词典
  views.js        # 各业务视图渲染函数与通用渲染 helper
  app.js          # 初始化、导航、状态、通知、AI 面板、弹窗等交互控制
```

原型体现的能力需求包括：企业后台布局、数据看板、通知/消息中心、弹窗、表格、筛选、状态标签、多主题、AI 助手入口、高信息密度管理界面。

迁移到目标前端工程（Vue / React 等）时只能抽象其能力和技术选型依据，不要照搬原生 DOM 操作、全局变量路由、字符串拼接 HTML 或 Material Symbols 依赖。

## 前端技术栈上下文

技术栈上下文统一维护在：

```text
docs/frontend-tech-stack.md
```

前端开发、生成、重构、审查任务开始前，先读取该文件与当前项目事实，例如 `package.json`、锁文件、构建配置、样式配置、路由/状态管理/UI 库使用痕迹，再执行项目内前端规范 skill。

当前项目的技术栈上下文是 Vue 3 方向基线；这不代表 skill 只能服务 Vue。复制到 React 项目时，必须先更新或读取目标项目的技术栈上下文。

## 前端规范 Skill

项目内保留以下前端规范 skill：

```text
agent-skills/frontend-project-structure/SKILL.md
agent-skills/frontend-reuse-governance/SKILL.md
agent-skills/frontend-code-style/SKILL.md
```

已废弃并删除的旧名称：

- `frontend-file-structure`
- `frontend-project-style`
- `frontend-product-style`

不要恢复旧目录，也不要保留兼容别名，避免 Claude Code 触发冲突。

## 技术栈上下文 + 三个 Skill 协同顺序

凡是前端开发、生成、重构、审查任务涉及页面、组件、API、Mock、样式或交互，默认先读取技术栈上下文与当前项目事实，再依次执行：

0. 技术栈上下文：`docs/frontend-tech-stack.md`、`package.json`、锁文件、构建/样式/路由/状态管理/UI 库等现有配置。
1. `frontend-project-structure`
2. `frontend-reuse-governance`
3. `frontend-code-style`

冲突优先级同上：

```text
技术栈上下文 / 项目事实 > frontend-project-structure > frontend-reuse-governance > frontend-code-style
```

`FAIL` 是否阻塞取决于执行模式：生成模式默认阻塞；审查模式不阻塞报告输出；YOLO 模式记录原因、风险与后续建议后继续推进。

执行模式按任务意图判定：

- 生成模式：用户要求新建、实现、修改、修复前端内容时使用；阻塞性 `FAIL` 必须修复到 `PASS`，或记录用户确认例外。
- 审查模式：用户要求检查、审查、list、评估且未要求立即修改时使用；`FAIL` 只作为问题清单输出，不阻塞报告交付。
- YOLO 模式：用户明确要求 `yolo`、自行判断、别等确认、快速推进时使用；遇到本应阻塞的 `FAIL`，记录原因、风险、影响范围与后续建议后继续推进，不静默忽略。

## 三个 Skill 的边界

### `frontend-project-structure`

只管目录结构、目录命名、文件命名、文件归属。

关键经验：

- 不包含 API 函数语义、Mock 字段完整性、类型系统、编码规范、技术选型。
- 重点约束 `src/pages/`、`src/business/`、`src/business-shared/`、`src/components/`、`src/api/`、`src/mock/`、`src/styles/` 等目录归属。
- 页面入口走 `src/pages/`，默认配合显式路由配置；文件路由框架例外必须来自项目事实。
- 业务组件放 `src/business/<domain>/<feature>/`。
- 通用组件放 `src/components/`。
- API 文件位置和 Mock 文件位置只做结构约束，不在该 skill 中约束字段或函数细节。
- Vue / React 的文件后缀、路由库、状态管理目录细节都跟随技术栈上下文和项目事实。

### `frontend-reuse-governance`

只管复用治理、新建前查重、扩展优先与相似度重构判断。

关键经验：

- 作为可复用 skill 搭配 `frontend-project-structure` 使用：结构规范决定“放哪里”，复用治理决定“是否应该新建”。
- 开发前默认搜索同 feature、全局组件、逻辑资产，避免重复创建功能相近的业务组件、通用组件、hook / composable 或业务逻辑。
- 相似度按名称语义、视觉形态、功能行为、数据模型综合判断。
- 能扩展先扩展；不能扩展时先评估；相似度达到 85% 以上优先考虑重构适配。
- 如果最终仍然新建，必须在任务交付说明中记录搜索范围、候选复用项与新建理由。

### `frontend-code-style`

只管编码可读性与交互完整性。

关键经验：

- 不约束 TypeScript 类型系统。
- 高优先级是节省 token、人类阅读友好、规则短、清晰、可执行。
- 保留规则：缩进、引号、分号、行宽、PascalCase 组件名、命名、中文注释、弹窗重置、异步错误处理、副作用清理、UI 交互完整性。
- Vue 的 `watch` / `onUnmounted` 与 React 的 `useEffect` / cleanup 都属于副作用治理范围。
- 删除/避免恢复：`ref<any[]>`、`row: any`、`Record<string, any>`、具体类型、类型安全、vue-tsc 等 TS 相关铁律。

## planning-with-files 经验

当用户要求先规划、或任务需要多文件修改/多步骤落地时：

- 优先使用 planning-with-files：先只读探索关键文件，再把推荐方案写入计划文件，等待用户确认后再实施。
- 计划文件应包含 Context、推荐方案、关键文件、复用现有内容、验证方式。
- 计划里只写推荐 approach，不展开过多备选项，避免用户审核成本过高。
- 执行阶段必须回看计划，但以当前文件事实为准；如果计划和文件现状冲突，先修正实施策略。
- 若用户在计划审批后补充“固化经验”，应同时更新 `CLAUDE.md` 或记忆文件，说明经验的适用条件与执行方式。

## 维护原则

- `FE-prompts.txt` 是来源材料，不应被 skill 运行时引用；skill 必须自包含。
- 修改规范时优先改对应 skill 的 `SKILL.md`，并更新其“版本与变更记录”。
- 技术栈变化优先更新 `docs/frontend-tech-stack.md`，不要把项目技术栈重新做成 skill。
- 新增项目经验时先判断属于哪一层：技术栈上下文、项目结构、复用治理、编码风格、planning-with-files，不要把规则混在一起。
- 如果只是换项目，应重新读取或更新该项目的技术栈上下文，不要直接沿用当前项目基线。
