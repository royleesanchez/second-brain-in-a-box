---
name: capture
description: Process everything sitting in the inbox — transcripts, clipped articles, PDFs, screenshots, notes — reading each one, extracting entities and action items, routing the content to the right page, cross-linking it, and marking the source processed. Use for "process my inbox", "capture this", "ingest these notes", "file this", "clear the inbox".
---

# Capture

Turns raw material into filed, cross-linked knowledge. This is the loop that makes the brain grow: **capture → route → synthesize → reuse.**

## Sequence

1. **List every unprocessed file** in `00_Inbox/`, excluding `_processed/`. Show the list and the count before starting.

2. **For each file, in order:**
   a. Read it fully. Do not skim and route on the filename.
   b. Identify the **type**: meeting transcript, clipped article, PDF, screenshot, voice memo, other.
   c. Identify **entities** (people, companies, deals, concepts) and **action items** (to-dos, follow-ups, decisions owed).
   d. **If the source is substantial, summarize the key takeaways in three to six bullets and wait for direction** before writing. A long transcript can be filed several defensible ways; the user knows which one matters.
   e. Route it (below).
   f. Cross-link every page touched.
   g. Mark the source processed.

## Routing

| Content | Destination |
|---|---|
| To-dos and follow-ups | Today's `01_Daily/YYYY-MM-DD.md`, under `## Action Items` / `## Follow-ups`. Create the file if missing. |
| Company or portfolio content | The company's page under `02_Workstreams/`. **If the company is new, create it with `/onboard <Company>`** so the anchor and map line are created properly rather than by hand. |
| A prospective company or deal | `02_Workstreams/Diligence Pipeline/`. |
| Firm-internal content | `02_Workstreams/Firm Internal/`. |
| A person mentioned substantively | Create or update their card in `03_People/` — role, company, relationship, and this interaction with its date and what was discussed. |
| A generalizable insight, framework, decision, or market intel | `04_Intelligence & Learning/`. |

**Meeting notes:** do not trust the calendar title. After reading, infer the real purpose and name the file `YYYY-MM-DD - [Company or Context] - [Meeting Type].md`.

## Cross-linking

Link every page touched with `[[wikilinks]]`, in both directions where it makes sense. The graph is a feature, not decoration — an entity with no inbound links is invisible to future retrieval.

## Marking processed

**Never edit the original.** Originals in `00_Inbox/` are immutable source of truth. To mark a source processed, **move it to `00_Inbox/_processed/YYYY-MM/`**, creating the folder as needed. If you generate a summary from a source, file the summary separately and link back to the original.

## When routing is unclear

**Do not guess.** Set `status: needs-routing` in the file's frontmatter, leave it in `00_Inbox/`, and list it for the user at the end. A misfiled note is worse than an unfiled one: it will be found later and trusted.

## Closing out

- Update `index.md` with every new page created.
- Append **one** dated `capture` entry to `log.md` for the whole batch, not one per file.
- Report: how many processed, where they went, what needs routing, and any action items that landed in today's daily note.

## Conventions

Every page written must follow `CLAUDE.md` §6 — filename casing, the frontmatter block, and **quoted wikilinks in every list value.** An unquoted `[[link]]` in a `sources:` list silently breaks the entire frontmatter block.
