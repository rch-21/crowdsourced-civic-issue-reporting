export type AbuseSeverity = 'FLAG' | 'BLOCK';
export type AbuseEventType = 'REPORT_VELOCITY' | 'DUPLICATE_CONTENT';
export interface AbuseSignal {
  type: AbuseEventType;
  severity: AbuseSeverity;
  details: Record<string, unknown>;
}

const VELOCITY_WINDOW_MINUTES = 10;
const VELOCITY_FLAG_THRESHOLD = 5; // the 5th report from the same citizen within the window is flagged for review
const VELOCITY_BLOCK_THRESHOLD = 10; // the 10th within the window is rejected outright

const DUPLICATE_SIMILARITY_THRESHOLD = 0.85; // word-overlap ratio above which two descriptions count as "the same"
const DUPLICATE_FLAG_THRESHOLD = 2; // 2 prior near-identical descriptions already on file flags the 3rd
const DUPLICATE_BLOCK_THRESHOLD = 4; // 4 prior near-identical descriptions blocks the 5th outright

/** Counts how many ISO timestamps fall within `windowMinutes` before `now`. */
export function countWithinWindow(timestamps: string[], now: Date, windowMinutes: number): number {
  const cutoff = now.getTime() - windowMinutes * 60000;
  return timestamps.filter((t) => new Date(t).getTime() >= cutoff).length;
}

/**
 * Evaluates report velocity from a citizen's recent report timestamps (not including the
 * one currently being submitted, which this function accounts for via the +1).
 * Deterministic and pure so it can be unit tested without a database.
 */
export function evaluateVelocity(recentTimestamps: string[], now: Date = new Date()): AbuseSignal | null {
  const count = countWithinWindow(recentTimestamps, now, VELOCITY_WINDOW_MINUTES) + 1;
  if (count >= VELOCITY_BLOCK_THRESHOLD) {
    return { type: 'REPORT_VELOCITY', severity: 'BLOCK', details: { count, windowMinutes: VELOCITY_WINDOW_MINUTES } };
  }
  if (count >= VELOCITY_FLAG_THRESHOLD) {
    return { type: 'REPORT_VELOCITY', severity: 'FLAG', details: { count, windowMinutes: VELOCITY_WINDOW_MINUTES } };
  }
  return null;
}

export function normalizeText(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, ' ');
}

/** Jaccard word-overlap similarity between 0 (nothing in common) and 1 (identical word sets). */
export function textSimilarity(a: string, b: string): number {
  const wordsA = new Set(normalizeText(a).split(' ').filter(Boolean));
  const wordsB = new Set(normalizeText(b).split(' ').filter(Boolean));
  if (!wordsA.size && !wordsB.size) return 1;
  const union = new Set([...wordsA, ...wordsB]);
  if (!union.size) return 0;
  const intersectionSize = [...wordsA].filter((w) => wordsB.has(w)).length;
  return intersectionSize / union.size;
}

/**
 * Evaluates a new report description against a citizen's other recent descriptions
 * (typically their last 24h of reports). Flags copy-pasted/near-identical spam without
 * requiring an exact string match, since minor edits (typos, punctuation) are common
 * even in genuine spam.
 */
export function evaluateDuplicateContent(newDescription: string, recentDescriptions: string[]): AbuseSignal | null {
  const matches = recentDescriptions.filter((d) => textSimilarity(d, newDescription) >= DUPLICATE_SIMILARITY_THRESHOLD).length;
  if (matches >= DUPLICATE_BLOCK_THRESHOLD) return { type: 'DUPLICATE_CONTENT', severity: 'BLOCK', details: { matches } };
  if (matches >= DUPLICATE_FLAG_THRESHOLD) return { type: 'DUPLICATE_CONTENT', severity: 'FLAG', details: { matches } };
  return null;
}
