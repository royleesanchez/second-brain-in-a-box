import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { anchorBlurb } from '../lib/blurb.mjs';

function write(name, body) {
  const dir = mkdtempSync(path.join(tmpdir(), 'sb-blurb-'));
  const p = path.join(dir, name);
  writeFileSync(p, body);
  return p;
}

test('extracts status line and Current State', () => {
  const p = write('project_acme.md', [
    '---', 'name: project_acme', '---', '',
    '**Status:** active · **Updated:** 2026-08-13', '',
    '## Current State', 'Renewal at risk.', 'Two open asks.', '',
    '## Log', '- old stuff nobody needs here',
  ].join('\n'));

  const b = anchorBlurb(p);
  assert.match(b, /^project_acme\.md — \*\*Status:\*\* active/);
  assert.match(b, /Renewal at risk\. Two open asks\./);
  assert.ok(!b.includes('old stuff'), 'Log section must not leak in');
});

test('falls back to the whole body when there is no Current State heading', () => {
  const p = write('project_flat.md', 'Just a flat old-format memory with no headings.');
  assert.match(anchorBlurb(p), /Just a flat old-format memory/);
});

test('truncates long Current State', () => {
  const p = write('project_long.md', '## Current State\n' + 'x'.repeat(900));
  const b = anchorBlurb(p, { maxCurrent: 420 });
  assert.ok(b.length < 500);
  assert.ok(b.endsWith('...'));
});

test('handles frontmatter containing a --- separator inside a value', () => {
  const p = write('project_fm.md', [
    '---', 'name: project_fm', 'description: "a --- b"', '---', '',
    '## Current State', 'Body survived.',
  ].join('\n'));
  const b = anchorBlurb(p);
  assert.match(b, /Body survived/);
});

test('a file with no status line still returns the body', () => {
  const p = write('project_nostatus.md', '## Current State\nNo status header here.');
  const b = anchorBlurb(p);
  assert.equal(b.split('\n')[0], 'project_nostatus.md');
  assert.match(b, /No status header here/);
});

test('returns null for an unreadable file', () => {
  assert.equal(anchorBlurb('/definitely/not/here.md'), null);
});
