# Log — {{FIRM}} Brain

Append-only chronological record. History only — this file never wins a conflict
against `MEMORY.md` or an anchor.

Entry format:

```
## [YYYY-MM-DD] <op> | <short title>
```

where `<op>` is one of: `capture`, `onboard`, `query`, `brief`, `os-audit`,
`schema-update`, `archive`, `sync`.

Each entry body: 2-6 bullets covering what was touched, key findings, open questions.

Greppable: `grep "^## \[" log.md | tail -10` gives the last ten operations.

---

## [{{DATE}}] schema-update | Brain created from Second Brain in a Box

- Scaffolded the `firm-personal` template for {{OWNER}} at {{FIRM}}.
- Memory architecture installed: `CLAUDE.md` (operating manual), `MEMORY.md` (the map), and per-entity anchors.
- Next: run `/onboard` to research the firm and populate the map, then `/connect`, then `/brief`.
