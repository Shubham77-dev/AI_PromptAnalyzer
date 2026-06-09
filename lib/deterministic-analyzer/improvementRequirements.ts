import type { ParsedPrompt } from "./parser";
import type { PromptType } from "./promptType";
import type { DimensionScores, ScoreResult } from "./scoring";
import type { StructuredSuggestions } from "./suggestions";

export type ImprovementCategory =
  | "role"
  | "outputFormat"
  | "constraints"
  | "examples"
  | "monitoring"
  | "context"
  | "requirements";

/** Sections that may be auto-injected into the improved prompt */
export type ImprovementRequirements = {
  role: boolean;
  outputFormat: boolean;
  constraints: boolean;
  examples: boolean;
  monitoring: boolean;
  context: boolean;
  requirements: boolean;
};

/** Impact tier — LOW items stay in review suggestions only */
export type ImpactTier = "high" | "medium" | "low";

const HIGH_CATEGORIES: ImprovementCategory[] = ["role", "requirements", "outputFormat"];
const MEDIUM_CATEGORIES: ImprovementCategory[] = ["constraints", "examples", "context"];
const LOW_CATEGORIES: ImprovementCategory[] = ["monitoring"];

const TYPE_ALLOWED: Record<PromptType, ImprovementCategory[]> = {
  code_generation: ["role", "requirements", "constraints", "outputFormat"],
  ui_ux: ["role", "requirements", "constraints", "outputFormat"],
  technical: ["role", "requirements", "constraints", "outputFormat", "examples"],
  documentation: ["role", "outputFormat", "context", "requirements"],
  debugging: ["role", "requirements", "context"],
  creative: ["role", "constraints", "outputFormat"],
  simple: ["role", "outputFormat", "context"],
};

const CATEGORY_PATTERNS: Array<{ category: ImprovementCategory; patterns: RegExp[] }> = [
  { category: "role", patterns: [/role\s*\/\s*persona/i, /add a role/i, /persona/i] },
  {
    category: "outputFormat",
    patterns: [/output format/i, /define expected output/i, /deliverable format/i, /specify the format/i],
  },
  { category: "constraints", patterns: [/constraint/i, /must-haves/i, /things to avoid/i, /bound the scope/i] },
  { category: "examples", patterns: [/example/i, /input\/output/i, /request\/response/i] },
  { category: "monitoring", patterns: [/monitoring/i, /logging/i, /observability/i, /health check/i] },
  { category: "context", patterns: [/context about/i, /target audience/i, /environment/i] },
  { category: "requirements", patterns: [/requirements/i, /functional requirements/i, /success criteria/i] },
];

function classifySuggestion(text: string): ImprovementCategory[] {
  const found: ImprovementCategory[] = [];
  for (const { category, patterns } of CATEGORY_PATTERNS) {
    if (patterns.some((p) => p.test(text))) found.push(category);
  }
  return found;
}

function isAllowedForType(category: ImprovementCategory, promptType: PromptType): boolean {
  return TYPE_ALLOWED[promptType].includes(category);
}

