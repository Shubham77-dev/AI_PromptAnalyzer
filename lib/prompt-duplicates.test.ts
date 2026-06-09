import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  checkForDuplicates,
  getSimilarityScore,
  hasCoreIntentMatch,
  normalizePromptText,
} from "./prompt-duplicates";

describe("prompt-duplicates", () => {
  it("normalizes punctuation and whitespace", () => {
    assert.equal(normalizePromptText("  Hello, World!  "), "hello world");
  });

  it("detects exact duplicates after normalization", () => {
    const result = checkForDuplicates("Build a React login page.", [
      {
        id: "1",
        content: "build a react login page",
        publishedBy: "user@example.com",
        publishedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
    assert.equal(result.isDuplicate, true);
    assert.equal(result.riskLevel, "high");
    assert.equal(result.similarPrompts[0]?.similarityScore, 1);
  });

  it("flags high similarity above 0.85", () => {
    const a =
      "Act as a senior React engineer. Build a login page with JWT authentication, form validation, and Tailwind CSS styling.";
    const b =
      "Act as a senior React engineer. Build a login page with JWT authentication, form validation, and Tailwind styling.";
    const score = getSimilarityScore(a, b);
    assert.ok(score >= 0.85);
    const result = checkForDuplicates(a, [
      {
        id: "2",
        content: b,
        publishedBy: "dev@example.com",
        publishedAt: "2026-01-02T00:00:00.000Z",
      },
    ]);
    assert.equal(result.riskLevel, "high");
  });

  it("returns none for unrelated prompts", () => {
    const result = checkForDuplicates("Write a poem about mountains.", [
      {
        id: "3",
        content: "Build a REST API in Node.js with Express and PostgreSQL.",
        publishedBy: "api@example.com",
        publishedAt: "2026-01-03T00:00:00.000Z",
      },
    ]);
    assert.equal(result.isDuplicate, false);
    assert.equal(result.riskLevel, "none");
  });

  it("detects core intent overlap", () => {
    assert.equal(
      hasCoreIntentMatch(
        "create react login jwt tailwind form validation typescript components hooks",
        "build react login jwt tailwind form validation typescript components hooks",
      ),
      true,
    );
  });
});
