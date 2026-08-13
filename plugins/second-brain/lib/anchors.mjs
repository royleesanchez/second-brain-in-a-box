import { readdirSync } from 'node:fs';
import path from 'node:path';
import { tokenize, STOPWORDS, STRUCTURAL_PREFIXES } from './tokens.mjs';

const DEFAULT_MAX_DF = 6;
const DEFAULT_MAX_ANCHORS = 3;

/**
 * Build: token -> [absolute anchor paths].
 *
 * Distinctiveness is decided by DOCUMENT FREQUENCY, not by a hand-kept
 * keyword list. A token appearing in <= maxDf filenames is distinctive
 * ("northwind", "debook"); one appearing in more is generic ("overview",
 * "skill"). A curated stoplist would rot as the brain grows; df does not.
 */
export function buildAnchorIndex(memDir, opts = {}) {
  const maxDf = opts.maxDf ?? DEFAULT_MAX_DF;
  const index = new Map();
  if (!memDir) return index;

  let files;
  try {
    files = readdirSync(memDir)
      .filter((n) => n.endsWith('.md') && n !== 'MEMORY.md')
      .sort();
  } catch {
    return index;
  }

  const perFile = new Map();
  const df = new Map();

  for (const name of files) {
    let segs = path.basename(name, '.md').toLowerCase().split(/[_-]/);
    if (segs.length && STRUCTURAL_PREFIXES.has(segs[0])) segs = segs.slice(1);
    const toks = new Set(segs.filter((t) => t.length > 2 && !STOPWORDS.has(t)));
    perFile.set(path.join(memDir, name), toks);
    for (const t of toks) df.set(t, (df.get(t) ?? 0) + 1);
  }

  for (const [file, toks] of perFile) {
    for (const t of toks) {
      if ((df.get(t) ?? Infinity) <= maxDf) {
        if (!index.has(t)) index.set(t, []);
        index.get(t).push(file);
      }
    }
  }

  return index;
}

/** Rank anchors by how many distinctive tokens of the prompt they hit. */
export function matchAnchors(prompt, index, opts = {}) {
  const aliases = opts.aliases ?? {};
  const maxAnchors = opts.maxAnchors ?? DEFAULT_MAX_ANCHORS;

  let p = String(prompt ?? '').toLowerCase();
  for (const [alias, target] of Object.entries(aliases)) {
    if (p.includes(alias)) p += ' ' + target;
  }

  const scores = new Map();
  for (const t of new Set(tokenize(p))) {
    for (const file of index.get(t) ?? []) {
      scores.set(file, (scores.get(file) ?? 0) + 1);
    }
  }
  if (scores.size === 0) return [];

  let ranked = [...scores.entries()].sort(
    (a, b) => b[1] - a[1] || path.basename(a[0]).localeCompare(path.basename(b[0]))
  );

  // If anything matched two or more distinctive tokens, single-token matches
  // are almost always coincidence -- one shared word pulling in an unrelated
  // memory. Drop them rather than pad the injection.
  if (ranked[0][1] >= 2) ranked = ranked.filter(([, s]) => s >= 2);

  return ranked.slice(0, maxAnchors).map(([file]) => file);
}
