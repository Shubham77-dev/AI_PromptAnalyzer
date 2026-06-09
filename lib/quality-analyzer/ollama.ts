import { buildQualityAnalyzerUserPrompt, QUALITY_ANALYZER_SYSTEM } from "./prompt";
import { parseQualityAnalyzerJson } from "./parse";

function ollamaBaseUrl(): string {
  const raw = process.env.OLLAMA_BASE_URL?.trim() || "https://ollama.com/v1";
  return raw.replace(/\/$/, "");
}

function isLocalOllamaBaseUrl(baseUrl: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(baseUrl);
}

function isPlaceholderOllamaKey(key: string | undefined): boolean {
  if (!key) return true;
  return /your-ollama-api-key|^placeholder$|^changeme$/i.test(key.trim());
}

export function isOllamaQualityAvailable(): boolean {
  const key = process.env.OLLAMA_API_KEY?.trim();
  const base = ollamaBaseUrl();
  if (isLocalOllamaBaseUrl(base)) return true;
  return Boolean(key && !isPlaceholderOllamaKey(key));
}

export async function analyzeWithOllama(content: string): Promise<ReturnType<typeof parseQualityAnalyzerJson>> {
  const base = ollamaBaseUrl();
  const apiKey = process.env.OLLAMA_API_KEY?.trim();
  const useAuth = Boolean(apiKey && !isPlaceholderOllamaKey(apiKey));
  if (!useAuth && !isLocalOllamaBaseUrl(base)) return null;

  const model = process.env.OLLAMA_MODEL?.trim() || "gpt-oss:120b-cloud";
  const debug = process.env.ANALYZER_DEBUG === "1";
  const url = `${base}/chat/completions`;

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (useAuth && apiKey) headers.Authorization = `Bearer ${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: QUALITY_ANALYZER_SYSTEM },
          { role: "user", content: buildQualityAnalyzerUserPrompt(content) },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      if (debug) {
        console.error("[quality-analyzer] ollama http error:", res.status, errText.slice(0, 300));
      }
      return null;
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!raw) return null;

    if (debug) console.log("[quality-analyzer] ollama raw:", raw.slice(0, 500));

    return parseQualityAnalyzerJson(raw, "ollama", "Ollama", content);
  } catch (e) {
    if (debug) console.error("[quality-analyzer] ollama error:", e);
    return null;
  }
}
