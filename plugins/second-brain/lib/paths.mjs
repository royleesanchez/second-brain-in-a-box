import { existsSync, readdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Claude Code names project state dirs by replacing every path separator,
 * drive colon and whitespace run with a single hyphen.
 *   C:\Users\Ada Lovelace\Desktop\Acme Brain
 *     -> C--Users-Ada-Lovelace-Desktop-Acme-Brain
 */
export function slugifyProjectPath(absPath) {
  return String(absPath).replace(/[:\\/]/g, '-').replace(/\s+/g, '-');
}

/**
 * Locate this project's native memory directory.
 *
 * Primary: derive the slug from the project dir. Fallback: if exactly one
 * project has a memory dir, use it -- this covers slug-derivation drift
 * without ever guessing between two candidates. Two or more candidates and
 * no slug match means we do not know, so we say so by returning null.
 *
 * Returns null when there is nothing to read; callers degrade silently.
 */
export function resolveMemoryDir(opts = {}) {
  const home = opts.home ?? os.homedir();
  const projectDir = opts.projectDir ?? process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

  const projectsRoot = path.join(home, '.claude', 'projects');
  const direct = path.join(projectsRoot, slugifyProjectPath(projectDir), 'memory');
  if (existsSync(direct)) return direct;

  if (!existsSync(projectsRoot)) return null;

  let candidates;
  try {
    candidates = readdirSync(projectsRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => path.join(projectsRoot, d.name, 'memory'))
      .filter((p) => existsSync(p));
  } catch {
    return null;
  }

  return candidates.length === 1 ? candidates[0] : null;
}

/**
 * Per-session dedup state. Deliberately NOT under ~/.claude-mem: this plugin
 * must work with claude-mem absent, so it may not put its own state there.
 */
export function resolveStateDir(opts = {}) {
  const home = opts.home ?? os.homedir();
  return path.join(home, '.claude', 'second-brain', 'state');
}
