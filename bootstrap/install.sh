#!/usr/bin/env bash
# Second Brain in a Box -- installer (macOS / Linux).
#
# Takes a cold machine to a working, personalised second brain. Every step is
# announced before it runs and every step is safe to re-run.
#
# Usage:
#   bash install.sh              interactive install
#   bash install.sh --dry-run    print the plan, change nothing

set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
MARKETPLACE_URL="${SECOND_BRAIN_MARKETPLACE:-https://github.com/REPLACE_ME_ORG/second-brain-in-a-box}"
DRY_RUN=false
[ "${1:-}" = "--dry-run" ] && DRY_RUN=true

say()  { printf '\n\033[1m%s\033[0m\n' "$*"; }
info() { printf '  %s\n' "$*"; }
warn() { printf '  !! %s\n' "$*"; }

# ---------------------------------------------------------------- dry run ---
if [ "$DRY_RUN" = true ]; then
  cat <<'PLAN'

Second Brain in a Box -- installation plan

  What you need before starting (two things):
    1. A Claude paid plan you can log into.
    2. Permission to install software on this machine.

  Step 1  preflight     Check what this machine already has. Changes nothing.
                        If blocked, print IT-REQUIREMENTS.md and stop.
  Step 2  dependencies  Install only what is missing: Node 22, Git,
                        Visual Studio Code, Claude Code, Obsidian (optional).
  Step 3  marketplace   Register the Second Brain plugin marketplace.
  Step 4  plugin        Install the second-brain plugin (skills + memory hooks).
  Step 5  scaffold      Create your brain folder, CLAUDE.md and the memory map.
  Step 6  cadence       Offer the optional automations. All off by default.
  Step 7  launch        Open VS Code at your new brain, ready to run /onboard.

  Nothing above has been executed. Re-run without --dry-run to install.

PLAN
  exit 0
fi

# -------------------------------------------------------------- 1 preflight ---
say "Step 1 of 7 - preflight: checking what this machine already has"
PREFLIGHT="$(bash "$HERE/lib/preflight.sh")"
info "$(printf '%s' "$PREFLIGHT" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const p=JSON.parse(s);console.log(p.checks.map(c=>`${c.present?"found   ":"missing "}${c.name}`).join("\n  "))})' 2>/dev/null || echo "(parsed)")"

IS_BLOCKED="$(printf '%s' "$PREFLIGHT" | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).blocked' 2>/dev/null || echo false)"
if [ "$IS_BLOCKED" = "true" ]; then
  warn "This machine is missing a package manager and core tools, and setup"
  warn "cannot install them for you."
  warn ""
  warn "Send this file to your IT administrator:"
  warn "  $HERE/IT-REQUIREMENTS.md"
  warn ""
  warn "Nothing was installed. Re-run this after IT has provisioned the tools."
  exit 0
fi

# ----------------------------------------------------------- 2 dependencies ---
say "Step 2 of 7 - dependencies: installing anything missing"
have() { command -v "$1" >/dev/null 2>&1; }

if ! have brew; then
  warn "Homebrew not found. Install it from https://brew.sh, then re-run."
  warn "Nothing was installed."
  exit 0
fi

install_formula() {
  local bin="$1" formula="$2" cask="${3:-}" url="$4"
  if have "$bin"; then info "already installed: $bin"; return; fi
  info "installing $formula ..."
  if [ -n "$cask" ]; then brew install --cask "$formula" || warn "brew failed -- download manually: $url"
  else brew install "$formula" || warn "brew failed -- download manually: $url"; fi
}

install_formula node     "node@22"              ""     "https://nodejs.org/en/download"
install_formula git      "git"                  ""     "https://git-scm.com/downloads"
install_formula code     "visual-studio-code"   cask   "https://code.visualstudio.com/download"
install_formula obsidian "obsidian"             cask   "https://obsidian.md/download"

if ! have claude; then
  info "installing Claude Code ..."
  curl -fsSL https://claude.ai/install.sh | bash || warn "Install manually: https://claude.ai/download"
fi

if have code; then code --install-extension anthropic.claude-code >/dev/null 2>&1 || true; fi

if ! have claude; then
  warn "Claude Code is still not on PATH. Open a new terminal and re-run."
  exit 1
fi

# ------------------------------------------------------------ 3 marketplace ---
say "Step 3 of 7 - marketplace: registering the plugin source"
claude plugin marketplace add "$MARKETPLACE_URL" 2>/dev/null || info "already registered"

# ----------------------------------------------------------------- 4 plugin ---
say "Step 4 of 7 - plugin: installing the second-brain skills and memory hooks"
claude plugin install second-brain@second-brain 2>/dev/null || info "already installed"

# --------------------------------------------------------------- 5 scaffold ---
say "Step 5 of 7 - scaffold: creating your brain"
printf '  Your name: '        ; read -r OWNER
printf '  Your firm name: '   ; read -r FIRM
DEFAULT_DIR="$HOME/Desktop/${FIRM:-My} Brain"
printf '  Where should it live? [%s]: ' "$DEFAULT_DIR"; read -r TARGET
TARGET="${TARGET:-$DEFAULT_DIR}"

PLUGIN_DIR="$(find "$HOME/.claude/plugins/cache" -type d -name second-brain -maxdepth 4 2>/dev/null | tail -1)"
SCAFFOLD="$(find "${PLUGIN_DIR:-$HOME/.claude/plugins/cache}" -name scaffold.mjs 2>/dev/null | tail -1)"

if [ -z "$SCAFFOLD" ]; then
  warn "Could not locate the plugin's scaffolder. Open VS Code at your brain"
  warn "folder and run /onboard -- it will finish the setup."
else
  mkdir -p "$TARGET"
  node "$SCAFFOLD" firm-personal "$TARGET" \
    OWNER="$OWNER" FIRM="$FIRM" DATE="$(date +%F)"
fi

if have git && [ ! -d "$TARGET/.git" ]; then
  (cd "$TARGET" && git init -q && git add -A && git -c user.name="$OWNER" commit -qm "Brain created" 2>/dev/null) || true
fi

# ---------------------------------------------------------------- 6 cadence ---
say "Step 6 of 7 - cadence: optional automations"
info "Automation is earned, not switched on. Everything below is OFF by default;"
info "run a skill by hand a few times, and turn it on once it has proved useful."
info ""
info "  daily brief    a brief written for you each morning"
info "  os-audit       a recurring health check of your brain"
info "  inbox capture  automatic filing of anything you drop in 00_Inbox"
info ""
info "Turn any of them on later by running:  /cadence"

# ----------------------------------------------------------------- 7 launch ---
say "Step 7 of 7 - launch"
if have code; then code "$TARGET" >/dev/null 2>&1 || true; fi

cat <<EOF

  Your brain is ready:  $TARGET

  VS Code is opening. In its terminal, run:

      claude

  then type:

      /onboard

  That researches your firm, learns your role, and fills in the map.
  After that: /connect  (wire in calendar and mail), then /brief.

EOF
exit 0
