const DEFAULT_MAX_CHARS = 1800;

const HEADER = '[brain recall — matched on this prompt, not a summary of it]';
const ANCHOR_LEAD =
  '\nAnchor files that match. Per the Memory Operating Protocol, load these before acting:';
const OBS_LEAD = '\nPrior related work. Search your memory store for the full record:';

/**
 * Assemble the injected block. Bounded on purpose: this runs before every
 * prompt, so an unbounded version would become exactly the context bloat the
 * memory architecture exists to prevent.
 */
export function render({ anchors = [], observations = [], maxChars = DEFAULT_MAX_CHARS } = {}) {
  if (anchors.length === 0 && observations.length === 0) return '';

  const parts = [HEADER];

  if (anchors.length) {
    parts.push(ANCHOR_LEAD);
    for (const a of anchors) parts.push(`- ${a}`);
  }

  if (observations.length) {
    parts.push(OBS_LEAD);
    for (const o of observations) parts.push(`- ${o}`);
  }

  const out = parts.join('\n');
  return out.length > maxChars ? out.slice(0, maxChars).trimEnd() + '\n(truncated)' : out;
}
