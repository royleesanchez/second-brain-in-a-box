#!/usr/bin/env node
/**
 * UserPromptSubmit hook -- the retrieval half of the memory architecture.
 *
 * WHY THIS EXISTS
 *   The Memory Operating Protocol says "LOAD FIRST: open the anchor before
 *   acting." A SessionStart hook can only *remind* Claude to do that, because
 *   at session start nobody knows yet what the session is about. The first
 *   user prompt is the earliest moment intent is known, which makes
 *   UserPromptSubmit the correct place to do the lookup.
 *
 * DESIGN RULES
 *   - Fast. Runs before every prompt, so it must stay well under a second.
 *   - Silent on failure. Any error yields no output and exit 0.
 *   - Never repeats itself. Per-session state means the same anchor is
 *     injected once, not on all twenty prompts of a conversation.
 *   - Bounded. Hard cap on injected characters so this never becomes the
 *     bloat it was built to prevent.
 */
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { resolveMemoryDir, resolveStateDir } from '../lib/paths.mjs';
import { buildAnchorIndex, matchAnchors, expandAliases } from '../lib/anchors.mjs';
import { anchorBlurb } from '../lib/blurb.mjs';
import { loadState, saveState } from '../lib/state.mjs';
import { render } from '../lib/render.mjs';
import { loadBrainConfig } from '../lib/config.mjs';
import { searchObservations } from '../lib/claudemem.mjs';
import { tokenize } from '../lib/tokens.mjs';

const MIN_PROMPT_CHARS = 12;
const MIN_PROMPT_TOKENS = 2;

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function main() {
  let payload;
  try {
    payload = JSON.parse(readStdin() || '{}');
  } catch {
    return;
  }

  const prompt = String(payload.prompt ?? '').trim();
  const sessionId = payload.session_id ?? 'unknown';

  // Cheap rejections that need no config: slash commands and one-liners.
  if (prompt.length < MIN_PROMPT_CHARS || prompt.startsWith('/')) return;

  // SECOND_BRAIN_HOME exists so the test suite can point at a fixture home.
  const home = process.env.SECOND_BRAIN_HOME || os.homedir();
  const projectDir = process.env.CLAUDE_PROJECT_DIR || payload.cwd || process.cwd();

  const config = loadBrainConfig(projectDir);

  // Expand aliases BEFORE the substance gate. "what's up with nw" is one
  // token raw and would be discarded as chit-chat, but it is a direct anchor
  // hit once the alias is applied.
  const expanded = expandAliases(prompt, config.aliases);
  if (tokenize(expanded).length < MIN_PROMPT_TOKENS) return;

  const memDir = resolveMemoryDir({ home, projectDir });
  const { path: statePath, seen } = loadState(resolveStateDir({ home }), sessionId);

  const anchors = [];
  if (memDir) {
    const index = buildAnchorIndex(memDir);
    for (const file of matchAnchors(expanded, index)) {
      const key = `anchor:${path.basename(file)}`;
      if (seen.has(key)) continue;
      const blurb = anchorBlurb(file);
      if (blurb) {
        anchors.push(blurb);
        seen.add(key);
      }
    }
  }

  const observations = [];
  if (config.features.claudeMem) {
    const dbPath = path.join(home, '.claude-mem', 'claude-mem.db');
    for (const line of searchObservations({ dbPath, prompt, project: config.project })) {
      const key = `obs:${line.slice(0, 40)}`;
      if (seen.has(key)) continue;
      observations.push(line);
      seen.add(key);
    }
  }

  const context = render({ anchors, observations });
  if (!context) return;

  saveState(statePath, seen);

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext: context,
      },
    })
  );
}

try {
  main();
} catch {
  /* never block a prompt */
}
process.exit(0);
