#!/usr/bin/env bash

set -euo pipefail

REPO_OWNER="ccwq"
REPO_NAME="frontend-skill-rules"
REF="main"
TARGET_DIR=""
SKIP_SKILLS=0
SKILLS_INSTALL_FAILED=0
PROMPT_CONTENT=""

BEGIN_MARKER="<!-- frontend-skill-rules:begin -->"
END_MARKER="<!-- frontend-skill-rules:end -->"
TECH_BEGIN_MARKER="<!-- frontend-skill-rules-tech-stack-template:begin -->"
TECH_END_MARKER="<!-- frontend-skill-rules-tech-stack-template:end -->"

usage() {
  cat <<EOF
用法：
  # 推荐：在目标项目根目录通过 GitHub raw 脚本执行
  bash <(curl -fsSL https://raw.githubusercontent.com/$REPO_OWNER/$REPO_NAME/main/scripts/install-project-rules.sh)

  # 本地/高级用法
  bash scripts/install-project-rules.sh [--skip-skills] [--ref <branch-or-tag>] [--target <目标项目根目录>]

参数：
  --skip-skills   跳过 npx 远程安装 skills，只处理 docs 与 CLAUDE.md / AGENTS.md。
  --ref <ref>     指定读取 GitHub 资源的 branch 或 tag，默认 main。
  --target <path> 高级兼容用法；默认使用当前目录作为目标项目根目录。
  --help          显示帮助。

示例：
  cd <your-project>
  bash <(curl -fsSL https://raw.githubusercontent.com/$REPO_OWNER/$REPO_NAME/main/scripts/install-project-rules.sh)

  cd final-prototype
  bash ../scripts/install-project-rules.sh --skip-skills --ref main
EOF
}

log() {
  printf '[install-project-rules] %s\n' "$1"
}

warn() {
  printf '[install-project-rules][WARN] %s\n' "$1"
}

fail() {
  printf '[install-project-rules][ERROR] %s\n' "$1" >&2
  exit 1
}

repo_url() {
  printf 'https://github.com/%s/%s' "$REPO_OWNER" "$REPO_NAME"
}

raw_base_url() {
  printf 'https://raw.githubusercontent.com/%s/%s/%s' "$REPO_OWNER" "$REPO_NAME" "$REF"
}

readme_url() {
  printf '%s/README.md' "$(raw_base_url)"
}

tech_stack_url() {
  printf '%s/docs/frontend-tech-stack.md' "$(raw_base_url)"
}

confirm() {
  local message="$1"
  local answer=""

  read -r -p "$message [y/N]: " answer
  case "$answer" in
    y|Y|yes|YES) return 0 ;;
    *) return 1 ;;
  esac
}

normalize_path() {
  local path="$1"
  if [[ -d "$path" ]]; then
    (cd "$path" && pwd)
  else
    return 1
  fi
}

download_text() {
  local url="$1"

  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$url"
    return $?
  fi

  if command -v wget >/dev/null 2>&1; then
    wget -qO- "$url"
    return $?
  fi

  return 127
}

extract_prompt_from_readme() {
  local readme_content="$1"

  printf '%s\n' "$readme_content" | awk '
    /^## 需要写入 CLAUDE\.md \/ AGENTS\.md 的内容[[:space:]]*$/ { in_section = 1; next }
    in_section && /^```md[[:space:]]*$/ { in_code = 1; next }
    in_code && /^```[[:space:]]*$/ { exit }
    in_code { print }
  '
}

load_prompt_content() {
  local url
  local readme_content
  local prompt

  url="$(readme_url)"
  log "从 README.md 读取 CLAUDE.md / AGENTS.md 提示词代码段：$url"

  if ! readme_content="$(download_text "$url")"; then
    fail "无法读取 README.md。CLAUDE.md / AGENTS.md 写入内容必须以 README.md 中的代码段为唯一来源，请检查网络后重试：$url"
  fi

  prompt="$(extract_prompt_from_readme "$readme_content")"
  if [[ -z "${prompt//[[:space:]]/}" ]]; then
    fail "未能在 README.md 中找到“需要写入 CLAUDE.md / AGENTS.md 的内容”下的 md 代码段：$url"
  fi

  PROMPT_CONTENT="$prompt"
}

prompt_block() {
  printf '%s\n' "$BEGIN_MARKER"
  printf '%s\n' "$PROMPT_CONTENT"
  printf '%s\n' "$END_MARKER"
}

print_manual_prompt_instructions() {
  local target_file="$1"

  cat <<EOF

手动配置方式：请在 $target_file 中加入以下内容。
内容唯一来源：$(readme_url) 中“需要写入 CLAUDE.md / AGENTS.md 的内容”代码段。

EOF
  prompt_block
  printf '\n'
}

print_manual_tech_stack_instructions() {
  local target_file="$1"

  cat <<EOF

手动处理方式：
请手动对比并合并：
- 源模板：$(tech_stack_url)
- 目标文件：$target_file
建议保留目标项目真实技术栈，以当前项目事实优先。

EOF
}

append_prompt_block() {
  local target_file="$1"

  {
    printf '\n'
    prompt_block
    printf '\n'
  } >> "$target_file"
}

