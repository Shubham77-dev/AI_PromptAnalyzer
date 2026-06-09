import { extractExistingRole } from "./improvementRequirements";
import { GOOD_ROLE_PATTERNS, GOOD_SECTION_PATTERNS } from "./patterns";
import type { ParsedPrompt } from "./parser";
import { parsePrompt } from "./parser";
import type { PromptType } from "./promptType";

export type PromptPresence = {
  hasRole: boolean;
  hasOutputFormat: boolean;
  hasConstraints: boolean;
  hasRequirements: boolean;
  hasExamples: boolean;
};

export type ContentSignals = {
  hasTypeScript: boolean;
  hasPropValidation: boolean;
  hasResponsive: boolean;
  hasTesting: boolean;
  hasEmptyState: boolean;
  hasSpecificRole: boolean;
  hasAccessibility: boolean;
};

function hasSectionWithBullets(content: string, sectionPattern: RegExp): boolean {
  if (!sectionPattern.test(content)) return false;
  const afterHeading = content.split(/\n\s*(?:#{1,6}\s+)?[^\n]*:/i).slice(1);
  if (afterHeading.some((block) => /^\s*[-*•]\s+/m.test(block))) return true;
  return /\n\s*[-*•]\s+/m.test(content);
}

function hasMarkdownSection(content: string, pattern: RegExp): boolean {
  return new RegExp(`^#{1,6}\\s+[^\\n]*${pattern.source}`, "im").test(content);
}

/**
 * Detects concrete technical elements already stated in the prompt text.
 */
export function detectContentSignals(content: string, parsed: ParsedPrompt): ContentSignals {
  const lower = content.toLowerCase();
  const roleText = [parsed.role, extractExistingRole(parsed, content)].filter(Boolean).join(" ");

  return {
    hasTypeScript: /\btypescript\b|\.tsx\b|\binterface\s+\w+|\btype\s+\w+\s*=/.test(content),
    hasPropValidation:
      /\bproptypes?\b|\bprop validation\b|\binterface\s+\w*props\b/i.test(content) ||
      /\btypescript\b/i.test(content),
    hasResponsive:
      /\bresponsive\b|\bmobile-first\b|\bbreakpoint\b|\btailwind\b|\bviewport\b/i.test(lower),
    hasTesting:
      /\b(unit test|unit tests|testing strategy|test coverage|jest|vitest|react testing library)\b/i.test(
        lower,
      ) || /\.(test|spec)\.(jsx?|tsx?)\b/i.test(lower),
    hasEmptyState:
      /\bempty state\b|\bempty dataset\b|\bno data\b|\bempty [\w\s]{0,24}lists?\b|\bwhen (the )?(list|data|table) is empty\b/i.test(
        lower,
      ),
    hasSpecificRole:
      /\b(senior|lead|principal|staff|expert)\b/i.test(roleText) ||
      /\bact as (a |an )?[\w\s/-]{8,}/i.test(content) ||
      /\byou are (a |an )?[\w\s/-]{8,}/i.test(content),
    hasAccessibility: /\b(accessibility|aria|keyboard navigation|screen reader|wcag)\b/i.test(lower),
  };
}
/**
 * Detects which prompt elements are already present in parsed structure or raw text.
 * Used to suppress false-positive review suggestions.
 */
export function detectPromptPresence(content: string, parsed: ParsedPrompt): PromptPresence {
  const hasRole =
    Boolean(parsed.role?.trim()) ||
    Boolean(extractExistingRole(parsed, content)) ||
    GOOD_ROLE_PATTERNS.some((p) => p.test(content));

  const hasRequirements =
    parsed.requirements.length > 0 ||
    hasSectionWithBullets(content, GOOD_SECTION_PATTERNS.requirements) ||
    hasMarkdownSection(content, /\b(requirements?|deliverables?)\b/i);

  const hasConstraints =
    parsed.constraints.length > 0 ||
    hasSectionWithBullets(content, GOOD_SECTION_PATTERNS.constraints) ||
    hasMarkdownSection(content, /\b(constraints?|rules)\b/i);

  const hasOutputFormat =
    Boolean(parsed.outputFormat?.trim()) ||
    hasSectionWithBullets(content, /\b(output format|response format)\b/i) ||
    hasMarkdownSection(content, /\b(output format|response format)\b/i) ||
    (/\boutput format\b/i.test(content) && /\b(component|typescript|markdown|json|code|file|tailwind)\b/i.test(content));

  const hasExamples =
    parsed.examples.length > 0 ||
    (GOOD_SECTION_PATTERNS.examples.test(content) && /\bexample\s*:/i.test(content)) ||
    hasMarkdownSection(content, /\bexamples?\b/i);

  return { hasRole, hasOutputFormat, hasConstraints, hasRequirements, hasExamples };
}

const SUGGESTION_TOPIC_PATTERNS = {
  role: /\b(role|persona)\b/i,
  outputFormat:
    /\b(output format|deliverable format|expected output|format of the answer|wireframe notes|state (whether|expected output))\b/i,
  constraints: /\b(constraints?|bound the scope|things to avoid|length, tone)\b/i,
  requirements: /\b(requirements?|functional requirements?|missing.*requirement)\b/i,
  examples: /\b(example|input\/output|request\/response)\b/i,
  monitoring: /\b(monitoring|logging|observability|health check)\b/i,
  genericRole: /\b(generic role|role.*generic|more specific.*expertise|expertise level)\b/i,
  propValidation: /\b(prop validation|proptypes?|prop types|typescript interfaces?)\b/i,
  emptyData: /\b(empty data|empty dataset|empty state|handling of empty|no data)\b/i,
  responsive: /\b(responsive design|mobile-first|breakpoints?|viewport)\b/i,
  testing: /\b(unit test|testing strategy|test coverage|jest|react testing library|vitest)\b/i,
  accessibility: /\b(accessibility|aria labels?|keyboard navigation|screen reader|wcag)\b/i,
} as const;

function stripUrlPaths(text: string): string {
  return text.replace(/\/[\w./-]+/g, " ");
}

function hasBackendSignals(content: string): boolean {
  const lower = stripUrlPaths(content.toLowerCase());
  return /\b(backend|server|microservice|deploy|production|scale|infrastructure|rest api|graphql)\b/i.test(
    lower,
  );
}

/** Frontend/UI prompts should not get backend observability suggestions by default. */
export function isMonitoringRelevant(promptType: PromptType, content: string): boolean {
  const lower = content.toLowerCase();
  const isFrontend =
    promptType === "ui_ux" ||
    promptType === "code_generation" ||
    /\b(login page|component|react|frontend|ui|tailwind|vue|angular)\b/i.test(lower);

  if (isFrontend && !hasBackendSignals(content)) {
    return false;
  }

  if (promptType === "creative" || promptType === "simple" || promptType === "documentation") {
    return false;
  }

  return promptType === "technical" && hasBackendSignals(content);
}

/**
 * Returns false when a suggestion asks for an element the prompt already has.
 */
export function shouldSuggest(
  suggestion: string,
  presence: PromptPresence,
  promptType: PromptType,
  content: string,
  overallScore?: number,
  signals?: ContentSignals,
): boolean {
  const text = suggestion.trim();
  if (!text) return false;

  const sig = signals ?? detectContentSignals(content, parsePrompt(content));

  if (SUGGESTION_TOPIC_PATTERNS.role.test(text) && presence.hasRole) return false;
  if (SUGGESTION_TOPIC_PATTERNS.genericRole.test(text) && presence.hasRole && sig.hasSpecificRole) return false;
  if (SUGGESTION_TOPIC_PATTERNS.outputFormat.test(text) && presence.hasOutputFormat) return false;
  if (SUGGESTION_TOPIC_PATTERNS.constraints.test(text) && presence.hasConstraints) return false;
  if (SUGGESTION_TOPIC_PATTERNS.requirements.test(text) && presence.hasRequirements) return false;
  if (SUGGESTION_TOPIC_PATTERNS.examples.test(text) && presence.hasExamples) return false;
  if (SUGGESTION_TOPIC_PATTERNS.propValidation.test(text) && sig.hasPropValidation) return false;
  if (SUGGESTION_TOPIC_PATTERNS.emptyData.test(text) && sig.hasEmptyState) return false;
  if (SUGGESTION_TOPIC_PATTERNS.responsive.test(text) && sig.hasResponsive) return false;
  if (SUGGESTION_TOPIC_PATTERNS.testing.test(text) && sig.hasTesting) return false;
  if (SUGGESTION_TOPIC_PATTERNS.accessibility.test(text) && sig.hasAccessibility) return false;
  if (SUGGESTION_TOPIC_PATTERNS.monitoring.test(text) && !isMonitoringRelevant(promptType, content)) {
    return false;
  }

  return true;
}

export function filterFeedbackItems(
  items: string[],
  presence: PromptPresence,
  promptType: PromptType,
  content: string,
  overallScore?: number,
  signals?: ContentSignals,
): string[] {
  const sig = signals ?? detectContentSignals(content, parsePrompt(content));
  return items.filter((item) => shouldSuggest(item, presence, promptType, content, overallScore, sig));
}

export function isWellStructured(presence: PromptPresence, overallScore: number): boolean {
  return (
    overallScore >= 75 &&
    presence.hasRole &&
    presence.hasRequirements &&
    presence.hasOutputFormat
  );
}

export function filterSuggestions(
  suggestions: string[],
  presence: PromptPresence,
  promptType: PromptType,
  content: string,
  overallScore?: number,
  signals?: ContentSignals,
): string[] {
  return suggestions.filter((s) => {
    if (overallScore !== undefined && isWellStructured(presence, overallScore)) {
      if (SUGGESTION_TOPIC_PATTERNS.examples.test(s)) return false;
    }
    return shouldSuggest(s, presence, promptType, content, overallScore, signals);
  });
}
