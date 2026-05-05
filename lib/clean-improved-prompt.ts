type CanonicalSection =
  | "role"
  | "goal"
  | "context"
  | "requirements"
  | "constraints"
  | "output_format";

const ORDER: Array<Exclude<CanonicalSection, "role">> = [
  "goal",
  "context",
  "requirements",
  "constraints",
  "output_format",
];

const CANONICAL_HEADINGS: Record<Exclude<CanonicalSection, "role">, string> = {
  goal: "## Goal / Task",
  context: "## Context",
  requirements: "## Requirements",
  constraints: "## Constraints",
  output_format: "## Output format",
};

function normalizeNewlines(s: string) {
  return s.trim().replaceAll("\r\n", "\n").replaceAll(/[ \t]+/g, " ");
}

function normalizeHeadingText(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9\s/]/g, "")
    .replaceAll(/\s+/g, " ");
}

function canonicalizeHeading(h: string): Exclude<CanonicalSection, "role"> | null {
  const n = normalizeHeadingText(h);
  if (n.includes("goal") || n.includes("task") || n.includes("objective")) return "goal";
  if (n.includes("context") || n.includes("background") || n.includes("inputs")) return "context";
  if (n.includes("requirement") || n.includes("requirements") || n.includes("deliverable")) return "requirements";
  if (n.includes("constraint") || n.includes("constraints") || n.includes("rules") || n.includes("do not")) {
    return "constraints";
  }
  if (n.includes("output") || n.includes("format") || n.includes("response format")) return "output_format";
  return null;
}

function looksLikeRoleLine(line: string) {
  return /^(you are|act as)\b/i.test(line.trim());
}

function cleanCorruptedLine(line: string) {
  const s = line.trim();
  if (!s) return "";

  // Common corruption patterns we want to drop entirely.
  if (/^you are (a|an)\s+you are\b/i.test(s)) return "";
  if (/^you are (a|an)\s+your\b/i.test(s)) return "";
  if (/^your task is to\s+your task is to\b/i.test(s)) return "";

  // Collapse accidental double-spaces and obvious repeated phrases.
  return s.replaceAll(/\s{2,}/g, " ").replaceAll(/(\b\w+\b)(\s+\1\b){2,}/gi, "$1");
}

function dedupeLinesPreserveOrder(lines: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of lines) {
    const cleaned = cleanCorruptedLine(raw);
    if (!cleaned) continue;
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
  // Remove leading/trailing blanks
  while (out.length && !(out.at(0)?.trim() ?? "")) out.shift();
  while (out.length && !(out.at(-1)?.trim() ?? "")) out.pop();
  return out;
}

function ensureMinimumContent(sections: Record<Exclude<CanonicalSection, "role">, string[]>) {
  if (!sections.goal.length) sections.goal.push("Describe the exact task and success criteria.");
  if (!sections.requirements.length) {
    sections.requirements.push(
      "- Provide a precise, actionable answer.",
      "- Ask clarifying questions only if truly necessary.",
    );
  }
  if (!sections.output_format.length) {
    sections.output_format.push("- Use clear headings and bullet points.", "- Include code blocks when relevant.");
  }
}

/**
 * Deterministic cleanup for analyzer-generated "improvedPrompt".
 * - Removes duplicate lines
 * - Merges repeated sections (e.g. repeated "## Goal")
 * - Rebuilds a fixed structure (Role, Goal, Context, Requirements, Constraints, Output format)
 */
export function cleanImprovedPrompt(prompt: string): string {
  const normalized = normalizeNewlines(prompt);
  const rawLines = normalized.split("\n");

  let roleLine = "";
  let current: Exclude<CanonicalSection, "role"> | null = null;
  const sections: Record<Exclude<CanonicalSection, "role">, string[]> = {
    goal: [],
    context: [],
    requirements: [],
    constraints: [],
    output_format: [],
  };

  for (const raw of rawLines) {
    const next = routeLine(raw, current, roleLine, sections);
    current = next.current;
    roleLine = next.roleLine;
  }

  roleLine = roleLine.trim() || "You are an expert assistant.";

  // Clean + dedupe within each section.
  for (const key of ORDER) {
    sections[key] = dedupeLinesPreserveOrder(sections[key]);
  }

  ensureMinimumContent(sections);

  const out: string[] = [roleLine, ""];

  for (const key of ORDER) {
    const body = finalizeSpacing(sections[key]);
    if (!body.length) continue;
    out.push(CANONICAL_HEADINGS[key], ...body, "");
  }

  return finalizeSpacing(out).join("\n");
}

function routeLine(
  raw: string,
  current: Exclude<CanonicalSection, "role"> | null,
  roleLine: string,
  sections: Record<Exclude<CanonicalSection, "role">, string[]>,
) {
  const line = raw.trimEnd();
  const headingMatch = /^(#{2,4})\s+(.+?)\s*$/.exec(line.trim());
  if (headingMatch) {
    const canon = canonicalizeHeading(headingMatch[2] ?? "");
    return { current: canon ?? current, roleLine };
  }

  if (current === null) {
    if (roleLine.length === 0 && looksLikeRoleLine(line)) {
      return { current, roleLine: cleanCorruptedLine(line) };
    }
    if (line.trim()) {
      sections.goal.push(line);
      return { current: "goal" as const, roleLine };
    }
    return { current, roleLine };
  }

  sections[current].push(line);
  return { current, roleLine };
}

