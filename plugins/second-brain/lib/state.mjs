import { mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const DEFAULT_TTL_DAYS = 3;

/**
 * Session ids come from the harness, but this builds a filesystem path, so
 * treat them as untrusted: anything that is not a word character, dot or
 * hyphen is replaced, which also neutralises "../" traversal.
 */
const safeId = (sessionId) => String(sessionId ?? 'unknown').replace(/[^\w.-]/g, '_');

/**
 * Per-session memory of what has already been injected, so the same anchor
 * is surfaced once rather than on all twenty prompts of a conversation.
 */
export function loadState(stateDir, sessionId, opts = {}) {
  const ttlDays = opts.ttlDays ?? DEFAULT_TTL_DAYS;
  const file = path.join(stateDir, `${safeId(sessionId)}.json`);

  try {
    mkdirSync(stateDir, { recursive: true });
    const cutoff = Date.now() - ttlDays * 86400 * 1000;
    for (const name of readdirSync(stateDir)) {
      if (!name.endsWith('.json')) continue;
      const p = path.join(stateDir, name);
      if (statSync(p).mtimeMs < cutoff) unlinkSync(p);
    }
  } catch {
    /* opportunistic cleanup only -- never fail a prompt over it */
  }

  try {
    return { path: file, seen: new Set(JSON.parse(readFileSync(file, 'utf8'))) };
  } catch {
    return { path: file, seen: new Set() };
  }
}

export function saveState(statePath, seen) {
  try {
    mkdirSync(path.dirname(statePath), { recursive: true });
    writeFileSync(statePath, JSON.stringify([...seen].sort()), 'utf8');
  } catch {
    /* never block a prompt over state */
  }
}
