---
name: frontend-project-structure
description: 前端项目目录结构铁律。用于约束 Vue / React 前端项目的目录层级、目录命名、文件命名、页面入口位置、文件路由例外、业务模块文件归属；只管结构与命名，不管 API 语义、Mock 字段、编码风格、复用治理或技术选型。与 frontend-reuse-governance、frontend-code-style 组成三个前端规范 skill。
---

# frontend-project-structure

## 定位与触发场景

这是前端工程的**项目目录结构、目录命名、文件命名铁律**。

当前 skill 只约束：

- 目录应该放在哪里。
- 目录应该叫什么。
- 文件应该放在哪里。
- 文件应该叫什么。
- 显式路由页面入口应如何落到 `src/pages/`。
- 文件路由框架项目应如何记录和处理例外。
- 路由配置、路由表、路由守卫应如何落到 `src/router/` 或项目已确认的路由目录。
- 业务模块文件应如何落到 `src/business/`、`src/business-shared/`、`src/api/`、`src/mock/` 等目录。

当前 skill 不约束：API 函数语义、Mock 字段、类型系统、编码风格、复用治理、技术选型或视觉风格。

在以下场景必须使用：

- 新建或调整前端项目目录。
- 新建 Vue / React 页面、业务组件、通用组件、API 文件、Mock 文件。
- 调整显式路由页面入口、文件路由页面结构和路由配置归属。
- 检查文件是否放错目录、目录命名是否混乱。
- 用户要求“目录结构规范 / 文件命名规范 / 项目结构规范 / 目录命名约束”。

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
4. `frontend-code-style`：具体编码风格、交互完整性最后。

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

1. 先确认当前项目技术栈上下文是否已由 `docs/frontend-tech-stack.md` 与当前项目事实明确。
2. 识别当前项目是显式路由项目还是文件路由项目；文件路由例外必须来自项目事实或用户确认。
3. 识别当前任务所属业务域 `<domain>`，例如 `collect`、`project`、`user`；名称必须来自业务语义，不要凭空造缩写。
4. 识别当前任务所属业务能力 `<feature>` 与文件名 `<Feature>`，例如 `datasource` / `Datasource`、`task` / `Task`。
5. 新建文件前先判断文件归属层级：`pages`、`router`、`api`、`mock`、`stores`、`http`、`auth`、`i18n`、`storage`、`realtime`、`map`、`styles`、`business`、`business-shared`、`components`。
6. 文件归属确定后，不代表必须新建；若任务涉及业务组件、通用组件或业务逻辑，必须交给 `frontend-reuse-governance` 判断是否复用、扩展或重构。
7. 优先复用既有目录模式；已有同职责目录时不得创建近义重复目录。
8. 完成后逐项自检；生成模式下有阻塞性 `FAIL` 不得声称完成，审查模式需列明问题，YOLO 模式需记录自行通过原因、风险与后续建议。

## 规则正文

### 业务域与业务能力定义

- `<domain>` 表示一级业务域，例如 `collect`、`project`、`user`。
- `<feature>` 表示业务域下的具体业务能力，例如 `datasource`、`task`、`member`。
- `<Feature>` 表示用于文件名的 PascalCase 业务能力名，例如 `Datasource`、`Task`、`Member`。
- `<domain>` 与 `<feature>` 必须来自真实业务语义，不得凭空造缩写。
- 禁止使用 `pg`、`cfgx`、`tmp-page`、`new`、`demo2` 等无意义名称。

### 标准目录结构

业务模块应遵守以下结构。目录按需存在，不表示每个项目必须创建全部目录。

