# CLAUDE.md — {{FIRM}} Brain

**This brain belongs to {{OWNER}} at {{FIRM}}.**

This file is the operating manual for the AI agent maintaining this brain. The agent is the **maintainer**; {{OWNER}} is the **curator**. {{OWNER}} sources material and asks questions. The agent reads, summarizes, files, cross-links, and keeps everything consistent.

Created {{DATE}} with Second Brain in a Box.

---

## 1. Folder structure

| Folder | Purpose | Who writes |
|---|---|---|
| `00_Inbox/` | **Raw staging.** Unprocessed transcripts, clipped articles, PDFs, screenshots, notes — anything dropped here before processing. **Originals are immutable.** | {{OWNER}} drops files in. The agent reads but never edits originals. |
| `01_Daily/` | One file per day (`YYYY-MM-DD.md`). Extracted to-dos, follow-ups, the daily brief. | Agent creates and updates. {{OWNER}} edits freely. |
| `02_Workstreams/` | Active work by stream: `PortCo Ops/`, `Diligence Pipeline/`, `Firm Internal/`. One page per company or initiative. | Agent maintains. |
| `03_People/` | **Personal CRM.** One page per founder, operator, advisor, banker. Background, interactions, asks and offers. | Agent maintains. |
| `04_Intelligence & Learning/` | Decisions, frameworks, market research, theses. The synthesis layer. | Agent maintains. |
| `05_Resources & Templates/` | Reusable scaffolds: meeting templates, memo templates, checklists. | Co-edited. |
| `06_Archive/` | Cold storage. Wound-down work, closed deals, superseded research. Never deleted, just moved. | Agent moves on request. |

**Do not invent new top-level folders.** If something does not fit, ask {{OWNER}} where it belongs and update this file.

---

## 2. How the brain remembers — the four layers

Context is layered broad to deep and mirrors the folders. Load the light layers instantly; open the heavy detail only for the exact thing being worked on. Nothing is lost between sessions.

**Layer 1 — `CLAUDE.md` — the Operating Manual.**
How the agent works, plus the memory rules. This file. *Always on. Sets the method. Broad and light.*

**Layer 2 — `MEMORY.md` — the Map, the global Save Point.**
Every company and project as **one line**, grouped Workstream ▸ Company, each carrying live status. *Auto-loaded every session. Instant, at a glance.*

**Layer 3 — `project_{company}.md` — the Company Anchor, its Save Point.**
Per company: current state, a dated log of all its projects, open items, key files. *Medium context. The history.*

**Layer 4 — `project_{company}_{project}.md` — the Project File.**
Per project: full methodology, data, decisions, gotchas. *Deep. Opened only when going deep.*

The governing idea is **progressive context depth: Workstream ▸ Company ▸ Project.** Load light first, go deep only when needed. Context stays fast, cheap, and accurate.

Layers 2, 3 and 4 live in the agent's memory directory, not in the vault folders above. The vault holds the *content*; the memory layer holds the *state of the work*.

---

## 3. The Memory Operating Protocol

**Load first.** Before acting on any company, deal, or initiative, open its anchor file to resume with full context. Never start cold on something that already has a file.

**Update on change.** At the end of any substantive engagement — a deliverable shipped, a decision made, a workstream advanced — update the anchor's Current State, prepend a dated Log entry, refresh Open Items, and update its one-line hook in `MEMORY.md`. Skip trivial questions.

**Roll up.** Every `MEMORY.md` line carries status plus the single hottest open item, so the map alone shows what is live without opening anything.

**Hygiene.** One anchor per project. Merge overlaps. Mark things done or paused rather than deleting history. Verify a cited path still exists before relying on it.

**Precedence.** When two sources disagree: `MEMORY.md` and the anchors are authoritative for **project status**; `index.md` is authoritative for **routing** (where content lives); `log.md` is **history only** and never wins a conflict.

**Keep live values out of always-loaded files.** This file and `MEMORY.md` load every session, so anything with a shelf life written here is guaranteed to go stale while still being trusted. Never write dated events, counters, "this week" phrasing, draft ids, or in-progress status into them. Write a **pointer** instead ("current status lives in the anchor"). Decaying detail belongs in the anchor.

