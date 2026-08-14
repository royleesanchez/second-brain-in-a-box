---
name: cadence
description: Turn the brain's optional automations on or off — a scheduled daily brief, a recurring health audit, and automatic inbox filing. Everything ships off by default and is switched on only once the manual version has proven itself. Use for "automate my brief", "schedule the audit", "turn on automation", "run this every morning", "stop the automatic filing".
---

# Cadence

Controls what the brain does on its own.

## Automation is earned, not switched on

Everything here ships **off**, deliberately. The reason is not caution for its own sake — it is that **a scheduled job which produces a bad first output gets disabled and never re-enabled, and nobody finds out why.** A brief someone chooses to run, finds useful, and then automates becomes a habit. A brief that appears uninvited at 7am on day one becomes noise.

So: **if the user asks to schedule something they have never run manually, say so and offer to run it once now instead.** Not as a refusal — as the faster route to it actually working. One real run surfaces the connector gaps, the empty sections, and the wrong emphasis, and all of those are cheaper to fix before it is on a timer.

## The three automations

| Name | What it does | Sensible precondition |
|---|---|---|
| **daily brief** | Runs `/brief` each morning and writes it to today's daily note | Run `/brief` by hand for about a week, and have at least one connector live |
| **os-audit** | Runs the read-only health check on a schedule and reports findings | The brain has enough material to drift — roughly a month in, or 50+ pages |
| **inbox capture** | Files anything dropped into `00_Inbox/` without being asked | `/capture` has been run by hand and routes things where the user expects |

## Turning one on

1. Confirm the precondition, or say plainly that it has not been met and let the user decide.
2. Ask for the schedule in their words ("every weekday at 7am"), not in cron.
3. Set it up using whatever scheduling the platform provides.
4. Record it in `.brain/config.json` under `cadence`, with the schedule and the date it was enabled.
5. **Tell them exactly how to turn it off**, in one line, before they need it.

## Turning one off

Remove the schedule, set the flag false in `.brain/config.json`, and confirm. Never leave a disabled automation still scheduled — a job that runs but writes nothing is worse than either state.

## The hard boundary

**Nothing may be scheduled that writes or sends without a human in the loop.**

Reading, summarizing, filing into the user's own vault, and reporting are all fine unattended. Sending an email, posting a message, replying to anyone, or changing a record in a connected system is not — regardless of how confident the brain is, and regardless of the user asking for it. Those stay manual, with a human approving the specific act. If the user pushes for it, explain the boundary once, plainly, and hold it.
