import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { slugifyProjectPath, resolveMemoryDir, resolveStateDir } from '../lib/paths.mjs';

test('slugify matches Claude Code project-dir naming', () => {
  assert.equal(
    slugifyProjectPath('C:\\Users\\Ada Lovelace\\Desktop\\Acme Brain'),
    'C--Users-Ada-Lovelace-Desktop-Acme-Brain'
  );
  assert.equal(
    slugifyProjectPath('/Users/ada/Desktop/Acme Brain'),
    '-Users-ada-Desktop-Acme-Brain'
  );
});

test('resolveMemoryDir finds the memory dir for the current project', () => {
  const home = mkdtempSync(path.join(tmpdir(), 'sb-home-'));
  const projectDir = path.join(home, 'Desktop', 'Acme Brain');
  const slug = slugifyProjectPath(projectDir);
  const mem = path.join(home, '.claude', 'projects', slug, 'memory');
  mkdirSync(mem, { recursive: true });

  assert.equal(resolveMemoryDir({ home, projectDir }), mem);
});

test('resolveMemoryDir returns null when there is no memory dir', () => {
  const home = mkdtempSync(path.join(tmpdir(), 'sb-home-'));
  const projectDir = path.join(home, 'Desktop', 'Nothing Here');
  assert.equal(resolveMemoryDir({ home, projectDir }), null);
});

test('resolveMemoryDir falls back to a sole existing project when the slug misses', () => {
  const home = mkdtempSync(path.join(tmpdir(), 'sb-home-'));
  const mem = path.join(home, '.claude', 'projects', 'Some-Other-Slug', 'memory');
  mkdirSync(mem, { recursive: true });
  const projectDir = path.join(home, 'Desktop', 'Acme Brain');

  assert.equal(resolveMemoryDir({ home, projectDir }), mem);
});

test('resolveMemoryDir refuses to guess between two candidates', () => {
  const home = mkdtempSync(path.join(tmpdir(), 'sb-home-'));
  mkdirSync(path.join(home, '.claude', 'projects', 'Slug-A', 'memory'), { recursive: true });
  mkdirSync(path.join(home, '.claude', 'projects', 'Slug-B', 'memory'), { recursive: true });
  const projectDir = path.join(home, 'Desktop', 'Acme Brain');

  assert.equal(resolveMemoryDir({ home, projectDir }), null);
});

test('resolveStateDir is under .claude, not .claude-mem', () => {
  const home = mkdtempSync(path.join(tmpdir(), 'sb-home-'));
  const dir = resolveStateDir({ home });
  assert.ok(dir.includes(path.join('.claude', 'second-brain')));
  assert.ok(!dir.includes('.claude-mem'), 'state must not depend on claude-mem');
});
