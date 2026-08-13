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

test('no hook script has CRLF line endings', () => {
  // A CRLF shebang is a "bad interpreter" error. .gitattributes enforces this
  // on checkout; this asserts it in the working tree too.
  for (const name of ['session-start', 'user-prompt-submit', 'pre-compact', 'run-hook.cmd']) {
    const raw = readFileSync(path.join(HOOKS, name), 'latin1');
    assert.ok(!raw.includes('\r\n'), `${name} must not contain CRLF`);
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
