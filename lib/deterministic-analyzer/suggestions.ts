import type { ParsedPrompt } from "./parser";
import {
  detectPromptPresence,
  filterSuggestions,
  type PromptPresence,
} from "./promptPresence";
import type { PromptType } from "./promptType";
import { DIMENSION_LABELS, type DimensionScores, type ScoreResult } from "./scoring";

export type StructuredSuggestions = {
  highImpactImprovements: string[];
  optionalEnhancements: string[];
};

type DimKey = keyof DimensionScores;

const TYPE_HIGH_IMPACT: Record<PromptType, Partial<Record<DimKey, string[]>>> = {
  code_generation: {
    specificity: [
      "Specify the framework — e.g. React with TypeScript or Vue 3.",
      "Define authentication requirements (JWT, OAuth, session-based).",
    ],
    outputDefinition: [
      "State expected output: full component, function only, or with tests.",
      "Mention error handling expectations.",
    ],
    actionability: ["Bound the scope — one feature or module, not the entire application."],
    completeness: ["List functional requirements as numbered steps or bullet points."],
  },
  ui_ux: {
    specificity: [
      "Name the component library — Tailwind, MUI, or shadcn/ui.",
      "Describe responsive behavior (mobile-first, breakpoints).",
    ],
    completeness: [
      "Specify user interactions (click, hover, form submit).",
      "Define the visual hierarchy expected.",
    ],
    outputDefinition: ["State whether you want wireframe notes, CSS, or a React component."],
  },
  debugging: {
    clarity: ["Include the exact error message or stack trace."],
    context: ["Mention the runtime/environment (Node 18, Chrome, iOS)."],
    actionability: [
      "Describe what was tried already.",
      "State expected vs actual behavior.",
    ],
    completeness: ["List numbered steps to reproduce the issue."],
  },
  technical: {
    specificity: [
      "Define scale requirements (100 users vs 1M users).",
      "Mention existing infrastructure constraints.",
    ],
    context: ["Specify latency or performance requirements."],
    outputDefinition: ["Define the deliverable format — diagram, config, or implementation plan."],
  },
  documentation: {
    context: ["Define the target audience (junior dev, end user, API consumer)."],
    outputDefinition: ["Specify the format (Markdown, JSDoc, OpenAPI)."],
    completeness: ["State the depth needed — overview vs full specification."],
    specificity: ["Name the system or module being documented."],
  },
  creative: {
    outputDefinition: ["Define tone (professional, casual, humorous)."],
    context: ["Specify target audience and reading level."],
    completeness: ["Mention length constraints (tweet, paragraph, page)."],
  },
  simple: {
    clarity: ["State one clear goal in a single sentence."],
    context: ["Add context about your environment or use case."],
    outputDefinition: ["Clarify the expected format of the answer."],
  },
};

const TYPE_OPTIONAL: Record<PromptType, string[]> = {
  code_generation: [
    "Add a role/persona if you want a specific engineering perspective.",
    "Include a small example input/output to anchor expectations.",
    "Define edge-case handling (empty state, network failure, validation errors).",
  ],
  ui_ux: [
    "Add a role/persona (e.g. senior frontend engineer).",
    "Include a reference layout or wireframe description.",
    "Specify accessibility requirements (ARIA, keyboard navigation).",
  ],
  debugging: [
    "Add relevant code snippets around the failure point.",
    "Note recent changes that might have introduced the bug.",
    "List environment variables or config that affect behavior.",
  ],
  technical: [
    "Add a role/persona for the intended implementer.",
    "Include example request/response payloads.",
    "Define monitoring or logging expectations.",
  ],
  documentation: [
    "Add a role/persona for the writer (e.g. technical writer).",
    "Include a table of contents or section outline.",
    "Specify terminology glossary if the domain is specialized.",
  ],
  creative: [
    "Add a role/persona (e.g. copywriter, novelist).",
    "Include a reference example of the desired style.",
    "Define what to avoid (clichés, topics, tone).",
  ],
  simple: [
    "Add a role/persona if a specific voice would help.",
    "Include an example of the kind of answer you want.",
    "Mention constraints — length, tone, or things to avoid.",
  ],
};

