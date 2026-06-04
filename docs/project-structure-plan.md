# frontend-project-structure 重构计划

> 目标文件：`.claude/skills/frontend-project-structure/SKILL.md`  
> 计划类型：结构规范重构方案  
> 角色视角：伊比喜 —— 需求边界、验收标准、可执行性、风险控制  
> 当前状态：已按章节 6.2、7.1、10、11、12、13、14、15 的讨论结果更新

## 1. 背景与问题结论

当前 `frontend-project-structure` 已经具备较好的分层意识：它只约束目录结构、目录命名、文件命名与文件归属，不直接介入技术选型、API 语义、Mock 字段、编码风格或 UI 风格。这一方向继续保留。

本轮重构进一步调整以下关键口径：

1. 页面入口不再按文件路由规则组织，改为传统 `vue-router` 配置显式引用。
2. 页面文件从 `src/pages/<domain>/<feature>/index.vue` 改为 `src/pages/<domain>/<Feature>.vue`。
3. 不再使用 `[id].vue` 这类动态文件路由语法。
4. API 与 Mock 文件统一使用 `.js`，并使用业务语义文件名，避免 `index.ts` / `index.js`。
5. Mock 保持独立目录，并镜像 API 结构。
6. 共享层按复用范围拆分为：`features-shared`、`features/<domain>/shared`、`components`。
7. 单一业务 domain 专用 store 优先放入 `src/features/<domain>/stores/`。
8. 移除 `src/core/` 总目录，HTTP、auth、router、i18n 等基础设施直接作为 `src/` 一级目录。
9. 文件归属决策树需要覆盖“跨 domain 的业务共享”和“同 domain 跨 feature 的业务共享”。

结论：下一版 skill 不再是“文件路由 + index 入口 + core/shared 总目录”的结构，而是“传统路由 + 语义文件名 + 业务共享分层 + 一级基础设施目录”的结构判定系统。

---

## 2. 重构目标

### 2.1 总目标

将 `frontend-project-structure` 从“文件不要乱放”的规则列表，升级为“复杂业务增长后仍能稳定扩展”的结构规范。

### 2.2 具体目标

- 让 Claude 和开发者能在新建文件前稳定判断文件归属。
- 让页面入口、业务 feature、API、Mock、业务共享、通用 UI、基础设施有清晰边界。
- 避免 `components`、`utils`、`common`、`helper` 等目录逐渐变成垃圾场。
- 避免无意义的 `index.ts`、`index.js`、`index.vue` 在业务结构中泛滥。
- 避免传统路由项目被误套文件路由规范。
- 让自检结果可判定、可阻塞、可记录例外。

---

## 3. 重构原则

### 3.1 只处理结构，不越界

本 skill 仍然只处理：

- 目录层级；
- 目录命名；
- 文件命名；
- 文件归属；
- 页面路由入口位置；
- 业务模块结构关系。

不处理：

- 技术栈选择；
- API 函数语义；
- Mock 字段完整性；
- TypeScript 类型系统；
- 具体编码风格；
- UI 视觉风格；
- 交互细节。

### 3.2 技术栈由上层决定，结构层只做条件约束

例如：

- 是否使用 Pinia，由 `frontend-tech-stack` 判断。
- 如果已经确定使用 Pinia，store 文件放哪里，由 `frontend-project-structure` 约束。
- 是否使用传统 `vue-router` 配置由项目技术方案决定；本规范当前按已确认结果约束传统路由结构。

### 3.3 没有实际归属需求时，不创建空目录

标准结构是“允许存在的标准归属”，不是初始化时必须全部创建的目录模板。

### 3.4 业务优先，技术分层辅助

业务文件应围绕业务域聚合，技术基础设施应与业务模块分离。

---

## 4. 计划修改范围

目标文件：

```text
.claude/skills/frontend-project-structure/SKILL.md
```

建议新增或修改以下章节：