update_agent_file() {
  local target_file="$1"
  local file_name="$(basename "$target_file")"

  if [[ -f "$target_file" ]] && grep -Fq "$BEGIN_MARKER" "$target_file"; then
    log "$file_name 已存在 frontend-skill-rules 受控块，跳过写入。"
    return 0
  fi

  if [[ ! -f "$target_file" ]]; then
    warn "$file_name 不存在。"
    if confirm "是否创建 $file_name 并写入 README.md 中的 frontend skill 提示词？"; then
      prompt_block > "$target_file"
      printf '\n' >> "$target_file"
      log "已创建并写入 $file_name。"
    else
      warn "已按你的选择跳过创建 $file_name。"
      print_manual_prompt_instructions "$target_file"
    fi
    return 0
  fi

  warn "$file_name 已存在，脚本不会覆盖原内容。"
  if confirm "是否将 README.md 中的 frontend skill 提示词追加到 $file_name 末尾？"; then
    append_prompt_block "$target_file"
    log "已追加提示词到 $file_name。"
  else
    warn "已按你的选择跳过写入 $file_name。"
    print_manual_prompt_instructions "$target_file"
  fi
}

copy_or_append_tech_stack() {
  local target_docs_dir="$TARGET_DIR/docs"
  local target_file="$target_docs_dir/frontend-tech-stack.md"
  local template_content=""

  if [[ ! -d "$target_docs_dir" ]]; then
    mkdir -p "$target_docs_dir"
    log "已创建目录：$target_docs_dir"
  fi

  if ! template_content="$(download_text "$(tech_stack_url)")"; then
    fail "无法下载技术栈模板：$(tech_stack_url)"
  fi

  if [[ ! -f "$target_file" ]]; then
    printf '%s\n' "$template_content" > "$target_file"
    log "已创建技术栈方案：$target_file"
    warn "请按目标项目事实调整 docs/frontend-tech-stack.md，不要直接把模板当作所有项目的真实技术栈。"
    return 0
  fi

  if grep -Fq "$TECH_BEGIN_MARKER" "$target_file"; then
    log "docs/frontend-tech-stack.md 已包含本脚本追加过的模板块，跳过重复追加。"
    return 0
  fi

  warn "目标项目已存在 docs/frontend-tech-stack.md。该文件可能已经包含目标项目真实技术栈事实。"
  if confirm "是否将远程 frontend-tech-stack.md 模板追加到目标文件末尾？"; then
    {
      printf '\n%s\n' "$TECH_BEGIN_MARKER"
      printf '<!-- 以下内容来自 %s，请按目标项目事实合并调整。 -->\n\n' "$(tech_stack_url)"
      printf '%s\n' "$template_content"
      printf '%s\n' "$TECH_END_MARKER"
    } >> "$target_file"
    log "已追加技术栈模板到：$target_file"
  else
    warn "已按你的选择跳过追加 docs/frontend-tech-stack.md。"
    print_manual_tech_stack_instructions "$target_file"
  fi
}

install_skills() {
  local install_url

  install_url="$(repo_url)"

  if ! command -v npx >/dev/null 2>&1; then
    warn "npx 不可用，跳过自动安装 skills。"
    SKILLS_INSTALL_FAILED=1
    return 0
  fi

  log "开始远程安装全部 frontend skills：npx -y skills add $install_url"
  if npx -y skills add "$install_url"; then
    log "skills 安装命令执行完成。"
  else
    warn "skills 自动安装失败，将继续处理 docs 与 CLAUDE.md / AGENTS.md。"
    SKILLS_INSTALL_FAILED=1
  fi
}

print_skills_manual_instructions_if_needed() {
  if [[ "$SKILLS_INSTALL_FAILED" -eq 0 ]]; then
    return 0
  fi

  cat <<EOF

skills 手动安装方式：
请在网络和 npx 可用后执行：

npx -y skills add $(repo_url)

EOF
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --target)
        [[ $# -ge 2 ]] || fail "--target 需要提供目标项目路径。"
        TARGET_DIR="$2"
        shift 2
        ;;
      --skip-skills)
        SKIP_SKILLS=1
        shift
        ;;
      --ref)
        [[ $# -ge 2 ]] || fail "--ref 需要提供 branch 或 tag。"
        REF="$2"
        shift 2
        ;;
      --help|-h)
        usage
        exit 0
        ;;
      *)
        fail "未知参数：$1。可使用 --help 查看用法。"
        ;;
    esac
  done
}

main() {
  parse_args "$@"

  if [[ -z "$TARGET_DIR" ]]; then
    TARGET_DIR="$(pwd)"
  fi

  TARGET_DIR="$(normalize_path "$TARGET_DIR")" || fail "目标目录不存在或不可访问：$TARGET_DIR"
  [[ -w "$TARGET_DIR" ]] || fail "目标目录不可写：$TARGET_DIR"

  log "目标项目根目录：$TARGET_DIR"
  log "GitHub 资源版本：$REF"

  if [[ ! -f "$TARGET_DIR/package.json" && ! -d "$TARGET_DIR/.git" && ! -d "$TARGET_DIR/src" ]]; then
    warn "当前目录未发现 package.json、.git 或 src/，请确认它确实是目标项目根目录。"
  fi

  if [[ "$SKIP_SKILLS" -eq 1 ]]; then
    warn "已启用 --skip-skills，跳过 skills 安装。"
  else
    install_skills
  fi

  copy_or_append_tech_stack
  load_prompt_content
  update_agent_file "$TARGET_DIR/CLAUDE.md"
  update_agent_file "$TARGET_DIR/AGENTS.md"
  print_skills_manual_instructions_if_needed

  cat <<EOF

安装流程已结束。
下一步建议：
1. 检查目标项目 docs/frontend-tech-stack.md 是否符合项目真实技术栈。
2. 回到 Claude Code 会话后执行 /reload-skills，或重启 Claude Code。

EOF
}

main "$@"
