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
  return content.trim().toLowerCase().replaceAll(/\s+/g, " ");
}

function normalizeForSignals(content: string) {
  const normalized = content
    .trim()
    .replaceAll("\r\n", "\n")
    .replaceAll(/[ \t]+/g, " ")
    .replaceAll(/\n{3,}/g, "\n\n");
  return {
    text: normalized,
    lower: normalized.toLowerCase(),
  };
}

type DetectedSignals = {
  role: boolean;
  structure: boolean;
  outputFormat: boolean;
  constraints: boolean;
  clearTask: boolean;
  examples: boolean;
};

function detectRole(text: string) {
  return (
    /\b(act as|you are|as an?|role:|persona:)\b/i.test(text) ||
    // "You are a/an ..." style role assignment
    /\byou are (a|an)\b/i.test(text)
  );
}

function detectStructure(text: string) {
  return (
    // headings, numbered lists, bullets, explicit sections
    /(^|\n)\s*(#{1,6}\s+|(\d{1,2}[.)\]]\s+)|[-*•]\s+)\S+/m.test(text) ||
    /\b(sections?|requirements?|constraints?|output format|deliverables?|acceptance criteria|steps?)\b/i.test(
      text,
    )
  );
}

function detectOutputFormat(text: string, lower: string) {
  return (
    // explicit format directive + a known format token, or a fenced block hint
    (/\b(output format|format|return|respond with|provide)\b/i.test(text) &&
      /\b(json|markdown|md|yaml|yml|xml|csv|table|bullet(s)?|steps?|numbered list)\b/i.test(text)) ||
    /```(json|yaml|yml|xml|csv|md|markdown)\b/i.test(lower)
  );
}

function detectConstraints(text: string, lower: string) {
  // hard constraints & prohibitions
  if (
    /\b(must|must not|do not|don't|never|avoid|required|required:|exactly|at least|at most|no more than)\b/i.test(
      text,
    )
  ) {
    return true;
  }
  // length constraints like "under 200 words"
  if (/\b(under|below|max(?:imum)?|limit(?:ed)?)\b/i.test(lower) && /\b\d+\s+(words?|chars?|characters?|tokens?)\b/i.test(lower)) {
    return true;
  }
  return false;
}

function detectClearTask(text: string) {
  if (/\b(goal|task|objective)\b/i.test(text)) return true;
  // Split verb list to keep regex complexity low.
  if (/\b(write|generate|summarize|analyze|create|build)\b/i.test(text)) return true;
  if (/\b(design|implement|refactor|debug|extract|classify|compare)\b/i.test(text)) return true;
  return false;
}

function detectExamples(text: string) {
  return /\b(example|for example|e\.g\.)\b/i.test(text) || /(^|\n)\s*example\s*:/im.test(text);
}

function detectSignals(content: string): DetectedSignals {
  const { text, lower } = normalizeForSignals(content);

  const role = detectRole(text);
  const structure = detectStructure(text);
  const outputFormat = detectOutputFormat(text, lower);
  const constraints = detectConstraints(text, lower);
  const clearTask = detectClearTask(text);
  const examples = detectExamples(text);

  return { role, structure, outputFormat, constraints, clearTask, examples };
}

export function analyzeWithRules(content: string): {
  passed: boolean;
  severeFailure: boolean;
  score: number;
  flags: string[];
} {
  const text = content.trim();
  const flags: string[] = [];

  const signals = detectSignals(text);
  let score = baseSignalScore(signals, flags);
  score += lengthQualityScore(text.length);

  if (text.length < MIN_LENGTH) {
    flags.push(`below_min_length:${text.length}`);
    score -= 50;
  }

  if (text.length > MAX_LENGTH) {
    flags.push(`above_max_length:${text.length}`);
    score -= 40;
  }

  score += applySafetyAndSpamPenalties(text, flags);

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

function applySafetyAndSpamPenalties(text: string, flags: string[]) {
  let delta = 0;
  const lower = text.toLowerCase();

  for (const banned of DEFAULT_BANNED) {
    if (lower.includes(banned)) {
      flags.push(`banned_keyword:${banned}`);
      delta -= 60;
    }
  }

  // Basic spam: single character dominance or excessive repetition
  if (text.length >= MIN_LENGTH) {
    const counts = new Map<string, number>();
    for (const ch of text) counts.set(ch, (counts.get(ch) ?? 0) + 1);
    let maxRatio = 0;
    for (const n of counts.values()) maxRatio = Math.max(maxRatio, n / text.length);
    if (maxRatio > 0.55) {
      flags.push("spam_like_repetition");
      delta -= 30;
    }
  }

  // Very low entropy lines (e.g. "aaaaaaa...")
  if (/^(.)\1{24,}$/m.test(text)) {
    flags.push("low_entropy_line");
    delta -= 25;
  }

  // Duplicate placeholder: flag if normalized body is trivially repeated twice
  const norm = normalizeForDup(text);
  const half = Math.floor(norm.length / 2);
  if (half > 40 && norm.slice(0, half) === norm.slice(half)) {
    flags.push("possible_duplicate_content");
    delta -= 15;
  }

  return delta;
}

function baseSignalScore(signals: DetectedSignals, flags: string[]) {
  let score = 0;
  score += scoreOrFlag(signals.role, 20, "missing_role", flags);
  score += scoreOrFlag(signals.clearTask, 20, "missing_task", flags);
  score += scoreOrFlag(signals.outputFormat, 20, "missing_output_format", flags);
  score += scoreOrFlag(signals.constraints, 15, "missing_constraints", flags);
  score += scoreOrFlag(signals.structure, 15, "missing_structure", flags);
  if (signals.examples) score += 5;
  return score;
}

function scoreOrFlag(ok: boolean, points: number, flag: string, flags: string[]) {
  if (ok) return points;
  flags.push(flag);
  return 0;
}

function lengthQualityScore(length: number) {
  // Encourage prompts that are neither too short nor excessively long.
  return length >= 80 && length <= 6_000 ? 5 : 0;
}
