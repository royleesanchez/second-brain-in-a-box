import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { slugifyProjectPath } from '../lib/paths.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RECALL = path.resolve(HERE, '..', 'bin', 'recall.mjs');

function makeBrain() {
  const home = mkdtempSync(path.join(tmpdir(), 'sb-e2e-'));
  const projectDir = path.join(home, 'Desktop', 'Acme Brain');
  mkdirSync(projectDir, { recursive: true });

  const mem = path.join(home, '.claude', 'projects', slugifyProjectPath(projectDir), 'memory');
  mkdirSync(mem, { recursive: true });
  writeFileSync(path.join(mem, 'MEMORY.md'), '# map\n');
  writeFileSync(
    path.join(mem, 'project_northwind.md'),
    '**Status:** active · **Updated:** 2026-08-13\n\n## Current State\nRenewal at risk.\n'
  );
  writeFileSync(
    path.join(mem, 'project_contoso.md'),
    '**Status:** paused\n\n## Current State\nOn hold until Q4.\n'
  );
  return { home, projectDir };
}

function run(payload, env = {}) {
  return execFileSync(process.execPath, ['--no-warnings', RECALL], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

const envFor = ({ home, projectDir }) => ({
  SECOND_BRAIN_HOME: home,
  CLAUDE_PROJECT_DIR: projectDir,
});

test('injects a matching anchor', () => {
  const brain = makeBrain();
  const out = run(
    { prompt: 'where did we land on northwind renewal', session_id: 's1', cwd: brain.projectDir },
    envFor(brain)
  );
  const parsed = JSON.parse(out);
  assert.equal(parsed.hookSpecificOutput.hookEventName, 'UserPromptSubmit');
  assert.match(parsed.hookSpecificOutput.additionalContext, /project_northwind\.md/);
  assert.match(parsed.hookSpecificOutput.additionalContext, /Renewal at risk/);
});

test('does not repeat the same anchor twice in one session', () => {
  const brain = makeBrain();
  const env = envFor(brain);
  const payload = { prompt: 'northwind renewal question', session_id: 's-dedup', cwd: brain.projectDir };
  assert.notEqual(run(payload, env).trim(), '');
  assert.equal(run(payload, env).trim(), '', 'second identical prompt injects nothing');
});

test('a different session still gets the anchor', () => {
  const brain = makeBrain();
  const env = envFor(brain);
  run({ prompt: 'northwind renewal question', session_id: 'sA', cwd: brain.projectDir }, env);
  const out = run({ prompt: 'northwind renewal question', session_id: 'sB', cwd: brain.projectDir }, env);
  assert.notEqual(out.trim(), '');
});

test('ignores short prompts and slash commands', () => {
  const brain = makeBrain();
  const env = envFor(brain);
  assert.equal(run({ prompt: 'ok', session_id: 's2', cwd: brain.projectDir }, env).trim(), '');
  assert.equal(run({ prompt: '/onboard northwind', session_id: 's3', cwd: brain.projectDir }, env).trim(), '');
});

test('ignores acknowledgements that carry no subject', () => {
  const brain = makeBrain();
  const out = run(
    { prompt: 'thanks that looks great to me', session_id: 's-ack', cwd: brain.projectDir },
    envFor(brain)
  );
  assert.equal(out.trim(), '');
});

test('emits nothing and exits 0 on malformed stdin', () => {
  const out = execFileSync(process.execPath, ['--no-warnings', RECALL], {
    input: 'not json at all',
    encoding: 'utf8',
  });
  assert.equal(out.trim(), '');
});

test('emits nothing and exits 0 when there is no memory dir', () => {
  const home = mkdtempSync(path.join(tmpdir(), 'sb-empty-'));
  const out = run(
    { prompt: 'anything at all here about northwind', session_id: 's4', cwd: home },
    { SECOND_BRAIN_HOME: home, CLAUDE_PROJECT_DIR: home }
  );
  assert.equal(out.trim(), '');
});

test('respects the claudeMem feature flag being off', () => {
  const brain = makeBrain();
  mkdirSync(path.join(brain.projectDir, '.brain'), { recursive: true });
  writeFileSync(
    path.join(brain.projectDir, '.brain', 'config.json'),
    JSON.stringify({ project: 'Acme Brain', features: { claudeMem: false } })
  );
  const out = run(
    { prompt: 'northwind renewal question', session_id: 's5', cwd: brain.projectDir },
    envFor(brain)
  );
  assert.ok(!out.includes('Prior related work'));
});

test('honours aliases from brain config', () => {
  const brain = makeBrain();
  mkdirSync(path.join(brain.projectDir, '.brain'), { recursive: true });
  writeFileSync(
    path.join(brain.projectDir, '.brain', 'config.json'),
    JSON.stringify({ project: 'Acme Brain', aliases: { nw: 'northwind' } })
  );
  const out = run(
    { prompt: 'give me the latest on nw please', session_id: 's6', cwd: brain.projectDir },
    envFor(brain)
  );
  assert.match(out, /project_northwind\.md/);
});

test('completes well inside the per-prompt budget', () => {
  const brain = makeBrain();
  const t = Date.now();
  run({ prompt: 'northwind renewal status check', session_id: 's7', cwd: brain.projectDir }, envFor(brain));
  const elapsed = Date.now() - t;
  // Generous: this includes full Node process startup, which the real hook
  // also pays. The engine itself is single-digit milliseconds.
  assert.ok(elapsed < 3000, `recall took ${elapsed}ms including process spawn`);
});
