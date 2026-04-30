/**
 * Internal model selection — not exposed to clients.
 * Extend with provider-specific maps (OpenAI, Anthropic, etc.) as you add backends.
 */

export type RoutedModel = {
  /** Provider-specific model id passed to the AI layer */
  modelId: string;
  provider: "openai";
};

function complexityHint(content: string): number {
  const t = content.trim();
  let hint = 0;
  if (t.length > 400) hint += 2;
  if (/\n\n/.test(t)) hint += 1;
  if (/\b(code|implement|refactor|architecture|dataset|evaluate)\b/i.test(t)) hint += 2;
  if (/[{[\]}]/.test(t)) hint += 1;
  return hint;
}

/**
 * Short/simple prompts → cheaper model; longer or more complex → stronger model.
 */
export function selectModel(content: string): RoutedModel {
  const len = content.trim().length;
  const complex = complexityHint(content);

  if (len < 100 && complex < 3) {
    return { modelId: "gpt-4o-mini", provider: "openai" };
  }

  return { modelId: "gpt-4o", provider: "openai" };
}
