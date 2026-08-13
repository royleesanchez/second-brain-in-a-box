import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Brain-local configuration, read from <projectDir>/.brain/config.json.
 *
 * Aliases live here rather than in code so each install can teach the recall
 * engine its own abbreviations ("nw" -> "northwind") without forking the
 * plugin. Every failure mode degrades to usable defaults: this is called on
 * the prompt path and must never throw.
 */
export function loadBrainConfig(projectDir) {
  const fallback = {
    project: projectDir ? path.basename(projectDir) : '',
    aliases: {},
    features: { claudeMem: true },
  };

  if (!projectDir) return fallback;

  try {
    const raw = JSON.parse(readFileSync(path.join(projectDir, '.brain', 'config.json'), 'utf8'));
    return {
      project: typeof raw.project === 'string' && raw.project ? raw.project : fallback.project,
      aliases: raw.aliases && typeof raw.aliases === 'object' && !Array.isArray(raw.aliases) ? raw.aliases : {},
      features: { claudeMem: raw.features?.claudeMem !== false },
    };
  } catch {
    return fallback;
  }
}
