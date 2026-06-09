import { z } from "zod";

export const QualityAnalyzerIdSchema = z.enum(["local", "auto", "openai", "ollama"]);
export type QualityAnalyzerId = z.infer<typeof QualityAnalyzerIdSchema>;

export type QualityAnalyzerProviderInfo = {
  id: QualityAnalyzerId;
  label: string;
  description: string;
  available: boolean;
};

export const DimensionScoresSchema = z.object({
  clarity: z.number().int().min(0).max(100),
  specificity: z.number().int().min(0).max(100),
  completeness: z.number().int().min(0).max(100),
  context: z.number().int().min(0).max(100),
  actionability: z.number().int().min(0).max(100),
  outputDefinition: z.number().int().min(0).max(100),
});

export const AnalyzerResultSchema = z.object({
  score: z.number().int().min(0).max(100),
  overallScore: z.number().int().min(0).max(100).optional(),
  promptType: z.string().optional(),
  promptTypeLabel: z.string().optional(),
  detectedIntent: z.string().optional(),
  dimensions: DimensionScoresSchema.optional(),
  review: z
    .object({
      reviewSummary: z.string(),
      strengths: z.array(z.string()),
      highImpactImprovements: z.array(z.string()).optional(),
      optionalEnhancements: z.array(z.string()).optional(),
      weaknesses: z.array(z.string()),
      promptMaturityLevel: z.enum(["Beginner", "Developing", "Intermediate", "Advanced", "Expert"]),
      whyThisScore: z.string(),
      dimensionBreakdown: z
        .array(
          z.object({
            key: z.string(),
            label: z.string(),
            score: z.number().int().min(0).max(100),
            maxPoints: z.number().int().min(0).max(100),
            earnedPoints: z.number().int().min(0).max(100),
          }),
        )
        .optional(),
      aiEnhancementNote: z.string().optional(),
    })
    .optional(),
  strengths: z.array(z.string().min(1)).max(20).optional(),
  weaknesses: z.array(z.string().min(1)).max(20).optional(),
  issues: z.array(z.string().min(1)).max(20),
  suggestions: z.array(z.string().min(1)).max(20),
  improvedPrompt: z.string().min(1).max(30_000),
  breakdown: z
    .object({
      clarity: z.number().int().min(0).max(100),
      structure: z.number().int().min(0).max(100),
      specificity: z.number().int().min(0).max(100),
      outputDefinition: z.number().int().min(0).max(100),
      accuracy: z.number().int().min(0).max(100),
    })
    .optional(),
  missingParts: z
    .object({
      roleMissing: z.boolean(),
      vagueInstruction: z.boolean(),
      outputFormatMissing: z.boolean(),
    })
    .optional(),
});

export type QualityAnalyzerResult = z.infer<typeof AnalyzerResultSchema> & {
  source: "ai" | "rules";
  analyzerProvider: QualityAnalyzerId;
  providerLabel: string;
  /** Set when an AI provider was requested but local fallback was used. */
  fallbackFrom?: QualityAnalyzerId;
};