1. `业务域与业务能力定义`
2. `标准目录结构`
3. `src/pages/ 命名规则`
4. `src/router/ 命名规则`
5. `src/features/ 命名规则`
6. `src/features-shared/ 命名规则`
7. `src/components/ 命名规则`
8. `src/api/ 命名规则`
9. `src/mock/ 命名规则`
10. `状态管理文件归属`
11. `一级基础设施目录命名规则`
12. `文件归属决策树`
13. `用户确认例外记录格式`
14. 强化 `自检清单`
15. 更新 `版本与变更记录`

---

## 5. 推荐标准目录结构

建议将标准结构调整为：

```text
src/
  pages/                         # 传统 vue-router 页面入口，只做页面装配
    collect/
      Datasource.vue
      DatasourceDetail.vue
      DatasourceConfig.vue
      Task.vue

  router/                        # vue-router 配置、路由表、守卫注册
    routes.js
    guards.js

  features/                      # 业务域能力
    collect/
      datasource/
        components/
        utils/
        DatasourceList.vue
        DatasourceFormDialog.vue
      task/
        TaskList.vue
      shared/                    # collect domain 内跨 feature 共享
        components/
        utils/
        CollectStatus.js
      stores/
        collectStore.js

  features-shared/               # 跨 domain 的业务共享
    components/
    utils/
    BusinessStatus.js

  components/                    # 彻底业务无关的通用 UI 组件
    base/
    layout/
    form/
    table/

  api/                           # API 模块，.js + 语义文件名
    collect.js
    collect/
      Datasource.js
      Task.js
    project.js
    user.js

  mock/                          # Mock 模块，独立并镜像 API
    collect.js
    collect/
      Datasource.js
      Task.js

  stores/                        # 全局应用级状态，按技术栈存在

  http/                          # HTTP client、请求拦截器、错误归一化
  auth/                          # 登录态、权限、鉴权辅助
  i18n/                          # 国际化初始化与资源组织
  storage/                       # 本地存储适配
  realtime/                      # WebSocket / SSE 等实时通信
  map/                           # 地图、3D、Cesium 等底层能力

  styles/                        # 全局样式、变量、主题
  assets/                        # 静态资源，按项目需要存在
```

注意：以上结构是规范归属，不表示每个项目必须创建全部目录。

---

## 6. 业务域与业务能力规则

### 6.1 推荐定义

```md
### 业务域与业务能力定义

- `<domain>` 表示一级业务域，例如 `collect`、`project`、`user`。
- `<feature>` 表示业务域下的具体业务能力，例如 `datasource`、`task`、`member`。
- `<Feature>` 表示用于文件名的 PascalCase 业务能力名，例如 `Datasource`、`Task`、`Member`。
- `<domain>` 与 `<feature>` 必须来自真实业务语义，不得凭空造缩写。
- 禁止使用 `pg`、`cfgx`、`tmp-page`、`new`、`demo2` 等无意义名称。
```

### 6.2 推荐规则

当页面路径存在二级业务语义时，推荐保持以下结构关系：

```text
src/pages/<domain>/<Feature>.vue
src/features/<domain>/<feature>/
src/api/<domain>/<Feature>.js
src/mock/<domain>/<Feature>.js
```

示例：

```text
src/pages/collect/Datasource.vue
src/features/collect/datasource/
src/api/collect/Datasource.js
src/mock/collect/Datasource.js
```

如果 API 或 Mock 因规模较小暂时使用 domain 级文件，例如：

```text
src/api/collect.js
src/mock/collect.js
```

则必须在执行摘要中说明这是“domain 聚合文件”，并且不得与另一套拆分风格混用。

---

## 7. pages 重构建议

### 7.1 传统 vue-router 页面入口规则

采用传统 `vue-router` 配置文件显式声明路由，不使用文件路由命名规则。

保留：

- `src/pages/` 只放路由页面入口文件。
- 页面路径必须表达路由语义。
- 页面文件使用 PascalCase，例如 `Datasource.vue`、`DatasourceDetail.vue`。
- 详情页、配置页、编辑页使用语义文件名，例如 `DatasourceDetail.vue`、`DatasourceConfig.vue`、`DatasourceEdit.vue`。

