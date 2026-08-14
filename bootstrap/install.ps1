# Second Brain in a Box -- installer (Windows).
#
# Takes a cold machine to a working, personalised second brain. Every step is
# announced before it runs and every step is safe to re-run.
#
# Usage:
#   .\install.ps1              interactive install
#   .\install.ps1 -DryRun      print the plan, change nothing
#
# Windows PowerShell 5.1 compatible: no pipeline chain operators, no ternary,
# no null-coalescing.

param(
    [switch] $DryRun
)

$ErrorActionPreference = 'Continue'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

$marketplaceUrl = $env:SECOND_BRAIN_MARKETPLACE
if ([string]::IsNullOrWhiteSpace($marketplaceUrl)) {
    $marketplaceUrl = 'https://github.com/REPLACE_ME_ORG/second-brain-in-a-box'
}

function Say  { param([string] $m) Write-Host ''; Write-Host $m -ForegroundColor Cyan }
function Info { param([string] $m) Write-Host "  $m" }
function Warn { param([string] $m) Write-Host "  !! $m" -ForegroundColor Yellow }
function Have { param([string] $c) return ($null -ne (Get-Command $c -ErrorAction SilentlyContinue)) }

# ---------------------------------------------------------------- dry run ---
if ($DryRun) {
    Write-Host @'

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

  Nothing above has been executed. Re-run without -DryRun to install.

'@
    exit 0
}

# ------------------------------------------------------------- 1 preflight ---
Say 'Step 1 of 7 - preflight: checking what this machine already has'
$preflightRaw = & powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File (Join-Path $here 'lib\preflight.ps1')
$preflight = $preflightRaw | ConvertFrom-Json

foreach ($c in $preflight.checks) {
    if ($c.present) { Info "found   $($c.name)" } else { Info "missing $($c.name)" }
}

if ($preflight.blocked) {
    Warn 'This machine is missing a package manager and core tools, and setup'
    Warn 'cannot install them for you.'
    Warn ''
    Warn 'Send this file to your IT administrator:'
    Warn ("  " + (Join-Path $here 'IT-REQUIREMENTS.md'))
    Warn ''
    Warn 'Nothing was installed. Re-run this after IT has provisioned the tools.'
    exit 0
}

# ---------------------------------------------------------- 2 dependencies ---
Say 'Step 2 of 7 - dependencies: installing anything missing'

function Install-IfMissing {
    param([string] $Bin, [string] $Id, [string] $Url)

    if (Have $Bin) { Info "already installed: $Bin"; return }

    if (-not (Have 'winget')) {
        Warn "winget unavailable -- download $Bin manually: $Url"
        return
    }

    Info "installing $Id ..."
    winget install --id $Id --silent --accept-package-agreements --accept-source-agreements
    if (-not $?) { Warn "winget failed -- download manually: $Url" }
}

Install-IfMissing -Bin 'node'     -Id 'OpenJS.NodeJS.LTS'          -Url 'https://nodejs.org/en/download'
Install-IfMissing -Bin 'git'      -Id 'Git.Git'                     -Url 'https://git-scm.com/download/win'
Install-IfMissing -Bin 'code'     -Id 'Microsoft.VisualStudioCode'  -Url 'https://code.visualstudio.com/download'
Install-IfMissing -Bin 'obsidian' -Id 'Obsidian.Obsidian'           -Url 'https://obsidian.md/download'

if (-not (Have 'claude')) {
    Info 'installing Claude Code ...'
    try {
        Invoke-RestMethod -Uri 'https://claude.ai/install.ps1' | Invoke-Expression
    } catch {
        Warn 'Install Claude Code manually: https://claude.ai/download'
    }
}

if (Have 'code') { & code --install-extension anthropic.claude-code 2>$null | Out-Null }

if (-not (Have 'claude')) {
    Warn 'Claude Code is still not on PATH. Open a new terminal and re-run.'
    exit 1
}

# ----------------------------------------------------------- 3 marketplace ---
Say 'Step 3 of 7 - marketplace: registering the plugin source'
& claude plugin marketplace add $marketplaceUrl 2>$null | Out-Null
if (-not $?) { Info 'already registered' }

# ---------------------------------------------------------------- 4 plugin ---
Say 'Step 4 of 7 - plugin: installing the second-brain skills and memory hooks'
& claude plugin install second-brain@second-brain 2>$null | Out-Null
if (-not $?) { Info 'already installed' }

# -------------------------------------------------------------- 5 scaffold ---
Say 'Step 5 of 7 - scaffold: creating your brain'
$owner = Read-Host '  Your name'
$firm  = Read-Host '  Your firm name'

$defaultDir = Join-Path ([Environment]::GetFolderPath('Desktop')) "$firm Brain"
$target = Read-Host "  Where should it live? [$defaultDir]"
if ([string]::IsNullOrWhiteSpace($target)) { $target = $defaultDir }

$cacheRoot = Join-Path $env:USERPROFILE '.claude\plugins\cache'
$scaffold = Get-ChildItem -Path $cacheRoot -Filter 'scaffold.mjs' -Recurse -ErrorAction SilentlyContinue |
            Select-Object -Last 1

if ($null -eq $scaffold) {
    Warn 'Could not locate the plugin scaffolder. Open VS Code at your brain'
    Warn 'folder and run /onboard -- it will finish the setup.'
} else {
    if (-not (Test-Path $target)) { New-Item -ItemType Directory -Force -Path $target | Out-Null }
    $today = Get-Date -Format 'yyyy-MM-dd'
    & node $scaffold.FullName 'firm-personal' $target "OWNER=$owner" "FIRM=$firm" "DATE=$today"
}

if ((Have 'git') -and (-not (Test-Path (Join-Path $target '.git')))) {
    Push-Location $target
    & git init -q
    & git add -A
    & git -c user.name="$owner" commit -qm 'Brain created' 2>$null | Out-Null
    Pop-Location
}

# --------------------------------------------------------------- 6 cadence ---
Say 'Step 6 of 7 - cadence: optional automations'
Info 'Automation is earned, not switched on. Everything below is OFF by default;'
Info 'run a skill by hand a few times, and turn it on once it has proved useful.'
Info ''
Info '  daily brief    a brief written for you each morning'
Info '  os-audit       a recurring health check of your brain'
Info '  inbox capture  automatic filing of anything you drop in 00_Inbox'
Info ''
Info 'Turn any of them on later by running:  /cadence'

# ---------------------------------------------------------------- 7 launch ---
Say 'Step 7 of 7 - launch'
if (Have 'code') { & code $target 2>$null | Out-Null }

Write-Host @"

  Your brain is ready:  $target

  VS Code is opening. In its terminal, run:

      claude

  then type:

      /onboard

  That researches your firm, learns your role, and fills in the map.
  After that: /connect  (wire in calendar and mail), then /brief.

"@

exit 0
