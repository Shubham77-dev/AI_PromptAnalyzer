export function isOpenAiModerationAvailable(): boolean {
  const key = process.env.OPENAI_API_KEY?.trim();
  return Boolean(key);
}
