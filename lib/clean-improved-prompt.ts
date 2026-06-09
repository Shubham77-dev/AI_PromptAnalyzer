type SectionKey = "goal" | "context" | "requirements" | "constraints" | "output_format";

const ORDER: SectionKey[] = ["goal", "context", "requirements", "constraints", "output_format"];

const CANONICAL_HEADINGS: Record<SectionKey, string> = {
  goal: "## Goal",
  context: "## Context",
  requirements: "## Requirements",
  constraints: "## Constraints",
  output_format: "## Output format",
};

const GENERIC_FILLER = new Set([
  "provide a precise, actionable answer.",
  "ask clarifying questions only if truly necessary.",
  "use clear headings and bullet points.",
  "include code blocks when relevant.",
  "describe the exact task and success criteria.",
]);

const GENERIC_ROLE = /^you are an expert assistant\.?$/i;

function normalizeNewlines(s: string) {
  return s.trim().replaceAll("\r\n", "\n");
}

function normalizeHeadingText(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9\s/]/g, "")
    .replaceAll(/\s+/g, " ");
}

function canonicalizeHeading(h: string): SectionKey | "role" | "examples" | null {
  const n = normalizeHeadingText(h);
  if (n === "role" || n.includes("persona")) return "role";
  if (n.includes("example")) return "examples";
  if (n.includes("goal") || n.includes("task") || n.includes("objective")) return "goal";
  if (n.includes("context") || n.includes("background") || n.includes("inputs")) return "context";
  if (n.includes("requirement") || n.includes("deliverable")) return "requirements";
  if (n.includes("constraint") || n.includes("rules") || n.includes("do not")) return "constraints";
  if (n.includes("output") || n.includes("format") || n.includes("response format")) return "output_format";
  return null;
}

function looksLikeRoleLine(line: string) {
  return /^(you are|act as)\b/i.test(line.trim());
}

function normalizeRoleLine(line: string): string {
  const s = cleanCorruptedLine(line).replace(/^role:\s*/i, "").trim();
  if (!s) return "";
  if (/^(you are|act as)\b/i.test(s)) {
    return s.endsWith(".") ? s : `${s}.`;
  }
  return `You are ${s.replace(/^you are\s+/i, "").replace(/\.$/, "")}.`;
}

function cleanCorruptedLine(line: string) {
  const s = line.trim();
  if (!s) return "";
  if (/^you are (a|an)\s+you are\b/i.test(s)) return "";
  if (/^you are (a|an)\s+your\b/i.test(s)) return "";
  if (/^your task is to\s+your task is to\b/i.test(s)) return "";
  return s.replaceAll(/\s{2,}/g, " ").replaceAll(/(\b\w+\b)(\s+\1\b){2,}/gi, "$1");
}

function isGenericFiller(line: string): boolean {
  const key = line.trim().replace(/^[-*•]\s+/, "").toLowerCase();
  return GENERIC_FILLER.has(key);
}

function dedupeLinesPreserveOrder(lines: string[], globalSeen?: Set<string>) {
  const seen = globalSeen ?? new Set<string>();
  const out: string[] = [];
  for (const raw of lines) {
    const cleaned = cleanCorruptedLine(raw);
    if (!cleaned || isGenericFiller(cleaned)) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned);
  }
  return out;
}

function finalizeSpacing(lines: string[]) {
  const out: string[] = [];
  let blankRun = 0;
  for (const l of lines) {
    const line = l.trimEnd();
    const isBlank = line.length === 0;
    blankRun = isBlank ? blankRun + 1 : 0;
    if (blankRun > 1) continue;
    out.push(line);
  }
  while (out.length && !(out.at(0)?.trim() ?? "")) out.shift();
  while (out.length && !(out.at(-1)?.trim() ?? "")) out.pop();
  return out;
}

function wordCount(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

function hasSubstantiveContent(sections: Record<SectionKey, string[]>, roleLine: string): boolean {
  const body = ORDER.flatMap((k) => sections[k]).join("\n");
  return (
    wordCount(body) > 35 ||
    sections.constraints.length > 0 ||
    sections.output_format.length > 1 ||
    (!GENERIC_ROLE.test(roleLine) && roleLine.length > 0)
  );
}

function resolveRoleLine(roleLine: string, sections: Record<SectionKey, string[]>): string {
  const candidates = [roleLine, ...sections.goal]
    .map((l) => normalizeRoleLine(l))
    .filter(Boolean);

  const specific = candidates.find((c) => !GENERIC_ROLE.test(c));
  if (specific) return specific;

  if (roleLine.trim()) return normalizeRoleLine(roleLine) || roleLine.trim();
  return "You are an expert assistant.";
}

function parseColonHeading(trimmed: string): { canon: SectionKey | "role" | "examples"; inline?: string } | null {
  const standalone = /^([^:]{2,48}):\s*$/.exec(trimmed);
  if (standalone?.[1]) {
    const canon = canonicalizeHeading(standalone[1]);
    return canon ? { canon } : null;
  }

  const inline = /^([^:]{2,48}):\s*(.+)$/.exec(trimmed);
  if (inline?.[1] && inline[2]) {
    const canon = canonicalizeHeading(inline[1]);
    if (canon) return { canon, inline: inline[2].trim() };
  }

  return null;
}

/**
 * Deterministic cleanup for AI-generated "improvedPrompt" (OpenAI + Ollama).
 * - Splits nested Role/Goal/Context colon labels into proper sections
 * - Removes duplicate lines and generic meta filler
 * - Rebuilds a single canonical structure
 */
export function cleanImprovedPrompt(prompt: string): string {
  const rawLines = normalizeNewlines(prompt).split("\n");

  let roleLine = "";
  let current: SectionKey | "role" | "examples" | null = null;
  const sections: Record<SectionKey, string[]> = {
    goal: [],
    context: [],
    requirements: [],
    constraints: [],
    output_format: [],
  };

  for (const raw of rawLines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    const mdHeading = /^(#{1,6})\s+(.+?)\s*$/.exec(trimmed);
    if (mdHeading) {
      current = canonicalizeHeading(mdHeading[2] ?? "");
      continue;
    }

    const colon = parseColonHeading(trimmed);
    if (colon) {
      current = colon.canon;
      if (colon.canon === "role" && colon.inline) {
        roleLine = normalizeRoleLine(colon.inline);
      } else if (colon.inline && colon.canon !== "role" && colon.canon !== "examples") {
        sections[colon.canon].push(colon.inline);
      }
      continue;
    }

    if (current === "role") {
      if (trimmed) roleLine = normalizeRoleLine(trimmed) || roleLine;
      continue;
    }

    if (current === "examples") {
      continue;
    }

    if (current === null) {
      if (!roleLine && looksLikeRoleLine(trimmed)) {
        roleLine = normalizeRoleLine(trimmed);
        continue;
      }
      if (trimmed) {
        sections.goal.push(line);
        current = "goal";
      }
      continue;
    }

    sections[current].push(line);
  }

  roleLine = resolveRoleLine(roleLine, sections);

  const globalSeen = new Set<string>();
  for (const key of ORDER) {
    sections[key] = dedupeLinesPreserveOrder(sections[key], globalSeen);
  }

  if (!hasSubstantiveContent(sections, roleLine)) {
    if (!sections.goal.length) sections.goal.push("Describe the exact task and success criteria.");
  }

  const out: string[] = [roleLine, ""];

  for (const key of ORDER) {
    const body = finalizeSpacing(sections[key]);
    if (!body.length) continue;
    out.push(CANONICAL_HEADINGS[key], ...body, "");
  }

  return finalizeSpacing(out).join("\n");
}
