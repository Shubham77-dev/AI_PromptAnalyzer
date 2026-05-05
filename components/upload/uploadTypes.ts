export type AnalysisBreakdown = {
  clarity: number;
  structure: number;
  specificity: number;
  outputDefinition: number;
  accuracy: number;
};

export type AnalysisModerationMeta = {
  pipelineStatus: "approved" | "pending" | "rejected";
  canAutoPublish: boolean;
  autoPublishThresholdExclusive: number;
};

export type AnalysisPayload = {
  score: number;
  issues: string[];
  suggestions: string[];
  improvedPrompt: string;
  source?: "ai" | "rules" | "merged" | "hybrid+heuristics";
  breakdown?: AnalysisBreakdown;
  missingParts?: {
    roleMissing: boolean;
    vagueInstruction: boolean;
    outputFormatMissing: boolean;
  };
  moderation?: AnalysisModerationMeta;
  debug?: Record<string, unknown>;
};

export type RecentPromptRow = {
  id: string;
  content: string;
  createdAt: string;
  score: number | null;
};
