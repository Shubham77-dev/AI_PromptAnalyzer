import { buildStructuredSuggestions } from "./suggestions";
import type { ParsedPrompt } from "./parser";
import { detectPromptPresence } from "./promptPresence";
import { promptTypeLabel, type PromptType } from "./promptType";
import { DIMENSION_LABELS, type DimensionScores } from "./scoring";
import type { ScoreResult } from "./scoring";

export type DimensionBreakdownRow = {
  key: keyof DimensionScores;
  label: string;
  score: number;
  maxPoints: number;
  earnedPoints: number;
};

export type PromptReview = {
  reviewSummary: string;
  strengths: string[];
  highImpactImprovements: string[];
  optionalEnhancements: string[];
  weaknesses: string[];
  promptMaturityLevel: "Beginner" | "Developing" | "Intermediate" | "Advanced" | "Expert";
  whyThisScore: string;
  dimensionBreakdown: DimensionBreakdownRow[];
  aiEnhancementNote?: string;
};

type DimKey = keyof DimensionScores;

const DIMENSION_WEIGHT_POINTS: Record<DimKey, number> = {
  clarity: 20,
  specificity: 20,
  completeness: 20,
  context: 15,
  actionability: 15,
  outputDefinition: 10,
};

const STRENGTH_PHRASES: Record<DimKey, string> = {
  clarity: "Clear objective and focused goal",
  specificity: "Concrete technical or domain details",
  completeness: "Requirements and success criteria present",
  context: "Useful background and environment context",
  actionability: "Actionable scope without vague references",
  outputDefinition: "Output format is well-defined",
};

const WEAKNESS_PHRASES: Record<DimKey, string> = {
  clarity: "Goal is ambiguous or unfocused",
  specificity: "Lacks concrete technical specifics",
  completeness: "Missing requirements or success criteria",
  context: "No audience, environment, or codebase context",
  actionability: "Unclear references or scope too broad",
  outputDefinition: "No output format defined",
};

const PRESENCE_LABELS: Record<
  keyof import("./promptPresence").PromptPresence,
  string
> = {
  hasRole: "a defined role",
  hasRequirements: "clear requirements",
  hasConstraints: "scope constraints",
  hasOutputFormat: "a specified output format",
  hasExamples: "concrete examples",
};

const PRESENCE_STRENGTHS: Array<{ key: keyof import("./promptPresence").PromptPresence; phrase: string }> = [
  { key: "hasRole", phrase: "Role or persona is defined" },
  { key: "hasRequirements", phrase: "Functional requirements are listed" },
  { key: "hasConstraints", phrase: "Scope constraints are specified" },
  { key: "hasOutputFormat", phrase: "Expected output format is clear" },
  { key: "hasExamples", phrase: "Examples anchor expected results" },
];

function maturityLevel(overallScore: number): PromptReview["promptMaturityLevel"] {
  if (overallScore <= 20) return "Beginner";
  if (overallScore <= 45) return "Developing";
  if (overallScore <= 65) return "Intermediate";
  if (overallScore <= 80) return "Advanced";
  return "Expert";
}

function buildDimensionBreakdown(dimensions: DimensionScores): DimensionBreakdownRow[] {
  return (Object.keys(DIMENSION_WEIGHT_POINTS) as DimKey[]).map((key) => {
    const maxPoints = DIMENSION_WEIGHT_POINTS[key];
    const score = dimensions[key];
    const earnedPoints = Math.round((score / 100) * maxPoints);
    return {
      key,
      label: DIMENSION_LABELS[key],
      score,
      maxPoints,
      earnedPoints,
    };
  });
}

function generateWhyThisScore(overallScore: number, dimensions: DimensionScores): string {
  const sorted = (Object.entries(dimensions) as Array<[DimKey, number]>).sort((a, b) => b[1] - a[1]);
  const highest = sorted[0]!;
  const lowest = sorted[sorted.length - 1]!;
  const highLabel = DIMENSION_LABELS[highest[0]];
  const lowLabel = DIMENSION_LABELS[lowest[0]];
  const highScore = highest[1];
  const lowScore = lowest[1];

  if (overallScore < 20) {
    return `Scored ${overallScore} because the prompt is too short to evaluate meaningfully. ${lowLabel} scored ${lowScore}/100 — there is not enough information to assess most dimensions.`;
  }

  if (overallScore < 45) {
    return `Scored ${overallScore} because while ${highLabel} shows promise at ${highScore}/100, ${lowLabel} scored only ${lowScore}/100. Add more specifics before this can be acted on reliably.`;
  }

  if (overallScore < 65) {
    return `Scored ${overallScore} because ${highLabel} is reasonably strong at ${highScore}/100, but ${lowLabel} scored only ${lowScore}/100. Addressing the high-impact items below would push this into the Advanced range.`;
  }

  if (overallScore < 82) {
    return `Scored ${overallScore} because ${highLabel} is solid at ${highScore}/100. The main gap is ${lowLabel} at ${lowScore}/100 — tightening that would make this near-expert level.`;
  }

  return `Scored ${overallScore} because all dimensions are strong. ${highLabel} leads at ${highScore}/100. Minor optional refinements could push this to perfect.`;
}

