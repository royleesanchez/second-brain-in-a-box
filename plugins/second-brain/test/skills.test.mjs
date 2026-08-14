import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILLS = path.resolve(HERE, '..', 'skills');

const REQUIRED = ['onboard', 'save-point', 'capture', 'brief'];

function frontmatter(name) {
  const text = readFileSync(path.join(SKILLS, name, 'SKILL.md'), 'utf8');
  assert.ok(text.startsWith('---\n'), `${name}: SKILL.md must open with frontmatter`);
  const end = text.indexOf('\n---', 4);
  assert.ok(end > 0, `${name}: unterminated frontmatter`);
  const block = text.slice(4, end);
  const get = (k) =>
    (block.match(new RegExp(`^${k}:\\s*([\\s\\S]+?)(?=\\n[a-z-]+:|$)`, 'm')) ?? [])[1]
      ?.trim()
      .replace(/^["']|["']$/g, '');
  return { name: get('name'), description: get('description'), body: text.slice(end + 4) };
}

test('every required skill exists with valid frontmatter', () => {
  for (const s of REQUIRED) {
    assert.ok(existsSync(path.join(SKILLS, s, 'SKILL.md')), `${s}/SKILL.md missing`);
    const fm = frontmatter(s);
    assert.equal(fm.name, s, `${s}: name must match its directory`);
    assert.ok(fm.description.length > 40, `${s}: description must be substantive enough to trigger on`);
  }
});

test('no skill leaks a confidential or personal identifier', () => {
  const banned = /Roylee|BSIP|Blue Star Innovation|OfficeRnD|Hostfully|JerseyWatch|Byga|Alleva|CloudLex|IntusCare/i;
  for (const s of readdirSync(SKILLS)) {
    const file = path.join(SKILLS, s, 'SKILL.md');
    if (!existsSync(file)) continue;
    const text = readFileSync(file, 'utf8');
    const hits = text.split('\n').filter((l) => banned.test(l));
    assert.equal(hits.length, 0, `${s} leaks an identifier: ${hits[0]}`);
  }
});

test('onboard covers research, the interview, and all write targets', () => {
  const { body } = frontmatter('onboard');

  // Identifiers must match exactly -- these are real filenames and flags.
  for (const needle of ['MEMORY.md', 'CLAUDE.md', 'index.md', 'log.md', 'project_', '--refresh']) {
    assert.ok(body.includes(needle), `onboard must reference "${needle}"`);
  }

  // Concepts are prose, so match case-insensitively.
  const lower = body.toLowerCase();
  for (const needle of ['portfolio', 'thesis', 'light', 'heavy']) {
    assert.ok(lower.includes(needle), `onboard must cover "${needle}"`);
  }

  assert.match(body, /interview|grill/i, 'onboard must interview the user');
});

test('onboard states the cost gate before any research runs', () => {
  const { body } = frontmatter('onboard');
  assert.match(body, /before.*research|research.*before/i);
  assert.match(body, /confirm|approval|ask/i);
});

test('onboard forbids inventing facts', () => {
  const { body } = frontmatter('onboard');
  assert.match(body, /_unknown_|never invent|do not invent/i);
});

test('save-point covers anchors, map, and the resume line', () => {
  const { body } = frontmatter('save-point');
  for (const needle of ['Current State', 'Log', 'Open Items', 'MEMORY.md', 'resume', 'Key Artifacts']) {
    assert.ok(body.includes(needle), `save-point must cover "${needle}"`);
  }
});

test('save-point does not create standalone files by default', () => {
  const { body } = frontmatter('save-point');
  assert.match(body, /standalone/i);
});

test('capture covers route targets, cross-linking, and marking sources processed', () => {
  const { body } = frontmatter('capture');
  for (const needle of ['00_Inbox', '01_Daily', '03_People', '_processed', '[[', 'index.md', 'log.md']) {
    assert.ok(body.includes(needle), `capture must cover "${needle}"`);
  }
});

test('capture never edits originals and never guesses routing', () => {
  const { body } = frontmatter('capture');
  assert.match(body, /never edit|do not edit|immutable/i, 'originals must be immutable');
  assert.match(body, /do not guess|needs-routing/i, 'unconfident routing must not be guessed');
});

test('brief is slot-based and never fails without connectors', () => {
  const { body } = frontmatter('brief');
  const lower = body.toLowerCase();
  for (const needle of ['never fail', 'vault', 'calendar', 'mail', 'meeting note', 'open item']) {
    assert.ok(lower.includes(needle), `brief must cover "${needle}"`);
  }
});

test('brief is read-only against connectors', () => {
  const { body } = frontmatter('brief');
  assert.match(body, /read-only|never send|does not send/i);
});

test('brief names no specific vendor in its logic', () => {
  const { body } = frontmatter('brief');
  assert.match(body, /slot/i, 'brief must be written against slots, not vendors');
});
