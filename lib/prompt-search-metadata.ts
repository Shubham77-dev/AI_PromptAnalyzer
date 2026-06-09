import type { AnalyzerResult } from "@/lib/ai";
import { TECH_KEYWORDS } from "@/lib/deterministic-analyzer/patterns";

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "to",
  "for",
  "with",
  "and",
  "or",
  "in",
  "on",
  "at",
  "by",
  "as",
  "of",
  "from",
  "that",
  "this",
  "these",
  "those",
  "it",
  "its",
  "you",
  "your",
  "we",
  "our",
  "they",
  "their",
  "will",
  "should",
  "must",
  "can",
  "could",
  "would",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "not",
  "all",
  "any",
  "each",
  "use",
  "using",
  "used",
  "make",
  "create",
  "build",
  "write",
  "help",
  "please",
  "want",
  "need",
  "like",
  "also",
  "only",
  "just",
  "when",
  "where",
  "what",
  "which",
  "who",
  "how",
  "why",
  "into",
  "about",
  "than",
  "then",
  "them",
  "there",
]);

const TECH_DISPLAY: Record<string, string> = {
  "next.js": "Next.js",
  react: "React",
  typescript: "TypeScript",
  javascript: "JavaScript",
  node: "Node.js",
  prisma: "Prisma",
  postgres: "PostgreSQL",
  sql: "SQL",
  rest: "REST",
  graphql: "GraphQL",
  docker: "Docker",
  kubernetes: "Kubernetes",
  aws: "AWS",
  gcp: "GCP",
  azure: "Azure",
  oauth: "OAuth",
  jwt: "JWT",
  redis: "Redis",
  tailwind: "Tailwind CSS",
  zod: "Zod",
  openai: "OpenAI",
  vue: "Vue",
  python: "Python",
  django: "Django",
  flask: "Flask",
  express: "Express",
  angular: "Angular",
  svelte: "Svelte",
  mongodb: "MongoDB",
  mysql: "MySQL",
  supabase: "Supabase",
  firebase: "Firebase",
};

export type PromptSearchMetadata = {
  promptType: string | null;
  detectedIntent: string | null;
  techStack: string[];
  domain: string | null;
  role: string | null;
  keywords: string[];
};

function displayTech(keyword: string): string {
  return TECH_DISPLAY[keyword.toLowerCase()] ?? keyword.charAt(0).toUpperCase() + keyword.slice(1);
}

export function extractTechStack(content: string): string[] {
  const lower = content.toLowerCase();
  const found: string[] = [];
  for (const kw of TECH_KEYWORDS) {
    if (lower.includes(kw)) found.push(displayTech(kw));
  }
  if (/\bnode\.?js\b/i.test(content) && !found.includes("Node.js")) found.push("Node.js");
  if (/\bpython\b/i.test(content) && !found.includes("Python")) found.push("Python");
  if (/\bvue\b/i.test(content) && !found.includes("Vue")) found.push("Vue");
  return [...new Set(found)].slice(0, 12);
}

export function extractRole(content: string): string | null {
  const lower = content.toLowerCase();
  if (/\bfull[\s-]?stack\b/.test(lower)) return "Full Stack Developer";
  if (/\b(senior\s+)?frontend\b/.test(lower) || /\bfront[\s-]?end\b/.test(lower)) {
    return "Frontend Developer";
  }
  if (/\b(senior\s+)?backend\b/.test(lower) || /\bback[\s-]?end\b/.test(lower)) {
    return "Backend Developer";
  }
  if (/\bdevops\b/.test(lower)) return "DevOps Engineer";
  if (/\bdata\s+(scientist|engineer|analyst)\b/.test(lower)) return "Data Engineer";
  if (/\bui[\s/]?ux\b/.test(lower)) return "UI/UX Designer";

  const youAre = content.match(/\byou are (?:a|an) ([^\n.,;]{3,60})/i);
  if (youAre?.[1]) return youAre[1].trim().replace(/\.$/, "");

  const actAs = content.match(/\bact as (?:a|an) ([^\n.,;]{3,60})/i);
  if (actAs?.[1]) return actAs[1].trim().replace(/\.$/, "");

  return null;
}

export function inferDomain(
  promptType: string | null | undefined,
  keywords: string[],
  content: string,
): string | null {
  const blob = `${promptType ?? ""} ${keywords.join(" ")} ${content}`.toLowerCase();

  if (/\b(login|auth|jwt|oauth|session|sign[\s-]?in|password)\b/.test(blob)) return "Authentication";
  if (/\b(dashboard|analytics|chart|metric|kpi)\b/.test(blob)) return "Dashboard";
  if (/\b(api|endpoint|rest|graphql|webhook)\b/.test(blob)) return "API Development";
  if (/\b(form|validation|input field)\b/.test(blob)) return "Form Handling";
  if (/\b(table|list|pagination|grid|datatable)\b/.test(blob)) return "Data Display";
  if (/\b(debug|fix|error|bug|stack trace|troubleshoot)\b/.test(blob)) return "Debugging";
  if (/\b(docs|readme|documentation|wiki)\b/.test(blob)) return "Documentation";
  if (/\b(test|jest|cypress|playwright|unit test)\b/.test(blob)) return "Testing";
  if (/\b(deploy|ci[\s/]?cd|docker|kubernetes)\b/.test(blob)) return "DevOps";

  if (promptType?.includes("code")) return "Code Generation";
  if (promptType?.includes("documentation")) return "Documentation";
  if (promptType?.includes("debug")) return "Debugging";

  return null;
}

export function extractKeywords(content: string, max = 10): string[] {
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

  const counts = new Map<string, number>();
  for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w)
    .slice(0, max);
}

export function buildSearchMetadata(content: string, quality?: AnalyzerResult): PromptSearchMetadata {
  const keywords = extractKeywords(content);
  const techStack = extractTechStack(content);
  const role = extractRole(content);
  const promptType = quality?.promptTypeLabel ?? quality?.promptType ?? null;
  const detectedIntent = quality?.detectedIntent ?? null;
  const domain = inferDomain(promptType ?? quality?.promptType, keywords, content);

  return {
    promptType,
    detectedIntent,
    techStack,
    domain,
    role,
    keywords,
  };
}

export function buildSearchMetadataFields(content: string, quality: AnalyzerResult) {
  const meta = buildSearchMetadata(content, quality);
  return {
    detectedIntent: meta.detectedIntent,
    techStack: meta.techStack,
    searchDomain: meta.domain,
    searchRole: meta.role,
    searchKeywords: meta.keywords,
  };
}

export function enrichSearchMetadataFromContent(
  content: string,
  partial?: Partial<PromptSearchMetadata & { promptTypeLabel?: string | null }>,
): PromptSearchMetadata {
  const keywords =
    partial?.keywords && partial.keywords.length > 0
      ? partial.keywords
      : extractKeywords(content);
  const promptType = partial?.promptType ?? partial?.promptTypeLabel ?? null;

  return {
    promptType,
    detectedIntent: partial?.detectedIntent ?? null,
    techStack:
      partial?.techStack && partial.techStack.length > 0
        ? partial.techStack
        : extractTechStack(content),
    domain: partial?.domain ?? inferDomain(promptType, keywords, content),
    role: partial?.role ?? extractRole(content),
    keywords,
  };
}
