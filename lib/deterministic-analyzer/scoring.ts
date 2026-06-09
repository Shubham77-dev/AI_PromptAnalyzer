import type { ParsedPrompt } from "./parser";
import { detectPromptPresence } from "./promptPresence";
import { detectPromptType, type PromptType } from "./promptType";

export type DimensionScores = {
  clarity: number;
  specificity: number;
  completeness: number;
  context: number;
  actionability: number;
  outputDefinition: number;
};

/** @deprecated Legacy breakdown kept for backward compatibility in merged paths */
export type ScoreBreakdown = {
  clarity: number;
  structure: number;
  specificity: number;
  outputDefinition: number;
  accuracy: number;
};

export type ScoreResult = {
  overallScore: number;
  promptType: PromptType;
  dimensions: DimensionScores;
  breakdown: ScoreBreakdown;
  penalties: string[];
  signals: {
    hasRole: boolean;
    hasGoal: boolean;
    requirementCount: number;
    constraintCount: number;
    hasOutputFormat: boolean;
    hasExamples: boolean;
    hasHeadings: boolean;
  };
  vagueInstruction: boolean;
  outputFormatMissing: boolean;
};

const DIMENSION_WEIGHTS: Record<keyof DimensionScores, number> = {
  clarity: 0.2,
  specificity: 0.2,
  completeness: 0.2,
  context: 0.15,
  actionability: 0.15,
  outputDefinition: 0.1,
};

const CLARITY_ACTION_VERBS = [
  "build",
  "create",
  "fix",
  "debug",
  "write",
  "implement",
  "design",
  "develop",
  "make",
  "generate",
  "refactor",
  "optimize",
  "add",
  "update",
  "migrate",
];

const TECH_KEYWORDS = [
  "react",
  "vue",
  "angular",
  "next",
  "nuxt",
  "node",
  "express",
  "django",
  "fastapi",
  "python",
  "java",
  "typescript",
  "javascript",
  "tailwind",
  "mui",
  "shadcn",
  "postgresql",
  "mongodb",
  "mysql",
  "redis",
  "graphql",
  "rest",
  "jwt",
  "oauth",
  "docker",
  "aws",
  "vercel",
  "api",
  "login",
];

const VAGUE_FILLER_WORDS = [
  "something",
  "stuff",
  "things",
  "some",
  "nice",
  "good",
  "better",
  "proper",
  "simple",
  "basic",
  "just",
  "maybe",
  "kind of",
  "sort of",
];

