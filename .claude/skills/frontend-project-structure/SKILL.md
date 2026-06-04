---
name: frontend-project-structure
description: 前端项目目录结构铁律。用于约束 Vue 3 前端项目的目录层级、目录命名、文件命名、页面文件路由位置、业务模块文件归属；只管结构与命名，不管 API 语义、Mock 字段、编码风格或技术选型。与 frontend-tech-stack、frontend-code-style 组成三层必跑规范。
---

# frontend-project-structure

## 定位与触发场景

这是前端工程的**项目目录结构、目录命名、文件命名铁律**。

当前 skill 只约束：

- 目录应该放在哪里。
- 目录应该叫什么。
- 文件应该放在哪里。
- 文件应该叫什么。
- 页面文件路由应如何落到 `src/pages/`。
- 业务模块文件应如何落到 `src/features/`、`src/api/`、`src/mock/` 等目录。

当前 skill 不约束：

- API 函数命名、请求路径、BASE 常量、响应字段。
- Mock 数据字段完整性。
- TypeScript 类型细节。
- async 错误处理、timer 清理、弹窗重置。
- UI 视觉风格、品牌色、组件风格。
- 技术栈选型和依赖选择。

在以下场景必须使用：

- 新建或调整前端项目目录。
- 新建 Vue 页面、业务组件、通用组件、API 文件、Mock 文件。
- 调整文件路由页面路径。
- 检查文件是否放错目录、目录命名是否混乱。
- 用户要求“目录结构规范 / 文件命名规范 / 项目结构规范 / 目录命名约束”。

## 三层必跑协议

当前端开发/修改/审查任务涉及 Vue 页面、组件、API、Mock、样式或交互时，默认依次执行：

1. `frontend-tech-stack`
2. `frontend-project-structure`
3. `frontend-code-style`

若用户只显式调用当前 skill，则只执行当前层，但最终报告必须提醒：**三层必跑协议未完整执行**。

三层规则冲突时，优先级固定为：

1. `frontend-tech-stack`：技术选型、依赖边界、构建体系优先。
2. `frontend-project-structure`：目录结构、目录命名、文件命名次之。
3. `frontend-code-style`：具体编码风格、类型安全、交互完整性再次。

任一自检项 `FAIL`，默认阻塞交付；必须继续修复到 `PASS`，或记录“用户确认例外”的原因。

## 强制执行流程

1. 先确认当前项目技术栈边界是否已由 `frontend-tech-stack` 明确。
2. 识别当前任务所属业务模块名，例如 `collect`、`project`、`user`；模块名必须来自业务语义，不要凭空造缩写。
3. 新建文件前先判断文件归属层级：`pages`、`features`、`components`、`api`、`mock`、`styles`、`core`。
4. 优先复用既有目录模式；已有同职责目录时不得创建近义重复目录。
5. 完成后逐项自检；有 `FAIL` 不得声称完成。

## 规则正文

### 标准目录结构

业务模块应遵守以下结构。`<module>` 是业务模块名，不固定为某个具体名称。

```text
src/
  pages/<module>/              # 文件路由页面入口
    index.vue                  # 模块列表/首页入口
    [id].vue                   # 模块详情页入口
    config/[id].vue            # 模块配置页入口，按需存在
  features/<module>/           # 业务组件、业务 composable、模块内逻辑
  components/                  # 全局通用 UI 组件
  api/<module>/
    index.ts                   # 模块 API 文件入口
  mock/<module>/
    index.ts                   # 模块 Mock 文件入口
  styles/                      # 全局样式、变量、主题
  core/                        # 地图、3D、底层能力等跨模块基础能力
```

### `src/pages/` 命名规则

- `src/pages/` 只放路由页面入口文件。
- 页面路径必须表达路由语义。
- 列表页 / 首页入口使用 `index.vue`。
- 详情页使用 `[id].vue`。
- 配置页、编辑页等嵌套页面使用语义目录，例如 `config/[id].vue`。
- 页面目录名使用小写业务模块名，优先使用 kebab-case 或项目既有模块命名方式。
- 禁止使用无意义缩写目录名，例如 `pg`、`cfgx`、`tmp-page`。

示例：

```text
src/pages/collect/datasource/index.vue
src/pages/collect/datasource/[id].vue
src/pages/collect/datasource/config/[id].vue
src/pages/collect/task/index.vue
src/pages/collect/task/[id].vue
```

### `src/features/` 命名规则

