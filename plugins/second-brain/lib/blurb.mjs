import { readFileSync } from 'node:fs';
import path from 'node:path';

const DEFAULT_MAX_CURRENT = 420;
const collapse = (s) => s.replace(/\s+/g, ' ').trim();

/**
 * Strip a leading YAML frontmatter block, if present.
 * Splitting naively on "---" breaks when a frontmatter VALUE contains "---",
 * so match the delimited block explicitly instead.
 */
function stripFrontmatter(text) {
  if (!text.startsWith('---')) return text;
  const m = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return m ? text.slice(m[0].length) : text;
}

/**
 * The load-first payload for an anchor: its status line plus the opening of
 * Current State. Everything below Current State is history and is deliberately
 * excluded -- the point is orientation, not the full record.
 */
export function anchorBlurb(filePath, opts = {}) {
  const maxCurrent = opts.maxCurrent ?? DEFAULT_MAX_CURRENT;

  let text;
  try {
    text = readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }

  const body = stripFrontmatter(text);

  const statusMatch = body.match(/\*\*Status:\*\*[^\n]*/);
  const status = statusMatch ? collapse(statusMatch[0]) : '';

  const currentMatch = body.match(/##\s*Current State\s*\r?\n([\s\S]+?)(?=\r?\n##|$)/);
  let current = currentMatch ? collapse(currentMatch[1]) : collapse(body);

  if (current.length > maxCurrent) current = current.slice(0, maxCurrent - 3).trimEnd() + '...';

  const name = path.basename(filePath);
  const head = status ? `${name} — ${status}` : name;
  return current ? `${head}\n  ${current}` : head;
}
