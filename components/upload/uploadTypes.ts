export type AnalysisBreakdown = {
  clarity: number;
  structure: number;
  specificity: number;
  outputDefinition: number;
  accuracy: number;
};

export type AnalysisPayload = {
  score: number;
  issues: string[];
  suggestions: string[];
  improvedPrompt: string;
  source?: "ai" | "rules" | "merged";
  breakdown?: AnalysisBreakdown;
};

export type RecentPromptRow = {
  id: string;
  content: string;
  createdAt: string;
  score: number | null;
};
