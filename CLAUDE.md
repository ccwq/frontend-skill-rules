# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目定位

本仓库用于沉淀前端规范与可复用 Claude Code skill，当前核心资产是：

- `FE-prompts.txt`：前端规范来源材料，不作为最终 skill 的运行时依赖。
- `final-prototype/`：天润项目管理系统静态原型，用于推导当前项目的技术选型与前端能力需求。
- `.claude/skills/`：项目内前端规范 skill，供后续复制、迁移、安装。

当前目录不是完整业务前端工程，而是“规范 / 原型 / skill”仓库。不要把 `final-prototype` 误判为正式 Vue 工程。

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

迁移到 Vue 工程时只能抽象其能力和技术选型依据，不要照搬原生 DOM 操作、全局变量路由、字符串拼接 HTML 或 Material Symbols 依赖。

## 前端规范 Skill

项目内只保留以下 3 个前端规范 skill：

```text
.claude/skills/frontend-tech-stack/SKILL.md
.claude/skills/frontend-project-structure/SKILL.md
.claude/skills/frontend-code-style/SKILL.md
```

已废弃并删除的旧名称：

- `frontend-file-structure`
- `frontend-project-style`
- `frontend-product-style`

不要恢复旧目录，也不要保留兼容别名，避免 Claude Code 触发冲突。

## 三层必跑顺序

凡是前端开发、生成、重构、审查任务涉及 Vue 页面、组件、API、Mock、样式或交互，默认依次执行：

1. `frontend-tech-stack`
2. `frontend-project-structure`
3. `frontend-code-style`

冲突优先级同上：

```text
frontend-tech-stack > frontend-project-structure > frontend-code-style
```

任一自检项 `FAIL`，默认阻塞交付；必须继续修复到 `PASS`，或记录用户确认的例外原因。

## 三个 Skill 的边界

### `frontend-tech-stack`

只管技术选型与依赖边界。

关键经验：

- 技术栈必须根据当前项目规范、原型、依赖、配置动态推导，不能机械套用到其他项目。
- 当前项目技术栈由 `FE-prompts.txt` 与 `final-prototype/` 共同推导。
- 开发语言跟随项目现状，可用 JavaScript 或 TypeScript；不强制 TypeScript，也不要求为了规范迁移已有 JavaScript 项目。
- 不管目录命名、编码风格、视觉品牌。
- 准备引入新 UI 库、状态管理、路由、样式体系、图标体系或图表库前必须先用该 skill 判断是否与现有方案重叠。

当前项目推导出的基线包括：Vue 3、Vite、pnpm、vue-router、unplugin-vue-router、pinia、Element Plus、Iconify MDI + UnoCSS presetIcons、UnoCSS、Less、ECharts 按需。

### `frontend-project-structure`

只管目录结构、目录命名、文件命名、文件归属。

关键经验：

- 不包含 API 函数语义、Mock 字段完整性、类型系统、编码规范、技术选型。
- 重点约束 `src/pages/`、`src/features/`、`src/components/`、`src/api/`、`src/mock/`、`src/styles/`、`src/core/` 的归属。
- 页面入口走 `src/pages/` 文件路由约定。
- 业务组件放 `src/features/<module>/`。
- 通用组件放 `src/components/`。
- API 文件位置和 Mock 文件位置只做结构约束，不在该 skill 中约束字段或函数细节。

### `frontend-code-style`

只管编码可读性与交互完整性。

关键经验：

- 不约束 TypeScript 类型系统。
- 高优先级是节省 token、人类阅读友好、规则短、清晰、可执行。
- 保留规则：缩进、引号、分号、行宽、PascalCase 组件名、命名、中文注释、弹窗重置、异步错误处理、timer 清理、UI 交互完整性。
- 删除/避免恢复：`ref<any[]>`、`row: any`、`Record<string, any>`、具体类型、类型安全、vue-tsc 等 TS 相关铁律。

## 维护原则

- `FE-prompts.txt` 是来源材料，不应被 skill 运行时引用；skill 必须自包含。
- 修改规范时优先改对应 skill 的 `SKILL.md`，并更新其“版本与变更记录”。
- 新增项目经验时先判断属于哪一层：技术选型、项目结构、编码风格，不要把规则混在一起。
- 如果只是换项目，应重新执行 `frontend-tech-stack` 的动态推导，不要直接沿用当前项目基线。
