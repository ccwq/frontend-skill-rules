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

`FAIL` 是否阻塞取决于执行模式：生成模式默认阻塞；审查模式不阻塞报告输出；YOLO 模式记录原因、风险与后续建议后继续推进。若用户未指定模式，按任务意图判定并在输出中说明。

## 执行模式与 FAIL 处理策略

1. **生成模式**
   - 适用：新建页面、组件、API、Mock、store、样式、交互逻辑，或主动修改代码以交付功能。
   - FAIL 处理：在生成模式下阻塞交付；必须修复到 `PASS`，或记录用户确认例外。
   - 目的：防止新生成内容继续扩大技术债。
2. **审查模式**
   - 适用：用户要求检查、审查、列问题、list、评估规范符合度，但没有要求立即修改。
   - FAIL 处理：不阻塞报告输出；只列问题、影响、建议优先级与可选修复方案。
   - 目的：避免审查任务因为发现问题反而无法交付审查结论。
3. **YOLO 模式**
   - 适用：用户明确要求 `yolo`、快速推进、自行判断、不要等待确认、需要阻塞时根据上下文自行通过等场景。
   - FAIL 处理：遇到本应阻塞的 `FAIL` 时，记录判断原因、风险、影响范围和后续建议，然后继续推进；不得静默忽略。
   - 目的：减少等待用户决策造成的效率损耗，同时保留风险可追踪。
4. **模式默认判定**
   - 用户明确“生成 / 新建 / 实现 / 修改 / 修复”时，默认生成模式。
   - 用户明确“审查 / 检查 / list / 评估 / 不要修改”时，默认审查模式。
   - 用户明确“yolo / 自行通过 / 别等我 / 不用确认 / 快速推进”时，默认 YOLO 模式。
   - 无法判断时，先说明默认采用的模式；如果模式会显著改变是否阻塞，再询问用户。

## 强制执行流程

1. 先识别当前改动涉及的前端文件、表单、表格、异步请求、副作用、timer、按钮。
2. 代码优先可读，少写炫技抽象，贴近周边已有写法。
3. 所有异步操作必须考虑成功、失败、用户取消与状态回退。
4. 所有可点击 UI 必须有可见行为或明确占位提示。
5. 完成后逐项自检；生成模式下有阻塞性 `FAIL` 不得声称完成，审查模式需列明问题，YOLO 模式需记录自行通过原因、风险与后续建议。

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

注释只写**代码本身说不出来**的内容，优先说明：为什么这样写、业务规则或限制、副作用、边界条件、历史坑、兼容原因、什么情况下不能随便改。

禁止生成重复代码行为的废话注释：

```js
// 获取用户列表
const users = await getUserList()

// 设置 loading
loading.value = true

// 遍历数组
items.forEach(item => {})
```

#### 先判断代码类型

添加、修改或审查注释前，先判断代码属于哪一类，再决定注释方式：

- 测试用例。
- 组件。
- 函数 / 方法。
- React Hooks。
- Vue Composition API。
- 类型 / Props / Emit。
- 复杂逻辑。
- 接口请求 / 状态管理。
- 路由 / 权限。
- 临时处理 / 兼容处理。

#### 不同类型的注释重点

- 测试用例：简单测试不用解释每一步；新增或修改单元测试、E2E 测试时，每个测试用例前按全局规则使用中文 GWT 注释，说明 `Given`、`When`、`Then`、`防回归`。
- 组件：说明组件职责、使用场景、状态来源、props 边界、权限或异常情况；纯展示组件通常不需要注释。
- 函数 / 方法：说明职责、为什么这样处理、副作用、边界条件、业务规则来源；函数名已经清楚且没有隐藏规则时不要强行注释。
- React Hooks：说明 `useEffect` 触发条件、依赖项为什么这样写、清理逻辑、副作用，以及 `useMemo` / `useCallback` 的性能原因。
- Vue Composition API：说明 `ref` / `reactive` 的业务含义、`computed` 的组合规则、`watch` / `watchEffect` 的监听原因、生命周期初始化或清理逻辑、composable 的输入输出与副作用。
- 类型 / Props / Emit：说明字段业务含义、取值限制、是否影响组件行为、字段来源、兼容问题、事件触发时机。
- 复杂逻辑：说明背景、为什么这样写、风险、不能随便改的点。
- 接口请求 / 状态管理：说明缓存策略、请求顺序、失败兜底、乐观更新、状态影响范围、跨页面影响。
- 路由 / 权限：说明路由参数来源、URL 状态同步原因、权限来源、前端权限与后端权限关系、异常跳转逻辑。
- 临时处理 / 兼容处理：使用 `TODO` / `FIXME` / `HACK` 时必须说明原因和删除条件；有关联 issue 或需求编号才写，没有就不要编造。

