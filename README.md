# Frontend Agent Rules

一套可复用的前端 Claude Code skills 规范集合，用于约束项目结构、复用治理与编码风格，并通过 `docs/frontend-tech-stack.md` 维护项目技术栈上下文。适合在 Vue / React 前端项目中一键安装、复制和按项目事实调整。

## 快速安装

在目标项目根目录执行；Windows 请使用 Git Bash：

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/ccwq/frontend-skill-rules/main/scripts/install-project-rules.sh)
```

安装完成后，回到 Claude Code 会话执行：

```text
/reload-skills
```

脚本默认把“当前目录”作为目标项目根目录，会执行：

- 从项目根目录 `.env.config` 读取默认安装的 frontend skills 配置。
- 通过 `npx -y skills add https://github.com/ccwq/frontend-skill-rules --skill frontend-project-structure frontend-reuse-governance frontend-code-style -y` 安装默认 frontend skills，跳过 skills CLI 多选勾选步骤。
- 创建或处理 `docs/frontend-tech-stack.md`。
- 在确认后，把下方 README 代码段写入目标项目 `CLAUDE.md` / `AGENTS.md`。

> `CLAUDE.md` / `AGENTS.md` 写入内容唯一来源是本 README 的下方代码段；脚本不会使用其他模板文件作为来源。

## 需要写入 CLAUDE.md / AGENTS.md 的内容

```md
# 严格按照下面技能约束项目新建和开发的过程
- frontend-code-style
- frontend-project-structure
- frontend-reuse-governance

# 技术栈要求
docs/frontend-tech-stack.md
引入的重要第三方组件时候，先判断是否符合技术栈；引入新的功能需要在文件中登记。
```

## 安装细节

### 脚本入口

推荐入口：

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/ccwq/frontend-skill-rules/main/scripts/install-project-rules.sh)
```

脚本默认安装到当前目录：

```bash
TARGET_DIR="$(pwd)"
```

支持参数：

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/ccwq/frontend-skill-rules/main/scripts/install-project-rules.sh) [--skip-skills] [--ref <branch-or-tag>] [--target <path>]
```

| 参数 | 说明 |
| --- | --- |
| `--skip-skills` | 跳过 `npx` 远程安装 skills，只处理 `docs` 与 `CLAUDE.md` / `AGENTS.md`。 |
| `--ref <branch-or-tag>` | 指定脚本读取 GitHub 资源的分支或 tag，默认 `main`。 |
| `--target <path>` | 高级兼容用法；默认不需要，未传时使用当前目录。 |
| `--help` | 输出帮助。 |

