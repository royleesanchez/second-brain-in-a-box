---
name: sync
description: Share the brain with teammates without anyone needing to know git. Pulls what others changed, commits your changes with a readable message, pushes, and reports who changed what. Detects whether the brain is git-backed or living on a shared drive and adapts. Use for "sync my brain", "push my changes", "get the latest", "share this with the team", "did anyone else change anything".
---

# Sync

Makes a shared brain survivable for people who do not use git and should not have to.

## Detect the mode first

- A `.git` directory present → **git mode**.
- Otherwise → **shared-drive mode**.

Say which mode you are in before doing anything, so the user knows what guarantees they have.

## Git mode

1. **Pull first.** `git pull --rebase`.
2. **Report incoming changes in plain language** — *who changed what page*, not a diff. "Dana updated the Acme account page and added two people cards" is useful; forty lines of unified diff is not.
3. **Stage and commit** the user's changes with a generated message that summarizes the pages touched. Never commit with an empty or generic message.
4. **Push.** Confirm it landed.

**On conflict, never resolve silently.** Show both versions in plain language, name the two people, explain what each one says, and ask which to keep. A brain that quietly picks a winner will eventually discard someone's work and nobody will notice until it matters.

**Never force-push. Never discard anyone's work.** If the working tree is dirty in a way that would lose changes, stop and report rather than stashing or resetting.

## Shared-drive mode

1. Verify the sync client shows no pending uploads before starting.
2. **Warn plainly:** simultaneous edits to the same file can be lost outright — there is no merge and no history to recover from.
3. Prompt the user to close open files before syncing.
4. Recommend, once and without nagging, moving to a real repository. This mode is a documented fallback for teams who cannot get one, not the destination.

## After a successful sync

Report **ownership drift**: pages edited by someone other than their declared owner in `CLAUDE.md`.

Report it as **information, not as a block.** Write access is declared, not enforced — the brain is a folder of markdown and anyone with it can edit anything. The point is visibility, so the team notices when the positioning page is being rewritten by someone outside product marketing and can have that conversation. Enforcement would just push people to edit outside the system.

## What this skill does not do

It does not branch, open pull requests, or gate anyone's writes. Those are the right tools for source code and the wrong ones for a team knowledge base — the friction they add is exactly the friction that stops a sales team from ever writing anything down.