- `src/features/<module>/` 放业务模块相关组件与组合式逻辑。
- 业务模块目录名必须与 `pages/<module>` 语义一致。
- 业务组件文件使用 PascalCase，例如 `DatasourceList.vue`、`TaskEditor.vue`。
- composable 文件使用 `useXxx.ts`，例如 `useDatasourceStatus.ts`。
- 模块内部子目录应使用清晰业务名，例如 `datasource/`、`task/`、`shared/`。
- 禁止把临时文件命名为 `new.vue`、`test.vue`、`aaa.vue`、`demo2.vue` 并提交为正式结构。

示例：

```text
src/features/collect/datasource/DatasourceList.vue
src/features/collect/datasource/DatasourceFormDialog.vue
src/features/collect/task/TaskList.vue
src/features/collect/shared/useCollectStatus.ts
```

### `src/components/` 命名规则

- `src/components/` 只放跨模块通用 UI 组件。
- 通用组件文件使用 PascalCase。
- 子目录按通用能力命名，例如 `base/`、`layout/`、`form/`、`table/`。
- 只服务单一业务模块的组件不得放入 `components`，应放入 `features/<module>/`。

示例：

```text
src/components/layout/AppShell.vue
src/components/table/StatusTag.vue
src/components/form/SearchToolbar.vue
```

### `src/api/` 命名规则

当前 skill 只约束 API 文件位置和命名，不约束 API 函数语义。

- 模块 API 放在 `src/api/<module>/index.ts`。
- 多业务域 API 可在模块目录下按业务语义拆分，但必须保留清晰入口。
- API 目录名应与业务模块名一致。
- 禁止在组件目录旁边散落 `api.ts`、`request.ts`、`service.ts` 等无归属文件。

示例：

```text
src/api/collect/index.ts
src/api/project/index.ts
src/api/user/index.ts
```

### `src/mock/` 命名规则

当前 skill 只约束 Mock 文件位置和命名，不约束 Mock 字段语义。

- 模块 Mock 放在 `src/mock/<module>/index.ts`。
- Mock 目录名应与业务模块名一致。
- 禁止把 Mock 数据散落在页面、组件或任意 `data.ts` 中。

示例：

```text
src/mock/collect/index.ts
src/mock/project/index.ts
```

### `src/styles/` 命名规则

- 全局样式、主题变量、UnoCSS 补充样式放入 `src/styles/`。
- 主题相关文件命名应清晰，例如 `variables.less`、`theme.less`、`element-plus.less`。
- 组件局部样式优先保留在组件内；跨页面复用样式再上提。

### `src/core/` 命名规则

- `src/core/` 只放底层能力，例如 Cesium、地图、3D 场景、底层渲染适配。
- 普通业务组件不得放入 `core`。
- 没有底层能力需求时不要创建空 `core` 子目录。

## 禁止事项

- 禁止创建无语义目录名：`aaa`、`tmp`、`new`、`test`、`demo2`。
- 禁止同一业务模块在 `pages`、`features`、`api`、`mock` 中使用不同命名。
- 禁止把业务组件放入 `src/components/`。
- 禁止把通用组件放入单一业务 feature 后再跨模块引用。
- 禁止页面、组件目录旁散落 API/Mock 文件。
- 禁止为单个文件创建过深无意义目录层级。
- 禁止保留废弃旧 skill 名称或旧目录造成触发冲突。

## 自检清单

执行结束必须逐项检查：

- [ ] 业务模块目录名在 `pages`、`features`、`api`、`mock` 中一致。
- [ ] 页面入口位于 `src/pages/`，并符合文件路由命名。
- [ ] 业务组件位于 `src/features/<module>/`。
- [ ] 通用组件位于 `src/components/`，且命名为 PascalCase。
- [ ] API 文件位于 `src/api/<module>/index.ts` 或清晰模块入口下。
- [ ] Mock 文件位于 `src/mock/<module>/index.ts` 或清晰模块入口下。
- [ ] 没有 `tmp`、`test`、`demo2`、`aaa` 等无意义正式目录/文件名。
- [ ] 没有新旧规范目录并存造成 skill 或模块命名冲突。
- [ ] 三层必跑协议状态已说明。

## 输出格式

```markdown
## frontend-project-structure 执行摘要

## 命中规则

## 生成/修改清单

## 自检表
- [PASS/FAIL] 业务模块目录命名一致
- [PASS/FAIL] pages 文件路由位置与命名正确
- [PASS/FAIL] features/components 归属正确
- [PASS/FAIL] api/mock 文件位置正确
- [PASS/FAIL] 无无意义目录名/文件名
- [PASS/FAIL] 三层必跑协议状态

## 阻塞项
```

## 版本与变更记录

- v1.0.0：建立项目目录结构、目录命名、文件命名铁律；语义限定为结构与命名，不包含 API 语义、编码规范或技术选型。