测试指定版本时，raw URL 中的分支和 `--ref` 需要保持一致：

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/ccwq/frontend-skill-rules/<branch-or-tag>/scripts/install-project-rules.sh) --ref <branch-or-tag>
```

### 可配置项

项目根目录 `.env.config` 纳入版本管理，用于集中维护安装脚本需要配置的内容。当前配置：

```bash
DEFAULT_SKILLS="frontend-project-structure frontend-reuse-governance frontend-code-style"
```

`DEFAULT_SKILLS` 使用空格分隔，脚本会传给 `npx skills add --skill`，用于跳过 skills CLI 多选勾选步骤。

### 交互确认规则

脚本遵循“默认不覆盖、写入前确认”的策略。

`docs/frontend-tech-stack.md`：

- 不存在：直接创建并写入远程模板。
- 已存在：提醒该文件可能包含目标项目真实技术栈事实，并询问是否追加模板内容。
- 选择取消：不修改文件，并输出手动合并方式。

`CLAUDE.md` / `AGENTS.md`：

- 不存在：提醒并询问是否创建。
- 已存在但没有受控块：提醒并询问是否追加。
- 已存在受控块：跳过，避免重复写入。
- 选择否定：不创建、不追加，并输出手动增加方法。

写入使用受控标记，方便幂等执行：

```md
<!-- frontend-skill-rules:begin -->
...
<!-- frontend-skill-rules:end -->
```

技术栈模板追加也使用受控标记，避免重复追加：

```md
<!-- frontend-skill-rules-tech-stack-template:begin -->
...
<!-- frontend-skill-rules-tech-stack-template:end -->
```

### 手动安装

如果脚本无法自动安装 skills，可在目标项目根目录手动执行：

```bash
npx -y skills add https://github.com/ccwq/frontend-skill-rules --skill frontend-project-structure frontend-reuse-governance frontend-code-style -y
```

然后手动处理：

1. 从远程模板创建或合并 `docs/frontend-tech-stack.md`：

   ```text
   https://raw.githubusercontent.com/ccwq/frontend-skill-rules/main/docs/frontend-tech-stack.md
   ```

2. 将本 README 中“需要写入 CLAUDE.md / AGENTS.md 的内容”代码段加入目标项目 `CLAUDE.md` / `AGENTS.md`。
3. 在 Claude Code 会话内执行 `/reload-skills`，或重启 Claude Code。

## Skill 说明

### frontend-project-structure

约束前端项目的目录结构、目录命名、文件命名与文件归属。它负责判断页面、业务组件、通用组件、API、Mock、store、样式和基础设施文件应该放在哪里；不处理技术选型、API 字段语义、编码风格或是否复用。

### frontend-reuse-governance

约束开发前的复用检查，避免重复造轮子。新建业务组件、通用组件、hook / composable、store、utils、API 或 Mock 前，需要先搜索同 feature、全局组件和逻辑资产；能扩展先扩展，相似度高时优先重构适配。

### frontend-code-style

约束前端代码可读性与交互完整性。重点检查命名、格式、中文注释、异步错误处理、弹窗表单重置、副作用和 timer 清理、搜索/筛选/按钮等 UI 是否有真实行为；不强制 TypeScript 类型系统。

## 执行模式

三套 skill 都按任务意图选择执行模式。用户明确指定模式时，以用户指定为准；未指定时按提示词语义自动判定。

| 模式 | 适用场景 | FAIL 处理 | 适合提示词 |
| --- | --- | --- | --- |
| 生成模式 | 新建 / 实现 / 修改前端内容 | 默认阻塞，修到 `PASS` 或记录用户确认例外 | “新增一个数据源页面，并按规范放置文件” |
| 审查模式 | 只检查、列问题、评估规范符合度 | 不阻塞报告输出，只列问题、影响和建议 | “检查这些文件哪里不符合规范，先不要改” |
| YOLO 模式 | 希望快速推进、不要等待确认 | 记录原因、风险和后续建议后继续，不静默忽略 | “按规范改，遇到需要确认的地方 yolo 自行通过并记录原因” |

YOLO 不是忽略规范，而是把阻塞项转为“记录后继续”，用于减少等待用户决策造成的效率损耗。

## 使用顺序

前端开发、生成、重构、审查任务涉及页面、组件、API、Mock、样式或交互时，先读取技术栈上下文与当前项目事实，再按顺序执行：

1. `docs/frontend-tech-stack.md`、`package.json`、锁文件、构建配置、样式配置、路由/状态管理/UI 库等现有配置。
2. `frontend-project-structure`
3. `frontend-reuse-governance`
4. `frontend-code-style`

冲突优先级：

```text
技术栈上下文 / 项目事实 > frontend-project-structure > frontend-reuse-governance > frontend-code-style
```

## 技术栈上下文

技术栈上下文统一维护在：

```text
docs/frontend-tech-stack.md
```

该文件是目标项目的技术栈方向清单与轻量约束。复制到项目后必须按项目事实调整；如果文档与当前项目事实冲突，以当前项目事实和用户明确要求优先。

技术栈变化时，优先更新 `docs/frontend-tech-stack.md`，不要把项目技术栈重新做成 skill。

## 维护原则

- `FE-prompts.txt` 是来源材料，不作为最终 skill 的运行时依赖。
- 修改规范时优先改对应 skill 的 `SKILL.md`，并更新其“版本与变更记录”。
- 新增项目经验时先判断属于哪一层：技术栈上下文、项目结构、复用治理、编码风格、planning-with-files，不要把规则混在一起。
- 如果只是换项目，应重新读取或更新该项目的技术栈上下文，不要直接沿用当前项目基线。
- 已废弃并删除的旧 skill 名称不要恢复，也不要保留兼容别名：
  - `frontend-file-structure`
  - `frontend-project-style`
  - `frontend-product-style`