function wordCount(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

/** Extracts only the persona clause, not the task on the same line. */
export function extractRoleClause(text: string): string | null {
  const t = text.trim();
  if (!/^(you are|act as)\b/i.test(t)) return null;

  const periodMatch = /^((?:you are|act as)[^.]+\.)/i.exec(t);
  if (periodMatch?.[1]) return periodMatch[1].trim();

  const commaMatch = /^((?:you are|act as)[^,]{3,100})/i.exec(t);
  if (commaMatch?.[1]) {
    const clause = commaMatch[1].trim().replace(/\.$/, "");
    return `${clause}.`;
  }

  if (t.length <= 80) return t.endsWith(".") ? t : `${t}.`;
  return null;
}

export function extractExistingRole(parsed: ParsedPrompt, originalPrompt: string): string | null {
  if (parsed.role?.trim()) {
    const r = parsed.role.trim();
    const clause = extractRoleClause(r);
    if (clause) return clause;
    return /^(you are|act as)/i.test(r) ? r : `You are ${r.replace(/^you are\s+/i, "")}.`;
  }
  const firstLine = originalPrompt.trim().split("\n")[0]?.trim() ?? "";
  const fromLine = extractRoleClause(firstLine);
  if (fromLine) return fromLine;

  const inline = extractRoleClause(originalPrompt.trim());
  if (inline) return inline;
  return null;
}

export function stripRolePrefix(text: string): string {
  return text
    .trim()
    .replace(/^(you are|act as)\s+[^.]+\.\s*/i, "")
    .replace(/^(you are|act as)\s+[^\n]+/i, "")
    .trim();
}

export function roleLineForType(promptType: PromptType, originalPrompt?: string): string {
  const lower = (originalPrompt ?? "").toLowerCase();
  const isFrontend =
    promptType === "ui_ux" ||
    promptType === "code_generation" ||
    /\b(react|vue|angular|tailwind|component|frontend|login page|ui)\b/i.test(lower);

  if (isFrontend) return "Act as a senior React frontend engineer.";
  switch (promptType) {
    case "technical":
      return "Act as a senior backend engineer.";
    case "documentation":
      return "You are a senior technical documentation writer.";
    case "debugging":
      return "Act as a senior software engineer specializing in debugging.";
    case "creative":
      return "You are an expert creative writer.";
    default:
      return "You are an expert assistant.";
  }
}

export function resolveRoleLine(
  needsRole: boolean,
  promptType: PromptType,
  parsed: ParsedPrompt,
  originalPrompt: string,
): string | null {
  const existing = extractExistingRole(parsed, originalPrompt);
  if (existing) return existing.endsWith(".") ? existing : `${existing}.`;
  if (!needsRole) return null;
  return roleLineForType(promptType, originalPrompt);
}

export function deriveImprovementRequirements(
  parsed: ParsedPrompt,
  scored: ScoreResult,
  suggestions: StructuredSuggestions,
  originalPrompt: string,
): ImprovementRequirements {
  const { dimensions, promptType } = scored;
  const words = wordCount(originalPrompt);
  const isShort = words <= 20;
  const alreadyHasRole = scored.signals.hasRole || Boolean(parsed.role?.trim()) || Boolean(extractExistingRole(parsed, originalPrompt));

  const sugFlags: Partial<Record<ImprovementCategory, boolean>> = {};
  for (const text of [...suggestions.highImpactImprovements, ...suggestions.optionalEnhancements]) {
    for (const cat of classifySuggestion(text)) sugFlags[cat] = true;
  }

  const isDetailed = words > 30 || dimensions.completeness >= 75;
  const lacksStructure = parsed.requirements.length === 0 && parsed.constraints.length === 0;

  const needsHigh = {
    role: !alreadyHasRole,
    requirements:
      parsed.requirements.length === 0 &&
      !isDetailed &&
      (isShort || (scored.signals.requirementCount < 1 && dimensions.completeness < 55)),
    outputFormat:
      !parsed.outputFormat?.trim() &&
      (isShort || scored.outputFormatMissing || dimensions.outputDefinition < 50),
  };

  const needsMedium = {
    constraints:
      !isDetailed &&
      lacksStructure &&
      scored.signals.constraintCount < 1 &&
      (dimensions.completeness < 60 || isShort),
    examples:
      !isShort &&
      !scored.signals.hasExamples &&
      dimensions.outputDefinition < 45 &&
      (promptType === "technical" || /\b(api|endpoint|rest|graphql)\b/i.test(originalPrompt)),
    context: !parsed.context?.trim() && dimensions.context < 40 && !isShort,
  };

  const apply = (cat: ImprovementCategory, want: boolean): boolean => {
    if (!want) return false;
    if (!isAllowedForType(cat, promptType)) return false;
    if (LOW_CATEGORIES.includes(cat)) return false;
    if (HIGH_CATEGORIES.includes(cat)) return true;
    if (MEDIUM_CATEGORIES.includes(cat)) {
      if (cat === "examples" && isShort) return false;
      if (cat === "context" && isShort) return false;
      if (cat === "constraints" && isShort && lacksStructure) return true;
      return dimensions[cat === "constraints" ? "completeness" : cat === "examples" ? "outputDefinition" : "context"] < 50;
    }
    return false;
  };

  const fromSuggestion = (cat: ImprovementCategory, want: boolean) =>
    want || (Boolean(sugFlags[cat]) && !isDetailed);

  return {
    role: apply("role", fromSuggestion("role", needsHigh.role)),
    requirements: apply("requirements", fromSuggestion("requirements", needsHigh.requirements)),
    outputFormat: apply("outputFormat", fromSuggestion("outputFormat", needsHigh.outputFormat)),
    constraints: apply("constraints", fromSuggestion("constraints", needsMedium.constraints)),
    examples: apply("examples", fromSuggestion("examples", needsMedium.examples)),
    context: apply("context", fromSuggestion("context", needsMedium.context)),
    monitoring: false,
  };
}

export function maxImprovedLength(originalPrompt: string): number {
  const len = originalPrompt.trim().length;
  const words = wordCount(originalPrompt);
  // Short prompts need structural room; long prompts stay near 2–3×
  if (words <= 12) return Math.min(650, Math.max(460, Math.round(len * 13)));
  if (words <= 20) return Math.min(720, Math.max(340, Math.round(len * 5)));
  if (words <= 25) return Math.min(720, Math.round(len * 4));
  if (words <= 45) return Math.min(1000, Math.round(len * 2.8));
  return Math.min(1400, Math.round(len * 2.2));
}

export function compactOutputFormatBullets(promptType: PromptType, originalPrompt: string): string[] {
  const lower = originalPrompt.toLowerCase();
  const isFrontend =
    promptType === "ui_ux" ||
    promptType === "code_generation" ||
    /\b(react|vue|angular|login page|component|tailwind|frontend)\b/i.test(lower);

  if (isFrontend) return ["React components with TypeScript and Tailwind CSS"];
  if (promptType === "documentation" || /\b(markdown|readme|wiki)\b/i.test(lower)) {
    return ["Markdown with headings and code blocks"];
  }
  if (promptType === "technical" || /\b(api|endpoint|rest)\b/i.test(lower)) {
    return ["Code implementation with endpoint definitions"];
  }
  if (/\bjson\b/i.test(lower)) return ["Valid JSON matching the described schema"];
  return ["Clear structured response matching the task"];
}

export function compactConstraintBullets(promptType: PromptType, originalPrompt = ""): string[] {
  const lower = originalPrompt.toLowerCase();
  const isFrontend =
    promptType === "ui_ux" ||
    promptType === "code_generation" ||
    /\b(react|vue|login page|frontend|component|tailwind)\b/i.test(lower);

  if (isFrontend) {
    if (/\blogin\b/i.test(lower)) {
      return ["Keep scope to the login feature; use React + TypeScript + Tailwind"];
    }
    return ["Keep scope to the described feature", "Use React + TypeScript unless specified otherwise"];
  }
  if (promptType === "technical") {
    return ["Validate inputs and handle errors explicitly", "Keep endpoints focused — no unrelated features"];
  }
  return ["Stay focused on the stated goal", "Avoid unnecessary complexity"];
}

export function compactRequirementBullets(promptType: PromptType, originalPrompt: string): string[] {
  const lower = originalPrompt.toLowerCase();
  const bullets: string[] = [];

  if (/\blogin\b/i.test(lower) && /\bjwt\b/i.test(lower)) {
    bullets.push(
      "Email/password form with validation and loading state on submit",
      "POST credentials to /api/auth/login; store JWT in localStorage",
      "Redirect to /dashboard on success; display errors for 401/500",
    );
    if (/\bprotected|route|dashboard\b/i.test(lower) || bullets.length < 4) {
      bullets.push("Protect routes with a wrapper that checks token expiry");
    }
    return bullets.slice(0, 4);
  }

  if (/\bapi\b/i.test(lower) || promptType === "technical") {
    bullets.push("Define endpoints with HTTP method, path, and response shape");
    bullets.push("Include validation and error responses");
    return bullets.slice(0, 3);
  }

  if (promptType === "debugging") {
    bullets.push("Include exact error message and steps to reproduce");
    bullets.push("State expected vs actual behavior");
    return bullets;
  }

  if (promptType === "documentation") {
    bullets.push("Cover purpose, usage, and one worked example");
    return bullets;
  }

  bullets.push("Break the task into concrete, verifiable steps");
  if (/\breact\b/i.test(lower)) bullets.push("Use React with TypeScript unless specified otherwise");
  return bullets.slice(0, 3);
}
