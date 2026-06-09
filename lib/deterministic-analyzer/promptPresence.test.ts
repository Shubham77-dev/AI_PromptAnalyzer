import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parsePrompt } from "./parser";
import {
  detectContentSignals,
  detectPromptPresence,
  isMonitoringRelevant,
  shouldSuggest,
} from "./promptPresence";
import { buildStructuredSuggestions } from "./suggestions";
import { scorePromptDeterministic } from "./scoring";
import { generateReview } from "./review";

const STRUCTURED_LOGIN = `Act as a senior React frontend engineer.

Build a login page in React with JWT

Requirements:

* Email/password form with validation and loading state on submit
* POST credentials to /api/auth/login; store JWT in localStorage
* Redirect to /dashboard on success; display errors for 401/500

Output Format:

* React components with TypeScript and Tailwind CSS

Constraints:

* Keep scope to the login feature; use React + TypeScript + Tailwind`;

describe("detectPromptPresence", () => {
  it("detects role from act-as line", () => {
    const parsed = parsePrompt("Act as a senior React engineer.\n\nBuild a login page.");
    const presence = detectPromptPresence("Act as a senior React engineer.\n\nBuild a login page.", parsed);
    assert.equal(presence.hasRole, true);
  });

  it("detects role from you-are line", () => {
    const text = "You are a backend developer. Create a REST API.";
    const parsed = parsePrompt(text);
    const presence = detectPromptPresence(text, parsed);
    assert.equal(presence.hasRole, true);
  });

  it("detects requirements, output format, and constraints from colon sections", () => {
    const parsed = parsePrompt(STRUCTURED_LOGIN);
    const presence = detectPromptPresence(STRUCTURED_LOGIN, parsed);

    assert.equal(parsed.requirements.length, 3);
    assert.equal(parsed.constraints.length, 1);
    assert.ok(parsed.outputFormat?.includes("React"));
    assert.equal(presence.hasRole, true);
    assert.equal(presence.hasRequirements, true);
    assert.equal(presence.hasOutputFormat, true);
    assert.equal(presence.hasConstraints, true);
  });

  it("returns false for missing elements on sparse prompt", () => {
    const text = "Build a login page";
    const parsed = parsePrompt(text);
    const presence = detectPromptPresence(text, parsed);
    assert.equal(presence.hasRole, false);
    assert.equal(presence.hasOutputFormat, false);
    assert.equal(presence.hasConstraints, false);
    assert.equal(presence.hasRequirements, false);
  });
});

describe("shouldSuggest / false-positive prevention", () => {
  it("suppresses role suggestion when role exists", () => {
    const parsed = parsePrompt(STRUCTURED_LOGIN);
    const presence = detectPromptPresence(STRUCTURED_LOGIN, parsed);
    assert.equal(
      shouldSuggest("Add a role/persona for the intended implementer.", presence, "technical", STRUCTURED_LOGIN),
      false,
    );
  });

  it("suppresses output format suggestion when output format exists", () => {
    const parsed = parsePrompt(STRUCTURED_LOGIN);
    const presence = detectPromptPresence(STRUCTURED_LOGIN, parsed);
    assert.equal(
      shouldSuggest("Define expected output format (component, JSON, doc, file)", presence, "technical", STRUCTURED_LOGIN),
      false,
    );
  });

  it("suppresses monitoring for frontend login prompts", () => {
    const parsed = parsePrompt(STRUCTURED_LOGIN);
    const presence = detectPromptPresence(STRUCTURED_LOGIN, parsed);
    assert.equal(isMonitoringRelevant("technical", STRUCTURED_LOGIN), false);
    assert.equal(
      shouldSuggest("Define monitoring or logging expectations.", presence, "technical", STRUCTURED_LOGIN),
      false,
    );
  });

  it("suppresses prop validation, responsive, testing, and generic role false positives", () => {
    const richPrompt = `${STRUCTURED_LOGIN}

* Include Jest + React Testing Library tests with 80% coverage
* Ensure accessibility with ARIA labels and keyboard navigation
* Responsive layout with Tailwind; handle empty user lists gracefully`;

    const parsed = parsePrompt(richPrompt);
    const presence = detectPromptPresence(richPrompt, parsed);
    const signals = detectContentSignals(richPrompt, parsed);

    assert.equal(presence.hasRole, true);
    assert.equal(signals.hasSpecificRole, true);
    assert.equal(signals.hasTesting, true);
    assert.equal(signals.hasResponsive, true);
    assert.equal(signals.hasPropValidation, true);

    assert.equal(
      shouldSuggest(
        "No explicit requirement for prop validation (PropTypes or TypeScript interfaces).",
        presence,
        "code_generation",
        richPrompt,
        80,
        signals,
      ),
      false,
    );
    assert.equal(
      shouldSuggest("Responsive design considerations are absent.", presence, "ui_ux", richPrompt, 80, signals),
      false,
    );
    assert.equal(
      shouldSuggest("No request for unit tests or testing strategy.", presence, "code_generation", richPrompt, 80, signals),
      false,
    );
    assert.equal(
      shouldSuggest(
        "The role description is generic and could be more specific about expertise level.",
        presence,
        "code_generation",
        richPrompt,
        80,
        signals,
      ),
      false,
    );
  });

  it("allows monitoring for backend API prompts", () => {
    const text = "Build a production REST API with Express and PostgreSQL";
    assert.equal(isMonitoringRelevant("technical", text), true);
  });
});

describe("buildStructuredSuggestions", () => {
  it("does not suggest role, output format, monitoring, or examples for structured login prompt", () => {
    const parsed = parsePrompt(STRUCTURED_LOGIN);
    const scored = scorePromptDeterministic(STRUCTURED_LOGIN, parsed);
    const suggestions = buildStructuredSuggestions(STRUCTURED_LOGIN, parsed, scored);
    const all = [...suggestions.highImpactImprovements, ...suggestions.optionalEnhancements].join("\n");

    assert.doesNotMatch(all, /role|persona/i);
    assert.doesNotMatch(all, /output format/i);
    assert.doesNotMatch(all, /monitoring|logging|observability/i);
    assert.doesNotMatch(all, /example|request\/response/i);
    assert.equal(suggestions.optionalEnhancements.length, 0);
  });
});

describe("generateReview", () => {
  it("produces positive summary for strong structured prompt", () => {
    const parsed = parsePrompt(STRUCTURED_LOGIN);
    const scored = scorePromptDeterministic(STRUCTURED_LOGIN, parsed);
    const review = generateReview(STRUCTURED_LOGIN, scored.dimensions, scored.promptType, scored.overallScore, scored, parsed);

    assert.ok(scored.overallScore >= 70);
    assert.equal(review.highImpactImprovements.length, 0);
    assert.ok(review.strengths.some((s) => /role|requirements|output|constraints/i.test(s)));
    assert.match(review.reviewSummary, /strong|well-structured|no critical gaps/i);
  });
});
