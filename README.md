# Second Brain in a Box

Stand up a personal AI second brain in one command: a folder of plain Markdown, an operating manual the AI actually follows, a real memory architecture that survives restarts, and the skills to grow it.

Not a note-taking app. A brain that knows your firm, your companies, and your role — and gets more useful every week instead of forgetting you between chats.

---

## What you need before you start

Exactly two things:

1. **A Claude paid plan you can log into.**
2. **Permission to install software on this machine.**

Everything else — Node, Git, VS Code, Claude Code, Obsidian — the installer handles, and it skips anything you already have.

*If your machine is locked down, the installer detects it, stops before changing anything, and hands you [`IT-REQUIREMENTS.md`](bootstrap/IT-REQUIREMENTS.md) to send to IT.*

---

## Install

### Windows

1. Download and unzip.
2. Double-click **`START HERE.cmd`**.

### macOS

1. Download and unzip.
2. Open Terminal and paste:

```bash
bash ~/Downloads/second-brain-in-a-box/install.sh
```

*(macOS quarantines downloaded files, so a double-clickable script gets blocked with a scary warning. One pasted line is more reliable and less alarming.)*

Want to see what it will do first? Add `--dry-run` (macOS) or `-DryRun` (Windows). It prints the plan and changes nothing.

---

## What the installer does

Seven steps, each announced before it runs, each safe to re-run:

| | |
|---|---|
| **1. preflight** | Checks what the machine already has. Changes nothing. |
| **2. dependencies** | Installs only what is missing. |
| **3. marketplace** | Registers this repo as a plugin source. |
| **4. plugin** | Installs the skills and the memory hooks. |
| **5. scaffold** | Creates your brain: folders, `CLAUDE.md`, the memory map. |
| **6. cadence** | Offers the optional automations. All off by default. |
| **7. launch** | Opens VS Code at your new brain. |

It ends by opening VS Code pointed at your brain. Your first experience is a conversation, not a folder.

---

## Your first ten minutes

```
/onboard
```

Asks for your firm's name and website, researches the firm and its portfolio, infers the investment thesis from what they actually fund, then interviews you about your role. Writes the result into `CLAUDE.md` and the memory map. This is what makes the brain *yours* instead of generic.

```
/connect
```

Walks you through wiring in your calendar, mail, and meeting notes. Verifies each one actually returns data before marking it live.

```
/brief
```

Your daily orientation. Works with zero connectors — it just gets richer as you add them.

---

## The skills

| Skill | What it does |
|---|---|
| `/onboard` | Research and add the firm, a company, or a project. The only sanctioned way to create a memory node. |
| `/capture` | Process the inbox: read, extract, route, cross-link, file. |
| `/brief` | The daily orientation brief. |
| `/save-point` | Checkpoint the session so nothing is lost across a restart. |
| `/os-audit` | Read-only health scorecard. Proposes fixes, applies none. |
| `/sync` | Share with teammates without needing to know git. |
| `/connect` | Guided setup for live data connections. |
| `/cadence` | Turn optional automations on or off. |

---

## How it remembers

Four layers, broad to deep. Load light first; open the heavy detail only for the thing being worked on.

| Layer | File | Role |
|---|---|---|
| 1 | `CLAUDE.md` | The operating manual. Always on. |
| 2 | `MEMORY.md` | The map. Every company and project as one line with live status. |
| 3 | `project_{company}.md` | The company anchor. Current state, dated log, open items. |
| 4 | `project_{company}_{project}.md` | The project file. Methodology, data, decisions, gotchas. |

Three hooks keep it honest without anyone remembering to: one primes the protocol at session start, one injects the matching anchors before the AI answers your prompt, and one flushes memory to disk before context is compacted away.

Say **"create a save point"** before a restart and the next session resumes with no re-briefing.

---

## Updates

The zip is only a bootstrap. The skills, hooks and templates live in this repo and reach you through the plugin system, so a brain installed months ago gets today's improvements:

```bash
claude plugin update second-brain@second-brain
```

---

## Where your data lives

In a normal folder on your machine. Plain Markdown, readable and portable, no proprietary format and no lock-in. Nothing is hosted on your behalf.

If you share a brain with a team, it lives in **your organization's own Git repository**, under your access controls and your offboarding process.

The only outbound connections are Anthropic's API and GitHub. Calendar and mail connections, if you enable them, are authorized by you in your own settings and are **read-only by default** — nothing is ever sent without a human approving it.

---

## For IT

See [`bootstrap/IT-REQUIREMENTS.md`](bootstrap/IT-REQUIREMENTS.md) — one page covering required software, network posture, and where data lives.

---

## License

MIT. Use it, fork it, adapt the schema to your own work.

*Marketplace: `https://github.com/REPLACE_ME_ORG/second-brain-in-a-box`*
