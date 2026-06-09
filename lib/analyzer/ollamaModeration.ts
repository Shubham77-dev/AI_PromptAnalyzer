import { isOllamaQualityAvailable } from "@/lib/quality-analyzer/ollama";
import {
  buildModerationAiUserPrompt,
  MODERATION_AI_SYSTEM,
  parseModerationAiJson,
  type ModerationAiFail,
  type ModerationAiOk,
  type ModerationAiOutcome,
} from "./moderationAiShared";

function ollamaBaseUrl(): string {
  const raw = process.env.OLLAMA_BASE_URL?.trim() || "https://ollama.com/v1";
  return raw.replace(/\/$/, "");
}

function isPlaceholderOllamaKey(key: string | undefined): boolean {
  if (!key) return true;
  return /your-ollama-api-key|^placeholder$|^changeme$/i.test(key.trim());
}

function isLocalOllamaBaseUrl(baseUrl: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(baseUrl);
}

export function isOllamaModerationAvailable(): boolean {
  return isOllamaQualityAvailable();
}

export async function analyzeModerationWithOllama(content: string): Promise<ModerationAiOutcome> {
  if (!isOllamaModerationAvailable()) {
    return { ok: false, provider: "ollama", error: "Ollama not configured" };
  }

  const base = ollamaBaseUrl();
  const apiKey = process.env.OLLAMA_API_KEY?.trim();
  const useAuth = Boolean(apiKey && !isPlaceholderOllamaKey(apiKey));
  if (!useAuth && !isLocalOllamaBaseUrl(base)) {
    return { ok: false, provider: "ollama", error: "Ollama API key missing" };
  }

  const model = process.env.OLLAMA_MODEL?.trim() || "gpt-oss:120b-cloud";
  const debug = process.env.ANALYZER_PIPELINE_DEBUG === "1";
  const url = `${base}/chat/completions`;

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (useAuth && apiKey) headers.Authorization = `Bearer ${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        temperature: 0.15,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: MODERATION_AI_SYSTEM },
          { role: "user", content: buildModerationAiUserPrompt(content) },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      if (debug) {
        console.error("[analyzer-pipeline] ollama moderation http error:", res.status, errText.slice(0, 300));
      }
      return { ok: false, provider: "ollama", error: `Ollama HTTP ${res.status}` };
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!raw) {
      return { ok: false, provider: "ollama", error: "Empty Ollama response" };
    }

    if (debug) console.log("[analyzer-pipeline] ollama moderation raw:", raw.slice(0, 500));

    const parsed = parseModerationAiJson(raw);
    if (!parsed) {
      return { ok: false, provider: "ollama", error: "Failed to parse Ollama JSON" };
    }

    const ok: ModerationAiOk = { ok: true, provider: "ollama", model, scores: parsed };
    return ok;
  } catch (e) {
    console.error("[analyzer-pipeline] Ollama moderation failed:", e);
    const fail: ModerationAiFail = {
      ok: false,
      provider: "ollama",
      error: e instanceof Error ? e.message : "Unknown Ollama error",
    };
    return fail;
  }
}
