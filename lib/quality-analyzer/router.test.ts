import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { listQualityAnalyzerProviders } from "./router";
import { isOllamaQualityAvailable } from "./ollama";
import { analyzeWithLocal } from "./local";

describe("quality-analyzer router", () => {
  it("lists local provider as always available", () => {
    const providers = listQualityAnalyzerProviders();
    const local = providers.find((p) => p.id === "local");
    assert.ok(local);
    assert.equal(local.available, true);
  });

  it("local analyzer returns rules source", () => {
    const result = analyzeWithLocal("Build a login page in React");
    assert.equal(result.analyzerProvider, "local");
    assert.equal(result.source, "rules");
    assert.equal(result.providerLabel, "Local analyzer");
    assert.equal(result.fallbackFrom, undefined);
  });

  it("ollama is unavailable with placeholder cloud key", () => {
    const prevKey = process.env.OLLAMA_API_KEY;
    const prevBase = process.env.OLLAMA_BASE_URL;
    process.env.OLLAMA_API_KEY = "your-ollama-api-key";
    delete process.env.OLLAMA_BASE_URL;
    assert.equal(isOllamaQualityAvailable(), false);
    process.env.OLLAMA_API_KEY = prevKey;
    if (prevBase) process.env.OLLAMA_BASE_URL = prevBase;
    else delete process.env.OLLAMA_BASE_URL;
  });
});
