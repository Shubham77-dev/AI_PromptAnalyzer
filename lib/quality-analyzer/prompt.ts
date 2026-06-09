import { detectContentSignals, detectPromptPresence } from "@/lib/deterministic-analyzer/promptPresence";
import { parsePrompt } from "@/lib/deterministic-analyzer/parser";

function yesNo(value: boolean): string {
  return value ? "YES — do not flag as missing" : "NO";
}

function buildDetectedElementsBlock(content: string): string {
  const parsed = parsePrompt(content);
  const presence = detectPromptPresence(content, parsed);
  const signals = detectContentSignals(content, parsed);

  return [
    "PRE-ANALYSIS (verified by parser — trust these over assumptions):",
    `- Role/persona: ${yesNo(presence.hasRole)}`,
    `- Requirements section: ${yesNo(presence.hasRequirements)}`,
    `- Constraints section: ${yesNo(presence.hasConstraints)}`,
    `- Output format: ${yesNo(presence.hasOutputFormat)}`,
    `- Examples: ${yesNo(presence.hasExamples)}`,
    `- TypeScript / interfaces: ${yesNo(signals.hasTypeScript || signals.hasPropValidation)}`,
    `- Responsive / mobile design: ${yesNo(signals.hasResponsive)}`,
    `- Testing / unit tests: ${yesNo(signals.hasTesting)}`,
    `- Empty state / no-data handling: ${yesNo(signals.hasEmptyState)}`,
    `- Accessibility (ARIA, keyboard): ${yesNo(signals.hasAccessibility)}`,
    "",
    "CRITICAL: Do NOT list issues or suggestions for any item marked YES above.",
    "Only flag genuinely missing elements marked NO. Quote the prompt when unsure.",
  ].join("\n");
}

export const QUALITY_ANALYZER_SYSTEM = [
  "You are a strict prompt quality analyzer.",
  "You MUST return ONLY valid JSON that matches the schema.",
  "Be concrete and actionable. No generic advice.",
  "Keep the improved prompt intent identical to the original.",
  "The improvedPrompt must use flat markdown sections — each heading exactly once.",
  "Never nest Role/Goal/Context/Constraints/Output labels inside another section.",
  "Never append generic meta-instructions like 'provide a precise actionable answer' or 'use clear headings'.",
  "Never suggest adding elements that are already present in the prompt text.",
  "Read the full prompt before listing issues — avoid false positives.",
].join(" ");

export const IMPROVED_PROMPT_TEMPLATE = [
  "## Role",
  "<one-line persona, e.g. You are a frontend developer.>",
  "",
  "## Goal",
  "<specific task from the original prompt>",
  "",
  "## Context",
  "<bullets or short prose>",
  "",
  "## Requirements",
  "<bullets — only if needed>",
  "",
  "## Constraints",
  "<bullets — rules and limits>",
  "",
  "## Output format",
  "<bullets — deliverables and structure>",
].join("\n");

export function buildQualityAnalyzerUserPrompt(content: string): string {
  return [
    "Analyze the following prompt.",
    buildDetectedElementsBlock(content),
    "",
    "Return STRICT JSON with:",
    `{
  "score": number (0-100),
  "breakdown": { "clarity": number, "structure": number, "specificity": number, "outputDefinition": number, "accuracy": number },
  "missingParts": { "roleMissing": boolean, "vagueInstruction": boolean, "outputFormatMissing": boolean },
  "issues": string[],
  "suggestions": string[],
  "improvedPrompt": string
}`,
    "",
    "Rules:",
    "- issues: only genuine gaps not already in the prompt (max 8). Empty array if the prompt is well-structured.",
    "- suggestions: only actionable fixes for real gaps (max 8). Empty array if nothing meaningful is missing.",
    "- missingParts booleans must match PRE-ANALYSIS above.",
    "- improvedPrompt: rewrite using ONLY this structure (each heading once, no nesting):",
    IMPROVED_PROMPT_TEMPLATE,
    "- Use a specific Role line from the task domain — not 'You are an expert assistant' unless no role fits.",
    "- Do NOT use colon labels (Role:, Goal:) inside ## Goal.",
    "- Do NOT duplicate Requirements or Output format sections.",
    "- breakdown: score each dimension from 0-100 (integers).",
    "- Do NOT include markdown fences or extra text outside JSON.",
    "",
    "PROMPT:",
    "----",
    content,
    "----",
  ].join("\n");
}