```text
src/
  pages/                         # 显式路由页面入口，只做页面装配；文件路由项目见例外规则
    collect/
      Datasource.vue             # Vue 示例；React 可按项目事实使用 .jsx / .tsx
      DatasourceDetail.vue
      Task.tsx

  router/                        # vue-router / react-router 等路由配置、路由表、守卫注册
    routes.js
    guards.js

  business/                      # 业务域能力
    collect/
      datasource/
        components/
        composables/             # Vue 项目优先用于业务逻辑复用
        hooks/                   # React 项目优先用于业务逻辑复用
        utils/                   # 纯工具函数；混合写法跟随项目事实
        DatasourceList.vue
        DatasourceList.tsx
        DatasourceFormDialog.vue
      shared/                    # collect domain 内跨 feature 共享
        components/
        composables/             # Vue 项目优先；React 项目可按项目事实使用 hooks
        hooks/
        utils/
        CollectStatus.js
      stores/
        collectStore.js

  business-shared/               # 跨 domain 的业务共享
    components/
    composables/                 # Vue 项目优先
    hooks/                       # React 项目优先
    utils/
    BusinessStatus.js

  components/                    # 彻底业务无关的通用 UI 组件
    base/
    layout/
    form/
    table/
    index.ts                     # 仅当项目已有导出入口模式时允许

  api/                           # API 模块，默认 .js，后缀可跟随项目事实
    collect.js
    collect/
      Datasource.js
      Task.js
      index.ts                   # 仅当项目已有导出入口模式时允许

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

### `src/pages/` 命名规则

- `src/pages/` 只放显式路由页面入口文件；文件路由项目见“文件路由项目例外规则”。
- 页面路径必须表达路由语义，但路由 path、动态参数、meta、权限等由 `src/router/` 或项目已确认的路由目录显式配置。
- 页面文件使用 PascalCase，例如 `Datasource.vue`、`DatasourceDetail.jsx`、`DatasourceConfig.tsx`；后缀跟随项目事实。
- 详情页、配置页、编辑页使用语义文件名，例如 `DatasourceDetail`、`DatasourceConfig`、`DatasourceEdit`。
- 页面文件应作为路由装配层，负责组合业务组件、读取路由参数、触发页面级初始化。
- 页面专属但较复杂的业务 UI 应下沉到 `src/business/<domain>/<feature>/`。
- 默认禁止使用文件路由动态段，例如 `[id].vue`、`[id].tsx`、`config/[id].tsx`；如果项目明确采用 Next / Nuxt / Remix / TanStack Start 等文件路由框架，按“文件路由项目例外规则”处理。
- 禁止使用 `index.vue`、`index.jsx`、`index.tsx` 作为无业务语义的默认页面入口；文件路由框架约定的 `page.tsx`、`layout.tsx`、Nuxt `pages/**/index.vue` 等例外必须来自项目事实。
- 禁止在 `pages/` 下堆放业务组件、API 调用封装、Mock 数据、store、复杂工具函数。

### 文件路由项目例外规则

当项目事实或用户确认表明项目采用 Next、Nuxt、Remix、TanStack Start 等文件路由框架时，当前 skill 不强制套用“`src/pages/<domain>/<PageName>` + 显式路由配置”模型。

文件路由项目允许框架约定命名，例如：

- Next / TanStack Start：`app/**/page.tsx`、`app/**/layout.tsx`、`app/**/route.ts`、`[id]`、`[...slug]`。
- Nuxt：`pages/**/index.vue`、`pages/**/[id].vue`、`layouts/`、`middleware/`。
- Remix：`app/routes/**` 下的 route module、动态段和布局约定。

文件路由例外仍需遵守以下边界：

- 必须在执行摘要或用户确认例外中记录“项目事实确认采用文件路由框架”。
- 路由文件可以跟随框架约定，但业务组件仍应下沉到 `src/business/<domain>/<feature>/` 或框架项目已确认的业务目录。
- API 请求模块、Mock、store、HTTP client、auth、i18n、storage、realtime、map 等强类型文件不得因为离页面近而散落到路由目录。
- 如果框架本身有 server route / API route 约定，应先区分“前端请求封装”与“服务端 route handler”；前端请求封装仍归 `src/api/` 或项目已确认的 API 目录。
- 文件路由动态段命名必须来自框架约定，不得在显式路由项目中借用。

### `src/router/` 命名规则

- `src/router/` 放当前项目已确认路由方案的配置、路由表、路由守卫或权限注册。
- Vue 项目可对应 `vue-router`；React 项目可对应 `react-router`、TanStack Router 或项目既有路由封装。
- 显式路由项目中，路由动态参数通过路由配置表达，不通过页面文件名表达；文件路由框架例外必须记录项目事实。
- 路由配置文件默认使用 `.js` 后缀与语义文件名，例如 `routes.js`、`guards.js`；如项目已使用 `.ts`，跟随项目事实。
- 禁止把业务页面组件、业务 API、业务 Mock 放入 `router`。

### `src/business/` 命名规则

- `src/business/<domain>/<feature>/` 放单一业务能力相关组件与逻辑。
- 业务域目录名必须与 `pages/<domain>`、`api/<domain>`、`mock/<domain>` 语义一致。
- feature 目录名使用小写业务语义名，优先跟随项目既有命名方式。
- 业务组件文件使用 PascalCase，例如 `DatasourceList.vue`、`TaskEditor.tsx`；后缀跟随项目事实。
- Vue 项目中，feature 内部逻辑复用优先放入 `composables/`，纯工具函数放入 `utils/`。
- React 项目中，feature 内部逻辑复用优先放入 `hooks/`，纯工具函数放入 `utils/`。
- 混合写法或历史项目必须跟随项目事实；不要为了统一命名而扩大重构。
- 同一 domain 内跨多个 feature 复用的业务共享代码放入 `src/business/<domain>/shared/`。
- 单一业务 domain 专用 store 优先放入 `src/business/<domain>/stores/`。
- 禁止把临时文件命名为 `new.vue`、`test.tsx`、`aaa.jsx`、`demo2.vue` 并提交为正式结构。

### `src/business-shared/` 命名规则

- `src/business-shared/` 放跨 domain 复用、但仍有业务语义的代码。
- 跨 domain 的共享业务组件放入 `src/business-shared/components/`。
- Vue composable 优先放入 `src/business-shared/composables/`；React hook 优先放入 `src/business-shared/hooks/`；纯工具函数放入 `src/business-shared/utils/`。
- 混合写法或历史项目必须跟随项目事实，不强行同时创建 `hooks` 与 `composables`。
- 跨 domain 常量放入 `src/business-shared/` 根目录，并使用语义文件名，例如 `BusinessStatus.js`。
- 不得把仍带业务语义的共享组件放入 `src/components/`。

### `src/business/<domain>/shared/` 命名规则

- `src/business/<domain>/shared/` 放同一 domain 内跨 feature 复用、但未跨 domain 的业务共享代码。
- 跨 feature 未跨 domain 的组件放入 `src/business/<domain>/shared/components/`。
- Vue composable 优先放入 `src/business/<domain>/shared/composables/`；React hook 优先放入 `src/business/<domain>/shared/hooks/`；纯工具函数放入 `src/business/<domain>/shared/utils/`。
- 混合写法或历史项目必须跟随项目事实。
- domain 内共享常量放入 `src/business/<domain>/shared/` 根目录，并使用语义文件名。
- 禁止把同一 domain 内共享代码放到缺少 domain 归属的 `src/business/shared/`。

### `src/components/` 命名规则

- `src/components/` 只放彻底业务无关的通用 UI 组件。
- 通用组件文件使用 PascalCase，后缀跟随项目事实。
- 子目录按通用能力命名，例如 `base/`、`layout/`、`form/`、`table/`。
- 组件进入 `src/components/` 前必须满足至少一项：
  - 已被两个及以上业务域实际引用，且不依赖业务语义。
  - 明确属于布局、表单、表格、反馈、基础展示等业务无关 UI 能力。
  - 经用户或项目规范确认要作为通用组件沉淀。
- 如果只是“未来可能复用”，默认先放入 `src/business/<domain>/<feature>/` 或对应业务 shared 层。
- 只服务单一业务能力的组件不得放入 `components`，应放入 `business/<domain>/<feature>/`。
- 跨 domain 但仍带业务语义的组件不得放入 `components`，应放入 `business-shared/components/`。

### `src/api/` 命名规则

当前 skill 只约束 API 文件位置和命名，不约束 API 函数语义。

- API 文件默认使用 `.js` 后缀；如果项目已使用 `.ts`，跟随项目事实。
- 小模块可以使用 `src/api/<domain>.js`。
- 当同一业务域下存在多个稳定业务能力时，应按 `<Feature>` 拆分：`src/api/<domain>/<Feature>.js`。
- `<Feature>.js` 使用 PascalCase，与业务实体或业务能力对应。
- API 目录名应与业务 domain 名一致。
- 允许 `index.ts` / `index.js` 作为 API 模块显式导出入口，但必须符合项目既有模式，且只做聚合导出，不承载复杂请求实现。
- 禁止同一模块同时出现 `datasource.js`、`Datasource.js`、`datasource/index.js` 等多种拆分风格。
- 禁止在页面或组件目录旁边散落 `api.js`、`request.js`、`service.js` 等无归属文件。

### `src/mock/` 命名规则

当前 skill 只约束 Mock 文件位置和命名，不约束 Mock 字段语义。

- Mock 文件默认使用 `.js` 后缀；如果项目已使用 `.ts`，跟随项目事实。
- Mock 目录应与 API 目录保持镜像结构。
- 如果 API 使用 `src/api/<domain>/<Feature>.js`，Mock 推荐使用 `src/mock/<domain>/<Feature>.js`。
- 如果 API 使用 `src/api/<domain>.js`，Mock 推荐使用 `src/mock/<domain>.js`。
- Mock 目录名应与业务 domain 名一致。
- 允许 `index.ts` / `index.js` 作为 Mock 模块显式导出入口，但必须符合项目既有模式，且只做聚合导出。
- 禁止把 Mock 数据散落在页面、组件或任意 `data.js` 中。
- 禁止 API 按 feature 拆分，而 Mock 全部堆在一个无结构的大文件中，除非记录用户确认例外。

### 状态管理文件归属

当前 skill 不决定是否使用状态管理库；是否使用 Pinia、Redux、Zustand、Jotai、TanStack Query 或其他状态方案由 `docs/frontend-tech-stack.md` 与当前项目事实决定。

当项目使用状态管理方案时：

- 全局应用级 store 放入 `src/stores/`。
- 单一业务 domain 专用 store 优先放入 `src/business/<domain>/stores/`。
- feature 内部非常局部的状态，如不需要作为跨 feature store，可作为普通 composable / hook / utils 放入 feature 内。
- 默认不新增 `src/business/<domain>/<feature>/stores/`，避免 store 过度碎片化。
- 禁止在 `pages/` 或文件路由目录下创建 store 文件。
- 禁止同时使用 `store` 和 `stores` 两种目录名。

### 一级基础设施目录命名规则

- 不再设置 `src/core/` 总目录。
- 跨模块技术基础设施按清晰能力直接放在 `src/` 一级目录。
- HTTP client、请求拦截器、错误归一化放入 `src/http/`。
- 登录态、权限、鉴权辅助放入 `src/auth/`。
- 当前路由方案的路由表、路由守卫或权限注册放入 `src/router/`。
- i18n 初始化与资源组织放入 `src/i18n/`。
- 本地存储适配放入 `src/storage/`。
- WebSocket / SSE 等实时通信放入 `src/realtime/`。
- 地图、3D、Cesium、底层渲染适配放入 `src/map/` 或项目确认的语义目录。
- 普通业务组件、业务工具不得放入这些基础设施目录。
- 没有对应技术能力时不得创建空目录。

### `src/styles/` 命名规则

- 全局样式、主题变量、UnoCSS / Tailwind / CSS Modules / Less 等补充样式放入 `src/styles/` 或项目既有样式目录。
- 主题相关文件命名应清晰，例如 `variables.less`、`theme.less`、`element-plus.less`、`antd.less`。
- 组件局部样式优先保留在组件内或组件同目录；跨页面复用样式再上提。

### `index.*` 文件命名规则

- 禁止无业务语义的页面入口 `index.vue`、`index.jsx`、`index.tsx`；文件路由框架约定例外必须来自项目事实。
- 允许组件库、hooks、composables、utils、api、mock 模块使用 `index.ts` / `index.js` 作为显式导出入口，但必须符合项目既有模式。
- 允许的 `index.ts` / `index.js` 应只做聚合导出、模块装配或框架约定入口，不应承载复杂业务实现。
- 如果项目没有使用 barrel export 或模块入口习惯，不得为“省命名”临时新增 `index.*`。
- 禁止同一目录内同时存在多个互相竞争的入口风格，例如 `Datasource.js` 与 `datasource/index.js` 混用且无项目事实依据。

## 文件归属决策树

新建文件前按顺序判断。强类型目录优先于业务 feature 归属，避免 API / Mock / store / 基础设施被“只服务某个 feature”误判到业务组件目录。

1. 是否属于已确认文件路由框架的 route module / page / layout / middleware 等约定文件？
   - 是：按框架约定放入对应路由目录，并记录项目事实；继续判断其中的业务组件、API、store 是否需要拆出。
2. 是否是显式路由页面入口？
   - 是：放入 `src/pages/<domain>/<PageName>.<ext>`，并由 `src/router/` 或项目已确认路由目录显式配置。
3. 是否是路由配置、路由表或路由守卫？
   - 是：放入 `src/router/` 或项目已确认路由目录。
4. 是否是业务接口请求封装？
   - 是：放入 `src/api/<domain>.js` 或 `src/api/<domain>/<Feature>.js`，后缀跟随项目事实。
5. 是否是 Mock 数据或 Mock 服务模块？
   - 是：放入 `src/mock/<domain>.js` 或 `src/mock/<domain>/<Feature>.js`，并镜像 API。
6. 是否是全局应用级 store？
   - 是：放入 `src/stores/`。
7. 是否是单一业务 domain 专用 store？
   - 是：放入 `src/business/<domain>/stores/`。
8. 是否是 HTTP、auth、i18n、storage、realtime、map 等基础设施？
   - 是：放入对应一级目录，例如 `src/http/`、`src/auth/`。
9. 是否是全局样式、主题变量？
   - 是：放入 `src/styles/` 或项目已确认样式目录。
10. 是否只服务某个 domain + feature 的业务组件或业务逻辑？
    - 是：放入 `src/business/<domain>/<feature>/`。
11. 是否同一 domain 内跨多个 feature 复用？
    - 是：放入 `src/business/<domain>/shared/`。
12. 是否跨多个 domain 复用但仍有业务语义？
    - 是：放入 `src/business-shared/`。
13. 是否是彻底业务无关的通用 UI 组件？
    - 是：放入 `src/components/`。
14. 仍不能归类：
    - 不得新建临时目录，必须先询问或记录用户确认例外。

## 禁止事项

- 禁止创建无语义目录名：`aaa`、`tmp`、`new`、`test`、`demo2`。
- 显式路由项目默认禁止使用文件路由动态段命名页面，例如 `[id].vue`、`[id].tsx`；文件路由框架例外必须记录项目事实。
- 禁止无业务语义的页面入口 `index.vue`、`index.jsx`、`index.tsx`；模块导出入口 `index.ts` / `index.js` 只在符合项目既有模式时允许。
- 禁止同一业务模块在 `pages`、`business`、`api`、`mock` 中使用不同命名。
- 禁止把业务组件放入 `src/components/`。
- 禁止把跨 domain 但仍有业务语义的共享代码塞入 `src/components/`。
- 禁止把同一 domain 内跨 feature 的共享代码放到缺少 domain 归属的 `src/business/shared/`。
- 禁止把通用组件放入单一业务 feature 后再跨模块引用。
- 禁止页面、组件目录旁散落 API/Mock/store 文件。
- 禁止把 HTTP client、权限守卫、路由守卫等技术基础设施塞入业务 feature。
- 禁止同时创建 `common`、`utils`、`helper`、`shared` 等近义目录承担同一职责。
- 禁止同一业务能力的 API 与 Mock 使用不一致的拆分风格，除非记录用户确认例外。
- 禁止为单个文件创建过深无意义目录层级。
- 禁止保留废弃旧 skill 名称或旧目录造成触发冲突。

## 自检清单

执行结束必须逐项检查：

- [ ] 已说明当前任务是否完成协同协议。
- [ ] 已确认项目是显式路由还是文件路由；文件路由例外已记录项目事实。
- [ ] 已确认 `<domain>`、`<feature>`、`<Feature>` 的命名来源于业务语义。
- [ ] 显式路由页面入口位于 `src/pages/<domain>/<PageName>.<ext>`，并使用 PascalCase 文件名。
- [ ] 路由 path、动态参数、meta、守卫由 `src/router/` 或项目已确认路由目录表达；文件路由项目按框架约定表达。
- [ ] 没有在显式路由项目新增 `[id].vue`、`[id].tsx` 等文件路由命名，或已记录项目事实例外。
- [ ] 单 feature 业务组件与逻辑位于 `src/business/<domain>/<feature>/`。
- [ ] 同 domain 跨 feature 共享位于 `src/business/<domain>/shared/`。
- [ ] 跨 domain 且仍带业务语义的共享位于 `src/business-shared/`。
- [ ] 彻底业务无关 UI 组件位于 `src/components/`，并满足通用组件判定条件。
- [ ] API 文件位于 `src/api/<domain>.js` 或 `src/api/<domain>/<Feature>.js`，后缀跟随项目事实。
- [ ] Mock 文件位于 `src/mock/<domain>.js` 或 `src/mock/<domain>/<Feature>.js`，并镜像 API。
- [ ] store 文件位于 `src/stores/` 或 `src/business/<domain>/stores/`。
- [ ] HTTP、auth、router、i18n、storage、realtime、map 等基础设施位于对应一级目录。
- [ ] Vue 项目优先使用 `composables/`，React 项目优先使用 `hooks/`；混合写法已跟随项目事实。
- [ ] 没有 `tmp`、`test`、`demo2`、`aaa` 等无意义正式目录/文件名。
- [ ] 没有无业务语义的页面入口 `index.*`；允许的模块 `index.ts` / `index.js` 符合项目既有模式。
- [ ] 没有 `common`、`helper`、`shared` 等近义目录重复承担同一职责。
- [ ] 没有新旧规范目录或旧 skill 名称并存造成触发冲突。

## 用户确认例外记录格式

如果因历史包袱、迁移成本、第三方约束导致无法满足规则，必须记录：

- 例外项：
- 违反规则：
- 业务 / 技术原因：
- 影响范围：
- 是否临时例外：
- 后续收敛建议：
- 用户确认：

## 输出格式

```markdown
## frontend-project-structure 执行摘要

## 协同协议状态

## 执行模式
- 模式：生成 / 审查 / YOLO
- FAIL 处理策略：

## 路由模式判定

## 业务域 / 业务能力判定

## 命中规则

## 生成/修改清单

## 自检表
- [PASS/FAIL] 协同协议状态已说明
- [PASS/FAIL] 路由模式与文件路由例外已说明
- [PASS/FAIL] domain / feature / Feature 命名来自业务语义
- [PASS/FAIL] pages 与 router 归属正确
- [PASS/FAIL] business / business-shared / components 归属正确
- [PASS/FAIL] api / mock 文件位置、后缀与镜像关系正确
- [PASS/FAIL] stores 归属正确
- [PASS/FAIL] 一级基础设施目录归属正确
- [PASS/FAIL] Vue composables / React hooks 目录命名符合项目事实
- [PASS/FAIL] index.* 使用符合页面入口与模块导出入口规则
- [PASS/FAIL] 无无意义目录名/文件名
- [PASS/FAIL] 无近义重复目录
- [PASS/FAIL] 无新旧规范冲突

## 阻塞项
- 生成模式：列真正阻塞交付的问题。
- 审查模式：列高优先级问题，不代表阻塞报告输出。
- YOLO 模式：列已自行通过的阻塞项，说明原因、风险与后续建议。

## 用户确认例外
```

## 版本与变更记录

- v1.0.0：建立前端项目结构规范基线，覆盖 Vue / React 目录结构、文件命名、显式路由与文件路由例外、`business` / `business-shared` 业务层级、API / Mock / store / 基础设施归属、`index.*` 规则，以及生成 / 审查 / YOLO 执行模式。
