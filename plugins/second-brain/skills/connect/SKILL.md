---
name: connect
description: Guided setup for the brain's live data connections — calendar, mail, and meeting notes. Walks the user through authorizing each connection in their own settings, verifies each one actually returns data, and records what is live so the daily brief knows what it can read. Use for "connect my email", "set up my connectors", "wire in my calendar", "why can't you see my meetings", "connect my notes".
---

# Connect

Wires the brain into live systems. The principle: **connect, do not copy.** Volatile data — the calendar, the inbox, the CRM — stays where it lives and is pulled just in time. Ingesting a snapshot of it into the vault guarantees the brain will one day confidently quote something that stopped being true.

## State the constraint first

**This skill cannot install anything.** These connections are per-user authorizations that the user makes in their own settings; no script can or should do it for them, because it is their credential. Say this plainly at the start so the user knows why they are being asked to click.

The upside is worth stating too: there are **no keys for anyone else to issue, store, rotate, or revoke.** Access is theirs, scoped, and revocable by them at any time.

## Sequence

**First, ask once which ecosystem their organization runs — Google or Microsoft.** Do not probe blindly; it wastes their time and yours. Both are supported for calendar and mail.

Then, for each slot — **calendar**, **mail**, **meeting notes** — in order:

1. **Detect.** Check whether a matching capability is already available. If it is, skip to verification.
2. **Instruct.** Give the exact click path to authorize it. Be specific enough that a non-technical person does not have to guess. One slot at a time; do not hand them a list of four things.
3. **Verify with a real read.** This is the part that matters:
   - calendar → fetch today's events
   - mail → fetch the three most recent message subjects
   - meeting notes → list the most recent meeting
4. **Report what came back**, concretely. "Read 4 events from today" beats "connected".

**Never mark a slot live without a successful read.** A slot recorded as working that then returns nothing produces a brief that silently omits half the day, and the user will not know why. Optimistic status is worse than no status.

## Record the outcome

Write the result into `.brain/config.json` under `connectors`:

```json
{
  "connectors": {
    "calendar":     { "provider": "<name>", "status": "live",        "verifiedOn": "YYYY-MM-DD" },
    "mail":         { "provider": "<name>", "status": "live",        "verifiedOn": "YYYY-MM-DD" },
    "meetingNotes": { "provider": "<name>", "status": "unavailable", "verifiedOn": "YYYY-MM-DD" }
  }
}
```

`/brief` reads this to know what it can use. Preserve any keys already in the file.

## Scope rules

- **Read-only by default.** Never enable a send or write scope as part of setup.
- If the user wants the brain to send on their behalf, say plainly that this is a separate decision, that a human approves before anything sends, and let them opt in deliberately.
- If a connection only offers broader access than needed, say so rather than quietly accepting it.

## On failure

Report the specific failure and one concrete thing to try. Do not retry the same authorization more than twice — if it will not connect, record the slot as `unavailable`, tell the user the brief will work without it, and move on. A half-finished setup that reports success is the worst outcome available here.
