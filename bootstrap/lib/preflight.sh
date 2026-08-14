#!/usr/bin/env bash
# Second Brain in a Box -- preflight (macOS / Linux).
#
# Detects what this machine already has. Emits JSON on stdout and ALWAYS
# exits 0: the installer decides what to do, this only reports. Side-effect
# free and safe to run any number of times.
set -u

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g' | tr -d '\n\r'
}

check() {
  local name="$1" cmd="$2" remedy="$3"
  local present="false" version=""

  if command -v "$cmd" >/dev/null 2>&1; then
    present="true"
    version="$("$cmd" --version 2>/dev/null | head -n1)"
  fi

  printf '{"name":"%s","present":%s,"version":"%s","remedy":"%s"}' \
    "$name" "$present" "$(json_escape "$version")" "$(json_escape "$remedy")"
}

if command -v brew >/dev/null 2>&1; then
  PKG_PRESENT=true
else
  PKG_PRESENT=false
fi
PKG_REMEDY="Install Homebrew from https://brew.sh, then run this installer again."

CHECKS="$(check node node 'Installed automatically via Homebrew (node@22). Manual: https://nodejs.org/en/download')"
CHECKS="$CHECKS,$(check git git 'Installed automatically via Homebrew. Manual: run xcode-select --install')"
CHECKS="$CHECKS,$(check code code 'Installed automatically via Homebrew (visual-studio-code). Manual: https://code.visualstudio.com/download')"
CHECKS="$CHECKS,$(check claude claude 'Installed automatically from the official Claude Code installer at https://claude.ai/install.sh')"
CHECKS="$CHECKS,$(check obsidian obsidian 'Optional but recommended. Installed automatically via Homebrew (obsidian). Manual: https://obsidian.md/download')"
CHECKS="$CHECKS,{\"name\":\"pkgmgr\",\"present\":$PKG_PRESENT,\"version\":\"\",\"remedy\":\"$(json_escape "$PKG_REMEDY")\"}"

# "blocked" means we cannot self-heal: no package manager AND missing
# essentials. The installer stops and emits IT-REQUIREMENTS.md rather than
# half-installing, because a half-installed brain looks fine and does nothing.
BLOCKED=false
if [ "$PKG_PRESENT" = "false" ]; then
  if ! command -v node >/dev/null 2>&1 || ! command -v git >/dev/null 2>&1; then
    BLOCKED=true
  fi
fi

# "ok" means nothing needs installing.
OK=true
for c in node git claude; do
  command -v "$c" >/dev/null 2>&1 || OK=false
done

printf '{"ok":%s,"blocked":%s,"checks":[%s]}\n' "$OK" "$BLOCKED" "$CHECKS"
exit 0
