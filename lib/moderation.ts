import OpenAI from "openai";

export type ModerationDecision = {
  status: "approved" | "rejected" | "pending";
  reason: string;
  flagged: boolean;
  score?: number;
  raw?: unknown;
};

function maxNumber(values: unknown[]) {
  let m = 0;
  for (const v of values) {
    if (typeof v === "number" && Number.isFinite(v)) m = Math.max(m, v);
  }
  return m;
}

function summarizeCategories(categories: unknown) {
  if (!categories || typeof categories !== "object") return "";
  const entries = Object.entries(categories as Record<string, unknown>)
    .filter(([, v]) => v === true)
    .map(([k]) => k)
    .slice(0, 6);
  return entries.length ? entries.join(", ") : "";
}

export async function moderateContent(content: string): Promise<ModerationDecision> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return {
      status: "pending",
      reason: "Moderation unavailable (missing OPENAI_API_KEY).",
      flagged: true,
    };
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODERATION_MODEL || "omni-moderation-latest";

  try {
    const resp = await client.moderations.create({
      model,
      input: content,
    });

    const result = resp.results?.[0] as
      | { flagged?: boolean; categories?: unknown; category_scores?: unknown }
      | undefined;

    const flagged = Boolean(result?.flagged);
    const scores = result?.category_scores;
    const score =
      scores && typeof scores === "object"
        ? maxNumber(Object.values(scores as Record<string, unknown>))
        : undefined;

    const cats = summarizeCategories(result?.categories);

    // Simple production-friendly policy:
    // - not flagged => approved
    // - flagged with high confidence => rejected
    // - otherwise => pending review
    if (!flagged) {
      return {
        status: "approved",
        reason: "Passed automated moderation.",
        flagged: false,
        score,
        raw: resp,
      };
    }

    if ((score ?? 0) >= 0.8) {
      return {
        status: "rejected",
        reason: cats ? `Rejected by automated moderation (${cats}).` : "Rejected by automated moderation.",
        flagged: true,
        score,
        raw: resp,
      };
    }

    return {
      status: "pending",
      reason: cats ? `Flagged by automated moderation (${cats}).` : "Flagged by automated moderation.",
      flagged: true,
      score,
      raw: resp,
    };
  } catch (e) {
    console.error("[moderation] failed; defaulting to pending");
    console.error(e);
    return {
      status: "pending",
      reason: "Moderation temporarily unavailable. Sent for review.",
      flagged: true,
    };
  }
}

