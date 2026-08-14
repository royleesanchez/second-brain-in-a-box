import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { denylistPattern, EXEMPT } from './denylist.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..', '..');

test('build-zip produces a small bootstrap-only archive', () => {
  execFileSync(process.execPath, [path.join(REPO, 'scripts', 'build-zip.mjs')], { cwd: REPO });
  const zip = path.join(REPO, 'dist', 'Second-Brain-in-a-Box.zip');
  assert.ok(existsSync(zip), 'zip was not produced');
  assert.ok(statSync(zip).size < 1_000_000, 'the zip is a bootstrap, not a payload');
  assert.ok(statSync(zip).size > 2_000, 'the zip looks empty');
});

test('README states the two prerequisites and both entry points', () => {
  const md = readFileSync(path.join(REPO, 'README.md'), 'utf8');
  assert.match(md, /START HERE\.cmd/);
  assert.match(md, /install\.sh/);
  assert.match(md, /Claude/);
  assert.match(md, /install software/i);
  assert.match(md, /\/onboard/);
});

test('README documents how updates reach an installed brain', () => {
  const md = readFileSync(path.join(REPO, 'README.md'), 'utf8');
  assert.match(md, /plugin update/i);
});

test('the marketplace URL placeholder is consistent everywhere it appears', () => {
  // The org is not chosen yet. Whatever placeholder is used must be identical
  // in both installers and the README, so a single find-and-replace fixes it.
  const files = ['bootstrap/install.sh', 'bootstrap/install.ps1', 'README.md'];
  const found = new Set();
  for (const f of files) {
    const text = readFileSync(path.join(REPO, f), 'utf8');
    for (const m of text.matchAll(/github\.com\/([A-Za-z0-9_-]+)\/second-brain-in-a-box/g)) {
      found.add(m[1]);
    }
  }
  assert.ok(found.size > 0, 'no marketplace URL found in installers or README');
  assert.equal(found.size, 1, `marketplace org differs across files: ${[...found].join(', ')}`);
});

test('the denylist is not itself committed', () => {
  const tracked = execFileSync('git', ['ls-files'], { cwd: REPO, encoding: 'utf8' });
  assert.ok(!tracked.split('\n').includes('.denylist'), '.denylist must never be committed');
});

test('nothing confidential is committed anywhere in the repo', () => {
  const banned = denylistPattern();
  if (!banned) {
    // No local denylist configured. Structural checks below still run.
    return;
  }

  const tracked = execFileSync('git', ['ls-files'], { cwd: REPO, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);

  const offenders = [];
  for (const f of tracked) {
    if (f.startsWith('dist/')) continue;
    if (EXEMPT.some((re) => re.test(f))) continue;

    let text;
    try {
      text = readFileSync(path.join(REPO, f), 'utf8');
    } catch {
      continue; // binary
    }

    for (const line of text.split('\n')) {
      if (banned.test(line)) offenders.push(`${f}: ${line.trim().slice(0, 80)}`);
    }
  }

  assert.deepEqual(offenders, [], `confidential identifiers found:\n${offenders.join('\n')}`);
});

test('no tracked file contains an absolute personal path', () => {
  const tracked = execFileSync('git', ['ls-files'], { cwd: REPO, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);

  const offenders = [];
  for (const f of tracked) {
    if (f.startsWith('dist/')) continue;
    let text;
    try {
      text = readFileSync(path.join(REPO, f), 'utf8');
    } catch {
      continue;
    }
    // Allow /Users/ada and similar inside test fixtures and doc examples.
    if (/C:\\Users\\(?!Ada|Alice|Example)[A-Za-z]/.test(text)) offenders.push(f);
  }

  assert.deepEqual(offenders, [], `absolute personal paths in: ${offenders.join(', ')}`);
});