const DIMENSION_HIGH_IMPACT: Record<DimKey, string> = {
  clarity: "Clarify the primary goal with a single action verb and concrete deliverable",
  specificity: "Specify framework, library, or technology stack",
  completeness: "Add requirements, constraints, or success criteria",
  context: "Add environment, audience, or existing-system context",
  actionability: "Narrow scope so the task can be executed without follow-up questions",
  outputDefinition: "Define expected output format (component, JSON, doc, file)",
};

function uniqCap(items: string[], max: number) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const s = raw.trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

function lowestDimensions(dimensions: DimensionScores, count: number): DimKey[] {
  return (Object.entries(dimensions) as Array<[DimKey, number]>)
    .sort((a, b) => a[1] - b[1])
    .slice(0, count)
    .map(([k]) => k);
}

function dimensionSuggestionAllowed(
  dim: DimKey,
  presence: PromptPresence,
): boolean {
  if (dim === "outputDefinition" && presence.hasOutputFormat) return false;
  if (dim === "completeness" && presence.hasRequirements && presence.hasConstraints) return false;
  return true;
}

function weakDimensionThreshold(overallScore: number): { high: number; optional: number } {
  if (overallScore >= 75) return { high: 45, optional: 60 };
  if (overallScore >= 55) return { high: 50, optional: 65 };
  return { high: 50, optional: 70 };
}

export function buildStructuredSuggestions(
  content: string,
  parsed: ParsedPrompt,
  score: ScoreResult,
): StructuredSuggestions {
  const { dimensions, promptType, overallScore } = score;
  const presence = detectPromptPresence(content, parsed);
  const thresholds = weakDimensionThreshold(overallScore);

  const highImpact: string[] = [];
  const optional: string[] = [];

  const weakDims = lowestDimensions(dimensions, 4);

  for (const dim of weakDims) {
    if (!dimensionSuggestionAllowed(dim, presence)) continue;

    const dimScore = dimensions[dim];
    if (dimScore < thresholds.high) {
      const typeSpecific = TYPE_HIGH_IMPACT[promptType]?.[dim] ?? [];
      if (typeSpecific.length > 0) {
        highImpact.push(...typeSpecific);
      } else {
        highImpact.push(DIMENSION_HIGH_IMPACT[dim]);
      }
    } else if (dimScore < thresholds.optional) {
      const typeSpecific = TYPE_HIGH_IMPACT[promptType]?.[dim] ?? [];
      optional.push(...typeSpecific.slice(0, 1));
    }
  }

  optional.push(...TYPE_OPTIONAL[promptType]);

  if (!presence.hasRole) {
    optional.push("Add a role/persona if a specific expert perspective would help.");
  }
  if (!presence.hasExamples && overallScore < 80) {
    optional.push("Include an example input/output to make the expected result unambiguous.");
  }
  if (content.trim().length > 3000) {
    highImpact.push("Add a short summary at the top — key requirements may be buried in a long prompt.");
  }

  return {
    highImpactImprovements: filterSuggestions(
      uniqCap(highImpact, 5),
      presence,
      promptType,
      content,
      overallScore,
    ),
    optionalEnhancements: filterSuggestions(
      uniqCap(optional, 4),
      presence,
      promptType,
      content,
      overallScore,
    ),
  };
}

/** @deprecated Use buildStructuredSuggestions — kept for legacy issue arrays */
export function buildSuggestions(
  content: string,
  parsed: ParsedPrompt,
  score: ScoreResult,
): { issues: string[]; suggestions: string[] } {
  const structured = buildStructuredSuggestions(content, parsed, score);
  return {
    issues: [],
    suggestions: [...structured.highImpactImprovements, ...structured.optionalEnhancements],
  };
}
