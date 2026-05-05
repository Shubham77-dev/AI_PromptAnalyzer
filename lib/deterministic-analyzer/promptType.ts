import { TECH_KEYWORDS } from "./patterns";
import type { ParsedPrompt } from "./parser";

export type PromptType = "simple" | "instruction" | "structured" | "creative" | "technical";

function countKeywordHits(text: string, keywords: string[]) {
  const lower = text.toLowerCase();
  let hits = 0;
  for (const k of keywords) if (lower.includes(k)) hits += 1;
  return hits;
}

function looksCreative(text: string) {
  return /\b(story|poem|lyrics|character|dialogue|novel|creative|imagine|brainstorm|tone|style|voice)\b/i.test(
    text,
  );
}

function looksInstructional(text: string) {
  return /\b(write|generate|summarize|analyze|create|build|design|implement|refactor|debug|extract|classify|compare|explain)\b/i.test(
    text,
  );
}

export function detectPromptType(content: string, parsed: ParsedPrompt): PromptType {
  const text = content.trim();
  const len = text.length;

  const hasHeadings = Object.keys(parsed.headingCounts).length > 0;
  const hasLists = parsed.requirements.length + parsed.constraints.length >= 2;
  const hasOutput = Boolean(parsed.outputFormat?.trim());
  const techHits = countKeywordHits(text, TECH_KEYWORDS);

  // Strong signals first
  if (techHits >= 2 || /\b(api|sql|http|database|schema|typescript|react|next\.js|prisma)\b/i.test(text)) {
    return "technical";
  }
  if (looksCreative(text)) return "creative";
  if (hasHeadings || hasLists) return "structured";
  if (looksInstructional(text)) return "instruction";

  // Otherwise: short and plain → simple
  if (len <= 160 && !hasOutput) return "simple";
  return "instruction";
}

