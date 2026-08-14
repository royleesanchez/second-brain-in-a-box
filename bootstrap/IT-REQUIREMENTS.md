# Second Brain in a Box — IT requirements

**Hand this page to your IT administrator.** It lists everything the setup needs and answers the questions IT will ask. One page, no jargon.

## What this is

Second Brain in a Box sets up a personal knowledge system on one person's machine: a folder of plain Markdown files, plus an AI assistant that reads and maintains them. It is not a server, not a service, and not a shared system. Everything runs locally, as the signed-in user.

## Software required

| Software | Why | Windows package id | Download |
|---|---|---|---|
| **Node.js 22 LTS** | Runs the setup scripts and the assistant's helper tools | `OpenJS.NodeJS.LTS` | https://nodejs.org/en/download |
| **Git** | Version history and, optionally, sharing the notes folder with teammates | `Git.Git` | https://git-scm.com/download/win |
| **Visual Studio Code** | The window the person works in | `Microsoft.VisualStudioCode` | https://code.visualstudio.com/download |
| **Claude Code** | The AI assistant itself. Requires the user's own paid Claude account | — | https://claude.ai/download |
| **Obsidian** *(optional)* | A friendly reader for the Markdown notes. Nothing depends on it | `Obsidian.Obsidian` | https://obsidian.md/download |

On macOS these install via Homebrew (https://brew.sh). On Windows they install via `winget`, which ships with Windows 11 as **App Installer**.

## Security posture

- **No inbound network access.** Nothing listens on a port. No firewall rule is needed.
- **No service, daemon, or scheduled task** is installed by default. Optional automation exists but ships switched off and requires the user to turn it on deliberately.
- **No admin rights are needed at runtime** — only to install the software above, the same as any desktop application.
- **Runs entirely as the signed-in user**, in that user's own profile.

### Outbound connections

Only two, both over HTTPS on port 443:

1. **Anthropic's API** (`api.anthropic.com`) — the AI assistant. Authenticated with the user's own Claude account.
2. **GitHub** (`github.com`) — to download the open-source plugin that provides the note-taking skills, and to check for updates.

If the person chooses to connect their calendar or email, those connections are authorized by them individually, in their own account settings, and are **read-only by default**. No credentials are issued, held, or shared by anyone else, and the user can revoke them at any time.

## Where the data lives

In a normal folder on the person's machine — by default under their Desktop or Documents. The files are plain Markdown and can be read, backed up, audited, or deleted with ordinary tools. Nothing is proprietary and nothing is locked in.

If the team chooses to share a brain, it lives in **your organization's own Git repository**, under your existing access controls and your existing offboarding process. Nothing is hosted by a third party on your behalf.

## If you cannot approve some of this

The setup degrades rather than breaking. Without Obsidian it still works. Without Git it works for a single person. Without the optional connectors the daily summary still runs from the local notes. The only hard requirements are **Node.js** and **Claude Code**.