移除：

- 不使用 `src/pages/<domain>/<feature>/index.vue` 作为默认页面入口。
- 不使用 `[id].vue` 表达动态路由参数。
- 不使用 `config/[id].vue` 这类文件路由嵌套语法。

### 7.2 建议新增职责说明

```md
- 页面文件应作为路由装配层，负责组合 feature 组件、读取路由参数、触发页面级初始化。
- 路由 path、动态参数、权限 meta 等由 `src/router/` 中的传统 vue-router 配置表达。
- 页面专属但较复杂的业务 UI 应下沉到 `features/<domain>/<feature>/`。
- 禁止在 `pages/` 下堆放业务组件、API 调用封装、Mock 数据、store、复杂工具函数。
```

### 7.3 推荐示例

```text
src/pages/collect/Datasource.vue
src/pages/collect/DatasourceDetail.vue
src/pages/collect/DatasourceConfig.vue
src/pages/collect/Task.vue
src/pages/collect/TaskDetail.vue
```

---

## 8. features 重构建议

### 8.1 保留现有规则

保留：

- `src/features/<domain>/<feature>/` 放业务模块相关组件与逻辑。
- 业务组件文件使用 PascalCase。
- feature 目录名使用小写业务语义名，优先跟随项目既有命名方式。
- 禁止提交 `new.vue`、`test.vue`、`aaa.vue`、`demo2.vue` 等临时名称。

### 8.2 建议增强规则

```md
- 单一业务能力专用的组件、composable、局部 helper，应优先放入 `features/<domain>/<feature>/`。
- feature 内部的 composable 与纯工具函数不强制拆成不同顶层类型，可按项目规模放入当前 feature 的 `utils/` 或语义文件中。
- 如果某个逻辑只被当前 domain 使用，但跨多个 feature 复用，放入 `features/<domain>/shared/`。
- 如果某个逻辑跨多个 domain 复用，但仍带业务语义，放入 `src/features-shared/`。
- 如果某个组件彻底业务无关，才考虑放入 `src/components/`。
```

### 8.3 推荐示例

```text
src/features/collect/datasource/DatasourceList.vue
src/features/collect/datasource/DatasourceFormDialog.vue
src/features/collect/datasource/utils/useDatasourceStatus.js
src/features/collect/task/TaskList.vue
src/features/collect/shared/components/CollectStatusTag.vue
src/features/collect/shared/utils/collectStatus.js
```

---

## 9. components 重构建议

### 9.1 当前问题

当前规则说 `components` 只放跨模块通用 UI 组件，但没有定义什么叫“通用”。这会导致开发者把“未来可能复用”的业务组件提前放入 `components`，造成污染。

### 9.2 推荐新增判定标准

```md
组件进入 `src/components/` 前必须满足至少一项：

- 已被两个及以上业务域实际引用，且不依赖业务语义。
- 明确属于布局、表单、表格、反馈、基础展示等业务无关 UI 能力。
- 经用户或项目规范确认要作为通用组件沉淀。

如果只是“未来可能复用”，默认先放入 `src/features/<domain>/<feature>/` 或对应业务 shared 层。
```

### 9.3 推荐示例

```text
src/components/layout/AppShell.vue
src/components/table/StatusTag.vue
src/components/form/SearchToolbar.vue
src/components/base/EmptyState.vue
```

---

## 10. api 重构建议

### 10.1 当前问题

旧规则强调 `src/api/<module>/index.ts`，但在复杂业务域中容易导致入口文件过大，也会产生无意义 `index` 文件名。本项目规范改为 `.js` 与业务语义文件名。

### 10.2 推荐规则