function clampInt(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function wordCount(prompt: string) {
  const trimmed = prompt.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function getWordCountBaseline(prompt: string): { maxPossible: number; baseline: number } {
  const words = wordCount(prompt);
  if (words <= 2) return { maxPossible: 15, baseline: 5 };
  if (words <= 4) return { maxPossible: 25, baseline: 5 };
  if (words <= 7) return { maxPossible: 40, baseline: 10 };
  if (words <= 12) return { maxPossible: 60, baseline: 15 };
  if (words <= 20) return { maxPossible: 75, baseline: 20 };
  if (words <= 40) return { maxPossible: 88, baseline: 25 };
  return { maxPossible: 100, baseline: 30 };
}

function scoreClarity(prompt: string): number {
  let score = 0;
  const words = prompt.trim().split(/\s+/).filter(Boolean);
  const lower = prompt.toLowerCase();

  const firstFiveWords = words.slice(0, 5).join(" ").toLowerCase();
  if (CLARITY_ACTION_VERBS.some((v) => firstFiveWords.includes(v))) score += 25;

  if (words.length >= 4) score += 20;
  if (words.length >= 8) score += 15;

  if (words.length <= 1) score -= 50;
  if (words.length === 2) score -= 30;
  if (words.length === 3) score -= 10;

  const vagueOnly = /^(do|make|it|this|that|fix|help)\s*(it|this|that)?$/i;
  if (vagueOnly.test(prompt.trim())) return 0;

  const hasDeliverable =
    /(page|component|api|endpoint|function|service|dashboard|modal|form|table|app|system|route|module|class|hook|store|bug|todo)/i.test(
      prompt,
    );
  if (hasDeliverable) score += 20;

  if (!hasDeliverable && words.length < 8) score -= 20;

  return clampInt(score);
}

function scoreSpecificity(prompt: string): number {
  let score = 0;
  const lower = prompt.toLowerCase();

  const techCount = TECH_KEYWORDS.filter((t) => lower.includes(t)).length;
  score += Math.min(techCount * 15, 40);

  if (/v\d|version \d|\d\.\d/.test(prompt)) score += 10;
  if (/\/[a-zA-Z]/.test(prompt)) score += 10;

  const specificPatterns = [
    "usestate",
    "useeffect",
    "usenavigation",
    "middleware",
    "jwt",
    "localstorage",
    "hooks",
    "context",
    "redux",
    "zustand",
    "router v6",
    "app router",
  ];
  if (specificPatterns.some((p) => lower.includes(p))) score += 15;

  if (/\b(get|post|put|patch|delete)\b/i.test(prompt)) score += 10;
  if (/\b(401|403|404|500|400)\b/.test(prompt)) score += 10;

  const vagueCount = VAGUE_FILLER_WORDS.filter((v) => lower.includes(v)).length;
  score -= vagueCount * 8;

  if (techCount === 0) {
    score = Math.min(score, 25);
    if (/(login|dashboard|auth|navbar|sidebar|checkout)/i.test(prompt)) score += 15;
  }

  if (/\b(rest|graphql)\s+api\b/i.test(prompt)) score += 10;

  return clampInt(score);
}

function scoreCompleteness(prompt: string, promptType: PromptType): number {
  const lower = prompt.toLowerCase();
  const words = prompt.trim().split(/\s+/).filter(Boolean);

  const actionVerbs = [
    "build",
    "create",
    "fix",
    "write",
    "implement",
    "design",
    "develop",
    "debug",
    "refactor",
    "optimize",
  ];
  const subjects = [
    "page",
    "component",
    "api",
    "endpoint",
    "app",
    "function",
    "service",
    "module",
    "system",
    "feature",
    "dashboard",
    "form",
    "table",
    "modal",
    "route",
    "bug",
    "todo",
  ];

  const hasAction = actionVerbs.some((v) => lower.includes(v));
  const hasSubject = subjects.some((s) => lower.includes(s));

  if (words.length < 5 && !(hasAction && hasSubject)) {
    let shortScore = Math.min(words.length * 3, 12);
    if (promptType === "debugging") shortScore = Math.min(shortScore + 3, 12);
    return shortScore;
  }

  let score = 0;

  const rolePatterns = ["you are", "act as", "as a", "as an", "senior", "expert", "developer", "engineer", "architect"];
  if (rolePatterns.some((r) => lower.includes(r))) score += 20;

  if (hasAction && hasSubject) score += 25;
  else if (hasAction || hasSubject) score += 10;

  const hasMultipleRequirements =
    prompt.includes("\n") || (prompt.includes(",") && words.length > 15) || /\d\.|•|-\s/.test(prompt);
  if (hasMultipleRequirements) score += 20;

  const constraintWords = [
    "no external",
    "without library",
    "must not",
    "should not",
    "do not use",
    "avoid",
    "only use",
    "existing",
    "legacy",
    "constraint",
  ];
  if (constraintWords.some((c) => lower.includes(c))) score += 15;

  const successWords = [
    "should work",
    "must work",
    "should return",
    "on success",
    "when done",
    "redirect to",
    "show message",
    "display error",
    "handle error",
    "error handling",
    "form validation",
  ];
  if (successWords.some((s) => lower.includes(s))) score += 20;

  if (words.length >= 30) {
    const detailTokens = [
      "validation",
      "localstorage",
      "redirect",
      "error handling",
      "401",
      "500",
      "hooks",
      "tailwind",
      "jwt",
      "endpoint",
      "middleware",
    ];
    const detailHits = detailTokens.filter((t) => lower.includes(t)).length;
    if (detailHits >= 5) score += Math.min(detailHits * 3, words.length >= 32 ? 27 : 21);
  }

  return clampInt(score);
}

function scoreContext(prompt: string, promptType: PromptType): number {
  let score = 0;
  const lower = prompt.toLowerCase();
  const words = prompt.trim().split(/\s+/).filter(Boolean);

  if (words.length < 6) return 5;

  const techContextWords = [
    "react",
    "vue",
    "node",
    "python",
    "express",
    "django",
    "postgresql",
    "mongodb",
    "aws",
    "docker",
    "typescript",
    "tailwind",
    "jwt",
    "oauth",
    "localstorage",
    "hooks",
    "rest",
  ];
  const techCount = techContextWords.filter((t) => lower.includes(t)).length;
  const techCap = words.length >= 32 ? 50 : words.length >= 25 ? 45 : 35;
  score += Math.min(techCount * 12, techCap);

  if (words.length >= 8 && techCount >= 1) score = Math.max(score, 18);

  const envWords = [
    "production",
    "development",
    "staging",
    "localhost",
    "browser",
    "mobile",
    "ios",
    "android",
    "chrome",
    "safari",
    "windows",
    "linux",
    "mac",
    "server",
    "client",
    "frontend",
    "backend",
    "fullstack",
  ];
  if (envWords.some((e) => lower.includes(e))) score += 20;

  const existingSystem = [
    "existing",
    "current",
    "our",
    "we have",
    "already",
    "codebase",
    "project",
    "app",
    "system",
    "using",
    "built with",
    "integrated with",
  ];
  if (existingSystem.some((e) => lower.includes(e))) score += 20;

  const audienceWords = ["user", "admin", "customer", "client", "developer", "team", "public", "authenticated", "guest"];
  if (audienceWords.some((a) => lower.includes(a))) score += 15;

  if (promptType === "debugging") {
    if (/version|v\d|\d\.\d/.test(prompt)) score += 10;
    if (/error|exception|stack trace|log/i.test(prompt)) score += 10;
    if (/line \d|:\d+/i.test(prompt)) score += 10;
  }

  return clampInt(score);
}

function scoreActionability(prompt: string, _promptType: PromptType): number {
  let score = 0;
  const lower = prompt.toLowerCase();
  const words = prompt.trim().split(/\s+/).filter(Boolean);

  if (words.length <= 2) return 0;
  if (words.length <= 4) return 8;
  if (words.length <= 6) return 15;

  const actionVerbs = ["build", "create", "fix", "debug", "write", "implement", "design", "refactor", "optimize", "add"];
  const actionCount = actionVerbs.filter((v) => lower.includes(v)).length;

  if (actionCount === 1) score += 30;
  else if (actionCount === 2) score += 15;
  else if (actionCount >= 3) score += 5;

  if (words.length >= 8 && words.length < 10) score += 5;
  if (words.length >= 10) score += 15;
  if (words.length >= 20) score += 15;
  if (words.length >= 28) score += 10;
  if (words.length >= 35) score += 10;

  const hasDetail = prompt.includes(",") || prompt.includes("\n") || words.length > 20;
  if (hasDetail) score += 15;

  const hasVagueRef = /\bfix (it|this|the bug)\b/i.test(prompt) && words.length < 8;
  if (hasVagueRef) score -= 30;

  if (/redirect|return|show|display|render|store/i.test(prompt)) score += 10;

  // Tech-named prompts with a single action are more actionable even when short.
  if (words.length >= 5 && words.length <= 12 && TECH_KEYWORDS.some((t) => lower.includes(t))) score += 10;

  const namedTechCount = TECH_KEYWORDS.filter((t) => lower.includes(t)).length;
  if (words.length >= 7 && words.length <= 12 && namedTechCount >= 2 && actionCount === 1) score += 12;

  if (/\brest\s+api\b/i.test(lower) && words.length <= 10) score += 5;

  return clampInt(score);
}

function scoreOutputDefinition(prompt: string, _promptType: PromptType): number {
  let score = 0;
  const lower = prompt.toLowerCase();
  const words = prompt.trim().split(/\s+/).filter(Boolean);

  if (words.length < 5) {
    if (/(api|page|component|form|route|login page)/i.test(prompt)) return 15;
    return 0;
  }

  const explicitOutput = [
    "json",
    "api",
    "component",
    "function",
    "class",
    "file",
    "endpoint",
    "route",
    "page",
    "list",
    "array",
    "object",
    "string",
    "response",
    "output format",
    "return",
    "result",
    "table",
    "form",
    "modal",
    "hook",
    "service",
    "module",
    "readme",
    "documentation",
    "markdown",
  ];

  const outputCount = explicitOutput.filter((o) => lower.includes(o)).length;
  score += Math.min(outputCount * 20, 50);

  const impliedOutputs = [
    "login page",
    "dashboard",
    "api",
    "rest api",
    "graphql api",
    "component",
    "form",
    "table component",
    "modal",
    "sidebar",
    "navbar",
  ];
  if (impliedOutputs.some((o) => lower.includes(o))) score += 25;

  if (/tailwind|css|styled|inline style/i.test(prompt)) score += 10;
  if (/typescript|typed|interface|type /i.test(prompt)) score += 10;
  if (/\b(with|using|in)\s+(react|vue|angular)/i.test(prompt)) score += 15;

  if (/\b\d+\s*(lines?|words?|characters?|items?|rows?)\b/i.test(prompt)) score += 10;
  if (/no (external|library|framework|dependency)/i.test(prompt)) score += 10;

  return clampInt(score);
}

function calculateOverallScore(dimensions: DimensionScores, prompt: string): number {
  const weighted =
    dimensions.clarity * DIMENSION_WEIGHTS.clarity +
    dimensions.specificity * DIMENSION_WEIGHTS.specificity +
    dimensions.completeness * DIMENSION_WEIGHTS.completeness +
    dimensions.context * DIMENSION_WEIGHTS.context +
    dimensions.actionability * DIMENSION_WEIGHTS.actionability +
    dimensions.outputDefinition * DIMENSION_WEIGHTS.outputDefinition;

  const { maxPossible, baseline } = getWordCountBaseline(prompt);
  let finalScore = Math.round(Math.min(weighted, maxPossible));
  if (baseline > 0) finalScore = Math.max(finalScore, baseline);
  return clampInt(finalScore);
}

function dimensionsToLegacyBreakdown(d: DimensionScores): ScoreBreakdown {
  return {
    clarity: d.clarity,
    structure: d.completeness,
    specificity: d.specificity,
    outputDefinition: d.outputDefinition,
    accuracy: clampInt((d.actionability + d.context) / 2),
  };
}

function collectPenalties(prompt: string, dimensions: DimensionScores, parsed: ParsedPrompt): string[] {
  const penalties: string[] = [];
  const words = wordCount(prompt);

  if (words <= 4) penalties.push("short");
  if (words < 5) penalties.push("structurally_incomplete");
  if (dimensions.clarity < 30) penalties.push("vague_goal");
  if (dimensions.specificity < 25) penalties.push("missing_specifics");
  if (dimensions.completeness < 30) penalties.push("missing_requirements");
  if (dimensions.outputDefinition < 20) penalties.push("missing_output_format");
  if (!parsed.role?.trim()) penalties.push("missing_role");
  if (/\bfix (it|this|the bug)\b/i.test(prompt) && words < 8) penalties.push("unclear_references");

  return Array.from(new Set(penalties));
}

export function scorePromptDeterministic(content: string, parsed: ParsedPrompt): ScoreResult {
  const text = content.trim();
  const promptType = detectPromptType(content, parsed);

  const presence = detectPromptPresence(content, parsed);
  const hasRole = presence.hasRole;
  const hasGoal = Boolean(parsed.goal?.trim());
  const requirementCount = parsed.requirements.length || (presence.hasRequirements ? 1 : 0);
  const constraintCount = parsed.constraints.length || (presence.hasConstraints ? 1 : 0);
  const hasOutputFormat = presence.hasOutputFormat;
  const hasExamples = presence.hasExamples;
  const hasHeadings = Object.keys(parsed.headingCounts).length > 0;

  const dimensions: DimensionScores = {
    clarity: scoreClarity(text),
    specificity: scoreSpecificity(text),
    completeness: scoreCompleteness(text, promptType),
    context: scoreContext(text, promptType),
    actionability: scoreActionability(text, promptType),
    outputDefinition: scoreOutputDefinition(text, promptType),
  };

  const overallScore = calculateOverallScore(dimensions, text);
  const penalties = collectPenalties(text, dimensions, parsed);

  const vagueInstruction =
    dimensions.clarity < 25 ||
    /^(do|make|it|this|that|fix|help)\s*(it|this|that)?$/i.test(text) ||
    (/\bfix (it|this|the bug)\b/i.test(text) && wordCount(text) < 8);

  const outputFormatMissing =
    (promptType === "code_generation" ||
      promptType === "technical" ||
      promptType === "documentation") &&
    dimensions.outputDefinition < 40;

  return {
    overallScore,
    promptType,
    dimensions,
    breakdown: dimensionsToLegacyBreakdown(dimensions),
    penalties,
    signals: {
      hasRole,
      hasGoal,
      requirementCount,
      constraintCount,
      hasOutputFormat,
      hasExamples,
      hasHeadings,
    },
    vagueInstruction,
    outputFormatMissing,
  };
}

export const DIMENSION_LABELS: Record<keyof DimensionScores, string> = {
  clarity: "Clarity",
  specificity: "Specificity",
  completeness: "Completeness",
  context: "Context",
  actionability: "Actionability",
  outputDefinition: "Output Definition",
};

export { getWordCountBaseline, calculateOverallScore };
