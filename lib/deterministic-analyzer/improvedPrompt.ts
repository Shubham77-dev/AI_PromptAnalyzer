import type { ParsedPrompt } from "./parser";
import type { PromptType } from "./promptType";
import {
  compactConstraintBullets,
  compactOutputFormatBullets,
  compactRequirementBullets,
  maxImprovedLength,
  resolveRoleLine,
  stripRolePrefix,
  type ImprovementRequirements,
} from "./improvementRequirements";

type FilledSection = { heading: string; bullets: string[] };

function wordCount(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

function normalizeWhitespace(text: string): string {
  return text
    .trim()
    .replaceAll("\r\n", "\n")
    .replaceAll(/\n{3,}/g, "\n\n")
    .replaceAll(/[ \t]+/g, " ");
}

export function normalizeImprovedBrief(text: string): string {
  const lines = normalizeWhitespace(text).split("\n");
  const out: string[] = [];
  let blankRun = 0;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      blankRun += 1;
      if (blankRun <= 1) out.push("");
      continue;
    }
    blankRun = 0;
    out.push(line);
  }
  while (out.length && !out[0]?.trim()) out.shift();
  while (out.length && !out.at(-1)?.trim()) out.pop();
  return out.join("\n");
}

function bulletize(lines: string[], max = 4): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of lines) {
    const s = raw.trim().replace(/^[-*•]\s+/, "");
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(`- ${s}`);
    if (out.length >= max) break;
  }
  return out;
}

function buildGoalLine(originalPrompt: string, promptType: PromptType): string {
  const firstLine = originalPrompt.trim().split("\n")[0]?.trim() ?? originalPrompt.trim();
  let raw = stripRolePrefix(firstLine);
  if (!raw || raw.toLowerCase() === firstLine.toLowerCase()) {
    raw = stripRolePrefix(originalPrompt.trim());
  }
  let goal = raw.replace(/\.$/, "").trim();
  if (!goal) goal = originalPrompt.trim().split("\n").find((l) => l.trim() && !/^(you are|act as)\b/i.test(l.trim()))?.trim() ?? originalPrompt.trim();

  if (promptType === "documentation" && !/\bdocument\b/i.test(goal)) {
    goal = `Document ${goal.replace(/^(document|explain|describe)\s+/i, "")}`;
  }
  if (promptType === "debugging" && !/^(fix|debug|resolve)\b/i.test(goal)) {
    goal = `Fix: ${goal}`;
  }

  return goal.charAt(0).toUpperCase() + goal.slice(1);
}

function sectionExists(sections: FilledSection[], keyword: string): boolean {
  return sections.some((s) => s.heading.toLowerCase().includes(keyword));
}

function buildSections(
  requirements: ImprovementRequirements,
  promptType: PromptType,
  originalPrompt: string,
  parsed: ParsedPrompt,
): FilledSection[] {
  const sections: FilledSection[] = [];

  if (requirements.requirements && !sectionExists(sections, "requirement")) {
    const fromParsed = parsed.requirements.map((r) => r.replace(/^[-*•]\s+/, ""));
    const bullets = bulletize(
      fromParsed.length > 0 ? fromParsed : compactRequirementBullets(promptType, originalPrompt),
      4,
    );
    if (bullets.length) sections.push({ heading: "Requirements:", bullets });
  }

  if (requirements.outputFormat && !sectionExists(sections, "output")) {
    const bullets = bulletize(compactOutputFormatBullets(promptType, originalPrompt), 2);
    if (bullets.length) sections.push({ heading: "Output Format:", bullets });
  }

  if (requirements.constraints && !sectionExists(sections, "constraint")) {
    const fromParsed = parsed.constraints.map((c) => c.replace(/^[-*•]\s+/, ""));
    const bullets = bulletize(
      fromParsed.length > 0 ? fromParsed : compactConstraintBullets(promptType, originalPrompt),
      3,
    );
    if (bullets.length) sections.push({ heading: "Constraints:", bullets });
  }

  if (requirements.examples && !sectionExists(sections, "example")) {
    const fromParsed = parsed.examples.map((e) => e.replace(/^[-*•]\s+/, ""));
    const bullets = bulletize(
      fromParsed.length > 0
        ? fromParsed
        : promptType === "technical"
          ? ["Example: POST /api/items with JSON body and 201 response"]
          : ["Example: one concrete input and the expected output"],
      2,
    );
    if (bullets.length) sections.push({ heading: "Example:", bullets });
  }

  if (requirements.context && parsed.context?.trim()) {
    sections.push({
      heading: "Context:",
      bullets: bulletize(parsed.context.split("\n"), 2),
    });
  } else if (requirements.context && !sectionExists(sections, "context")) {
    sections.push({
      heading: "Context:",
      bullets: bulletize(["Specify environment, audience, or existing codebase if relevant"], 1),
    });
  }

  return sections;
}

