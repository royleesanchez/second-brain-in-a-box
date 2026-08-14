import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

/**
 * Terms that must never appear in this PUBLIC repository.
 *
 * The list itself is deliberately NOT committed. A file enumerating a firm's
 * portfolio companies would be a disclosure in its own right -- the guard
 * would leak exactly what it exists to prevent. So the terms are supplied
 * locally, by whoever is about to publish:
 *
 *   1. SECOND_BRAIN_DENYLIST env var (comma-separated), or
 *   2. a gitignored `.denylist` file at the repo root, one term per line.
 *
 * With neither present the name check is skipped and the structural checks
 * (absolute personal paths, credential shapes) still run. That is the right
 * default for an outside contributor, who has nothing to leak.
 */
export function loadDenylist() {
  const fromEnv = process.env.SECOND_BRAIN_DENYLIST;
  if (fromEnv && fromEnv.trim()) {
    return fromEnv.split(',').map((s) => s.trim()).filter(Boolean);
  }

  const file = path.join(REPO, '.denylist');
  if (existsSync(file)) {
    return readFileSync(file, 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));
  }

  return [];
}

/**
 * Build a case-insensitive alternation, or null when there is nothing to check.
 *
 * Terms are word-bounded. Without that, a short company name is a substring of
 * ordinary English and the guard cries wolf -- a real example: the term
 * "Ritten" matched inside the word "written", failing four unrelated files.
 * A guard that produces false positives gets disabled, and a disabled guard
 * protects nothing.
 */
export function denylistPattern() {
  const terms = loadDenylist();
  if (terms.length === 0) return null;
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`\\b(?:${escaped.join('|')})\\b`, 'i');
}

/** Files exempt from the scan: the guard's own machinery. */
export const EXEMPT = [/test[\\/]denylist\.mjs$/, /test[\\/]package\.test\.mjs$/];
