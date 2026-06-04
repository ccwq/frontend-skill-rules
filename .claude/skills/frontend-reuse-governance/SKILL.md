---
name: frontend-reuse-governance
description: 前端复用治理规范。用于 Vue / React 前端开发前检查功能相近的业务组件、通用组件、hook / composable 与业务逻辑，优先复用、扩展或重构，避免重复造轮子；搭配 frontend-project-structure 使用。
---

# frontend-reuse-governance

## 定位与触发场景

这是前端工程的**复用治理规范**。

高优先级目标：

- 开发前先找可复用资产，避免重复创建功能相近的组件或逻辑。
- 能扩展先扩展，不能扩展再评估重构或新建。
- 搭配 `frontend-project-structure` 使用：结构规范决定“放哪里”，复用治理决定“是否应该新建”。
- Vue / React 均适用；具体复用单元名称跟随项目事实。

在以下场景必须使用：

- 新建或修改业务组件之前。
- 新建或修改通用组件之前。
- 新建 Vue composable、React hook、store、utils、API 封装、Mock 逻辑之前。
- 重构或审查重复实现、重复组件、重复业务逻辑时。
- 用户要求“复用治理 / 避免重复组件 / 避免重复造轮子 / 相似组件检查”。

## 技术栈上下文 + 三 skill 协同协议

当前端开发/修改/审查任务涉及页面、组件、API、Mock、样式或交互时，默认先读取项目技术栈上下文，再依次执行：

0. 技术栈上下文：`docs/frontend-tech-stack.md`、`package.json`、锁文件、构建/样式/路由/状态管理/UI 库等现有配置。
1. `frontend-project-structure`
2. `frontend-reuse-governance`
3. `frontend-code-style`

若用户只显式调用当前 skill，则只执行当前层，但最终报告必须提醒：**协同协议未完整执行**。

规则冲突时，优先级固定为：

1. 技术栈上下文 / 项目事实：技术选型、依赖边界、构建体系优先。
2. `frontend-project-structure`：目录结构、目录命名、文件命名次之。
3. `frontend-reuse-governance`：复用、扩展、重构与新建判断再次。
4. `frontend-code-style`：具体编码风格、错误处理、资源清理、交互完整性最后。

任一自检项 `FAIL`，默认阻塞交付；必须继续修复到 `PASS`，或记录“用户确认例外”的原因。

## 强制执行流程

1. 先通过 `frontend-project-structure` 明确目标能力的结构归属：`business`、`business-shared`、`components`、`api`、`mock`、`stores` 等。
2. 识别目标能力：业务域、业务功能、交互行为、视觉形态、数据模型。
3. 开发前搜索默认范围：
   - 同 feature：`src/business/<domain>/<feature>/`。
   - 全局组件：`src/components/`。
   - 逻辑资产：项目现有 `hooks`、`composables`、`stores`、`utils`、`api`、`mock` 等目录。
4. 按名称语义、视觉形态、功能行为、数据模型综合判断相似度。
5. 能扩展现有实现时，优先扩展，不新建近似组件或逻辑。
6. 不能直接扩展时，先评估重构成本、影响范围与相似度。
7. 相似度达到 `85%` 以上时，优先考虑重构适配；如果仍然新建，必须在交付说明中记录原因。
8. 相似度低于 `85%` 时允许新建，但仍需说明与候选项的主要差异。
9. 完成后逐项自检；有 `FAIL` 不得声称完成。

## 相似度判断线索

### 名称语义

检查文件名、组件名、函数名、变量名、业务实体名是否表达相近能力。

示例线索：

- `DatasourceFormDialog` 与 `DatasourceEditDialog`。
- `UserPicker` 与 `MemberSelect`。
- `useDatasourceStatus`、`statusText`、`statusType`、`businessStatusMap` 等 hook / composable / 状态映射。

### 视觉形态

检查 UI 形态是否相近。

常见形态包括：

- 表格、分页表格、选择表格。
- 搜索栏、筛选区、高级筛选弹窗。
- 新建/编辑弹窗、详情抽屉、确认弹窗。
- 状态标签、步骤条、上传区、空状态。

### 功能行为

检查交互和业务行为是否重叠。

常见行为包括：

- 查询、筛选、重置、分页。
- 新建、编辑、删除、详情。
- 导入、导出、上传、下载。
- 审批、启停、发布、撤回。

### 数据模型

检查数据结构是否接近。

常见线索包括：

- props、emits、callback、form 字段是否类似。
- API 入参、响应字段、Mock 字段是否类似。
- 状态枚举、状态文案、状态颜色是否类似。
- 表格列、详情字段、筛选条件是否类似。

## 复用决策规则

