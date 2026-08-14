---
name: onboard
description: Bootstrap or extend this second brain. With no arguments it researches the firm or company from its website, studies the portfolio, infers the investment thesis, then interviews the user about their role and writes the result into CLAUDE.md and MEMORY.md. With a company name it adds that company as a new anchor; with a company and project it opens a new project thread. Use for "set up my brain", "onboard me", "add a new portfolio company", "add a project", "refresh my context", "learn about my firm".
---

# Onboard

`/onboard` is the **only sanctioned way to create a new node in the memory architecture.** Companies, projects and the firm profile all enter the brain through here. Creating those folders and files by hand is how a brain drifts: within a month the naming diverges, anchors go missing, and `MEMORY.md` stops matching what is on disk.

## Modes

Detect the mode from the arguments. **If `CLAUDE.md` does not exist, force bootstrap mode regardless of what was passed.**

| Invocation | Mode | Writes |
|---|---|---|
| `/onboard` | Bootstrap the brain | `CLAUDE.md` + `MEMORY.md` |
| `/onboard <Company>` | Add an entity | `MEMORY.md` + `project_<company>.md` |
| `/onboard <Company> "<Project>"` | Open a project thread | `project_<company>.md` + `project_<company>_<project>.md` |
| `/onboard --refresh [target]` | Re-research what exists | all of the above |

## The cost gate — do this BEFORE any research runs

Research is the expensive part of this skill, and it runs on the user's own plan. **Announce the intended depth and get one confirmation before starting.** Never begin a heavy pass without saying so.

- **Light** (default for bootstrap, roughly ten minutes): firm profile, plus a stub page per portfolio company with name, sector, stage and source link.
- **Heavy** (only when asked): full company-and-industry depth per entity — market, GTM, competitive landscape, M&A, sizing. Say plainly that this takes substantially longer and uses meaningful usage.

State which you are about to run, and how many entities it covers, then wait.

## Bootstrap sequence

1. **Ask for the firm name and website. Ask nothing else yet.** One question. Everything below is derived or asked later.

2. **Research the firm.** Read the site: about, team, strategy, news, and above all the **portfolio or investments page**. Enumerate every portfolio company you can find, with sector, stage, and investment date where available. Follow through to each company's own site when the portfolio page is thin.

3. **Infer the investment thesis from the portfolio, not from the marketing copy.** What the firm actually funds is a better signal than what it says it funds. Derive: stage, typical check size, sector concentration, geography, ownership posture (control vs minority), and what they conspicuously avoid. **State your confidence and say what each inference rests on.** A thesis inferred from eight companies is worth more than one quoted from a homepage.

4. **Interview the user.** Invoke the brainstorming or grilling skill if one is available; otherwise conduct the interview directly — one question at a time, each with your recommended answer so they can confirm or correct. Cover what the web cannot:
   - Their role and actual responsibilities, in their words.
   - Which companies or deals they personally own.
   - How they are measured.
   - Who they work with most, inside and outside the firm.
   - What they want the brain to do for them first.
   - Anything about the thesis your research got wrong.

5. **Write the results, split by shelf life.**
   - **Durable and small → `CLAUDE.md`:** who the user is, their role, the firm, the operating rules. This file loads every session, so it gets identity and method only.
   - **Rich and decaying → the vault:** a firm profile and thesis page in `04_Intelligence & Learning/`; one page per portfolio company under `02_Workstreams/PortCo Ops/`; prospects under `Diligence Pipeline/`.
   - **State → the memory layer:** one line per entity in the right `MEMORY.md` section, and a `project_<company>.md` anchor for each.
   - Update `index.md` with every new page. Append one dated `onboard` entry to `log.md`.

6. **Close by telling them what to do next:** run `/connect` to wire in calendar and mail, then `/brief`.

## Add-entity sequence

1. Research the company to the agreed depth.
2. Create `project_<company>.md` with, in this order: `**Status:** active · **Updated:** <today>`, then **Current State**, **Open Items / Next Actions**, **Key Artifacts & Paths**, **Log**, **Links**.
3. Add its one-line hook to the correct `MEMORY.md` section: status plus the single hottest open item.
4. Create the vault folder and landing page under the right workstream.
5. Update `index.md`; append an `onboard` entry to `log.md`.

## Refresh sequence

1. Re-research the target.
2. **Diff against what is already on file.** Do not overwrite blind.
3. Present changed claims to the user for confirmation before writing.
4. **Retire superseded statements rather than deleting them** — move them into the Log with the date they stopped being true.
5. Never silently rewrite a Current State. That is how a brain quietly starts lying.

## Hard rules

- **Never invent a fact to fill a section.** If it is unknown, write `_unknown_`. A gap is honest; a plausible invention is a landmine, and it is the single fastest way to make the brain untrustworthy.
- **Date every claim that can go stale**, and cite the source for every number, percentage, multiple or valuation.
- **Keep dated detail out of `CLAUDE.md`.** Put it in the anchor and leave a pointer.
- **Follow the frontmatter conventions in `CLAUDE.md` §6** on every page written — including quoted wikilinks in list values.
