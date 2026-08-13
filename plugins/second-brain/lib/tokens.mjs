/**
 * Filename prefixes that describe the memory TYPE, never its subject.
 * Stripped before tokenizing rather than fought with the df filter --
 * "project" appears in almost every filename, so it would be filtered as
 * generic anyway, but stripping it first keeps the index honest.
 */
export const STRUCTURAL_PREFIXES = new Set(['project', 'feedback', 'reference', 'user']);

export const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'you', 'can', 'are', 'was', 'our',
  'have', 'has', 'had', 'not', 'but', 'all', 'any', 'how', 'what', 'when', 'why',
  'who', 'get', 'got', 'let', 'lets', 'make', 'made', 'just', 'like', 'one', 'out',
  'use', 'used', 'using', 'from', 'into', 'then', 'than', 'now', 'new', 'add',
  'run', 'see', 'look', 'need', 'want', 'please', 'thanks', 'yes', 'okay',
  'build', 'built', 'help', 'give', 'show', 'tell', 'back', 'over', 'more', 'some',

  // Workflow nouns. These appear in memory filenames but describe process, not
  // subject, so matching on them surfaces the wrong anchor -- "status" once
  // ranked a generic app-status memory above the company the user asked about.
  'status', 'state', 'update', 'updates', 'resume', 'current', 'pending',
  'inprogress', 'notes', 'note', 'plan', 'plans', 'setup', 'config', 'list',

  // Acknowledgements. Without these, "thanks that looks great" scores enough
  // tokens to trigger a search and inject five unrelated results.
  'great', 'good', 'nice', 'perfect', 'awesome', 'looks', 'love',
  'works', 'worked', 'cool', 'sounds', 'sweet', 'done', 'correct', 'right',
]);

/** Lowercased alphanumeric runs longer than two characters, minus stopwords. */
export function tokenize(text) {
  const raw = String(text ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return raw.filter((t) => t.length > 2 && !STOPWORDS.has(t));
}
