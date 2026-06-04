---
name: frontend-code-style
description: 前端编码规范铁律。用于 Vue / React 前端项目的可读性、命名、格式、注释、异步错误处理、弹窗重置、副作用清理、UI 交互完整性审查与执行；不约束 TypeScript 类型。与 frontend-project-structure、frontend-reuse-governance 组成三个前端规范 skill。
---

# frontend-code-style

## 定位与触发场景

这是前端工程的**编码可读性与交互完整性铁律**。

高优先级目标：

- 节省 token,避免无效占用上下文。
- 人类阅读友好。
- 规则短、清晰、可执行。
- 不在本 skill 中约束类型系统。
- Vue / React 均适用；具体 API、UI 库与生命周期写法跟随项目事实。

在以下场景必须使用：

- 新建或修改 Vue / React 组件、composable / hook、表格、弹窗、表单。
- 新增搜索、筛选、按钮、异步请求、确认框、定时器、轮询。
- 审查静默吞错、资源泄漏、空壳交互、命名混乱、注释噪音。
- 用户要求“编码规范 / 代码风格 / 可读性 / 交互完整性”。

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

1. 先识别当前改动涉及的前端文件、表单、表格、异步请求、副作用、timer、按钮。
2. 代码优先可读，少写炫技抽象，贴近周边已有写法。
3. 所有异步操作必须考虑成功、失败、用户取消与状态回退。
4. 所有可点击 UI 必须有可见行为或明确占位提示。
5. 完成后逐项自检；有 `FAIL` 不得声称完成。

## 规则正文

### 格式与文件命名

- 缩进：2 个空格。
- 引号：单引号。
- 分号：不使用分号。
- 行宽：目标 `printWidth: 100`。
- 组件文件：PascalCase，例如 `DatasourceList.vue`、`DatasourceList.jsx`、`DatasourceList.tsx`；后缀跟随项目事实。
- 代码风格贴近周边已有代码，不引入割裂写法。

### 命名规范

- 布尔变量使用 `is`、`has`、`can` 前缀。
- 事件处理函数使用 `handle` 前缀，例如 `handleDelete`、`handleSubmit`。
- 状态/映射函数使用清晰名称，例如 `statusType`、`statusText`。
- 多处重复的状态映射应抽到 shared composable / hook 或模块公共工具。
- 禁止无意义缩写命名。

### 注释规范

- 注释优先中文。
- 注释说明“为什么”，不要复述“做什么”。
- 复杂业务规则、非直觉参数、兼容历史行为必须注释。
- 简单绑定、基础条件判断、显而易见赋值不需要注释。
- 禁止无意义缩写代号，例如 `(pg-ds)`、`(newDsOv)`。

### 弹窗表单重置

弹窗关闭时，`handleClose` 必须重置**所有** form 字段，包括扩展字段和隐藏字段。

Vue 推荐模式：

```js
const initialForm = () => ({
  name: '',
  status: '',
})

const form = reactive(initialForm())

function handleClose() {
  Object.assign(form, initialForm())
  emit('update:visible', false)
}
```

React 推荐模式：

```jsx
const initialForm = () => ({
  name: '',
  status: '',
})

function handleClose() {
  setForm(initialForm())
  setVisible(false)
}
```

禁止只重置部分字段，导致再次打开弹窗残留脏数据。

### 异步操作错误处理

所有异步操作必须有错误处理，不允许静默吞错。消息组件、确认组件跟随当前 UI 库，例如 Element Plus、Ant Design、MUI 等。

```js
async function handleDelete(row) {
  try {
    await confirmDelete(`确认删除「${row.name}」？`)
    await deleteTask(row.id)
    showSuccess('删除成功')
    await loadData()
  } catch {
    // 用户取消或删除失败都不能产生 uncaught；失败提示可按业务细化。
  }
}
```

Vue `watch` 或 React `useEffect` 中的异步调用必须处理失败并回退状态：

```js
watch(() => form.taskType, async (val) => {
  if (!val) return
  try {
    const { data } = await getDatasourcePage({ pageSize: 100 })
    datasourceOptions.value = data.list
  } catch {
    showError('加载数据源失败')
    datasourceOptions.value = []
  }
})
```

