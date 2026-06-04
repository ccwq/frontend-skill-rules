# frontend-tech-stack

## 定位

本文档是当前项目的前端技术栈方向清单与轻量约束。

当前仓库不是完整业务前端工程，而是“规范 / 原型 / skill”仓库

## 技术清单

- 框架：Vue 3。
- 构建工具：Vite。
- 包管理：pnpm。
- 路由：vue-router。
- 状态管理：Pinia。
- UI 组件库：Element Plus。
  - 用户提到 “Element UI” 时，在 Vue 3 场景下默认理解为 Element Plus。
- UI 图标：`@element-plus/icons-vue`。
- 通用图标：UnoCSS Icons / Iconify MDI，例如 `@iconify-json/mdi`。
- 样式：UnoCSS + Less。
- 图表：ECharts。
  - `echarts-gl`、`echarts-liquidfill` 仅在确有 3D / 液态图需求时按需引入。
- 网络请求：优先复用项目已有 request / axios / fetch 封装。
- 工具库：VueUse、dayjs、lodash-es 按需评估，不默认强制安装。

## 新增包约束

需要安装新的 package 前，先做以下检查：

1. 先读取当前项目 `package.json` 和锁文件。
2. 先查找项目里是否已经存在相同或相近功能的 package。
3. 能复用已有 package 就不新增。
4. 不引入与现有方案功能重复的 package，例如：
   - 第二套 UI 组件库。
   - 第二套路由库。
   - 第二套状态管理库。
   - 第二套原子化 CSS / 样式体系。
   - 第二套图标字体或图标体系。
   - 替代 ECharts 的大型图表库。
5. 确认确实需要新增时，先说明新增原因、用途和影响，再执行安装。

## 使用要求
- 前端开发、生成、重构、审查前，先读取本文档和当前项目 `package.json`。
- 若本文档与当前项目事实冲突，以当前项目事实和用户明确要求优先。
- 技术栈变化时，及时更新本文档中的技术清单。