function dedupeRoleLines(text: string): string {
  const lines = text.split("\n");
  const out: string[] = [];
  let sawRole = false;
  for (const line of lines) {
    const isRole = /^(you are|act as)\b/i.test(line.trim());
    if (isRole) {
      if (sawRole) continue;
      sawRole = true;
    }
    out.push(line);
  }
  return out.join("\n");
}

function dedupeSectionHeadings(text: string): string {
  const lines = text.split("\n");
  const seenHeadings = new Set<string>();
  const out: string[] = [];
  let skipUntilNextHeading = false;

  for (const line of lines) {
    const headingMatch = /^([A-Za-z][^:]{0,40}):$/.exec(line.trim());
    if (headingMatch) {
      const key = headingMatch[1]!.toLowerCase();
      if (seenHeadings.has(key)) {
        skipUntilNextHeading = true;
        continue;
      }
      seenHeadings.add(key);
      skipUntilNextHeading = false;
      out.push(line);
      continue;
    }
    if (skipUntilNextHeading) continue;
    out.push(line);
  }
  return out.join("\n");
}

function trimBlockBullets(block: string, budget: number): string | null {
  if (block.length <= budget) return block;
  const lines = block.split("\n");
  const heading = lines[0] ?? "";
  const bullets = lines.filter((l) => l.trim().startsWith("- "));
  if (!bullets.length) return null;
  const kept: string[] = [heading];
  for (const b of bullets) {
    const next = [...kept, b].join("\n");
    if (next.length > budget) break;
    kept.push(b);
  }
  return kept.length > 1 ? kept.join("\n") : null;
}

function trimToMaxLength(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;

  const blocks = text.split(/\n\n+/);
  const kept: string[] = [];
  for (const block of blocks) {
    const prefix = kept.join("\n\n");
    const joiner = prefix ? "\n\n" : "";
    const budget = maxLen - prefix.length - joiner.length;
    if (budget <= 0) break;

    if (block.length <= budget) {
      kept.push(block);
      continue;
    }

    const trimmed = trimBlockBullets(block, budget);
    if (trimmed) kept.push(trimmed);
  }

  return kept.join("\n\n").trim();
}

function assemblePrompt(roleLine: string | null, goalLine: string, sections: FilledSection[]): string {
  const parts: string[] = [];
  if (roleLine) parts.push(roleLine, "");
  parts.push(goalLine, "");
  for (const s of sections) {
    if (!s.bullets.length) continue;
    parts.push(s.heading, ...s.bullets, "");
  }
  return normalizeImprovedBrief(parts.join("\n"));
}

/**
 * Generates a proportional improved prompt from analyzer findings.
 * HIGH impact (role, requirements, output) applied when needed.
 * MEDIUM (constraints, examples) applied selectively.
 * LOW (monitoring) never auto-injected — stays in review suggestions only.
 */
export function generateImprovedPrompt(
  originalPrompt: string,
  promptType: PromptType,
  _detectedIntent: string,
  parsed: ParsedPrompt,
  requirements: ImprovementRequirements,
): string {
  const isShort = wordCount(originalPrompt) <= 20;
  const goalLine = buildGoalLine(originalPrompt, promptType);
  const hasExistingRole = Boolean(parsed.role?.trim()) || /^(you are|act as)\b/i.test(originalPrompt.trim());
  const roleLine = resolveRoleLine(requirements.role || hasExistingRole, promptType, parsed, originalPrompt);

  const sections = buildSections(requirements, promptType, originalPrompt, parsed);
  if (isShort) {
    for (const s of sections) {
      s.bullets = s.bullets.slice(0, s.heading.startsWith("Requirements") ? 3 : 2);
    }
  }

  let result = assemblePrompt(roleLine, goalLine, sections);
  result = dedupeRoleLines(result);
  result = dedupeSectionHeadings(result);
  result = trimToMaxLength(result, maxImprovedLength(originalPrompt));

  return result;
}
