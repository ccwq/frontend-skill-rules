# findings.md

## 研究与发现

### 1. 当前仓库性质

当前仓库主要用于沉淀前端规范、静态原型和 Claude Code skill，不是完整业务前端工程。

关键内容：

- `FE-prompts.txt`：前端规范来源材料。
- `final-prototype/`：天润项目管理系统静态原型。
- `.claude/skills/`：项目内可迁移前端规范 skill。
- `CLAUDE.md`：未来 Claude Code 实例进入本仓库时读取的项目级工作说明。

### 2. final-prototype 的作用

`final-prototype/` 是原生静态原型，由以下文件构成：

```text
final-prototype/
  index.html
  style.css
  data.js
  views.js
  app.js
```

它用于推导能力需求和技术选型，不应被照搬成 Vue 工程代码。

可推导出的能力包括：

- 企业后台布局。
- 数据看板。
- 通知与消息中心。
- 弹窗、表格、筛选、状态标签。
- 多主题切换。
- AI 助手入口。
- 高信息密度管理界面。

### 3. 三个 skill 的最终边界

#### `frontend-tech-stack`

技术选型铁律，动态推导。

结论：

- 技术栈不能写死成跨项目固定答案。
- 当前项目技术栈由 `FE-prompts.txt` 与 `final-prototype/` 共同推导。
- 开发语言跟随项目现状，可用 JS 或 TS。
- 不强制 TypeScript，不要求为了规范迁移已有 JavaScript 项目。

#### `frontend-project-structure`

目录结构铁律。

结论：

- 只管目录结构、目录命名、文件命名、文件归属。
- 不管 API 函数语义、Mock 字段完整性、类型系统、编码规范、技术选型。

#### `frontend-code-style`

编码可读性与交互完整性铁律。

结论：

- 不约束 TypeScript 类型系统。
- 高优先级是节省 token、人类阅读友好。
- 保留异步错误处理、timer 清理、弹窗重置、UI 交互完整性、命名和注释规则。

### 4. 废弃旧名称

旧 skill 名称不再保留：

- `frontend-file-structure`
- `frontend-project-style`
- `frontend-product-style`

原因：保留旧名称会造成 Claude Code skill 触发冲突，也会误导后续维护。

### 5. 常用命令发现

根目录当前只有原型预览命令：

```bash
pnpm run preview
```

没有发现正式 build、lint、test 脚本。后续不要编造不存在的命令。
