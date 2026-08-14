---
name: save-point
description: Checkpoint the session into the memory architecture so nothing is lost across a restart, a context compaction, or a handoff. Updates every touched anchor's Current State, dated Log entry, Open Items and Key Artifacts, refreshes the MEMORY.md map lines, and returns the one-line phrase that resumes the work. Use for "create a save point", "save my context", "I'm about to restart", "don't lose this", "checkpoint this".
---

# Save Point

A save point is **not a summary.** A summary describes what happened; a save point writes state to disk so the next session starts where this one stopped. If you produce prose and change no files, you have not made a save point.

Trigger on: *"create a save point"*, *"save a point before I restart"*, *"don't lose context"*, *"checkpoint this"*, *"I'm about to run out of context"*.

## Step 1 — Identify what was touched

List every project this session actually advanced, and show the list to the user before writing anything. If a project was merely mentioned, leave it out. A save point that updates six anchors when two changed makes the dated log useless.

## Step 2 — Update each anchor

For every project on that list, in its `project_<company>.md`:

- **Current State** — rewrite it to where things actually stand *now*, in two to four sentences, present tense. Do not append to the old state; replace it. This is the field that answers "what is going on with this."
- **Log** — **prepend** a dated entry, newest first: what was done, when, why, and what was decided. Decisions matter more than actions; a future reader can see the actions in the files.
- **Open Items / Next Actions** — refresh. Remove what got done. Add what surfaced.
- **Key Artifacts & Paths** — this is the field that actually prevents lost context, and it is the one most often skipped. Record:
  - every file created or modified, by full path
  - scratch directories and build-script locations
  - unsent draft ids, ticket numbers, branch names
  - **the exact command, query or phrase needed to resume**

If a project has no anchor yet, create one via `/onboard <Company>` rather than hand-rolling the file.

## Step 3 — Refresh the map

Update each project's line in `MEMORY.md`: current status plus **the single hottest open item.** The map has to show what is live without anyone opening a file. A line that says "in progress" has told the reader nothing.

## Step 4 — Broad sessions

If the session was exploratory and not tied to one project — a brainstorm, a discovery pass, a decision worked through — also write a dated capture into `04_Intelligence & Learning/` so the thinking survives, and link it from the relevant anchors.

## Step 5 — Tell the user

Report, briefly:
- which anchors were updated
- what the hottest open item now is
- **the one-line way to resume**, quoted, ready to paste: *"next session, say: resume the Acme pricing work"*

## Rules

- **Do not create standalone save-point files by default.** The anchor is the source of truth and keeps the vault clean. Only write a separate dated file if the user explicitly asks for a browsable copy.
- **Never write dated or decaying detail into `CLAUDE.md`.** It loads every session and will be trusted long after it goes stale.
- Prefer precision over completeness. Three accurate paths beat a paragraph of narrative.
