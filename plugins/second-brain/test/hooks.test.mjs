import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, '..');
const HOOKS = path.join(PLUGIN, 'hooks');

test('hooks.json registers the memory hooks via CLAUDE_PLUGIN_ROOT', () => {
  const h = JSON.parse(readFileSync(path.join(HOOKS, 'hooks.json'), 'utf8')).hooks;
  for (const evt of ['SessionStart', 'UserPromptSubmit', 'PreCompact']) {
    assert.ok(h[evt], `${evt} must be registered`);
  }
  const flat = JSON.stringify(h);
  assert.ok(flat.includes('${CLAUDE_PLUGIN_ROOT}'), 'must use CLAUDE_PLUGIN_ROOT, never an absolute path');
  assert.ok(!/C:\\\\Users|\/Users\//.test(flat), 'no hardcoded user paths');
});

test('every referenced hook script exists and is extensionless', () => {
  for (const name of ['session-start', 'user-prompt-submit', 'pre-compact']) {
    assert.ok(existsSync(path.join(HOOKS, name)), `${name} missing`);
    assert.ok(!name.includes('.'), 'hook scripts must be extensionless');
  }
  assert.ok(existsSync(path.join(HOOKS, 'run-hook.cmd')));
});

test('no hook script has CRLF line endings in the working tree', () => {
  for (const name of ['session-start', 'user-prompt-submit', 'pre-compact', 'run-hook.cmd']) {
    const raw = readFileSync(path.join(HOOKS, name), 'latin1');
    assert.ok(!raw.includes('\r\n'), `${name} must not contain CRLF`);
  }
});

test('git is configured to keep hook scripts LF on every checkout', () => {
  // The working-tree check above is NOT sufficient. These files were LF
  // locally while .gitattributes silently failed to match them, and they came
  // back CRLF after a round trip through GitHub -- which fails on macOS with
  // "$'\r': command not found". Assert git's EFFECTIVE attribute, which is
  // what actually governs checkout on someone else's machine.
  const REPO = path.resolve(PLUGIN, '..', '..');

  for (const name of ['session-start', 'user-prompt-submit', 'pre-compact', 'run-hook.cmd']) {
    const rel = path.relative(REPO, path.join(HOOKS, name)).split(path.sep).join('/');
    const out = execFileSync('git', ['check-attr', 'eol', '--', rel], {
      cwd: REPO,
      encoding: 'utf8',
    });
    assert.match(out.trim(), /eol:\s*lf$/, `${rel} must carry "eol=lf", got: ${out.trim()}`);
  }
});

test('git reports hook scripts as LF in the index', () => {
  const REPO = path.resolve(PLUGIN, '..', '..');
  const out = execFileSync('git', ['ls-files', '--eol', '--', 'plugins/second-brain/hooks'], {
    cwd: REPO,
    encoding: 'utf8',
  });

  for (const line of out.split('\n').filter(Boolean)) {
    assert.ok(!/w\/crlf/.test(line), `working-tree CRLF in: ${line.trim()}`);
    assert.ok(!/i\/crlf/.test(line), `index CRLF in: ${line.trim()}`);
  }
});

test('session-start emits the protocol primer as valid hook JSON', () => {
  const out = execFileSync('bash', [path.join(HOOKS, 'session-start')], { encoding: 'utf8' });
  const parsed = JSON.parse(out);
  assert.equal(parsed.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.match(parsed.hookSpecificOutput.additionalContext, /LOAD FIRST/);
  assert.match(parsed.hookSpecificOutput.additionalContext, /UPDATE ON CHANGE/);
});

test('pre-compact tells Claude to save anchors before compaction', () => {
  const out = execFileSync('bash', [path.join(HOOKS, 'pre-compact')], { encoding: 'utf8' });
  const parsed = JSON.parse(out);
  assert.equal(parsed.hookSpecificOutput.hookEventName, 'PreCompact');
  assert.match(parsed.hookSpecificOutput.additionalContext, /compact/i);
  assert.match(parsed.hookSpecificOutput.additionalContext, /MEMORY\.md/);
});

test('user-prompt-submit forwards stdin to the recall engine', () => {
  const out = execFileSync('bash', [path.join(HOOKS, 'user-prompt-submit')], {
    input: JSON.stringify({ prompt: 'x', session_id: 's' }),
    encoding: 'utf8',
  });
  assert.equal(out.trim(), '', 'short prompt produces no output but must not error');
});

test('user-prompt-submit exits 0 even when handed garbage', () => {
  const out = execFileSync('bash', [path.join(HOOKS, 'user-prompt-submit')], {
    input: 'not json',
    encoding: 'utf8',
  });
  assert.equal(out.trim(), '');
});

test('run-hook.cmd dispatches by script name on unix', () => {
  const out = execFileSync('bash', [path.join(HOOKS, 'run-hook.cmd'), 'session-start'], {
    encoding: 'utf8',
  });
  assert.match(JSON.parse(out).hookSpecificOutput.additionalContext, /LOAD FIRST/);
});
