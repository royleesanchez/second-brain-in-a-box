import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tokenize } from './tokens.mjs';

const require = createRequire(import.meta.url);
const MAX_OBS = 5;

/**
 * How many top-ranked FTS hits to consider before filtering by project.
 * Large enough that a project's own results are not crowded out, small
 * enough that ranking stays cheap. See the query comment below.
 */
const FTS_WINDOW = 200;

/**
 * OPTIONAL enrichment band.
 *
 * claude-mem is NOT a dependency of this plugin. When its database is absent,
 * when node:sqlite is unavailable (older runtimes), or when the schema differs
 * from what this query expects, this returns [] and the recall block simply
 * has one fewer section. That is the whole point: the file-based memory
 * architecture stands on its own, and this only enriches it.
 */
export function searchObservations({ dbPath, prompt, project, maxObs = MAX_OBS } = {}) {
  const toks = [...new Set(tokenize(prompt))].slice(0, 8);
  if (toks.length === 0) return [];
  if (!dbPath || !existsSync(dbPath)) return [];

  let DatabaseSync;
  try {
    ({ DatabaseSync } = require('node:sqlite'));
  } catch {
    return [];
  }

  let db;
  try {
    db = new DatabaseSync(dbPath, { readOnly: true });
    const query = toks.map((t) => `"${t}"`).join(' OR ');

    // The FTS scan is bounded to its top-ranked FTS_WINDOW rows BEFORE the
    // join and the project filter. The obvious formulation --
    //   WHERE observations_fts MATCH ? AND o.project = ? ORDER BY rank LIMIT 40
    // -- makes SQLite score and sort every match in the database before the
    // filter or the limit can apply. Measured on a 40MB / 8.3k-row store that
    // is ~800-1400ms per prompt; this form is ~65ms for identical results.
    const rows = db
      .prepare(
        `SELECT o.title AS title, o.created_at_epoch AS epoch
         FROM (SELECT rowid AS rid, rank AS rnk
               FROM observations_fts
               WHERE observations_fts MATCH ?
               ORDER BY rank
               LIMIT ${FTS_WINDOW}) f
         JOIN observations o ON o.rowid = f.rid
         WHERE o.project = ?
           AND o.title IS NOT NULL
         ORDER BY f.rnk, o.created_at_epoch DESC
         LIMIT 40`
      )
      .all(query, project);

    const seen = new Set();
    const out = [];

    for (const row of rows) {
      let title = String(row.title).replace(/\s+/g, ' ').trim();
      const key = title.toLowerCase().slice(0, 60);
      if (seen.has(key)) continue;
      seen.add(key);

      let date = '?';
      try {
        const d = new Date(Number(row.epoch));
        if (!Number.isNaN(d.getTime())) date = d.toISOString().slice(0, 10);
      } catch {
        /* leave as ? */
      }

      if (title.length > 130) title = title.slice(0, 127).trimEnd() + '...';
      out.push(`${date} — ${title}`);
      if (out.length >= maxObs) break;
    }

    return out;
  } catch {
    return [];
  } finally {
    try {
      db?.close();
    } catch {
      /* ignore */
    }
  }
}
