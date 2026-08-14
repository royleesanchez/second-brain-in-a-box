#!/usr/bin/env node
/**
 * Package the bootstrap into the distributable.
 *
 * The PAYLOAD deliberately does not ship here. Skills, hooks and templates
 * come from the public marketplace at install time, so an installer emailed
 * six months ago still installs today's version. Only the small, stable
 * bootstrap goes in the zip -- if this archive ever grows past a few tens of
 * kilobytes, something has leaked into it that should not have.
 *
 * The bootstrap is copied to a staging directory before archiving. Zipping
 * the live directory fails on Windows whenever any of those scripts happens
 * to be executing -- the OS holds a lock on a running script -- which makes
 * the build nondeterministic. Staging removes the contention outright.
 */
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BOOTSTRAP = path.join(REPO, 'bootstrap');
const DIST = path.join(REPO, 'dist');
const ZIP = path.join(DIST, 'Second-Brain-in-a-Box.zip');

const stage = mkdtempSync(path.join(tmpdir(), 'sb-zip-'));
const staged = path.join(stage, 'second-brain-in-a-box');

try {
  cpSync(BOOTSTRAP, staged, { recursive: true });

  rmSync(ZIP, { force: true });
  mkdirSync(DIST, { recursive: true });

  if (process.platform === 'win32') {
    execFileSync(
      'powershell',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        `Compress-Archive -Path '${path.join(staged, '*')}' -DestinationPath '${ZIP}' -Force`,
      ],
      { stdio: 'inherit' }
    );
  } else {
    execFileSync('zip', ['-r', '-q', ZIP, '.'], { cwd: staged, stdio: 'inherit' });
  }

  const kb = (statSync(ZIP).size / 1024).toFixed(1);
  console.log(`Built ${ZIP} (${kb} KB)`);
} finally {
  rmSync(stage, { recursive: true, force: true });
}
