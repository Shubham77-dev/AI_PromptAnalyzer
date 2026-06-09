import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, "JWT_SECRET should be at least 32 characters"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
  OLLAMA_API_KEY: z.string().optional(),
  OLLAMA_MODEL: z.string().optional(),
  OLLAMA_BASE_URL: z.string().optional(),
});

let didLogEnvOnce = false;

function redactUrlPassword(url: string) {
  try {
    const u = new URL(url);
    if (u.password) u.password = "****";
    return u.toString();
  } catch {
    return "<invalid-url>";
  }
}

export function getEnv() {
  const parsed = EnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    OLLAMA_API_KEY: process.env.OLLAMA_API_KEY,
    OLLAMA_MODEL: process.env.OLLAMA_MODEL,
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
  });

  if (!parsed.success) {
    const message =
      "Invalid environment configuration:\n" +
      parsed.error.issues.map((i) => `- ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(message);
  }

  // Useful in dev when debugging "Database not reachable".
  // Note: Next.js only reloads env vars on server restart.
  if (!didLogEnvOnce && process.env.NODE_ENV !== "production") {
    didLogEnvOnce = true;
    console.log("[env] Loaded DATABASE_URL/DIRECT_URL (redacted). Restart dev server after editing .env.");
    console.log(`[env] DATABASE_URL=${redactUrlPassword(parsed.data.DATABASE_URL)}`);
    console.log(`[env] DIRECT_URL=${redactUrlPassword(parsed.data.DIRECT_URL)}`);
  }

  // Extra sanity checks for Supabase pooled vs direct URLs.
  if (!parsed.data.DATABASE_URL.startsWith("postgresql://")) {
    throw new Error("DATABASE_URL must start with postgresql://");
  }
  if (!parsed.data.DIRECT_URL.startsWith("postgresql://")) {
    throw new Error("DIRECT_URL must start with postgresql://");
  }

  try {
    const pooled = new URL(parsed.data.DATABASE_URL);
    const direct = new URL(parsed.data.DIRECT_URL);

    // Pooled typically uses pooler host + 6543 + pgbouncer flag.
    if (pooled.port !== "6543") {
      // Not fatal, but very common mistake for Supabase pooler.
      console.warn(
        `[env] DATABASE_URL port is ${pooled.port || "<default>"}. Supabase pooled is usually 6543.`,
      );
    }
    if (!pooled.searchParams.get("pgbouncer")) {
      console.warn(
        "[env] DATABASE_URL missing ?pgbouncer=true. Supabase pooled connections usually require it.",
      );
    }

    // Direct typically uses db.<ref>.supabase.co:5432
    if (direct.port !== "5432") {
      console.warn(
        `[env] DIRECT_URL port is ${direct.port || "<default>"}. Supabase direct is usually 5432.`,
      );
    }
  } catch {
    console.warn("[env] One of DATABASE_URL / DIRECT_URL is not a valid URL.");
    console.warn(`[env] DATABASE_URL=${redactUrlPassword(parsed.data.DATABASE_URL)}`);
    console.warn(`[env] DIRECT_URL=${redactUrlPassword(parsed.data.DIRECT_URL)}`);
  }

  return parsed.data;
}

