---
name: brief
description: Produce the daily orientation brief — what is on the calendar, what came in, what is open across every project, and what needs a decision today. Reads whichever data connections are available and degrades gracefully when none are. Use for "brief me", "what's on tap", "plan my day", "morning brief", "what's on my plate", "catch me up".
---

# Brief

The daily reason to open this brain. Everything else in the system compounds only if someone comes back, and this is what brings them back.

## Input slots, not vendors

The brief reads three **optional slots**. Each is satisfied by whatever connection `.brain/config.json` records under `connectors`:

| Slot | Satisfied by |
|---|---|
| **calendar** | the user's calendar connection, whichever provider |
| **mail** | the user's mail connection, whichever provider |
| **meeting notes** | a notetaker connection, or failing that the calendar plus anything in `00_Inbox/` |

**Never hardcode a provider into the logic.** Read what is configured, use what is live. Name the specific provider only when reporting what you actually read, so the user can tell where a line came from.

## This skill must never fail

With **zero** connectors it still produces a complete brief from the vault alone:

- open items across every anchor, grouped by project
- projects with no activity in fourteen days or more
- unprocessed items sitting in `00_Inbox/`
- yesterday's unfinished follow-ups from `01_Daily/`

State plainly at the top which slots were unavailable, and point at `/connect` once. Do not nag, and do not let a missing connector produce an error instead of a brief. A brief that fails on day one is a product that gets deleted on day two; every connector added should make it richer, never make it possible.

If a connector is configured but returns an error, say so in one line, use what you have, and carry on.

## Output shape

1. **Headline** — one line: the single thing that most needs attention today.
2. **Calendar strip** — today's meetings, time-ordered, each with the company or person and a one-line "what this is" drawn from the brain where one exists.
3. **Needs a decision today** — things blocked on the user, with what the decision is.
4. **Meetings and prep** — anything on the calendar the brain has context for, and what to read first.
5. **Open items by project** — grouped, hottest first. Link every project to its anchor.
6. **Came in since last brief** — mail and notes worth knowing about, filtered hard. Volume is not the point.
7. **Going stale** — active projects with no recent movement.

Skip any section that is empty rather than printing an empty heading.

## Writing it down

Append the brief to today's `01_Daily/YYYY-MM-DD.md`. **Append, never overwrite** — the daily note also collects action items from `/capture` during the day.

## Boundaries

**Read-only against every connector.** Never send, reply, accept, decline, archive or delete anything as part of a brief. Drafting is allowed and useful; sending is a separate, explicit act a human approves. This boundary is what makes it safe to give the brief broad read access.
