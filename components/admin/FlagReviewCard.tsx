import Link from "next/link";
import { adminIgnoreFlag, adminRemovePrompt, adminSuspendUser, adminUnpublishPrompt } from "@/app/admin/actions";

export type FlagKind = "low" | "ambiguous" | "abuse";

export interface FlagReviewCardProps {
  promptId: string;
  userId: string;
  email: string;
  content: string;
  score: number | null;
  kind: FlagKind;
}

function orb(kind: FlagKind) {
  if (kind === "low") {
    return {
      bg: "color-mix(in srgb, var(--pa-acc1) 15%, transparent)",
      border: "1px solid color-mix(in srgb, var(--pa-acc1) 30%, transparent)",
      node: (
        <svg width={16} height={16} viewBox="0 0 16 16" aria-hidden>
          <circle cx="8" cy="8" r="6.5" stroke="var(--pa-acc1)" strokeWidth={1.2} fill="none" />
          <path d="M8 11v-1M8 5.5V9" stroke="var(--pa-acc1)" strokeWidth={1.2} strokeLinecap="round" />
        </svg>
      ),
    };
  }
  if (kind === "ambiguous") {
    return {
      bg: "color-mix(in srgb, var(--pa-acc4) 15%, transparent)",
      border: "1px solid color-mix(in srgb, var(--pa-acc4) 30%, transparent)",
      node: (
        <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M3 2v12M3 2h9l-2 4 2 4H3" stroke="var(--pa-acc4)" strokeWidth={1.2} strokeLinecap="round" />
        </svg>
      ),
    };
  }
  return {
    bg: "color-mix(in srgb, var(--pa-acc3) 15%, transparent)",
    border: "1px solid color-mix(in srgb, var(--pa-acc3) 30%, transparent)",
    node: (
      <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M8 4v5M8 11h.01" stroke="var(--pa-acc3)" strokeWidth={1.2} strokeLinecap="round" />
        <circle cx="8" cy="8" r="6" stroke="var(--pa-acc3)" strokeWidth={1.2} />
      </svg>
    ),
  };
}

function pill(kind: FlagKind) {
  if (kind === "low") {
    return {
      t: "Low score",
      bg: "color-mix(in srgb, var(--pa-acc4) 15%, transparent)",
      c: "var(--pa-acc4)",
      b: "color-mix(in srgb, var(--pa-acc4) 30%, transparent)",
    };
  }
  if (kind === "ambiguous") {
    return {
      t: "Ambiguous",
      bg: "color-mix(in srgb, var(--pa-acc4) 15%, transparent)",
      c: "var(--pa-acc4)",
      b: "color-mix(in srgb, var(--pa-acc4) 30%, transparent)",
    };
  }
  return {
    t: "Abuse",
    bg: "color-mix(in srgb, var(--pa-acc3) 15%, transparent)",
    c: "var(--pa-acc3)",
    b: "color-mix(in srgb, var(--pa-acc3) 30%, transparent)",
  };
}

export function FlagReviewCard({ promptId, userId, email, content, score, kind }: Readonly<FlagReviewCardProps>) {
  const o = orb(kind);
  const p = pill(kind);
  const preview = content.length > 160 ? `${content.slice(0, 159)}…` : content;
  const s = typeof score === "number" && Number.isFinite(score) ? Math.round(score) : "—";
  return (
    <div className="flex gap-2.5 px-3.5 py-3">
      <div className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg" style={{ background: o.bg, border: o.border }}>
        {o.node}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium" style={{ color: "var(--pa-text)" }}>
          {kind === "abuse" ? "API rate limit abuse" : kind === "ambiguous" ? "Contradictory image prompt" : "Low-quality prompt published"}
        </div>
        <div className="mt-0.5 text-[10px] leading-snug" style={{ color: "var(--pa-muted)" }}>
          {kind === "abuse"
            ? `${email} exceeded automated usage thresholds. Account currently active.`
            : `"${preview}" — score ${s}/100. User: ${email.split("@")[0] ?? email}`}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <Link
            href={kind === "abuse" ? "/admin/users" : `/admin/prompts?view=${encodeURIComponent(promptId)}`}
            className="pa-fb inline-flex items-center"
          >
            {kind === "abuse" ? "View user" : "View prompt/user"}
          </Link>
          <form action={adminIgnoreFlag} className="inline">
            <input type="hidden" name="promptId" value={promptId} />
            <button type="submit" className="pa-fb">
              Ignore flag
            </button>
          </form>
          {kind === "abuse" ? (
            <form action={adminSuspendUser} className="inline">
              <input type="hidden" name="userId" value={userId} />
              <button type="submit" className="pa-fb pa-fb-red">
                Suspend account
              </button>
            </form>
          ) : kind === "ambiguous" ? (
            <form action={adminRemovePrompt} className="inline">
              <input type="hidden" name="promptId" value={promptId} />
              <button type="submit" className="pa-fb pa-fb-red">
                Remove
              </button>
            </form>
          ) : (
            <form action={adminUnpublishPrompt} className="inline">
              <input type="hidden" name="promptId" value={promptId} />
              <button type="submit" className="pa-fb pa-fb-red">
                Unpublish
              </button>
            </form>
          )}
        </div>
      </div>
      <div className="shrink-0 self-start">
        <span className="pa-score-pill" style={{ background: p.bg, color: p.c, border: `1px solid ${p.b}` }}>
          {p.t}
        </span>
      </div>
    </div>
  );
}
