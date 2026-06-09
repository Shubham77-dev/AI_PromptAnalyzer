export type AnalysisDimensions = {
  clarity: number;
  specificity: number;
  completeness: number;
  context: number;
  actionability: number;
  outputDefinition: number;
};

export type AnalysisBreakdown = {
  clarity: number;
  structure: number;
  specificity: number;
  outputDefinition: number;
  accuracy: number;
};

export type AnalysisReview = {
  reviewSummary: string;
  strengths: string[];
  highImpactImprovements?: string[];
  optionalEnhancements?: string[];
  weaknesses: string[];
  promptMaturityLevel: "Beginner" | "Developing" | "Intermediate" | "Advanced" | "Expert";
  whyThisScore: string;
  dimensionBreakdown?: Array<{
    key: string;
    label: string;
    score: number;
    maxPoints: number;
    earnedPoints: number;
  }>;
  aiEnhancementNote?: string;
};

export type AnalysisModerationMeta = {
  pipelineStatus: "approved" | "pending" | "rejected";
  canAutoPublish: boolean;
  autoPublishThresholdExclusive: number;
  /** Separate moderation pipeline score used on save — not the analyzer display score. */
  pipelineScore?: number;
  /** Provider used for publish moderation scoring. */
  moderationProvider?: "openai" | "ollama" | "local";
  moderationProviderLabel?: string;
  /** Cloud providers tried before the selected moderation provider. */
  moderationFallbacks?: Array<"openai" | "ollama" | "local">;
};

export type QualityAnalyzerId = "local" | "auto" | "openai" | "ollama";

export type QualityAnalyzerProviderOption = {
  id: QualityAnalyzerId;
  label: string;
  description: string;
  available: boolean;
};

export type AnalysisPayload = {
  score: number;
  /** Same as score — kept for backward compatibility with older clients. */
  overallScore?: number;
  aiStatus?: "ok" | "error" | "skipped";
  promptType?: string;
  detectedIntent?: string;
  dimensions?: AnalysisDimensions;
  review?: AnalysisReview;
  issues: string[];
  suggestions: string[];
  improvedPrompt: string;
  /** Moderation pipeline source on save. */
  source?: "ai" | "rules" | "merged" | "hybrid+heuristics" | "rule" | "rule+ai";
  /** Upload preview quality analysis source. */
  qualitySource?: "ai" | "rules";
  analyzerProvider?: QualityAnalyzerId;
  providerLabel?: string;
  breakdown?: AnalysisBreakdown;
  missingParts?: {
    roleMissing: boolean;
    vagueInstruction: boolean;
    outputFormatMissing: boolean;
  };
  fallbackFrom?: QualityAnalyzerId;
  moderation?: AnalysisModerationMeta;
  debug?: Record<string, unknown>;
};

export type RecentPromptRow = {
  id: string;
  content: string;
  createdAt: string;
  score: number | null;
};
