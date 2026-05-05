import { cleanImprovedPrompt } from "@/lib/clean-improved-prompt";
import type { ParsedPrompt } from "./parser";

function bulletize(lines: string[]) {
  const out: string[] = [];
  for (const l of lines) {
    const s = l.trim();
    if (!s) continue;
    out.push(/^[-*•] /.test(s) ? s : `- ${s.replaceAll(/^[-*•]\s+/, "")}`);
  }
  return out;
}

export function generateImprovedPrompt(parsed: ParsedPrompt): string {
  const role = parsed.role?.trim() || "You are an expert assistant.";
  const goal = parsed.goal?.trim() || "Describe the exact task and success criteria.";
  const context = parsed.context?.trim() || "";

  const requirements = parsed.requirements.length
    ? bulletize(parsed.requirements)
    : ["- Provide a precise, actionable answer.", "- Ask clarifying questions only if truly necessary."];

  const constraints = parsed.constraints.length
    ? bulletize(parsed.constraints)
    : ["- Follow all constraints (tone/length/exclusions/must-haves).", "- Do not invent facts; state assumptions when needed."];

  const outputFormat = parsed.outputFormat?.trim()
    ? parsed.outputFormat.trim()
    : ["- Use clear headings and bullet points.", "- Include code blocks when relevant."].join("\n");

  const raw = [
    role,
    "",
    "## Goal / Task",
    goal,
    "",
    ...(context ? ["## Context", context, ""] : []),
    "## Requirements",
    ...requirements,
    "",
    "## Constraints",
    ...constraints,
    "",
    "## Output format",
    outputFormat,
    "",
  ].join("\n");

  return cleanImprovedPrompt(raw);
}

