import type { PromptSearchMetadata } from "@/lib/prompt-search-metadata";
import {
  enrichSearchMetadataFromContent,
  extractKeywords,
  extractRole,
  extractTechStack,
  inferDomain,
} from "@/lib/prompt-search-metadata";
import { TECH_KEYWORDS } from "@/lib/deterministic-analyzer/patterns";

export type SearchableLibraryPrompt = {
  id: string;
  content: string;
  createdAt: string;
  user: { email: string };
  analysis: { accuracy: number; clarity: number; suggestions: string } | null;
  stats: { likes: number } | null;
  promptType?: string | null;
  promptTypeLabel?: string | null;
  detectedIntent?: string | null;
  techStack?: string[];
  domain?: string | null;
  searchDomain?: string | null;
  role?: string | null;
  searchRole?: string | null;
  keywords?: string[];
  searchKeywords?: string[];
};

export type SearchMatchReason = {
  field: string;
  label: string;
};

export type ScoredLibraryPrompt = SearchableLibraryPrompt & {
  searchScore: number;
  matchReasons: SearchMatchReason[];
  searchMeta: PromptSearchMetadata;
};

export type SearchSuggestion = {
  id: string;
  icon: string;
  category: string;
  label: string;
  filterValue: string;
  filterKind: "tech" | "role" | "goal" | "domain" | "query";
};

const ACTION_VERBS = ["build", "create", "fix", "debug", "write", "design", "implement", "generate"];
const DOMAIN_HINTS = ["auth", "authentication", "login", "dashboard", "api", "form", "table", "debug", "docs"];
const ROLE_HINTS = ["senior", "frontend", "backend", "full stack", "fullstack", "devops", "engineer", "developer"];

function resolvedMeta(prompt: SearchableLibraryPrompt): PromptSearchMetadata {
  const hasStored =
    (prompt.techStack?.length ?? 0) > 0 ||
    prompt.detectedIntent ||
    prompt.searchDomain ||
    prompt.domain ||
    prompt.searchRole ||
    prompt.role ||
    (prompt.searchKeywords?.length ?? 0) > 0 ||
    (prompt.keywords?.length ?? 0) > 0;

  if (hasStored) {
    return enrichSearchMetadataFromContent(prompt.content, {
      promptType: prompt.promptTypeLabel ?? prompt.promptType,
      detectedIntent: prompt.detectedIntent ?? null,
      techStack: prompt.techStack ?? [],
      domain: prompt.searchDomain ?? prompt.domain ?? null,
      role: prompt.searchRole ?? prompt.role ?? null,
      keywords: prompt.searchKeywords ?? prompt.keywords ?? [],
    });
  }

  return enrichSearchMetadataFromContent(prompt.content, {
    promptType: prompt.promptTypeLabel ?? prompt.promptType,
  });
}

function addReason(reasons: SearchMatchReason[], field: string, label: string) {
  if (reasons.some((r) => r.field === field && r.label === label)) return;
  reasons.push({ field, label });
}

export function scorePromptForSearch(
  prompt: SearchableLibraryPrompt,
  normalizedQuery: string,
  queryWords: string[],
  filterTags: string[],
): ScoredLibraryPrompt | null {
  const meta = resolvedMeta(prompt);
  const text = prompt.content.toLowerCase();
  let score = 0;
  const matchReasons: SearchMatchReason[] = [];

  if (normalizedQuery) {
    if (text.includes(normalizedQuery)) {
      score += 100;
      addReason(matchReasons, "text", "Prompt text");
    }

    const promptType = meta.promptType?.toLowerCase() ?? "";
    if (promptType && promptType.includes(normalizedQuery)) {
      score += 80;
      addReason(matchReasons, "promptType", meta.promptType ?? "Prompt type");
    }

    const intent = meta.detectedIntent?.toLowerCase() ?? "";
    if (intent && intent.includes(normalizedQuery)) {
      score += 70;
      addReason(matchReasons, "detectedIntent", "Detected intent");
    }

    for (const tech of meta.techStack) {
      const t = tech.toLowerCase();
      if (t.includes(normalizedQuery) || normalizedQuery.includes(t)) {
        score += 60;
        addReason(matchReasons, "techStack", tech);
      }
    }

    const domain = meta.domain?.toLowerCase() ?? "";
    if (domain && domain.includes(normalizedQuery)) {
      score += 55;
      addReason(matchReasons, "domain", meta.domain ?? "Domain");
    }

    const role = meta.role?.toLowerCase() ?? "";
    if (role && role.includes(normalizedQuery)) {
      score += 50;
      addReason(matchReasons, "role", meta.role ?? "Role");
    }

    const matchedKeywords = meta.keywords.filter(
      (k) => k.includes(normalizedQuery) || normalizedQuery.includes(k),
    );
    score += matchedKeywords.length * 20;
    for (const k of matchedKeywords.slice(0, 3)) {
      addReason(matchReasons, "keywords", k);
    }

    for (const word of queryWords) {
      if (word.length < 3) continue;
      if (text.includes(word)) score += 10;
      if (meta.keywords.some((k) => k.includes(word))) {
        score += 15;
        addReason(matchReasons, "keywords", word);
      }
      if (meta.techStack.some((t) => t.toLowerCase().includes(word))) {
        score += 15;
        addReason(matchReasons, "techStack", word);
      }
    }
  }

  for (const tag of filterTags) {
    const t = tag.toLowerCase();
    const blob = [
      text,
      meta.promptType ?? "",
      meta.detectedIntent ?? "",
      meta.domain ?? "",
      meta.role ?? "",
      ...meta.techStack,
      ...meta.keywords,
    ]
      .join(" ")
      .toLowerCase();

    if (!blob.includes(t)) return null;
    score += 40;
    addReason(matchReasons, "filter", tag);
  }

  if (score <= 0) return null;

  return { ...prompt, searchScore: score, matchReasons, searchMeta: meta };
}

