#!/usr/bin/env node
/**
 * Create the vault tree and seed files for a brain.
 *
 * Idempotent and non-destructive by design: directories are created with
 * recursive:true, and an existing file is left exactly as the user left it.
 * The installer is expected to be re-run, and a scaffolder that clobbers a
 * customised CLAUDE.md on the second run would destroy the very thing the
 * product exists to accumulate.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function substitute(text, vars) {
  return text.replace(/\{\{([A-Z_]+)\}\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
}

export function scaffoldBrain({ templateDir, targetDir, vars = {} }) {
  const manifest = JSON.parse(readFileSync(path.join(templateDir, 'manifest.json'), 'utf8'));
  const created = [];

  for (const dir of manifest.dirs) {
    mkdirSync(path.join(targetDir, dir), { recursive: true });
  }

  for (const file of manifest.files) {
    const dest = path.join(targetDir, file.to);
    if (existsSync(dest)) continue;
    mkdirSync(path.dirname(dest), { recursive: true });
    const body = readFileSync(path.join(templateDir, file.from), 'utf8');
    writeFileSync(dest, substitute(body, vars), 'utf8');
    created.push(file.to);
  }

  return { created };
}

/** List the flavors this plugin ships. */
export function listTemplates(templatesRoot) {
  const { readdirSync } = require('node:fs');
  return readdirSync(templatesRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

// CLI: node bin/scaffold.mjs <template> <target> KEY=value ...
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const [template, targetArg, ...rest] = process.argv.slice(2);

  if (!template || !targetArg) {
    console.error('usage: scaffold.mjs <template> <target-dir> KEY=value ...');
    process.exit(2);
  }

  const vars = {};
  for (const arg of rest) {
    const m = arg.replace(/^--var[= ]?/, '').match(/^([A-Z_]+)=([\s\S]*)$/);
    if (m) vars[m[1]] = m[2];
  }

  const here = path.dirname(fileURLToPath(import.meta.url));
  const templateDir = path.resolve(here, '..', 'templates', template);
  const targetDir = path.resolve(targetArg);

  if (!existsSync(templateDir)) {
    console.error(`No such template: ${template}`);
    process.exit(2);
  }

  const { created } = scaffoldBrain({ templateDir, targetDir, vars });
  console.log(
    created.length
      ? `Created ${created.length} file(s) in ${targetDir}:\n  ${created.join('\n  ')}`
      : `Nothing to create — ${targetDir} is already scaffolded.`
  );
}
