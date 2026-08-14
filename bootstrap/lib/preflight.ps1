# Second Brain in a Box -- preflight (Windows).
#
# Detects what this machine already has. Emits JSON on stdout and ALWAYS
# exits 0: the installer decides what to do, this only reports. Side-effect
# free and safe to run any number of times.
#
# Windows PowerShell 5.1 compatible: no &&, no ternary, no null-coalescing,
# and nothing interactive.

$ErrorActionPreference = 'Continue'

function Test-Tool {
    param(
        [string] $Name,
        [string] $Command,
        [string] $Remedy
    )

    $present = $false
    $version = ''

    $cmd = Get-Command $Command -ErrorAction SilentlyContinue
    if ($null -ne $cmd) {
        # Presence is what the installer acts on. Version is nice-to-have.
        $present = $true
        try {
            # stderr is discarded deliberately: some shims (notably VS Code's
            # code.cmd) fail on --version while being perfectly installed, and
            # letting that error surface mid-install reads as a broken setup
            # to a non-technical user. Presence is already established above.
            $raw = & $Command --version 2>$null
            if ($null -ne $raw) {
                $version = ($raw | Select-Object -First 1).ToString().Trim()
            }
        } catch {
            $version = ''
        }
    }

    return [PSCustomObject]@{
        name    = $Name
        present = $present
        version = $version
        remedy  = $Remedy
    }
}

$checks = @()

$checks += Test-Tool -Name 'node' -Command 'node' `
    -Remedy 'Installed automatically: winget install --id OpenJS.NodeJS.LTS. Manual: https://nodejs.org/en/download'

$checks += Test-Tool -Name 'git' -Command 'git' `
    -Remedy 'Installed automatically: winget install --id Git.Git. Manual: https://git-scm.com/download/win'

$checks += Test-Tool -Name 'code' -Command 'code' `
    -Remedy 'Installed automatically: winget install --id Microsoft.VisualStudioCode. Manual: https://code.visualstudio.com/download'

$checks += Test-Tool -Name 'claude' -Command 'claude' `
    -Remedy 'Installed automatically from the official Claude Code installer at https://claude.ai/install.ps1'

$checks += Test-Tool -Name 'obsidian' -Command 'obsidian' `
    -Remedy 'Optional but recommended. Installed automatically: winget install --id Obsidian.Obsidian. Manual: https://obsidian.md/download'

$wingetCmd = Get-Command 'winget' -ErrorAction SilentlyContinue
$wingetPresent = $false
if ($null -ne $wingetCmd) { $wingetPresent = $true }

$checks += [PSCustomObject]@{
    name    = 'pkgmgr'
    present = $wingetPresent
    version = ''
    remedy  = "Install 'App Installer' from the Microsoft Store, or ask IT -- see IT-REQUIREMENTS.md."
}

# "blocked" means we cannot self-heal: no package manager AND missing
# essentials. The installer stops and emits IT-REQUIREMENTS.md rather than
# half-installing, because a half-installed brain looks fine and does nothing.
$blocked = $false
if (-not $wingetPresent) {
    $nodeOk = $null -ne (Get-Command 'node' -ErrorAction SilentlyContinue)
    $gitOk  = $null -ne (Get-Command 'git'  -ErrorAction SilentlyContinue)
    if ((-not $nodeOk) -or (-not $gitOk)) { $blocked = $true }
}

# "ok" means nothing needs installing.
$ok = $true
foreach ($required in @('node', 'git', 'claude')) {
    if ($null -eq (Get-Command $required -ErrorAction SilentlyContinue)) { $ok = $false }
}

[PSCustomObject]@{
    ok      = $ok
    blocked = $blocked
    checks  = $checks
} | ConvertTo-Json -Depth 4 -Compress

exit 0