```md
- API 文件统一使用 `.js` 后缀。
- 不使用 `index.ts` / `index.js` 作为默认入口文件名。
- 小模块可以使用 `src/api/<domain>.js`。
- 当同一业务域下存在多个稳定业务能力时，应按 `<Feature>` 拆分：
  - `src/api/<domain>/<Feature>.js`
- `<Feature>.js` 使用 PascalCase，与业务实体或业务能力对应。
- 禁止同一模块同时出现 `datasource.js`、`Datasource.js`、`datasource/index.js` 等多种拆分风格。
- 禁止在页面或组件目录旁散落 `api.js`、`request.js`、`service.js` 等无归属文件。
```

### 10.3 推荐示例

```text
src/api/collect.js
src/api/collect/Datasource.js
src/api/collect/Task.js
src/api/project.js
src/api/user.js
```

---

## 11. mock 重构建议

### 11.1 推荐规则

Mock 采用独立目录，并镜像 API 结构。

```md
- Mock 文件统一使用 `.js` 后缀。
- Mock 目录应与 API 目录保持镜像结构。
- 如果 API 使用 `src/api/<domain>/<Feature>.js`，Mock 推荐使用：
  - `src/mock/<domain>/<Feature>.js`
- 如果 API 使用 `src/api/<domain>.js`，Mock 推荐使用：
  - `src/mock/<domain>.js`
- 禁止把 Mock 数据散落在页面、组件或任意 `data.js` 中。
- 禁止 API 按 feature 拆分，而 Mock 全部堆在一个无结构的大文件中，除非用户确认当前模块规模很小。
```

### 11.2 推荐示例

```text
src/mock/collect.js
src/mock/collect/Datasource.js
src/mock/collect/Task.js
src/mock/project.js
```

---

## 12. 业务共享层规则

### 12.1 新增原因

当前规范缺少跨模块共享代码的归属，容易产生以下目录并存：

```text
src/utils/
src/common/
src/helper/
src/hooks/
src/composables/
src/lib/
```

这会造成职责重叠和长期维护混乱。本轮不采用笼统的 `src/shared/`，而是按业务复用范围拆分。

### 12.2 推荐新增规则

```md
### `src/features-shared/` 命名规则

- `src/features-shared/` 放跨 domain 复用、但仍有业务语义的代码。
- 跨 domain 的共享 Vue 组件放入 `src/features-shared/components/`。
- composable 与纯工具函数不强制区分类型，统一放入 `src/features-shared/utils/`。
- 跨 domain 常量放入 `src/features-shared/` 根目录，并使用语义文件名，例如 `BusinessStatus.js`。
- 不得把仍带业务语义的共享组件放入 `src/components/`。

### `src/features/<domain>/shared/` 命名规则

- `src/features/<domain>/shared/` 放同一 domain 内跨 feature 复用、但未跨 domain 的业务共享代码。
- 跨 feature 未跨 domain 的组件放入 `src/features/<domain>/shared/components/`。
- 跨 feature 未跨 domain 的 composable / 纯工具函数统一放入 `src/features/<domain>/shared/utils/`。
- domain 内共享常量放入 `src/features/<domain>/shared/` 根目录，并使用语义文件名。
```

---

## 13. stores 规则

### 13.1 新增原因

状态管理是否使用由 `frontend-tech-stack` 决定。但如果项目已经使用 Pinia 或其他状态管理方案，store 文件位置属于结构规范问题。

### 13.2 推荐新增规则

```md
### 状态管理文件归属

当前 skill 不决定是否使用状态管理库；是否使用 Pinia 等状态管理方案由 `frontend-tech-stack` 决定。

当项目使用 Pinia 时：

- 全局应用级 store 放入 `src/stores/`。
- 单一业务 domain 专用 store 优先放入 `src/features/<domain>/stores/`。
- feature 内部非常局部的状态，如不需要作为跨 feature store，可作为普通 composable / utils 放入 feature 内。
- 默认不新增 `src/features/<domain>/<feature>/stores/`，避免 store 过度碎片化。
- 禁止在 `pages/` 下创建 store 文件。
- 禁止同时使用 `store` 和 `stores` 两种目录名。
```

---

## 14. 一级基础设施目录建议

### 14.1 当前问题

