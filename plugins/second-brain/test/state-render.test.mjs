import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadState, saveState } from '../lib/state.mjs';
import { render } from '../lib/render.mjs';

const stateDir = () => path.join(mkdtempSync(path.join(tmpdir(), 'sb-st-')), 'state');

test('state round-trips within a session', () => {
  const dir = stateDir();
  const { path: p, seen } = loadState(dir, 'sess-1');
  assert.equal(seen.size, 0);
  seen.add('anchor:project_acme.md');
  saveState(p, seen);
  assert.deepEqual([...loadState(dir, 'sess-1').seen], ['anchor:project_acme.md']);
});

test('state for a different session is independent', () => {
  const dir = stateDir();
  const a = loadState(dir, 'sess-a');
  a.seen.add('anchor:x.md');
  saveState(a.path, a.seen);
  assert.equal(loadState(dir, 'sess-b').seen.size, 0);
});

test('stale session state is reaped', () => {
  const dir = stateDir();
  const { path: p, seen } = loadState(dir, 'old');
  seen.add('anchor:x.md');
  saveState(p, seen);
  const ancient = new Date(Date.now() - 10 * 86400 * 1000);
  utimesSync(p, ancient, ancient);
  loadState(dir, 'fresh', { ttlDays: 3 });
  assert.equal(existsSync(p), false);
});

test('a hostile session id cannot escape the state directory', () => {
  const dir = stateDir();
  const { path: p } = loadState(dir, '../../../etc/passwd');
  assert.equal(path.dirname(path.resolve(p)), path.resolve(dir));
});

test('render emits the recall header and both bands', () => {
  const out = render({
    anchors: ['project_acme.md — **Status:** active'],
    observations: ['2026-08-01 — did a thing'],
  });
  assert.match(out, /\[brain recall — matched on this prompt, not a summary of it\]/);
  assert.match(out, /Anchor files that match/);
  assert.match(out, /Prior related work/);
});

test('render omits the observations band when there are none', () => {
  const out = render({ anchors: ['project_acme.md'], observations: [] });
  assert.ok(!out.includes('Prior related work'));
});

test('render hard-caps injected characters', () => {
  const out = render({ anchors: [Array(500).fill('long').join(' ')], observations: [], maxChars: 1800 });
  assert.ok(out.length <= 1800 + 12);
  assert.ok(out.endsWith('(truncated)'));
});

test('render returns empty string when there is nothing to say', () => {
  assert.equal(render({ anchors: [], observations: [] }), '');
  assert.equal(render({}), '');
});
