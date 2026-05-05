export const GOOD_ROLE_PATTERNS = [
  /\bact as\b/i,
  /\byou are\b/i,
  /\brole:\b/i,
  /\bpersona:\b/i,
];

export const GOOD_SECTION_PATTERNS = {
  goal: /\b(goal|task|objective)\b/i,
  requirements: /\b(requirements?|deliverables?)\b/i,
  constraints: /\b(constraints?|rules)\b/i,
  outputFormat: /\b(output format|response format|return|respond with|format)\b/i,
  examples: /\b(example|for example|e\.g\.)\b/i,
};

export const BAD_VAGUE_PATTERNS = [
  /\bmake (an?|the) app\b/i,
  /\bmake it\b/i,
  /\bdo it\b/i,
  /\bhelp\b/i,
  /\bimprove this\b/i,
  /\bfix this\b/i,
  /\bsomething\b/i,
  /\bstuff\b/i,
  /\bany(thing|one)\b/i,
];

export const VAGUE_WORDS = [
  "nice",
  "good",
  "better",
  "best",
  "fast",
  "simple",
  "robust",
  "optimize",
  "improve",
  "awesome",
  "cool",
];

export const TECH_KEYWORDS = [
  "next.js",
  "react",
  "typescript",
  "javascript",
  "node",
  "prisma",
  "postgres",
  "sql",
  "rest",
  "graphql",
  "docker",
  "kubernetes",
  "aws",
  "gcp",
  "azure",
  "oauth",
  "jwt",
  "redis",
  "tailwind",
  "zod",
  "openai",
];

export const OUTPUT_FORMAT_KEYWORDS = [
  "json",
  "markdown",
  "yaml",
  "xml",
  "csv",
  "table",
  "bullets",
  "bullet",
  "steps",
  "numbered",
  "schema",
];

