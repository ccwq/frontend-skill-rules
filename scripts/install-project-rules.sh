#!/usr/bin/env bash

set -euo pipefail

REPO_OWNER="ccwq"
REPO_NAME="frontend-skill-rules"
REF="main"
TARGET_DIR=""
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="$REPO_ROOT/.env.config"
SKIP_SKILLS=0
SKILLS_INSTALL_FAILED=0
PROMPT_CONTENT=""
DEFAULT_SKILLS=""

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

config_url() {
  printf '%s/.env.config' "$(raw_base_url)"
}

load_config() {
  local config_content=""

  if [[ -f "$CONFIG_FILE" ]]; then
    # .env.config 只用于维护安装脚本参数；当前需要 DEFAULT_SKILLS。
    # shellcheck disable=SC1090
    source "$CONFIG_FILE"
  else
    log "本地未找到 .env.config，改为读取远程配置：$(config_url)"
    if ! config_content="$(download_text "$(config_url)")"; then
      fail "无法读取配置文件：$(config_url)"
    fi

    DEFAULT_SKILLS="$(printf '%s\n' "$config_content" | awk -F= '
      /^[[:space:]]*DEFAULT_SKILLS=/ {
        value = substr($0, index($0, "=") + 1)
        gsub(/^[[:space:]]+|[[:space:]]+$/, "", value)
        gsub(/^"|"$/, "", value)
        print value
        exit
      }
    ')"
  fi

  if [[ -z "${DEFAULT_SKILLS//[[:space:]]/}" ]]; then
    fail ".env.config 中 DEFAULT_SKILLS 不能为空。"
  fi
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
  local round
  local attempt
  local status=0

  if command -v curl >/dev/null 2>&1; then
    for round in 1 2; do
      for attempt in 1 2; do
        if curl -fsSL --retry-connrefused "$url"; then
          return 0
        fi
        status=$?
        if [[ "$attempt" -lt 2 ]]; then
          sleep 10
        fi
      done
      if [[ "$round" -lt 2 ]]; then
        sleep 25
      fi
    done
    return "$status"
  fi

  if command -v wget >/dev/null 2>&1; then
    for round in 1 2; do
      for attempt in 1 2; do
        if wget -qO- "$url"; then
          return 0
        fi
        status=$?
        if [[ "$attempt" -lt 2 ]]; then
          sleep 10
        fi
      done
      if [[ "$round" -lt 2 ]]; then
        sleep 25
      fi
    done
    return "$status"
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

ensure_tagged_content() {
  local tag_name="$1"
  local content="$2"
  local start_tag="<$tag_name>"
  local end_tag="</$tag_name>"

  if [[ "$content" == *"$start_tag"* && "$content" == *"$end_tag"* ]]; then
    printf '%s\n' "$content"
    return 0
  fi

  printf '%s\n' "$start_tag"
  printf '%s\n' "$content"
  printf '%s\n' "$end_tag"
}

prompt_block() {
  ensure_tagged_content "frontend-rules" "$PROMPT_CONTENT"
}

print_manual_prompt_instructions() {
  local target_file="$1"

  cat <<EOF

手动配置方式：请在 $target_file 中按以下规则处理。
- 不存在 <frontend-rules>：追加以下配置块。
- 已存在 <frontend-rules>：覆盖该 tag 内的整个配置块，不要重复追加。
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
规则：目标文件不存在 <frontend-tech-stack> 时追加源模板；已存在时覆盖该 tag 内的整个配置块，不要重复追加。
建议保留目标项目真实技术栈，以当前项目事实优先。

EOF
}

replace_block_in_file() {
  local target_file="$1"
  local start_pattern="$2"
  local end_pattern="$3"
  local replacement_file="$4"

  if ! command -v perl >/dev/null 2>&1; then
    fail "perl 不可用，无法安全执行 XML tag upsert。请安装 perl 或使用 Git Bash 后重试。"
  fi

  # 用 perl 的多行正则做块替换，避免 sed -i 在 macOS / GNU / Git Bash 下的兼容差异。
  START_PATTERN="$start_pattern" \
    END_PATTERN="$end_pattern" \
    REPLACEMENT_FILE="$replacement_file" \
    perl -0pi -e '
      BEGIN {
        $start = $ENV{"START_PATTERN"};
        $end = $ENV{"END_PATTERN"};
        $replacement_file = $ENV{"REPLACEMENT_FILE"};
        open my $fh, "<", $replacement_file or die "Cannot read replacement file: $replacement_file\n";
        local $/;
        $replacement = <$fh>;
        close $fh;
      }
      s/\Q$start\E.*?\Q$end\E/$replacement/s;
    ' "$target_file"
}

remove_block_if_complete() {
  local target_file="$1"
  local start_pattern="$2"
  local end_pattern="$3"
  local empty_file=""

  if [[ -z "$start_pattern" || -z "$end_pattern" ]] || ! grep -Fq "$start_pattern" "$target_file"; then
    return 0
  fi

  if ! grep -Fq "$end_pattern" "$target_file"; then
    warn "$target_file 包含旧受控开始标记但缺少结束标记，无法安全删除旧块。"
    return 0
  fi

  empty_file="$(mktemp)" || return 1
  : > "$empty_file"
  replace_block_in_file "$target_file" "$start_pattern" "$end_pattern" "$empty_file"
  rm -f "$empty_file"
}

upsert_tagged_block() {
  local target_file="$1"
  local tag_name="$2"
  local block_content="$3"
  local legacy_begin_marker="${4:-}"
  local legacy_end_marker="${5:-}"
  local start_tag="<$tag_name>"
  local end_tag="</$tag_name>"
  local replacement_file=""

  replacement_file="$(mktemp)" || return 1
  printf '%s\n' "$block_content" > "$replacement_file"

  if [[ ! -f "$target_file" ]]; then
    cp "$replacement_file" "$target_file"
    rm -f "$replacement_file"
    return 0
  fi

  if grep -Fq "$start_tag" "$target_file"; then
    if grep -Fq "$end_tag" "$target_file"; then
      replace_block_in_file "$target_file" "$start_tag" "$end_tag" "$replacement_file"
      remove_block_if_complete "$target_file" "$legacy_begin_marker" "$legacy_end_marker"
      rm -f "$replacement_file"
      return 0
    fi

    warn "$target_file 包含 $start_tag 但缺少 $end_tag，无法安全覆盖；将保守追加新的 $tag_name 块。"
  elif [[ -n "$legacy_begin_marker" && -n "$legacy_end_marker" ]] && grep -Fq "$legacy_begin_marker" "$target_file"; then
    if grep -Fq "$legacy_end_marker" "$target_file"; then
      replace_block_in_file "$target_file" "$legacy_begin_marker" "$legacy_end_marker" "$replacement_file"
      rm -f "$replacement_file"
      return 0
    fi

    warn "$target_file 包含旧受控开始标记但缺少结束标记，无法安全迁移；将保守追加新的 $tag_name 块。"
  fi

  {
    printf '\n'
    cat "$replacement_file"
    printf '\n'
  } >> "$target_file"
  rm -f "$replacement_file"
}

update_agent_file() {
  local target_file="$1"
  local file_name="$(basename "$target_file")"
  local block_content=""

  block_content="$(prompt_block)"

  if [[ ! -f "$target_file" ]]; then
    warn "$file_name 不存在。"
    if confirm "是否创建 $file_name 并写入 README.md 中的 <frontend-rules> 配置？"; then
      upsert_tagged_block "$target_file" "frontend-rules" "$block_content" "$BEGIN_MARKER" "$END_MARKER"
      log "已创建并写入 $file_name。"
    else
      warn "已按你的选择跳过创建 $file_name。"
      print_manual_prompt_instructions "$target_file"
    fi
    return 0
  fi

  warn "$file_name 已存在，脚本不会覆盖非 <frontend-rules> 内容。"
  if confirm "是否新增或覆盖 $file_name 中的 <frontend-rules> 配置块？"; then
    upsert_tagged_block "$target_file" "frontend-rules" "$block_content" "$BEGIN_MARKER" "$END_MARKER"
    log "已新增或覆盖 $file_name 中的 <frontend-rules> 配置块。"
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
  template_content="$(ensure_tagged_content "frontend-tech-stack" "$template_content")"

  if [[ ! -f "$target_file" ]]; then
    upsert_tagged_block "$target_file" "frontend-tech-stack" "$template_content" "$TECH_BEGIN_MARKER" "$TECH_END_MARKER"
    log "已创建技术栈方案：$target_file"
    warn "请按目标项目事实调整 docs/frontend-tech-stack.md，不要直接把模板当作所有项目的真实技术栈。"
    return 0
  fi

  warn "目标项目已存在 docs/frontend-tech-stack.md。该文件可能已经包含目标项目真实技术栈事实。"
  if confirm "是否新增或覆盖 docs/frontend-tech-stack.md 中的 <frontend-tech-stack> 配置块？"; then
    upsert_tagged_block "$target_file" "frontend-tech-stack" "$template_content" "$TECH_BEGIN_MARKER" "$TECH_END_MARKER"
    log "已新增或覆盖 <frontend-tech-stack> 配置块：$target_file"
  else
    warn "已按你的选择跳过处理 docs/frontend-tech-stack.md。"
    print_manual_tech_stack_instructions "$target_file"
  fi
}

install_skills() {
  local install_url
  local default_skills=()
  local skills_args=()

  read -r -a default_skills <<< "$DEFAULT_SKILLS"
  skills_args=(--skill "${default_skills[@]}")

  install_url="$(repo_url)"

  if ! command -v npx >/dev/null 2>&1; then
    warn "npx 不可用，跳过自动安装 skills。"
    SKILLS_INSTALL_FAILED=1
    return 0
  fi

  # skills CLI 默认会进入多选交互；显式传入 .env.config 中的 skill 并加 -y，跳过勾选步骤。
  log "开始远程安装默认 frontend skills：npx -y skills add $install_url --skill $DEFAULT_SKILLS -y"
  if npx -y skills add "$install_url" "${skills_args[@]}" -y; then
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

npx -y skills add $(repo_url) --skill $DEFAULT_SKILLS -y

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
  load_config

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
