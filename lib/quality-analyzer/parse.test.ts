import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseQualityAnalyzerJson } from "./parse";
import { refineAiQualityResult } from "./refineAiFeedback";

const SPARSE_PROMPT = "Build something vague";

const SAMPLE_JSON = JSON.stringify({
  score: 72,
  breakdown: {
    clarity: 70,
    structure: 75,
    specificity: 68,
    outputDefinition: 65,
    accuracy: 72,
  },
  missingParts: {
    roleMissing: true,
    vagueInstruction: false,
    outputFormatMissing: true,
  },
  issues: ["Missing explicit output format", "No role defined"],
  suggestions: ["Add a Role section", "Specify JSON output schema"],
  improvedPrompt: "Role: Frontend developer.\nGoal: Build a login page in React with JWT authentication.",
});

const STRUCTURED_LOGIN = `Act as a senior React frontend engineer.

Build a login page in React with JWT

Requirements:

* Email/password form with validation and loading state on submit
* POST credentials to /api/auth/login; store JWT in localStorage
* Redirect to /dashboard on success; display errors for 401/500
* Include Jest + React Testing Library tests with 80% coverage
* Ensure accessibility with ARIA labels and keyboard navigation

Output Format:

* React components with TypeScript and Tailwind CSS

Constraints:

* Responsive layout with Tailwind; handle empty user lists gracefully
* Keep scope to the login feature; use React + TypeScript + Tailwind`;

const OLLAMA_FALSE_POSITIVES = {
  score: 78,
  breakdown: {
    clarity: 80,
    structure: 75,
    specificity: 72,
    outputDefinition: 70,
    accuracy: 76,
  },
  missingParts: {
    roleMissing: true,
    vagueInstruction: false,
    outputFormatMissing: true,
  },
  issues: [
    "The role description is generic and could be more specific about expertise level.",
    "No explicit requirement for prop validation (PropTypes or TypeScript interfaces).",
    "Handling of empty data sets is not mentioned.",
    "Responsive design considerations are absent.",
    "No request for unit tests or testing strategy.",
  ],
  suggestions: [
    "Add a more specific role with seniority level.",
    "Require PropTypes or TypeScript interfaces.",
    "Specify empty state handling.",
    "Add responsive design requirements.",
    "Include unit tests.",
  ],
  improvedPrompt: "## Role\nYou are a frontend developer.",
};

function assertAiShape(
  label: string,
  result: ReturnType<typeof parseQualityAnalyzerJson>,
  provider: "openai" | "ollama",
  providerLabel: string,
) {
  assert.ok(result, `${label}: expected parsed result`);
  assert.equal(result.source, "ai");
  assert.equal(result.analyzerProvider, provider);
  assert.equal(result.providerLabel, providerLabel);
  assert.equal(typeof result.score, "number");
  assert.ok(Array.isArray(result.issues));
  assert.ok(Array.isArray(result.suggestions));
  assert.ok(result.improvedPrompt.length > 20);
  assert.ok(result.breakdown);
  assert.ok(result.missingParts);
}

describe("quality-analyzer parse", () => {
  it("OpenAI and Ollama produce the same result shape from identical JSON", () => {
    const openai = parseQualityAnalyzerJson(SAMPLE_JSON, "openai", "OpenAI", SPARSE_PROMPT);
    const ollama = parseQualityAnalyzerJson(SAMPLE_JSON, "ollama", "Ollama", SPARSE_PROMPT);

    assertAiShape("OpenAI", openai, "openai", "OpenAI");
    assertAiShape("Ollama", ollama, "ollama", "Ollama");
    assert.ok((openai!.issues.length > 0 || openai!.suggestions.length > 0));
  });

  it("extracts JSON from markdown-wrapped model output", () => {
    const wrapped = "```json\n" + SAMPLE_JSON + "\n```";
    const parsed = parseQualityAnalyzerJson(wrapped, "ollama", "Ollama", SPARSE_PROMPT);
    assert.ok(parsed);
    assert.equal(parsed!.score, 72);
  });

  it("filters false-positive Ollama issues when prompt already contains those elements", () => {
    const raw = JSON.stringify(OLLAMA_FALSE_POSITIVES);
    const refined = parseQualityAnalyzerJson(raw, "ollama", "Ollama", STRUCTURED_LOGIN);
    assert.ok(refined);
    assert.equal(refined!.missingParts?.roleMissing, false);
    assert.equal(refined!.missingParts?.outputFormatMissing, false);
    assert.equal(refined!.issues.length, 0, `unexpected issues: ${refined!.issues.join("; ")}`);
    assert.ok(refined!.review);
    assert.equal(refined!.review!.highImpactImprovements.length, 0);
  });
});

describe("refineAiQualityResult", () => {
  it("builds a structured review object for AI results", () => {
    const base = refineAiQualityResult(SPARSE_PROMPT, {
      score: 40,
      issues: ["No role defined"],
      suggestions: ["Add a role"],
      improvedPrompt: "You are a developer. Build something.",
      source: "ai",
      analyzerProvider: "ollama",
      providerLabel: "Ollama",
    });
    assert.ok(base.review);
    assert.ok(base.review!.reviewSummary.length > 10);
  });
});
