import { TECH_KEYWORDS } from "./patterns";
import type { ParsedPrompt } from "./parser";

export type PromptType =
  | "simple"
  | "technical"
  | "documentation"
  | "debugging"
  | "creative"
  | "ui_ux"
  | "code_generation";

export const PROMPT_TYPE_LABELS: Record<PromptType, string> = {
  simple: "Simple",
  technical: "Technical",
  documentation: "Documentation",
  debugging: "Debugging",
  creative: "Creative",
  ui_ux: "UI/UX",
  code_generation: "Code Generation",
};

function countKeywordHits(text: string, keywords: string[]) {
  const lower = text.toLowerCase();
  let hits = 0;
  for (const k of keywords) if (lower.includes(k)) hits += 1;
  return hits;
}

function scoreSignals(text: string, patterns: RegExp[]): number {
  let score = 0;
  for (const re of patterns) if (re.test(text)) score += 1;
  return score;
}

/**
 * Detects prompt type from keywords and patterns.
 * Returns the highest-scoring category; ties resolved by priority order.
 */
export function detectPromptType(content: string, parsed?: ParsedPrompt): PromptType {
  const text = content.trim();
  const len = text.length;
  const lower = text.toLowerCase();

  const signals: Array<{ type: PromptType; score: number }> = [
    {
      type: "debugging",
      score: scoreSignals(text, [
        /\bfix\b/i,
        /\berror\b/i,
        /\bbug\b/i,
        /\bissue\b/i,
        /\bnot working\b/i,
        /\bbroken\b/i,
        /\bdebug\b/i,
        /\bfails?\b/i,
        /\bexception\b/i,
        /\bstack trace\b/i,
      ]),
    },
    {
      type: "documentation",
      score: scoreSignals(text, [
        /\bdocument\b/i,
        /\breadme\b/i,
        /\bwiki\b/i,
        /\bexplain\b/i,
        /\bdescribe\b/i,
        /\bguide\b/i,
        /\bdocumentation\b/i,
        /\boverview\b/i,
      ]),
    },
    {
      type: "ui_ux",
      score: scoreSignals(text, [
        /\bui\b/i,
        /\bux\b/i,
        /\bdesign\b/i,
        /\bcomponent\b/i,
        /\blayout\b/i,
        /\bscreen\b/i,
        /\binterface\b/i,
        /\bwireframe\b/i,
        /\bresponsive\b/i,
      ]),
    },
    {
      type: "code_generation",
      score: scoreSignals(text, [
        /\bbuild\b/i,
        /\bcreate\b/i,
        /\bimplement\b/i,
        /\bdevelop\b/i,
        /\bfunction\b/i,
        /\bclass\b/i,
        /\bmodule\b/i,
        /\bapi endpoint\b/i,
      ]),
    },
    {
      type: "creative",
      score: scoreSignals(text, [
        /\bwrite\b/i,
        /\bstory\b/i,
        /\bpoem\b/i,
        /\bcreative\b/i,
        /\bimagine\b/i,
        /\bfictional\b/i,
        /\bnovel\b/i,
        /\bcharacter\b/i,
        /\bbrainstorm\b/i,
      ]),
    },
    {
      type: "technical",
      score:
        scoreSignals(text, [
          /\bapi\b/i,
          /\bbackend\b/i,
          /\bserver\b/i,
          /\bdatabase\b/i,
          /\balgorithm\b/i,
          /\bsystem\b/i,
          /\barchitecture\b/i,
          /\bmicroservice\b/i,
        ]) + Math.min(3, countKeywordHits(text, TECH_KEYWORDS)),
    },
  ];

  signals.sort((a, b) => b.score - a.score);
  const top = signals[0];
  if (top && top.score >= 1) return top.type;

  const hasStructure =
    parsed &&
    (Object.keys(parsed.headingCounts).length > 0 ||
      parsed.requirements.length + parsed.constraints.length >= 2);

  if (len <= 160 && !hasStructure && countKeywordHits(text, TECH_KEYWORDS) === 0) {
    return "simple";
  }

  if (/\b(build|create|implement|develop)\b/i.test(text)) return "code_generation";
  if (countKeywordHits(text, TECH_KEYWORDS) >= 1) return "technical";

  return "simple";
}

export function promptTypeLabel(type: PromptType): string {
  return PROMPT_TYPE_LABELS[type] ?? "Simple";
}
