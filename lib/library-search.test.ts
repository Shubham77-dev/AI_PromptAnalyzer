import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inferDomain } from "./prompt-search-metadata";
import { searchPrompts } from "./library-search";
import type { SearchableLibraryPrompt } from "./library-search";

const SAMPLE: SearchableLibraryPrompt[] = [
  {
    id: "1",
    content: "Act as a senior React frontend engineer. Build a login page with JWT and Tailwind CSS.",
    createdAt: "2026-01-01T00:00:00.000Z",
    user: { email: "a@example.com" },
    analysis: { accuracy: 82, clarity: 78, suggestions: "" },
    stats: { likes: 3 },
    promptTypeLabel: "Code Generation",
    detectedIntent: "Build a login page in React with JWT authentication.",
    techStack: ["React", "JWT", "Tailwind CSS"],
    searchDomain: "Authentication",
    searchRole: "Frontend Developer",
    searchKeywords: ["login", "react", "jwt", "tailwind"],
  },
  {
    id: "2",
    content: "Create a sales dashboard with charts and KPI cards using React.",
    createdAt: "2026-01-02T00:00:00.000Z",
    user: { email: "b@example.com" },
    analysis: { accuracy: 75, clarity: 70, suggestions: "" },
    stats: { likes: 1 },
    promptTypeLabel: "UI/UX",
    techStack: ["React"],
    searchDomain: "Dashboard",
    searchKeywords: ["dashboard", "charts", "sales"],
  },
];

describe("library-search", () => {
  it("infers authentication domain from keywords", () => {
    assert.equal(inferDomain("Code Generation", ["login", "jwt"], "Build login with JWT"), "Authentication");
  });

  it("finds prompts by tech stack query", () => {
    const results = searchPrompts("react", SAMPLE);
    assert.ok(results.length >= 2);
    assert.equal(results[0]?.id, "1");
    assert.ok(results[0]?.matchReasons.some((r) => r.field === "techStack" || r.field === "text"));
  });

  it("finds prompts by domain-like query", () => {
    const results = searchPrompts("authentication", SAMPLE);
    assert.equal(results[0]?.id, "1");
  });

  it("combines filter tags with AND logic", () => {
    const results = searchPrompts("", SAMPLE, ["React", "Authentication"]);
    assert.equal(results.length, 1);
    assert.equal(results[0]?.id, "1");
  });
});
