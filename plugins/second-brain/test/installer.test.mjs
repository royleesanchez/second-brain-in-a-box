import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BOOT = path.join(path.resolve(HERE, '..', '..', '..'), 'bootstrap');

const STEPS = ['preflight', 'dependencies', 'marketplace', 'plugin', 'scaffold', 'cadence', 'launch'];

const dryRunSh = () =>
  execFileSync('bash', [path.join(BOOT, 'install.sh'), '--dry-run'], { encoding: 'utf8' });

test('install.sh --dry-run prints the ordered plan without executing', () => {
  const out = dryRunSh().toLowerCase();
  let cursor = -1;
  for (const s of STEPS) {
    const at = out.indexOf(s);
    assert.ok(at > cursor, `step "${s}" missing or out of order`);
    cursor = at;
  }
});

test('install.sh is idempotent — a second dry run yields the same plan', () => {
  assert.equal(dryRunSh(), dryRunSh());
});

test('install.sh dry run states the two prerequisites', () => {
  const out = dryRunSh().toLowerCase();
  assert.match(out, /claude/);
  assert.match(out, /install software|admin|permission/);
});

test('START HERE.cmd bypasses execution policy and targets install.ps1', () => {
  const cmd = readFileSync(path.join(BOOT, 'START HERE.cmd'), 'utf8');
  assert.match(cmd, /ExecutionPolicy\s+Bypass/i);
  assert.match(cmd, /install\.ps1/i);
  assert.match(cmd, /%~dp0/, 'must resolve paths relative to itself, not the CWD');
  assert.ok(!cmd.includes('\r\n'), 'must be LF so the polyglot/bash path stays valid');
});

test('install.ps1 avoids PowerShell 5.1 incompatibilities', () => {
  const raw = readFileSync(path.join(BOOT, 'install.ps1'), 'utf8');
  const code = raw.split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');
  assert.ok(!code.includes('&&'), 'no && in PowerShell 5.1');
  assert.ok(!code.includes('??'), 'no null-coalescing in PowerShell 5.1');
  assert.match(code, /marketplace add/i);
  assert.match(code, /plugin install/i);
  assert.match(code, /DryRun/, 'must support -DryRun');
});

test('install.ps1 covers the same seven steps', () => {
  const ps = readFileSync(path.join(BOOT, 'install.ps1'), 'utf8').toLowerCase();
  for (const s of STEPS) {
    assert.ok(ps.includes(s), `install.ps1 must cover step "${s}"`);
  }
});

test('both installers handle the IT-blocked path without half-installing', () => {
  for (const f of ['install.sh', 'install.ps1']) {
    const text = readFileSync(path.join(BOOT, f), 'utf8');
    assert.match(text, /IT-REQUIREMENTS/, `${f} must point at the IT handout when blocked`);
    assert.match(text, /blocked/i, `${f} must honour the preflight blocked flag`);
  }
});

test('installers default every automation to off', () => {
  for (const f of ['install.sh', 'install.ps1']) {
    const text = readFileSync(path.join(BOOT, f), 'utf8').toLowerCase();
    assert.match(text, /off by default|default.*off|all off/, `${f} must default cadence off`);
  }
});

test('no installer contains a hardcoded personal path or identifier', () => {
  for (const f of ['install.sh', 'install.ps1', 'START HERE.cmd']) {
    const text = readFileSync(path.join(BOOT, f), 'utf8');
    assert.ok(!/Roylee|BSIP|Blue Star/i.test(text), `${f} leaks an identifier`);
    assert.ok(!/C:\\Users\\[A-Za-z]/.test(text), `${f} has a hardcoded user path`);
  }
});
