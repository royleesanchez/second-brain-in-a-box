import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, '..');
const REPO = path.resolve(PLUGIN, '../..');

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

test('marketplace.json declares the second-brain plugin', () => {
  const m = readJson(path.join(REPO, '.claude-plugin', 'marketplace.json'));
  assert.equal(m.name, 'second-brain');
  assert.ok(m.owner?.name, 'owner.name is required');
  assert.ok(Array.isArray(m.plugins) && m.plugins.length === 1);
  const p = m.plugins[0];
  assert.equal(p.name, 'second-brain');
  assert.equal(p.source, './plugins/second-brain');
  assert.ok(p.description.length > 20);
});

test('plugin.json is valid and versioned', () => {
  const p = readJson(path.join(PLUGIN, '.claude-plugin', 'plugin.json'));
  assert.equal(p.name, 'second-brain');
  assert.match(p.version, /^\d+\.\d+\.\d+$/);
  assert.equal(p.license, 'MIT');
  assert.ok(p.description.length > 20);
});

test('package.json pins the Node floor and declares zero runtime deps', () => {
  const p = readJson(path.join(PLUGIN, 'package.json'));
  assert.equal(p.type, 'module');
  assert.match(p.engines.node, /22/);
  assert.deepEqual(p.dependencies ?? {}, {}, 'runtime dependencies are forbidden');
});