function describePresentElements(presence: ReturnType<typeof detectPromptPresence>): string {
  const parts = (Object.keys(PRESENCE_LABELS) as Array<keyof typeof PRESENCE_LABELS>)
    .filter((key) => presence[key])
    .map((key) => PRESENCE_LABELS[key]);
  if (parts.length === 0) return "a clear direction";
  if (parts.length === 1) return parts[0]!;
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts.at(-1)}`;
}

function buildReviewSummary(
  dimensions: DimensionScores,
  promptType: PromptType,
  overallScore: number,
  presence: ReturnType<typeof detectPromptPresence>,
  hasHighImpact: boolean,
  hasOptional: boolean,
): string {
  const entries = (Object.entries(dimensions) as Array<[DimKey, number]>).sort((a, b) => a[1] - b[1]);
  const low = entries[0]!;
  const high = entries[entries.length - 1]!;
  const lowLabel = DIMENSION_LABELS[low[0]].toLowerCase();
  const typeLabel = promptTypeLabel(promptType).toLowerCase();
  const presentDesc = describePresentElements(presence);

  if (overallScore < 25) {
    return `This ${typeLabel} prompt is too brief to act on reliably. Expand the goal, add concrete details, and define what a successful output looks like.`;
  }

  if (overallScore >= 75 && !hasHighImpact) {
    if (!hasOptional) {
      return `This is a strong ${typeLabel} prompt with ${presentDesc}. No critical gaps were found — it is ready to use as-is.`;
    }
    return `This is a well-structured ${typeLabel} prompt with ${presentDesc}. Only minor optional refinements are suggested below.`;
  }

  if (dimensions[high[0]] >= 60 && dimensions[low[0]] < 50) {
    return `The prompt clearly communicates the ${typeLabel} task but lacks ${lowLabel}, which may lead to inconsistent or incomplete responses across different AI tools.`;
  }

  if (overallScore >= 70) {
    return `This is a well-structured ${typeLabel} prompt with ${presentDesc}. Optional refinements below can make outputs even more predictable.`;
  }

  return `The prompt establishes a ${typeLabel} direction with workable ${DIMENSION_LABELS[high[0]].toLowerCase()}, but ${lowLabel} needs attention before results will be consistently reliable.`;
}

export function generateReview(
  prompt: string,
  dimensions: DimensionScores,
  promptType: PromptType,
  overallScore: number,
  scored: ScoreResult,
  parsed: ParsedPrompt,
): PromptReview {
  const presence = detectPromptPresence(prompt, parsed);
  const structured = buildStructuredSuggestions(prompt, parsed, scored);

  const dimensionStrengths = (Object.entries(dimensions) as Array<[DimKey, number]>)
    .filter(([, v]) => v > 70)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([k]) => STRENGTH_PHRASES[k]);

  const presenceStrengths = PRESENCE_STRENGTHS.filter(({ key }) => presence[key]).map(({ phrase }) => phrase);

  const strengths = uniqPreserve([...presenceStrengths, ...dimensionStrengths]).slice(0, 5);

  const weaknesses = (Object.entries(dimensions) as Array<[DimKey, number]>)
    .filter(([, v]) => v < 50)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 4)
    .map(([k]) => WEAKNESS_PHRASES[k]);

  return {
    reviewSummary: buildReviewSummary(
      dimensions,
      promptType,
      overallScore,
      presence,
      structured.highImpactImprovements.length > 0,
      structured.optionalEnhancements.length > 0,
    ),
    strengths: strengths.length > 0 ? strengths : ["Identifiable goal or task"],
    highImpactImprovements: structured.highImpactImprovements,
    optionalEnhancements: structured.optionalEnhancements,
    weaknesses,
    promptMaturityLevel: maturityLevel(overallScore),
    whyThisScore: generateWhyThisScore(overallScore, dimensions),
    dimensionBreakdown: buildDimensionBreakdown(dimensions),
  };
}

function uniqPreserve(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
