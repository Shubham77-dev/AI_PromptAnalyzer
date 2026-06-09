import { OUTPUT_FORMAT_KEYWORDS } from "./patterns";

export type ParsedPrompt = {
  role?: string;
  goal?: string;
  context?: string;
  requirements: string[];
  constraints: string[];
  outputFormat?: string;
  examples: string[];
  /** counts repeated headings like "## Goal" */
  headingCounts: Record<string, number>;
};

function normalize(content: string) {
  return content
    .trim()
    .replaceAll("\r\n", "\n")
    .replaceAll(/[ \t]+/g, " ")
    .replaceAll(/\n{3,}/g, "\n\n");
}

function normalizeHeading(h: string) {
  return h.trim().toLowerCase().replaceAll(/[^a-z0-9\s/]/g, "").replaceAll(/\s+/g, " ");
}

type Canon =
  | "role"
  | "goal"
  | "context"
  | "requirements"
  | "constraints"
  | "output_format"
  | "examples";

function toCanonHeading(raw: string): Canon | null {
  const h = normalizeHeading(raw);
  if (h.includes("role") || h.includes("persona")) return "role";
  if (h.includes("goal") || h.includes("task") || h.includes("objective")) return "goal";
  if (h.includes("context") || h.includes("background") || h.includes("inputs")) return "context";
  if (h.includes("requirement") || h.includes("deliverable")) return "requirements";
  if (h.includes("constraint") || h.includes("rules")) return "constraints";
  if (h.includes("output") || h.includes("format") || h.includes("response format")) return "output_format";
  if (h.includes("example")) return "examples";
  return null;
}

function extractRoleInline(lines: string[]) {
  for (const l of lines) {
    const line = l.trim();
    if (/^(you are|act as)\b/i.test(line)) {
      const clause = /^((?:you are|act as)[^.]+\.)/i.exec(line);
      return clause?.[1]?.trim() ?? (line.length <= 80 ? line : undefined);
    }
    const m = /^role:\s*(.+)$/i.exec(line);
    if (m?.[1]) return `You are ${m[1].trim()}.`;
  }
  return undefined;
}

function extractOutputFormatInline(text: string) {
  const lower = text.toLowerCase();
  const hasDirective = /\b(output format|response format|return|respond with|format)\b/i.test(text);
  if (!hasDirective) return undefined;

  const found = OUTPUT_FORMAT_KEYWORDS.filter((k) => lower.includes(k));
  if (!found.length) return undefined;
  return `Return in ${Array.from(new Set(found)).slice(0, 3).join(", ")} format.`;
}

function pushBulletLike(target: string[], line: string) {
  const s = line.trim();
  if (!s) return;
  const bullet = /^[-*•]\s+/.test(s) ? s : /^(\d{1,2})[.)]\s+/.test(s) ? s : "";
  if (bullet) target.push(s);
}

export function parsePrompt(content: string): ParsedPrompt {
  const text = normalize(content);
  const lines = text.split("\n");

  const headingCounts: Record<string, number> = {};
  const parsed: ParsedPrompt = {
    requirements: [],
    constraints: [],
    examples: [],
    headingCounts,
  };

  let current: Canon | null = null;
  const preHeadingLines: string[] = [];

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    const headingMatch = /^(#{1,6})\s+(.+?)\s*$/.exec(trimmed);
    if (headingMatch) {
      const hRaw = headingMatch[2] ?? "";
      const hNorm = normalizeHeading(hRaw);
      headingCounts[hNorm] = (headingCounts[hNorm] ?? 0) + 1;
      current = toCanonHeading(hRaw);
      continue;
    }

    const colonHeading = /^([^:]{2,48}):\s*$/.exec(trimmed);
    if (colonHeading?.[1]) {
      const canon = toCanonHeading(colonHeading[1]);
      if (canon) {
        const hNorm = normalizeHeading(colonHeading[1]);
        headingCounts[hNorm] = (headingCounts[hNorm] ?? 0) + 1;
        current = canon;
        continue;
      }
    }

    if (current === null) {
      preHeadingLines.push(line);
      continue;
    }

    switch (current) {
      case "role":
        if (!parsed.role && line.trim()) parsed.role = line.trim();
        break;
      case "goal":
        parsed.goal = [parsed.goal, line].filter(Boolean).join("\n").trim() || parsed.goal;
        break;
      case "context":
        parsed.context = [parsed.context, line].filter(Boolean).join("\n").trim() || parsed.context;
        break;
      case "requirements":
        pushBulletLike(parsed.requirements, line);
        break;
      case "constraints":
        pushBulletLike(parsed.constraints, line);
        break;
      case "output_format":
        parsed.outputFormat = [parsed.outputFormat, line].filter(Boolean).join("\n").trim() || parsed.outputFormat;
        break;
      case "examples":
        if (line.trim()) parsed.examples.push(line.trim());
        break;
    }
  }

  // Inline extraction fallbacks (common for unstructured prompts).
  const roleInline = extractRoleInline(preHeadingLines);
  if (!parsed.role && roleInline) parsed.role = roleInline;

  if (!parsed.goal) {
    const goalLines = preHeadingLines
      .map((l) => l.trim())
      .filter((l) => l && !/^(you are|act as)\b/i.test(l));
    if (goalLines.length) parsed.goal = goalLines.join("\n").trim();
  }

  const outputInline = extractOutputFormatInline(text);
  if (!parsed.outputFormat && outputInline) parsed.outputFormat = outputInline;

  return parsed;
}

