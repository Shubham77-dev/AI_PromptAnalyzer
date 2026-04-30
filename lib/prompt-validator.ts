export type PromptValidationResult =
  | { ok: true; normalized: string }
  | { ok: false; error: string; issues: string[] };

const MIN_PUBLISH_LENGTH = 50;

function normalizePrompt(content: string) {
  // Trim + collapse whitespace but preserve newlines as separators.
  return content
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n");
}

function hasRole(text: string) {
  return /\b(act as|you are|as an?|role:)\b/i.test(text);
}

function hasOutputFormat(text: string) {
  return /\b(output format|return|respond with)\b/i.test(text) &&
    /\b(json|bullet|bullets|steps|table|markdown|csv|yaml|xml)\b/i.test(text);
}

function hasClearTask(text: string) {
  // Heuristic: common instruction verbs or explicit goal.
  return (
    /\b(goal|task|objective|required|requirements)\b/i.test(text) ||
    /\b(write|generate|summarize|analyze|create|build|explain|list|convert|design|implement|refactor)\b/i.test(
      text,
    )
  );
}

/**
 * Strict prompt validation for saving/publishing (admins may bypass).
 * Returns normalized content for storage.
 */
export function validatePromptForPublish(content: string): PromptValidationResult {
  const normalized = normalizePrompt(content);
  const issues: string[] = [];

  if (normalized.length < MIN_PUBLISH_LENGTH) {
    issues.push(`Prompt must be at least ${MIN_PUBLISH_LENGTH} characters.`);
  }
  if (!hasRole(normalized)) {
    issues.push('Missing role. Add something like "Act as a …" or "You are a …".');
  }
  if (!hasClearTask(normalized)) {
    issues.push("Missing a clear task/instruction. Be explicit about what to do.");
  }
  if (!hasOutputFormat(normalized)) {
    issues.push('Missing output format. Specify e.g. "Return JSON …" or "Use bullet steps".');
  }

  if (issues.length) {
    return {
      ok: false,
      error: "Prompt failed validation.",
      issues,
    };
  }

  return { ok: true, normalized };
}

/**
 * Always-normalize helper when you don’t want to enforce strict rules (e.g. admin bypass).
 */
export function normalizeOnly(content: string) {
  return normalizePrompt(content);
}

