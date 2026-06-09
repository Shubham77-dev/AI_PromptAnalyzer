import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cleanImprovedPrompt } from "./clean-improved-prompt";

const OLLAMA_DUPLICATE_EXAMPLE = `You are an expert assistant.

## Goal / Task
Role:
You are a frontend developer.
Goal:
Build a responsive login page using React 18 and Tailwind CSS 3 that authenticates users via JWT.
Context:
- The project is initialized with Vite (React template).
- JWT should be stored in localStorage under the key "authToken".
Constraints:
- Use only functional components with React hooks.
- Client-side validation: email required & proper format, password required & min 8 characters.
Output Format:
- Folder structure: src/components/Login.jsx
- Provide full source code for each file in fenced code blocks.

## Requirements
- Provide a precise, actionable answer.
- Ask clarifying questions only if truly necessary.

## Output format
- Use clear headings and bullet points.
- Include code blocks when relevant.`;

describe("cleanImprovedPrompt", () => {
  it("splits nested colon sections and removes generic filler duplicates", () => {
    const cleaned = cleanImprovedPrompt(OLLAMA_DUPLICATE_EXAMPLE);

    assert.match(cleaned, /^You are a frontend developer\./m);
    assert.doesNotMatch(cleaned, /You are an expert assistant/i);
    assert.doesNotMatch(cleaned, /Provide a precise, actionable answer/i);
    assert.doesNotMatch(cleaned, /Use clear headings and bullet points/i);
    assert.doesNotMatch(cleaned, /## Goal \/ Task/);
    assert.match(cleaned, /## Goal/);
    assert.match(cleaned, /Build a responsive login page/);
    assert.match(cleaned, /## Context/);
    assert.match(cleaned, /## Constraints/);
    assert.match(cleaned, /## Output format/);

    const headings = cleaned.match(/^## .+$/gm) ?? [];
    const uniqueHeadings = new Set(headings);
    assert.equal(headings.length, uniqueHeadings.size, "each section heading appears once");
  });

  it("dedupes identical bullets across merged sections", () => {
    const cleaned = cleanImprovedPrompt(`You are an expert assistant.

## Goal
Build a login page.

## Requirements
- Use React hooks.
- Use React hooks.

## Constraints
- Use React hooks.`);

    assert.equal((cleaned.match(/Use React hooks/gi) ?? []).length, 1);
  });

  it("applies the same cleanup shape for OpenAI-style markdown sections", () => {
    const cleaned = cleanImprovedPrompt(`## Role
You are a senior backend engineer.

## Goal
Design a REST API for user registration.

## Context
- Node.js 20 with Express
- PostgreSQL database

## Constraints
- Use JWT for auth tokens

## Output format
- OpenAPI 3.0 spec
- Example curl commands`);

    assert.match(cleaned, /^You are a senior backend engineer\./m);
    assert.match(cleaned, /## Goal/);
    assert.match(cleaned, /Design a REST API/);
    assert.doesNotMatch(cleaned, /## Role/);
    assert.doesNotMatch(cleaned, /expert assistant/i);
  });
});