旧方案使用 `src/core/` 放 HTTP、auth、router、i18n、storage、realtime、map 等能力。用户确认移除 `core` 总目录，改为一级目录，让能力边界更直接。

### 14.2 推荐调整

```md
### 一级基础设施目录命名规则

- 不再设置 `src/core/` 总目录。
- 跨模块技术基础设施按清晰能力直接放在 `src/` 一级目录。
- HTTP client、请求拦截器、错误归一化放入 `src/http/`。
- 登录态、权限、鉴权辅助放入 `src/auth/`。
- 传统 `vue-router` 路由表、路由守卫注册放入 `src/router/`。
- i18n 初始化与资源组织放入 `src/i18n/`。
- 本地存储适配放入 `src/storage/`。
- WebSocket / SSE 等实时通信放入 `src/realtime/`。
- 地图、3D、Cesium、底层渲染适配放入 `src/map/` 或项目确认的语义目录。
- 普通业务组件、业务工具不得放入这些基础设施目录。
- 没有对应技术能力时不得创建空目录。
```

### 14.3 推荐结构

```text
src/http/
src/auth/
src/router/
src/i18n/
src/storage/
src/realtime/
src/map/
```

---

## 15. 文件归属决策树

建议新增以下章节，帮助 Claude 和开发者快速判断文件位置。

```md
## 文件归属决策树

新建文件前按顺序判断：

1. 是否是路由页面入口？
   - 是：放入 `src/pages/<domain>/<PageName>.vue`，并由 `src/router/` 显式配置。
2. 是否是传统 vue-router 配置、路由表或路由守卫？
   - 是：放入 `src/router/`。
3. 是否只服务某个 domain + feature？
   - 是：放入 `src/features/<domain>/<feature>/`。
4. 是否同一 domain 内跨多个 feature 复用？
   - 是：放入 `src/features/<domain>/shared/`。
5. 是否跨多个 domain 复用但仍有业务语义？
   - 是：放入 `src/features-shared/`。
6. 是否是彻底业务无关的通用 UI 组件？
   - 是：放入 `src/components/`。
7. 是否是业务接口请求？
   - 是：放入 `src/api/<domain>.js` 或 `src/api/<domain>/<Feature>.js`。
8. 是否是 Mock 数据？
   - 是：放入 `src/mock/<domain>.js` 或 `src/mock/<domain>/<Feature>.js`，并镜像 API。
9. 是否是全局应用级 store？
   - 是：放入 `src/stores/`。
10. 是否是单一业务 domain 专用 store？
   - 是：放入 `src/features/<domain>/stores/`。
11. 是否是 HTTP、auth、i18n、storage、realtime、map 等基础设施？
   - 是：放入对应一级目录，例如 `src/http/`、`src/auth/`。
12. 是否是全局样式、主题变量？
   - 是：放入 `src/styles/`。
13. 仍不能归类：
   - 不得新建临时目录，必须先询问或记录用户确认例外。
```

---

## 16. 禁止事项调整建议

在现有禁止事项基础上，建议新增：

```md
- 禁止使用文件路由动态段命名页面，例如 `[id].vue`。
- 禁止使用 `index.ts`、`index.js`、`index.vue` 作为无业务语义的默认文件名。
- 禁止同时创建 `common`、`utils`、`helper`、`shared` 等近义目录承担同一职责。
- 禁止把跨 domain 但仍有业务语义的共享代码塞入 `src/components/`。
- 禁止把同一 domain 内跨 feature 的共享代码放到缺少 domain 归属的 `src/features/shared/`。
- 禁止把 HTTP client、权限守卫、路由守卫等技术基础设施塞入业务 feature。
- 禁止在 `pages/` 下创建 API、Mock、store、复杂工具函数。
- 禁止同一业务能力的 API 与 Mock 使用不一致的拆分风格，除非记录用户确认例外。
- 禁止为了单个文件创建过深目录层级。
```

---

## 17. 自检清单重构建议

建议将当前自检清单升级为：