export function searchPrompts(
  query: string,
  allPrompts: SearchableLibraryPrompt[],
  filterTags: string[] = [],
): ScoredLibraryPrompt[] {
  const normalizedQuery = query.toLowerCase().trim();
  const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);

  if (!normalizedQuery && filterTags.length === 0) {
    return allPrompts.map((p) => ({
      ...p,
      searchScore: 0,
      matchReasons: [],
      searchMeta: resolvedMeta(p),
    }));
  }

  return allPrompts
    .map((p) => scorePromptForSearch(p, normalizedQuery, queryWords, filterTags))
    .filter((p): p is ScoredLibraryPrompt => p !== null)
    .sort((a, b) => b.searchScore - a.searchScore);
}

export function getSearchSuggestions(query: string, allPrompts: SearchableLibraryPrompt[]): SearchSuggestion[] {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];

  const suggestions: SearchSuggestion[] = [];
  const seen = new Set<string>();

  function push(s: SearchSuggestion) {
    const key = `${s.filterKind}:${s.filterValue}`;
    if (seen.has(key)) return;
    seen.add(key);
    suggestions.push(s);
  }

  for (const kw of TECH_KEYWORDS) {
    if (kw.startsWith(q) || q.includes(kw)) {
      push({
        id: `tech-${kw}`,
        icon: "🔧",
        category: "Tech",
        label: kw.charAt(0).toUpperCase() + kw.slice(1),
        filterValue: kw,
        filterKind: "tech",
      });
    }
  }

  for (const hint of ROLE_HINTS) {
    if (hint.startsWith(q) || q.includes(hint)) {
      const label =
        hint === "frontend"
          ? "Frontend Developer"
          : hint === "backend"
            ? "Backend Developer"
            : hint === "full stack" || hint === "fullstack"
              ? "Full Stack Developer"
              : hint.charAt(0).toUpperCase() + hint.slice(1);
      push({
        id: `role-${hint}`,
        icon: "👤",
        category: "Role",
        label,
        filterValue: label,
        filterKind: "role",
      });
    }
  }

  for (const verb of ACTION_VERBS) {
    if (verb.startsWith(q)) {
      push({
        id: `goal-${verb}`,
        icon: "🎯",
        category: "Goal",
        label: `${verb.charAt(0).toUpperCase()}${verb.slice(1)} something`,
        filterValue: verb,
        filterKind: "goal",
      });
    }
  }

  for (const hint of DOMAIN_HINTS) {
    if (hint.startsWith(q)) {
      const label =
        hint === "auth" || hint === "authentication" || hint === "login"
          ? "Authentication"
          : hint === "api"
            ? "API Development"
            : hint === "form"
              ? "Form Handling"
              : hint === "table"
                ? "Data Display"
                : hint === "debug"
                  ? "Debugging"
                  : hint === "docs"
                    ? "Documentation"
                    : hint.charAt(0).toUpperCase() + hint.slice(1);
      push({
        id: `domain-${hint}`,
        icon: "📁",
        category: "Domain",
        label,
        filterValue: label,
        filterKind: "domain",
      });
    }
  }

  for (const p of allPrompts.slice(0, 30)) {
    const meta = resolvedMeta(p);
    for (const tech of meta.techStack) {
      if (tech.toLowerCase().includes(q)) {
        push({
          id: `lib-tech-${tech}`,
          icon: "🔧",
          category: "Tech",
          label: tech,
          filterValue: tech,
          filterKind: "tech",
        });
      }
    }
    if (meta.domain?.toLowerCase().includes(q)) {
      push({
        id: `lib-domain-${meta.domain}`,
        icon: "📁",
        category: "Domain",
        label: meta.domain,
        filterValue: meta.domain,
        filterKind: "domain",
      });
    }
  }

  return suggestions.slice(0, 5);
}

export function enrichLibraryPrompts(prompts: SearchableLibraryPrompt[]): SearchableLibraryPrompt[] {
  return prompts.map((p) => {
    const meta = resolvedMeta(p);
    return {
      ...p,
      promptType: meta.promptType,
      detectedIntent: meta.detectedIntent,
      techStack: meta.techStack,
      domain: meta.domain,
      role: meta.role,
      keywords: meta.keywords,
    };
  });
}

/** Exported for tests */
export { extractKeywords, extractRole, extractTechStack, inferDomain };
