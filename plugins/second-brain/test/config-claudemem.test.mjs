import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadBrainConfig } from '../lib/config.mjs';
import { searchObservations } from '../lib/claudemem.mjs';

const require = createRequire(import.meta.url);

/**
 * Build a synthetic claude-mem-shaped store so the POSITIVE path is covered
 * without depending on any particular machine's real database.
 */
function makeDb({ rows = 4000, project = 'Acme Brain' } = {}) {
  let DatabaseSync;
  try {
    ({ DatabaseSync } = require('node:sqlite'));
  } catch {
    return null; // runtime without node:sqlite -- caller skips
  }

  const dir = mkdtempSync(path.join(tmpdir(), 'sb-fts-'));
  const dbPath = path.join(dir, 'claude-mem.db');
  const db = new DatabaseSync(dbPath);

  db.exec(`CREATE TABLE observations (
    title TEXT, project TEXT, created_at_epoch INTEGER)`);
  db.exec(`CREATE VIRTUAL TABLE observations_fts USING fts5(title, content='observations', content_rowid='rowid')`);

  const ins = db.prepare('INSERT INTO observations (title, project, created_at_epoch) VALUES (?, ?, ?)');
  const base = Date.UTC(2026, 0, 1);

  // One transaction for the whole load. Without this each insert commits
  // separately and building the fixture takes ~35s instead of well under 1s.
  db.exec('BEGIN');
  // Filler that all shares a common term, so ranking has real work to do.
  for (let i = 0; i < rows; i++) {
    ins.run(`Routine pipeline review note number ${i} about pricing cadence`, project, base + i * 60000);
  }
  // The needles.
  ins.run('Northwind renewal risk and pricing decision', project, base + 999_000_000);
  ins.run('Northwind renewal note belonging to a different brain', 'Other Brain', base + 999_100_000);
  db.exec('COMMIT');

  db.exec(`INSERT INTO observations_fts(observations_fts) VALUES('rebuild')`);
  db.close();
  return dbPath;
}

test('claude-mem band finds real matches and scopes them to the project', () => {
  const dbPath = makeDb();
  if (!dbPath) return; // node:sqlite unavailable

  const out = searchObservations({ dbPath, prompt: 'northwind renewal', project: 'Acme Brain' });
  assert.ok(out.length > 0, 'expected at least one hit');
  assert.ok(out.some((l) => l.includes('Northwind renewal risk')), 'expected the in-project needle');
  assert.ok(
    !out.some((l) => l.includes('different brain')),
    'must not leak observations belonging to another project'
  );
  assert.match(out[0], /^\d{4}-\d{2}-\d{2} — /, 'lines are "YYYY-MM-DD — title"');
});

test('claude-mem band caps results at maxObs', () => {
  const dbPath = makeDb();
  if (!dbPath) return;
  const out = searchObservations({ dbPath, prompt: 'pricing cadence review', project: 'Acme Brain', maxObs: 3 });
  assert.ok(out.length <= 3);
});

test('claude-mem band stays inside the per-prompt latency budget', () => {
  const dbPath = makeDb({ rows: 8000 });
  if (!dbPath) return;

  // Warm the page cache so this measures the query, not first-touch disk IO.
  searchObservations({ dbPath, prompt: 'pricing cadence review', project: 'Acme Brain' });

  const t = Date.now();
  searchObservations({ dbPath, prompt: 'northwind renewal pricing cadence review', project: 'Acme Brain' });
  const elapsed = Date.now() - t;

  // The naive "MATCH ... AND project = ? ORDER BY rank" formulation measured
  // 800-1400ms on a real store. This asserts we did not regress to it.
  assert.ok(elapsed < 400, `recall band took ${elapsed}ms, budget is 400ms`);
});

test('config defaults when there is no config file', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'sb-cfg-'));
  const c = loadBrainConfig(dir);
  assert.deepEqual(c.aliases, {});
  assert.equal(c.features.claudeMem, true);
  assert.equal(typeof c.project, 'string');
});

test('config reads aliases and feature flags', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'sb-cfg-'));
  mkdirSync(path.join(dir, '.brain'));
  writeFileSync(
    path.join(dir, '.brain', 'config.json'),
    JSON.stringify({ project: 'Acme Brain', aliases: { nw: 'northwind' }, features: { claudeMem: false } })
  );
  const c = loadBrainConfig(dir);
  assert.equal(c.project, 'Acme Brain');
  assert.deepEqual(c.aliases, { nw: 'northwind' });
  assert.equal(c.features.claudeMem, false);
});

test('malformed config degrades to defaults instead of throwing', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'sb-cfg-'));
  mkdirSync(path.join(dir, '.brain'));
  writeFileSync(path.join(dir, '.brain', 'config.json'), '{ not json');
  assert.deepEqual(loadBrainConfig(dir).aliases, {});
});

test('config tolerates a null projectDir', () => {
  assert.deepEqual(loadBrainConfig(null).aliases, {});
  assert.deepEqual(loadBrainConfig(undefined).aliases, {});
});

test('claude-mem band returns empty when the database is absent', () => {
  const out = searchObservations({
    dbPath: path.join(tmpdir(), 'nope', 'claude-mem.db'),
    prompt: 'acme pricing',
    project: 'Acme Brain',
  });
  assert.deepEqual(out, []);
});

test('claude-mem band returns empty for an empty prompt', () => {
  assert.deepEqual(searchObservations({ dbPath: '/x', prompt: '   ', project: 'p' }), []);
});

test('claude-mem band returns empty when called with no arguments', () => {
  assert.deepEqual(searchObservations(), []);
});

test('claude-mem band never throws on a non-database file', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'sb-db-'));
  const fake = path.join(dir, 'claude-mem.db');
  writeFileSync(fake, 'this is definitely not sqlite');
  assert.deepEqual(searchObservations({ dbPath: fake, prompt: 'acme pricing', project: 'p' }), []);
});
