import { TECH_KEYWORDS } from "./patterns";
import type { ParsedPrompt } from "./parser";
import type { PromptType } from "./promptType";
import { promptTypeLabel } from "./promptType";

const ACTION_VERBS = [
  "build",
  "create",
  "implement",
  "develop",
  "fix",
  "debug",
  "write",
  "explain",
  "describe",
  "design",
  "generate",
  "analyze",
  "refactor",
  "optimize",
  "document",
  "test",
  "deploy",
  "configure",
];

const SUBJECT_PATTERNS: Array<{ re: RegExp; extract: (m: RegExpMatchArray) => string }> = [
  { re: /\b(?:build|create|implement|develop)\s+(?:a|an|the)?\s*([^.!?\n,]{3,60})/i, extract: (m) => m[1]?.trim() ?? "" },
  { re: /\b(?:fix|debug|resolve)\s+(?:a|an|the)?\s*([^.!?\n,]{3,60})/i, extract: (m) => m[1]?.trim() ?? "" },
  { re: /\b(?:write|generate)\s+(?:a|an|the)?\s*([^.!?\n,]{3,60})/i, extract: (m) => m[1]?.trim() ?? "" },
  { re: /\b(?:explain|describe|document)\s+(?:a|an|the)?\s*([^.!?\n,]{3,60})/i, extract: (m) => m[1]?.trim() ?? "" },
  { re: /\b(?:design)\s+(?:a|an|the)?\s*([^.!?\n,]{3,60})/i, extract: (m) => m[1]?.trim() ?? "" },
];

function extractVerb(text: string): string {
  const lower = text.toLowerCase();
  for (const v of ACTION_VERBS) {
    const re = new RegExp(`\\b${v}\\b`, "i");
    if (re.test(lower)) return v;
  }
  return "accomplish";
}

function extractSubject(text: string, parsed: ParsedPrompt): string {
  for (const { re, extract } of SUBJECT_PATTERNS) {
    const m = re.exec(text);
    if (m) {
      const subj = extract(m);
      if (subj.length >= 3) return subj.replace(/\s+/g, " ").trim();
    }
  }

  const goal = parsed.goal?.trim();
  if (goal && goal.length <= 80) return goal.replace(/\s+/g, " ").trim();

  const firstSentence = text.split(/[.!?\n]/)[0]?.trim() ?? "";
  if (firstSentence.length > 10 && firstSentence.length <= 100) {
    return firstSentence.replace(/\s+/g, " ").trim();
  }

  return "their task";
}

function extractTechStack(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const kw of TECH_KEYWORDS) {
    if (lower.includes(kw)) found.push(kw);
  }
  const extras = ["react", "vue", "angular", "node.js", "python", "java", "go", "rust", "typescript"];
  for (const e of extras) {
    if (lower.includes(e) && !found.includes(e)) found.push(e);
  }
  return found.slice(0, 3);
}

function verbForType(type: PromptType, verb: string): string {
  if (verb !== "accomplish") return verb;
  const defaults: Record<PromptType, string> = {
    simple: "get help with",
    technical: "work on a technical task involving",
    documentation: "create documentation for",
    debugging: "debug",
    creative: "create creative content about",
    ui_ux: "design a UI/UX solution for",
    code_generation: "build",
  };
  return defaults[type];
}

/**
 * Returns a one-sentence plain-English description of user intent.
 */
export function detectIntent(content: string, parsed: ParsedPrompt, promptType: PromptType): string {
  const text = content.trim();
  if (!text) return "The user wants to accomplish a task.";

  const verb = verbForType(promptType, extractVerb(text));
  const subject = extractSubject(text, parsed);
  const tech = extractTechStack(text);

  let sentence = `The user wants to ${verb} ${subject}`;
  if (tech.length > 0) {
    const stack = tech.map((t) => (t === "next.js" ? "Next.js" : t.charAt(0).toUpperCase() + t.slice(1))).join(", ");
    sentence += ` using ${stack}`;
  }
  sentence += ".";

  if (sentence.length > 160) {
    return `The user wants to ${verbForType(promptType, extractVerb(text))} a ${promptTypeLabel(promptType).toLowerCase()} task.`;
  }

  return sentence;
}