### 1. 能扩展先扩展

已有实现能通过少量 props、slot、children、render prop、配置项或函数参数覆盖新需求时，优先扩展现有实现。

禁止为了少量差异复制一份新组件或新逻辑。

### 2. 就近复用优先

复用层级按就近原则逐级上提：

1. 单一 feature 内复用：保留在 `src/business/<domain>/<feature>/`。
2. 同 domain 跨 feature 复用：上提到 `src/business/<domain>/shared/`。
3. 跨 domain 但仍有业务语义：上提到 `src/business-shared/`。
4. 彻底业务无关 UI：上提到 `src/components/`。

具体文件归属必须服从 `frontend-project-structure`。

### 3. 85% 相似度优先重构

当候选实现与目标能力综合相似度达到 `85%` 以上时：

- 优先选择重构、参数化、拆分公共逻辑或抽取共享组件。
- 不默认强制阻塞新建，但必须说明为什么重构不合适。
- 不允许无说明地复制相近组件、状态映射、请求封装或 Mock 逻辑。

### 4. 避免过早公共化

如果只是“未来可能复用”，不要直接放入全局公共层。

应先放在当前 feature 或 domain shared 中，等出现真实跨域复用后再上提。

### 5. 允许新建的常见理由

以下情况可以新建，但必须在交付说明中记录：

- 相似候选仅视觉接近，但业务行为和数据模型明显不同。
- 扩展现有实现会破坏旧调用方或引入大量兼容分支。
- 重构影响范围过大，当前任务不适合扩大变更。
- 用户明确要求保持独立实现。
- 现有实现质量过低，复用会扩大技术债，且已说明后续收敛建议。

## 禁止事项

- 禁止开发前不搜索就新建业务组件、通用组件或业务逻辑。
- 禁止复制已有表格、筛选区、弹窗、状态标签等近似组件后只改少量字段。
- 禁止复制多份状态枚举、状态文案、状态颜色映射。
- 禁止复制近似 API 封装、Mock 数据生成逻辑或请求参数组装逻辑。
- 禁止把应在同 feature 或 domain shared 复用的能力直接塞到全局 `components`。
- 禁止为了“未来可能复用”过早抽象高复杂度公共组件。
- 禁止相似度达到 `85%` 以上仍无说明地新建。

## 自检清单

执行结束必须逐项检查：

- [ ] 已在开发前完成复用搜索。
- [ ] 已覆盖同 feature、全局组件、逻辑资产三个默认搜索范围。
- [ ] 已列出候选复用项或说明未找到候选项。
- [ ] 已按名称语义、视觉形态、功能行为、数据模型判断相似度。
- [ ] 能扩展时已优先扩展现有实现。
- [ ] 相似度达到 `85%` 以上时已优先考虑重构适配。
- [ ] 最终新建时已在交付说明中记录搜索范围、候选项、差异和新建理由。
- [ ] 复用后的文件归属符合 `frontend-project-structure`。
- [ ] 协同协议状态已说明。

## 输出格式

```markdown
## frontend-reuse-governance 执行摘要

## 协同协议状态

## 目标能力

## 搜索范围

## 候选复用项

## 相似度判断
- 名称语义：
- 视觉形态：
- 功能行为：
- 数据模型：
- 综合判断：

## 复用决策
- 决策：复用 / 扩展 / 重构 / 新建
- 理由：
- 若新建，为什么不能复用或扩展：

## 自检表
- [PASS/FAIL] 已完成开发前复用搜索
- [PASS/FAIL] 已覆盖同 feature、全局组件、逻辑资产
- [PASS/FAIL] 已按四类线索判断相似度
- [PASS/FAIL] 能扩展时优先扩展
- [PASS/FAIL] 85% 以上相似度已优先考虑重构适配
- [PASS/FAIL] 新建理由已记录
- [PASS/FAIL] 文件归属符合 frontend-project-structure
- [PASS/FAIL] 协同协议状态

## 阻塞项
```

## 版本与变更记录

- v1.3.0：跟随 `frontend-project-structure` 将业务目录命名从 `src/features/`、`src/features-shared/` 调整为 `src/business/`、`src/business-shared/`，避免复用治理与结构规范冲突。
- v1.2.0：将复用治理从 Vue 术语泛化为 Vue / React；搜索范围补充 hooks，复用扩展方式补充 children / render prop。
- v1.1.0：移除 `frontend-tech-stack` skill 依赖，技术栈改为读取 `docs/frontend-tech-stack.md` 与当前项目事实。
- v1.0.0：建立复用治理、开发前搜索、四类相似度判断、85% 重构阈值、交付说明机制与 `frontend-project-structure` 协同规则。