```md
## 自检清单

执行结束必须逐项检查：

- [ ] 已说明当前任务是否完成三层必跑协议。
- [ ] 已确认 `<domain>`、`<feature>`、`<Feature>` 的命名来源于业务语义。
- [ ] 页面入口位于 `src/pages/<domain>/<PageName>.vue`，并使用 PascalCase 文件名。
- [ ] 路由 path、动态参数、meta、守卫由 `src/router/` 配置表达。
- [ ] 没有新增 `[id].vue`、`config/[id].vue` 等文件路由命名。
- [ ] 单 feature 业务组件与逻辑位于 `src/features/<domain>/<feature>/`。
- [ ] 同 domain 跨 feature 共享位于 `src/features/<domain>/shared/`。
- [ ] 跨 domain 且仍带业务语义的共享位于 `src/features-shared/`。
- [ ] 彻底业务无关 UI 组件位于 `src/components/`，并满足通用组件判定条件。
- [ ] API 文件位于 `src/api/<domain>.js` 或 `src/api/<domain>/<Feature>.js`。
- [ ] Mock 文件位于 `src/mock/<domain>.js` 或 `src/mock/<domain>/<Feature>.js`，并镜像 API。
- [ ] store 文件位于 `src/stores/` 或 `src/features/<domain>/stores/`。
- [ ] HTTP、auth、router、i18n、storage、realtime、map 等基础设施位于对应一级目录。
- [ ] 没有 `tmp`、`test`、`demo2`、`aaa` 等无意义正式目录/文件名。
- [ ] 没有 `index.ts`、`index.js`、`index.vue` 等无业务语义文件名。
- [ ] 没有 `common`、`helper`、`shared` 等近义目录重复承担同一职责。
- [ ] 没有新旧规范目录或旧 skill 名称并存造成触发冲突。
```

---

## 18. 用户确认例外机制

### 18.1 新增原因

当前规则允许用户确认例外，但没有规定例外记录格式，容易被滥用。

### 18.2 推荐新增格式

```md
## 用户确认例外记录格式

如果因历史包袱、迁移成本、第三方约束导致无法满足规则，必须记录：

- 例外项：
- 违反规则：
- 业务 / 技术原因：
- 影响范围：
- 是否临时例外：
- 后续收敛建议：
- 用户确认：
```

---

## 19. 输出格式调整建议

建议保留现有输出格式，但补充以下字段：

```md
## frontend-project-structure 执行摘要

## 三层必跑协议状态

## 业务域 / 业务能力判定

## 命中规则

## 生成/修改清单

## 自检表
- [PASS/FAIL] 三层必跑协议状态已说明
- [PASS/FAIL] domain / feature / Feature 命名来自业务语义
- [PASS/FAIL] pages 与 router 归属正确
- [PASS/FAIL] features / features-shared / components 归属正确
- [PASS/FAIL] api / mock 文件位置、后缀与镜像关系正确
- [PASS/FAIL] stores 归属正确
- [PASS/FAIL] 一级基础设施目录归属正确
- [PASS/FAIL] 无无意义目录名/文件名
- [PASS/FAIL] 无近义重复目录
- [PASS/FAIL] 无新旧规范冲突

## 阻塞项

## 用户确认例外
```

---

## 20. 分阶段实施计划

### 阶段 1：补齐概念与边界

修改内容：

- 新增业务域 `<domain>`、业务能力 `<feature>`、文件名 `<Feature>` 定义。
- 明确二级业务能力下 `pages`、`features`、`api`、`mock` 的关系。
- 保留“不约束技术选型、API 语义、编码风格”的边界说明。

验收标准：

- 能回答 `collect` 与 `collect/datasource` 哪个是业务域、哪个是业务能力。
- 能解释 `api/collect.js` 与 `api/collect/Datasource.js` 何时使用。

### 阶段 2：调整 pages / router / API / Mock

修改内容：

- 改为传统 `vue-router` 配置口径。
- 页面文件使用 `src/pages/<domain>/<Feature>.vue`。
- API 使用 `.js` 与语义文件名。
- Mock 独立目录镜像 API。

