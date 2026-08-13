import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildAnchorIndex, matchAnchors } from '../lib/anchors.mjs';

function fixture(names) {
  const dir = mkdtempSync(path.join(tmpdir(), 'sb-mem-'));
  writeFileSync(path.join(dir, 'MEMORY.md'), '# map\n');
  for (const n of names) writeFileSync(path.join(dir, n), '# stub\n');
  return dir;
}

const NAMES = [
  'project_acme.md',
  'project_acme_pricing.md',
  'project_northwind.md',
  'project_contoso.md',
  'feedback_output_standards.md',
  'reference_drive_roots.md',
];

test('index excludes MEMORY.md and strips structural prefixes', () => {
  const idx = buildAnchorIndex(fixture(NAMES));
  assert.ok(idx.has('acme'), 'subject token indexed');
  assert.ok(!idx.has('project'), 'structural prefix must not be a token');
  for (const paths of idx.values()) {
    assert.ok(!paths.some((p) => p.endsWith('MEMORY.md')));
  }
});

test('tokens appearing in more than maxDf files are dropped as generic', () => {
  const names = Array.from({ length: 8 }, (_, i) => `project_shared_thing${i}.md`);
  const idx = buildAnchorIndex(fixture(names), { maxDf: 6 });
  assert.ok(!idx.has('shared'), 'a token in 8 files is not distinctive');
});

test('matchAnchors ranks by number of distinctive tokens hit', () => {
  const dir = fixture(NAMES);
  const idx = buildAnchorIndex(dir);
  const hits = matchAnchors('what happened with acme pricing', idx);
  assert.equal(path.basename(hits[0]), 'project_acme_pricing.md');
});

test('single-token matches are dropped when a multi-token match exists', () => {
  const dir = fixture(NAMES);
  const idx = buildAnchorIndex(dir);
  const hits = matchAnchors('acme pricing drive', idx).map((p) => path.basename(p));
  assert.ok(hits.includes('project_acme_pricing.md'));
  assert.ok(!hits.includes('reference_drive_roots.md'), 'coincidental single-token hit dropped');
});

test('aliases expand abbreviations that never appear in a filename', () => {
  const dir = fixture(NAMES);
  const idx = buildAnchorIndex(dir);
  const hits = matchAnchors('how is nw doing', idx, { aliases: { nw: 'northwind' } });
  assert.deepEqual(hits.map((p) => path.basename(p)), ['project_northwind.md']);
});

test('no match returns an empty array', () => {
  const idx = buildAnchorIndex(fixture(NAMES));
  assert.deepEqual(matchAnchors('completely unrelated zebra topic', idx), []);
});

test('results are capped at maxAnchors', () => {
  const dir = fixture(NAMES);
  const idx = buildAnchorIndex(dir);
  const hits = matchAnchors('acme northwind contoso', idx, { maxAnchors: 2 });
  assert.ok(hits.length <= 2);
});

test('a missing or unreadable memory dir yields an empty index, not a throw', () => {
  assert.equal(buildAnchorIndex(null).size, 0);
  assert.equal(buildAnchorIndex('/definitely/not/a/real/dir').size, 0);
});

test('ranking is deterministic for equal scores', () => {
  const dir = fixture(NAMES);
  const idx = buildAnchorIndex(dir);
  const a = matchAnchors('northwind contoso', idx).map((p) => path.basename(p));
  const b = matchAnchors('northwind contoso', idx).map((p) => path.basename(p));
  assert.deepEqual(a, b);
});
