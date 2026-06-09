import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzeModerationWithLocal } from "./localModeration";
import { parseModerationAiJson } from "./moderationAiShared";

describe("moderation providers", () => {
  it("local moderation returns valid scores from rule output", () => {
    const result = analyzeModerationWithLocal(72, ["missing_constraints"]);
    assert.equal(result.ok, true);
    assert.equal(result.provider, "local");
    assert.ok(result.scores.finalScore >= 0 && result.scores.finalScore <= 100);
    assert.ok(result.scores.reason.length > 0);
  });

  it("shared JSON parser accepts moderation schema", () => {
    const parsed = parseModerationAiJson(
      JSON.stringify({
        clarityScore: 80,
        usefulnessScore: 75,
        safetyScore: 90,
        creativityScore: 70,
        finalScore: 78,
        reason: "Clear task with structured output.",
      }),
    );
    assert.ok(parsed);
    assert.equal(parsed!.finalScore, 78);
  });
});