普通 `loading`、`visible`、`list` 等状态，不要写无意义注释。

#### 注释风格要求

- 使用中文注释，路径、命令、API 名称等固定形式可保留英文。
- 简洁、准确，优先使用单行注释。
- 只有组件、复杂逻辑、类型说明才使用多行注释。
- 不重复代码行为。
- 不编造业务背景、负责人、日期、需求编号。
- 如果原因无法从代码判断，写：

```ts
// 需要确认：这里的业务原因不明确。
```

- 禁止无意义缩写代号，例如 `(pg-ds)`、`(newDsOv)`。

#### 注释示例

业务阈值：

```ts
// 199 元包邮是当前活动规则，不跟随后端默认包邮线变化。
if (orderAmount >= 199) {
  freeShipping.value = true
}
```

Vue `watch` 副作用：

```ts
// 切换组织后，已选用户不再属于当前组织，必须清空，避免提交跨组织用户。
watch(selectedOrgId, orgId => {
  userStore.clearSelectedUsers()
  fetchUsers(orgId)
})
```

React `useEffect` 依赖：

```tsx
// 只依赖 userId，避免父组件重建 user 对象时重复请求详情接口。
useEffect(() => {
  fetchUserDetail(userId)
}, [userId])
```

Props 边界：

```ts
interface Props {
  /**
   * 只读模式仅用于详情页。
   * 开启后隐藏提交按钮，但不阻止外部调用 submit。
   */
  readonly?: boolean
}
```

临时兼容：

```ts
// HACK: 后端暂未返回 roleName，临时根据 roleCode 映射展示。
// 删除条件：用户详情接口返回 roleName 后移除。
const roleName = roleNameMap[user.roleCode]
```

#### 注释专项输出格式

当用户明确要求生成或审查注释时，按以下格式输出：

```markdown
1. 注释判断
- 需要注释的位置：
- 不建议注释的位置：

2. 添加注释后的代码
```

如果代码完全不需要注释，直接输出：

```text
不建议添加注释。当前代码通过命名已经能表达清楚，没有明显隐藏规则、边界条件或副作用。
```

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
- [ ] 必要注释已说明业务规则、边界条件、副作用或兼容原因。
- [ ] 未添加复述代码行为的废话注释。
- [ ] `TODO` / `FIXME` / `HACK` 已说明原因与删除条件，未编造编号。
- [ ] 可复用状态映射已抽取，未重复散落多个组件。
- [ ] 协同协议状态已说明。

## 输出格式

```markdown
## frontend-code-style 执行摘要

## 执行模式
- 模式：生成 / 审查 / YOLO
- FAIL 处理策略：

## 命中规则

## 生成/修改清单

## 自检表
- [PASS/FAIL] 异步操作有错误处理
- [PASS/FAIL] timer 有卸载/cleanup 清理
- [PASS/FAIL] 弹窗关闭重置完整字段
- [PASS/FAIL] 所有按钮/筛选/搜索都有实现
- [PASS/FAIL] 注释只说明代码本身说不出来的原因、边界或副作用
- [PASS/FAIL] 协同协议状态

## 阻塞项
- 生成模式：列真正阻塞交付的问题。
- 审查模式：列高优先级问题，不代表阻塞报告输出。
- YOLO 模式：列已自行通过的阻塞项，说明原因、风险与后续建议。
```

## 版本与变更记录

- v1.0.0：建立前端编码风格规范基线，覆盖 Vue / React 可读性、命名、格式、中文注释、异步错误处理、弹窗重置、副作用清理、UI 交互完整性，以及生成 / 审查 / YOLO 执行模式。