验收标准：

- 不再出现文件路由动态段强制规则。
- 不再把 `index.ts` / `index.js` 作为推荐 API 入口。
- API 与 Mock 的拆分风格一致。

### 阶段 3：补齐业务共享与基础设施层

修改内容：

- 新增 `src/features-shared/` 规则。
- 新增 `src/features/<domain>/shared/` 规则。
- 收紧 `src/components/` 通用组件判定条件。
- 移除 `src/core/` 规则，新增一级基础设施目录规则。
- 新增状态管理文件归属规则。

验收标准：

- 跨 domain 业务共享、同 domain 跨 feature 共享、业务无关 UI 能明确区分。
- HTTP、auth、router、i18n 等基础设施有明确位置。
- 全局 store 与业务 domain store 有明确位置。

### 阶段 4：增加执行工具化规则

修改内容：

- 新增文件归属决策树。
- 重构自检清单。
- 新增用户确认例外记录格式。
- 更新输出格式。

验收标准：

- Claude 在新建文件前能按决策树判断归属。
- 自检表能明确 PASS / FAIL。
- 例外有格式，不会口头跳过。

### 阶段 5：版本记录

修改内容：

- 更新 `版本与变更记录`。

建议版本：

```md
- v1.1.0：改为传统 vue-router 页面入口结构；统一 `.js` 与语义文件名；新增 API/Mock 镜像规则、features-shared、domain shared、store 归属、一级基础设施目录、文件归属决策树、自检清单与用户确认例外机制。
```

---

## 21. 风险与控制

### 风险 1：规范变重，执行成本上升

控制方式：

- 使用决策树降低理解成本。
- 强调“按需存在，不创建空目录”。
- 保持规则短句化，避免长篇理论。

### 风险 2：`features-shared`、domain shared、`components` 边界混淆

控制方式：

- 跨 domain 但仍有业务语义：`src/features-shared/`。
- 同 domain 跨 feature：`src/features/<domain>/shared/`。
- 彻底业务无关 UI：`src/components/`。

简化判断：

- 还带业务语义：不要放 `components`。
- 没有跨 domain：不要放 `features-shared`。
- 没有 domain 归属：不要放 `features/<domain>/shared`。

### 风险 3：业务 store 到底放全局还是 feature 内

控制方式：

- 全局应用级状态放 `src/stores/`。
- 单一业务 domain 状态放 `src/features/<domain>/stores/`。
- feature 内部局部状态优先作为普通 composable / utils，不默认创建 feature 级 stores。
- 不在 `pages/` 下创建 store。

### 风险 4：当前项目不是完整 Vue 工程

控制方式：

- 明确该 skill 是为后续 Vue 工程迁移与复制准备的结构规范。
- 不根据 `final-prototype` 的原生 DOM 结构反推实际目录。
- 不要求当前仓库立即创建所有 `src/` 目录。

---

## 22. 最终验收标准

当重构完成后，`frontend-project-structure` 应满足：

1. 可以明确回答任意新文件应该放在哪里。
2. 可以区分业务域、业务能力、页面入口、传统路由配置、业务共享、通用 UI、技术基础设施。
3. 可以阻止 `components`、`utils`、`common`、`helper` 泛滥。
4. 可以避免无意义 `index.ts`、`index.js`、`index.vue`。
5. 可以让 API 与 Mock 的层级保持镜像。
6. 可以在使用 Pinia 等状态管理时给出 store 归属。
7. 可以通过自检清单做 PASS / FAIL 判断。
8. 可以记录用户确认例外，而不是隐性放行。
9. 不越界到技术选型、编码风格、API 语义或 UI 风格。

---

## 23. 伊比喜裁决

建议执行本重构，但要坚持以下底线：

> 结构规范必须服务可执行性，而不是堆砌目录模板。

最终版本不应该要求项目一开始就拥有所有目录，而应该在每次新建文件时，提供稳定、可审查、可扩展的归属判断。