```jsx
useEffect(() => {
  if (!form.taskType) return

  let ignore = false

  async function loadOptions() {
    try {
      const { data } = await getDatasourcePage({ pageSize: 100 })
      if (!ignore) setDatasourceOptions(data.list)
    } catch {
      showError('加载数据源失败')
      if (!ignore) setDatasourceOptions([])
    }
  }

  loadOptions()

  return () => {
    ignore = true
  }
}, [form.taskType])
```

### timer 与资源清理

凡使用 `setTimeout`、`setInterval`、轮询、监听器等资源，必须在生命周期或 effect cleanup 中清理。

Vue：

```js
let pollTimer

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
```

React：

```jsx
useEffect(() => {
  const pollTimer = setInterval(loadData, 5000)

  return () => {
    clearInterval(pollTimer)
  }
}, [])
```

禁止组件卸载后继续轮询或触发状态更新。

### UI 交互完整性

所有 UI 元素必须有对应实现：

- 搜索框必须绑定状态并触发加载或过滤；Vue 可用 `v-model`，React 可用 `value` + `onChange` 或项目现有表单方案。
- 筛选下拉必须绑定状态并触发加载或过滤。
- 新建/编辑按钮必须打开对应弹窗或路由。
- 详情按钮必须进入详情视图，不得与编辑共用同一个跳转函数。
- 删除按钮必须有确认和结果反馈。
- 导出暂未实现时必须提示：

```js
function handleExport() {
  showInfo('导出功能待实现')
}
```

禁止空壳交互：

```jsx
<button onClick={() => {}}>导出</button>
```

## 禁止事项

- 禁止异步请求无错误处理或失败无反馈。
- 禁止确认框取消造成 uncaught。
- 禁止 timer、轮询、监听器不清理。
- 禁止按钮、搜索、筛选、导出等 UI 空壳。
- 禁止编辑和详情共用同一个处理函数。
- 禁止复制多份状态映射逻辑。
- 禁止无意义缩写注释。

## 自检清单

执行结束必须逐项检查：

- [ ] 所有 async 操作有错误处理。
- [ ] 确认框取消不会产生 uncaught。
- [ ] 异步副作用有失败回退。
- [ ] 所有 `setTimeout` / `setInterval` 在卸载或 cleanup 时清理。
- [ ] 弹窗关闭重置全部字段。
- [ ] 搜索框、筛选下拉绑定并触发行为。
- [ ] 所有按钮有实现或明确占位提示。
- [ ] 编辑和详情使用不同处理逻辑。
- [ ] 注释、命名、格式符合规范。
- [ ] 可复用状态映射已抽取，未重复散落多个组件。
- [ ] 协同协议状态已说明。

## 输出格式

```markdown
## frontend-code-style 执行摘要

## 命中规则

## 生成/修改清单

## 自检表
- [PASS/FAIL] 异步操作有错误处理
- [PASS/FAIL] timer 有卸载/cleanup 清理
- [PASS/FAIL] 弹窗关闭重置完整字段
- [PASS/FAIL] 所有按钮/筛选/搜索都有实现
- [PASS/FAIL] 注释/命名/格式符合规范
- [PASS/FAIL] 协同协议状态

## 阻塞项
```

## 版本与变更记录

- v1.4.0：将编码规范从 Vue-only 泛化为 Vue / React；补充 React controlled component、useEffect cleanup 与 hook 表述，UI 库 API 跟随项目事实。
- v1.3.0：移除 `frontend-tech-stack` skill 依赖，技术栈改为读取 `docs/frontend-tech-stack.md` 与当前项目事实。
- v1.2.0：加入 `frontend-reuse-governance`，前端规范执行顺序升级为结构、复用治理、编码风格三个 skill 协同。
- v1.1.0：整体移除 TypeScript/类型系统约束，优先节省 token 与人类阅读友好。
- v1.0.0：建立编码风格、异步错误处理、资源清理、弹窗重置与交互完整性铁律。
