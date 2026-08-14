import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..', '..');
const BOOT = path.join(REPO, 'bootstrap');

const NAMES = ['claude', 'code', 'git', 'node', 'obsidian', 'pkgmgr'];

const runSh = () =>
  JSON.parse(execFileSync('bash', [path.join(BOOT, 'lib', 'preflight.sh')], { encoding: 'utf8' }));

test('the bash preflight emits parseable JSON and exits 0', () => {
  const parsed = runSh();
  assert.equal(typeof parsed.ok, 'boolean');
  assert.equal(typeof parsed.blocked, 'boolean');
  assert.deepEqual(parsed.checks.map((c) => c.name).sort(), NAMES);
});

test('every check carries a remedy string', () => {
  for (const c of runSh().checks) {
    assert.equal(typeof c.present, 'boolean');
    assert.ok(c.remedy.length > 10, `${c.name} needs an actionable remedy`);
  }
});

test('the bash preflight is side-effect free and stable across runs', () => {
  const a = runSh();
  const b = runSh();
  assert.deepEqual(
    a.checks.map((c) => [c.name, c.present]),
    b.checks.map((c) => [c.name, c.present])
  );
});

test('preflight detects tools that genuinely exist on this machine', () => {
  // node and git are provably present -- this test is running under node,
  // inside a git repo. If preflight says otherwise, its detection is broken.
  const byName = Object.fromEntries(runSh().checks.map((c) => [c.name, c]));
  assert.equal(byName.node.present, true, 'node must be detected');
  assert.equal(byName.git.present, true, 'git must be detected');
});

test('the PowerShell preflight checks the same six names', () => {
  const ps = readFileSync(path.join(BOOT, 'lib', 'preflight.ps1'), 'utf8');
  for (const n of NAMES) {
    assert.ok(ps.includes(n), `preflight.ps1 must check ${n}`);
  }
});

test('the PowerShell preflight avoids 5.1 incompatibilities and prompts', () => {
  const raw = readFileSync(path.join(BOOT, 'lib', 'preflight.ps1'), 'utf8');
  // Strip comment lines: a comment explaining "no && allowed" must not itself
  // trip the check.
  const code = raw
    .split('\n')
    .filter((l) => !l.trim().startsWith('#'))
    .join('\n');

  assert.ok(!code.includes('&&'), 'PowerShell 5.1 has no && operator');
  assert.ok(!code.includes('??'), 'PowerShell 5.1 has no null-coalescing operator');
  assert.ok(!/\?\s*\{[^}]*\}\s*:/.test(code), 'PowerShell 5.1 has no ternary operator');
  assert.ok(!/Read-Host|Get-Credential|Out-GridView/.test(code), 'preflight must be non-interactive');
});

test('the PowerShell preflight actually runs and emits the same contract', { skip: process.platform !== 'win32' }, () => {
  const out = execFileSync(
    'powershell',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(BOOT, 'lib', 'preflight.ps1')],
    { encoding: 'utf8' }
  );

  const parsed = JSON.parse(out);
  assert.equal(typeof parsed.ok, 'boolean');
  assert.equal(typeof parsed.blocked, 'boolean');
  assert.deepEqual(parsed.checks.map((c) => c.name).sort(), NAMES);

  const byName = Object.fromEntries(parsed.checks.map((c) => [c.name, c]));
  assert.equal(byName.node.present, true, 'node must be detected on Windows too');
  assert.equal(byName.git.present, true, 'git must be detected on Windows too');
  for (const c of parsed.checks) {
    assert.ok(c.remedy.length > 10, `${c.name} needs an actionable remedy`);
  }
});

test('the IT requirements one-pager names every dependency', () => {
  const md = readFileSync(path.join(BOOT, 'IT-REQUIREMENTS.md'), 'utf8');
  for (const n of ['Node', 'Git', 'Visual Studio Code', 'Claude Code', 'Obsidian']) {
    assert.ok(md.includes(n), `IT-REQUIREMENTS.md must name ${n}`);
  }
});

test('the IT one-pager states the security posture plainly', () => {
  const md = readFileSync(path.join(BOOT, 'IT-REQUIREMENTS.md'), 'utf8').toLowerCase();
  for (const claim of ['no inbound', 'local', 'outbound']) {
    assert.ok(md.includes(claim), `IT-REQUIREMENTS.md must address "${claim}"`);
  }
});

test('no bootstrap file carries a hardcoded personal path', () => {
  for (const f of ['lib/preflight.sh', 'lib/preflight.ps1', 'IT-REQUIREMENTS.md']) {
    const text = readFileSync(path.join(BOOT, f), 'utf8');
    assert.ok(!/Roylee|BSIP|Blue Star/i.test(text), `${f} leaks an identifier`);
  }
});
