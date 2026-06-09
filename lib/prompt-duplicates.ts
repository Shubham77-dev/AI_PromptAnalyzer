const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "to",
  "for",
  "with",
  "and",
  "or",
  "in",
  "of",
  "on",
  "at",
  "by",
  "as",
  "be",
  "this",
  "that",
  "it",
  "you",
  "your",
]);

export type PublishedPromptForDuplicateCheck = {
  id: string;
  content: string;
  publishedBy: string;
  publishedAt: Date | string;
};

export type SimilarPromptMatch = {
  id: string;
  text: string;
  similarityScore: number;
  publishedBy: string;
  publishedAt: string;
  libraryUrl: string;
};

export type DuplicateCheckResult = {
  isDuplicate: boolean;
  riskLevel: "high" | "medium" | "none";
  similarPrompts: SimilarPromptMatch[];
};

export function normalizePromptText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getSimilarityScore(text1: string, text2: string): number {
  const words1 = normalizePromptText(text1).split(" ").filter(Boolean);
  const words2 = normalizePromptText(text2).split(" ").filter(Boolean);
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  if (set1.size === 0 && set2.size === 0) return 1;
  if (set1.size === 0 || set2.size === 0) return 0;

  const intersection = new Set([...set1].filter((w) => set2.has(w)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

function meaningfulWords(text: string): string[] {
  return normalizePromptText(text)
    .split(" ")
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

export function hasCoreIntentMatch(text1: string, text2: string): boolean {
  const words1 = meaningfulWords(text1).slice(0, 10);
  const words2 = meaningfulWords(text2).slice(0, 10);
  if (words1.length === 0 || words2.length === 0) return false;
  const set2 = new Set(words2);
  const matches = words1.filter((w) => set2.has(w)).length;
  return matches >= 7;
}

function riskFromScore(score: number, exact: boolean, coreIntent: boolean): "high" | "medium" | "none" {
  if (exact || score >= 0.85 || coreIntent) return "high";
  if (score >= 0.7) return "medium";
  return "none";
}

function truncate(text: string, max = 100): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function usernameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local.replace(/[._-]+/g, " ").trim() || email;
}

export function checkForDuplicates(
  promptText: string,
  existingPrompts: PublishedPromptForDuplicateCheck[],
  options?: { excludePromptId?: string; maxResults?: number },
): DuplicateCheckResult {
  const excludeId = options?.excludePromptId;
  const maxResults = options?.maxResults ?? 5;
  const normalizedInput = normalizePromptText(promptText);

  const matches: SimilarPromptMatch[] = [];

  for (const p of existingPrompts) {
    if (excludeId && p.id === excludeId) continue;

    const exact = normalizedInput === normalizePromptText(p.content);
    const similarityScore = exact ? 1 : getSimilarityScore(promptText, p.content);
    const coreIntent = !exact && hasCoreIntentMatch(promptText, p.content);
    const risk = riskFromScore(similarityScore, exact, coreIntent);

    if (risk === "none") continue;

    const publishedAt =
      typeof p.publishedAt === "string" ? p.publishedAt : p.publishedAt.toISOString();

    matches.push({
      id: p.id,
      text: truncate(p.content, 100),
      similarityScore: Math.round(similarityScore * 100) / 100,
      publishedBy: usernameFromEmail(p.publishedBy),
      publishedAt,
      libraryUrl: `/library?id=${encodeURIComponent(p.id)}`,
    });
  }

  matches.sort((a, b) => b.similarityScore - a.similarityScore);
  const top = matches.slice(0, maxResults);

  let topRisk: "high" | "medium" | "none" = "none";
  if (top.length > 0) {
    const best = top[0];
    const existing = existingPrompts.find((p) => p.id === best.id);
    const exact = existing ? normalizedInput === normalizePromptText(existing.content) : false;
    const coreIntent = existing ? hasCoreIntentMatch(promptText, existing.content) : false;
    topRisk = riskFromScore(best.similarityScore, exact, coreIntent);
  }

  return {
    isDuplicate: top.length > 0,
    riskLevel: topRisk,
    similarPrompts: top,
  };
}
