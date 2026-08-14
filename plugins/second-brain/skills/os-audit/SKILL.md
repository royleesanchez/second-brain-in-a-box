---
name: os-audit
description: Read-only health scorecard for the brain. Scores routing, index truth, freshness, bloat and duplication, hygiene, and context placement red/yellow/green, then proposes a prioritized fix list for approval without applying anything. Use for "audit my brain", "health check", "is my brain drifting", "what's broken in here", "lint the wiki", "os audit".
---

# OS Audit

The brain audits itself. A second brain does not fail loudly — it degrades quietly, and the first symptom is usually a confidently wrong answer. This finds the drift before it produces one.

## This skill is read-only

**It never edits user content.** It produces a report and a punch list; the user triages. Anything else and the audit becomes another thing that can silently damage the brain — and an audit you cannot trust to be safe is an audit nobody runs.

The only file it may write is its own dated report into `04_Intelligence & Learning/`.

## What it is defending against

Every finding must be labeled with which failure mode it represents:

| Mode | What it looks like |
|---|---|
| **Poisoning** | A false fact sitting among true ones. A retired price or dead feature still stated as current, so anything built on it inherits the error. |
| **Bloat** | Too much material, so retrieval surfaces the wrong or outdated page. The needle is there; the haystack grew. |
| **Confusion** | Something is missing, so the model fills the gap by inventing. No ICP on file means an invented ICP. |
| **Clash** | Old and new both live. Two versions of the same claim, no indication which won. |

## The six scored rows

Score each **red / yellow / green**, and show the evidence that produced the score. A score without evidence is an opinion.

1. **Routing** — does `CLAUDE.md` point at files that actually exist? Are there pages with no inbound links, unreachable from `index.md` or any anchor?
2. **Index Truth** — does `index.md` match what is on disk, **in both directions**? Entries pointing at deleted pages, and pages missing from the index, are both failures.
3. **Freshness** — anchors marked `active` whose `Updated:` date is old; claims with dates that have passed; "current" statements older than their subject matter.
4. **Bloat / Duplication** — competing copies of the same page; near-duplicate anchors for one entity; `CLAUDE.md` or `MEMORY.md` grown large enough to cost real context every session.
5. **Hygiene** — filename convention violations; frontmatter that fails to parse — **check specifically for unquoted `[[wikilinks]]` in list values, which silently break the entire block**; missing required fields.
6. **Context Placement** — dated or decaying detail living in `CLAUDE.md` or `MEMORY.md` instead of an anchor; facts filed on the wrong shelf; project state recorded in `log.md` where it will lose a precedence conflict.

## Output

1. **Headline verdict** — one line on whether the brain is healthy, drifting, or in trouble.
2. **The six-row scorecard**, with evidence.
3. **A prioritized fix list, top ten, highest-ROI first.** Ordered by what would most change an answer the brain gives, not by how many instances there are. One poisoned fact outranks forty naming inconsistencies.
4. Each item labeled with its failure mode and the file it lives in.

Then **ask which to apply.** Do not apply anything until told, and when told, apply only what was named.

## Cadence

This is worth running on a schedule once it has proven useful by hand — see `/cadence`. Run it read-only, act on what it flags, and the brain stays accurate as it grows.
