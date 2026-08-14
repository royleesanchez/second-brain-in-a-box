import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scaffoldBrain } from '../bin/scaffold.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TPL = path.resolve(HERE, '..', 'templates', 'firm-personal');

const VARS = { OWNER: 'Ada Lovelace', FIRM: 'Acme Capital', DATE: '2026-08-13' };
const target = () => mkdtempSync(path.join(tmpdir(), 'sb-vault-'));

test('scaffolds the full folder tree', () => {
  const t = target();
  scaffoldBrain({ templateDir: TPL, targetDir: t, vars: VARS });
  for (const d of [
    '00_Inbox', '01_Daily', '02_Workstreams', '03_People',
    '04_Intelligence & Learning', '05_Resources & Templates', '06_Archive',
  ]) {
    assert.ok(existsSync(path.join(t, d)), `${d} missing`);
  }
});

test('substitutes variables and leaves no unresolved placeholders', () => {
  const t = target();
  scaffoldBrain({ templateDir: TPL, targetDir: t, vars: VARS });
  for (const f of ['CLAUDE.md', 'index.md', 'log.md']) {
    const text = readFileSync(path.join(t, f), 'utf8');
    assert.ok(!/\{\{[A-Z_]+\}\}/.test(text), `${f} has unresolved placeholders`);
  }
  const claudeMd = readFileSync(path.join(t, 'CLAUDE.md'), 'utf8');
  assert.match(claudeMd, /Ada Lovelace/);
  assert.match(claudeMd, /Acme Capital/);
});

test('CLAUDE.md documents all four memory layers in order', () => {
  const t = target();
  scaffoldBrain({ templateDir: TPL, targetDir: t, vars: VARS });
  const md = readFileSync(path.join(t, 'CLAUDE.md'), 'utf8');

  const layers = ['CLAUDE.md', 'MEMORY.md', 'project_{company}.md', 'project_{company}_{project}.md'];
  let cursor = -1;
  for (const l of layers) {
    const at = md.indexOf(l);
    assert.ok(at > cursor, `layer "${l}" missing or out of order`);
    cursor = at;
  }
});

test('CLAUDE.md carries the ownership label, save point, and data classification', () => {
  const t = target();
  scaffoldBrain({ templateDir: TPL, targetDir: t, vars: VARS });
  const md = readFileSync(path.join(t, 'CLAUDE.md'), 'utf8');
  for (const needle of ['This brain belongs to', 'Save Point', 'Data classification', 'Precedence']) {
    assert.ok(md.includes(needle), `CLAUDE.md must mention "${needle}"`);
  }
});

test('CLAUDE.md states the quoted-wikilink YAML rule', () => {
  const t = target();
  scaffoldBrain({ templateDir: TPL, targetDir: t, vars: VARS });
  const md = readFileSync(path.join(t, 'CLAUDE.md'), 'utf8');
  assert.match(md, /QUOTED/);
  assert.match(md, /not valid YAML/i);
});

test('writes the brain config with owner and flavor', () => {
  const t = target();
  scaffoldBrain({ templateDir: TPL, targetDir: t, vars: VARS });
  const cfg = JSON.parse(readFileSync(path.join(t, '.brain', 'config.json'), 'utf8'));
  assert.equal(cfg.owner, 'Ada Lovelace');
  assert.equal(cfg.flavor, 'firm-personal');
  assert.deepEqual(cfg.aliases, {});
  assert.equal(cfg.features.claudeMem, true);
});

test('never overwrites an existing file', () => {
  const t = target();
  writeFileSync(path.join(t, 'CLAUDE.md'), 'MINE — DO NOT TOUCH');
  const { created } = scaffoldBrain({ templateDir: TPL, targetDir: t, vars: VARS });
  assert.equal(readFileSync(path.join(t, 'CLAUDE.md'), 'utf8'), 'MINE — DO NOT TOUCH');
  assert.ok(!created.includes('CLAUDE.md'));
});

test('is idempotent — a second run creates nothing new', () => {
  const t = target();
  scaffoldBrain({ templateDir: TPL, targetDir: t, vars: VARS });
  const second = scaffoldBrain({ templateDir: TPL, targetDir: t, vars: VARS });
  assert.deepEqual(second.created, []);
});

test('the scaffolded brain contains no confidential identifiers', () => {
  const t = target();
  scaffoldBrain({ templateDir: TPL, targetDir: t, vars: VARS });
  const banned = /Roylee|BSIP|Blue Star Innovation|OfficeRnD|Hostfully|JerseyWatch/i;
  for (const f of ['CLAUDE.md', 'index.md', 'log.md']) {
    assert.ok(!banned.test(readFileSync(path.join(t, f), 'utf8')), `${f} leaks an identifier`);
  }
});
