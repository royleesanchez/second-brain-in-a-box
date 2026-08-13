import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenize, STOPWORDS, STRUCTURAL_PREFIXES } from '../lib/tokens.mjs';

test('tokenize lowercases, splits on non-alphanumerics, drops short tokens', () => {
  assert.deepEqual(tokenize('Acme-Corp REVIEW/2026'), ['acme', 'corp', 'review', '2026']);
});

test('tokenize drops stopwords', () => {
  assert.deepEqual(tokenize('what is the status update on Acme'), ['acme']);
});

test('acknowledgements reduce to nothing', () => {
  assert.deepEqual(tokenize('thanks that looks great'), []);
});

test('workflow nouns are stopwords so they never outrank a subject', () => {
  for (const w of ['status', 'state', 'update', 'resume', 'current', 'plan', 'setup', 'notes']) {
    assert.ok(STOPWORDS.has(w), `${w} must be a stopword`);
  }
});

test('structural prefixes are declared', () => {
  assert.deepEqual([...STRUCTURAL_PREFIXES].sort(), ['feedback', 'project', 'reference', 'user']);
});

test('tokenize is defensive about null and undefined', () => {
  assert.deepEqual(tokenize(null), []);
  assert.deepEqual(tokenize(undefined), []);
  assert.deepEqual(tokenize(''), []);
});
