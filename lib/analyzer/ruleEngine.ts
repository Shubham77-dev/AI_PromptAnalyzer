/**
 * Fast, local rule-based validation before any AI call.
 */

const MIN_LENGTH = 20;
const MAX_LENGTH = 20_000;

/** Lowercase banned fragments — extend via env or config as needed. */
const DEFAULT_BANNED: string[] = [
  "ignore previous instructions",
  "ignore all prior",
  "system prompt",
  "jailbreak",
  "dan mode",
  "reveal your prompt",
  "bypass safety",
];

function normalizeForDup(content: string): string {
  return content.trim().toLowerCase().replace(/\s+/g, " ");
}

export function analyzeWithRules(content: string): {
  passed: boolean;
  severeFailure: boolean;
  score: number;
  flags: string[];
} {
  const text = content.trim();
  const flags: string[] = [];
  let score = 100;

  if (text.length < MIN_LENGTH) {
    flags.push(`below_min_length:${text.length}`);
    score -= 50;
  }

  if (text.length > MAX_LENGTH) {
    flags.push(`above_max_length:${text.length}`);
    score -= 40;
  }

  const lower = text.toLowerCase();
  for (const banned of DEFAULT_BANNED) {
    if (lower.includes(banned)) {
      flags.push(`banned_keyword:${banned}`);
      score -= 35;
    }
  }

  // Basic spam: single character dominance or excessive repetition
  if (text.length >= MIN_LENGTH) {
    const counts = new Map<string, number>();
    for (const ch of text) {
      counts.set(ch, (counts.get(ch) ?? 0) + 1);
    }
    let maxRatio = 0;
    for (const n of counts.values()) {
      maxRatio = Math.max(maxRatio, n / text.length);
    }
    if (maxRatio > 0.55) {
      flags.push("spam_like_repetition");
      score -= 30;
    }
  }

  // Very low entropy lines (e.g. "aaaaaaa...")
  if (/^(.)\1{24,}$/m.test(text)) {
    flags.push("low_entropy_line");
    score -= 25;
  }

  // Duplicate placeholder: flag if normalized body is trivially repeated twice
  const norm = normalizeForDup(text);
  const half = Math.floor(norm.length / 2);
  if (half > 40 && norm.slice(0, half) === norm.slice(half)) {
    flags.push("possible_duplicate_content");
    score -= 15;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const severeFailure =
    flags.some((f) => f.startsWith("banned_keyword")) ||
    text.length < Math.min(10, MIN_LENGTH) ||
    score < 15;

  const passed =
    text.length >= MIN_LENGTH &&
    text.length <= MAX_LENGTH &&
    !flags.some((f) => f.startsWith("banned_keyword")) &&
    score >= 40;

  return { passed, severeFailure, score, flags };
}