---

## 4. Save Point

When {{OWNER}} says **"create a save point"** — or anything like *"save my context"*, *"I'm about to restart"*, *"don't lose this"* — do all of the following:

1. **Update the anchor** for every project touched this session: Current State, a new dated Log entry, refreshed Open Items, and **Key Artifacts & Paths** — including in-flight file paths, scratch and build-script locations, unsent draft ids, and **the exact command or query needed to resume**. This is the part that actually prevents lost context.
2. **Refresh the `MEMORY.md` line** for each: status plus the hottest open item.
3. **If the session was broad** and not tied to one project, also write a dated capture into `04_Intelligence & Learning/`.
4. **Tell {{OWNER}}** what was saved and the one-line way to resume next session.

Do not create standalone save-point files by default. The anchor is the source of truth and keeps the vault clean.

---

## 5. Core operations

| Command | What it does |
|---|---|
| `/onboard` | Research this firm or company, build the context layer, and interview {{OWNER}} about their role. Also `/onboard <Company>` to add an entity and `/onboard --refresh` to re-research. **The only sanctioned way to create a new memory node.** |
| `/capture` | Process `00_Inbox/`: read, extract entities and actions, route, cross-link, mark processed. |
| `/brief` | The daily orientation: calendar, mail, meeting notes, open items, what is going stale. |
| `/save-point` | The checkpoint ritual in §4. |
| `/os-audit` | Read-only health scorecard. Proposes fixes, applies none. |
| `/sync` | Share with teammates without needing to know git. |
| `/connect` | Guided setup for calendar, mail, and meeting-note connections. |
| `/cadence` | Turn optional automations on or off. All ship off. |

---

## 6. Page conventions

- **Filenames:** `Title Case With Spaces.md`.
- **Frontmatter** on every agent-authored page:

```yaml
---
type: company | deal | person | concept | decision | source-summary | daily | template
status: active | watching | archived | closed
tags: [tag-one, tag-two]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources:
  - "[[Source Page A]]"
  - "[[Source Page B]]"
---
```

- **Any list of wikilinks MUST be a block sequence of QUOTED links** — `sources`, `related`, or any new field of the same shape.

  `sources: [[Page A]], [[Page B]]` **is not valid YAML.** YAML reads `[[Page A]]` as a complete nested flow sequence, so the comma that follows is unexpected at the mapping level and **the entire frontmatter block fails to parse** — silently. The page's properties become invisible to Obsidian Properties, Dataview, Bases, and any indexer reading the vault.

  A single link is equally wrong unquoted: `sources: [[Only Page]]` parses, but as a nested list, not as a link.

  Quotes are required, not stylistic. An unquoted `[[...]]` is flow-sequence syntax to YAML, never a string.

- **Free-text list values must be quoted too.** An unquoted item containing `[`, `]`, `:` or `,` breaks the same way — an action item containing a `[Placeholder]` is enough to do it.
- **Cross-link aggressively** with `[[wikilinks]]`. The graph is a feature.

---

## 7. Data classification

**Belongs in the brain:** synthesis, decisions and the reasoning behind them, meeting takeaways, strategy, market and competitive intelligence, relationship context, process knowledge, and pointers to where the raw record lives.

**Stays in the system of record:** raw customer PII, credentials and API keys, anything covered by a specific NDA that does not permit copies, regulated or material non-public information, and bulk exports that are authoritative elsewhere. Reference those by link; do not duplicate them here.

When in doubt, ask {{OWNER}} before filing it. A brain that quietly accumulates material it should not hold is harder to fix than one that asked.

---

## 8. Tone

- Crisp and factual. No hedging filler.
- Bullets for entity pages; short paragraphs for synthesis pages.
- Flag uncertainty explicitly: `> [!note] Unverified — source X said Y but Z contradicts.`
- Date every claim that could go stale.
- **Never invent a fact to fill a section.** Write `_unknown_` or leave the section out.

---

## 9. Co-evolution

This schema is v0.1. Whenever a convention changes — a new folder, a new frontmatter field, a new operation — update this file and append a `schema-update` entry to `log.md`.
