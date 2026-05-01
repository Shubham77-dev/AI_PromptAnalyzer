import { prisma } from "@/lib/prisma";
import { adminRemovePrompt } from "@/app/admin/actions";
import { PublishToggle } from "@/components/admin/PublishToggle";
import { Card } from "@/components/ui/Card";
import { ButtonOutline } from "@/components/ui/ButtonOutline";
import { UserAvatar } from "@/components/ui/UserAvatar";

export type AdminPromptsSearchParams = {
  status?: "PUBLISHED" | "DRAFT" | "UNDER_REVIEW" | "all";
  minScore?: string;
  maxScore?: string;
  page?: string;
};

function truncate(s: string, max = 140) {
  const t = s.trim();
  if (t.length <= max) return t;
  return t.slice(0, Math.max(0, max - 1)).trimEnd() + "…";
}

function parsePage(page: string | undefined) {
  const n = Number(page ?? "1");
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function parseScore(v: string | undefined) {
  if (!v) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, n));
}

function effectiveScore(p: { score: number | null; analysis: { accuracy: number | null } | null }) {
  if (typeof p.score === "number" && Number.isFinite(p.score)) return Math.round(p.score);
  const acc = p.analysis?.accuracy;
  return typeof acc === "number" && Number.isFinite(acc) ? acc : null;
}

function initials(email: string) {
  const name = email.split("@")[0] ?? email;
  const a = name[0] ?? "U";
  const b = name[1] ?? "";
  return (a + b).toUpperCase();
}

function labelFromEmail(email: string) {
  const local = email.split("@")[0] ?? email;
  return local.replace(/[._]/g, " ").trim() || email;
}

function scoreColor(score: number) {
  if (score >= 80) return "var(--pa-acc2)";
  if (score >= 50) return "var(--pa-acc1)";
  return "var(--pa-acc4)";
}

function HeartIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" aria-hidden style={{ color: "var(--pa-muted)" }}>
      <path
        d="M12 21s-7.2-4.6-9.6-9.1C.7 8.7 2.6 5.5 6 5.1c1.8-.2 3.6.6 4.6 2 1-1.4 2.8-2.2 4.6-2 3.4.4 5.3 3.6 3.6 6.8C19.2 16.4 12 21 12 21Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

function listParams(sp: Readonly<AdminPromptsSearchParams>, pageNum: number) {
  const p = new URLSearchParams();
  if (sp.status && sp.status !== "all") p.set("status", sp.status);
  if (sp.minScore?.trim()) p.set("minScore", sp.minScore.trim());
  if (sp.maxScore?.trim()) p.set("maxScore", sp.maxScore.trim());
  if (pageNum > 1) p.set("page", String(pageNum));
  return p;
}

function viewHref(sp: Readonly<AdminPromptsSearchParams>, promptId: string) {
  const p = listParams(sp, parsePage(sp.page));
  p.set("view", promptId);
  return `/admin/prompts?${p.toString()}`;
}

export async function PromptTable({ searchParams }: Readonly<{ searchParams: AdminPromptsSearchParams }>) {
  const pageSize = 20;
  const page = parsePage(searchParams.page);
  const status = searchParams.status ?? "all";
  const minScore = parseScore(searchParams.minScore);
  const maxScore = parseScore(searchParams.maxScore);

  const where = {
    ...(status !== "all" ? { status } : null),
    ...(minScore != null || maxScore != null
      ? {
          score: {
            ...(minScore != null ? { gte: minScore } : null),
            ...(maxScore != null ? { lte: maxScore } : null),
          },
        }
      : null),
  };

  const [total, prompts] = await Promise.all([
    prisma.prompt.count({ where }),
    prisma.prompt.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: {
        id: true,
        content: true,
        status: true,
        score: true,
        flagged: true,
        user: { select: { email: true } },
        analysis: { select: { accuracy: true, clarity: true } },
        stats: { select: { likes: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Card>
      <div style={{ borderBottom: "1px solid var(--pa-card-border)" }} className="p-4">
        <form className="grid gap-3 md:flex md:flex-wrap md:items-end" action="/admin/prompts" method="GET">
          <div className="md:w-auto">
            <div className="text-xs font-semibold" style={{ color: "var(--pa-muted)" }}>
              Status
            </div>
            <select
              name="status"
              defaultValue={status}
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none md:w-auto"
              style={{
                border: "1px solid var(--pa-card-border)",
                background: "var(--pa-card)",
                color: "var(--pa-text)",
              }}
            >
              <option value="all">All</option>
              <option value="PUBLISHED">Published</option>
              <option value="UNDER_REVIEW">Under review</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3 md:flex md:items-end">
            <div className="min-w-0">
              <div className="text-xs font-semibold" style={{ color: "var(--pa-muted)" }}>
                Min score
              </div>
              <input
                name="minScore"
                inputMode="numeric"
                defaultValue={searchParams.minScore ?? ""}
                className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none md:w-[120px]"
                style={{
                  border: "1px solid var(--pa-card-border)",
                  background: "var(--pa-card)",
                  color: "var(--pa-text)",
                }}
                placeholder="0"
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold" style={{ color: "var(--pa-muted)" }}>
                Max score
              </div>
              <input
                name="maxScore"
                inputMode="numeric"
                defaultValue={searchParams.maxScore ?? ""}
                className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none md:w-[120px]"
                style={{
                  border: "1px solid var(--pa-card-border)",
                  background: "var(--pa-card)",
                  color: "var(--pa-text)",
                }}
                placeholder="100"
              />
            </div>
          </div>
          <button
            type="submit"
            className="pa-btn-transition rounded-lg px-3 py-2 text-sm font-semibold"
            style={{ backgroundImage: "var(--pa-grad)", color: "#fff" }}
          >
            Apply
          </button>
          <div className="text-xs md:ml-auto" style={{ color: "var(--pa-muted)" }}>
            {total} prompts • page {page} / {totalPages}
          </div>
        </form>
      </div>

      {/* Mobile-first: cards. Desktop: table. */}
      <div className="grid gap-3 p-4 md:hidden">
        {prompts.map((p) => {
          const likes = p.stats?.likes ?? 0;
          const score = effectiveScore({ score: p.score ?? null, analysis: { accuracy: p.analysis?.accuracy ?? null } });
          const canPublish = typeof score === "number" && score >= 50;
          return (
            <div
              key={p.id}
              className="rounded-xl p-4"
              style={{ background: "var(--pa-hint)", border: "1px solid var(--pa-card-border)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold" style={{ color: "var(--pa-text)" }}>
                    {p.user.email}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{
                        background: p.flagged
                          ? "color-mix(in srgb, var(--pa-acc4) 16%, transparent)"
                          : p.status === "PUBLISHED"
                            ? "color-mix(in srgb, var(--pa-acc2) 16%, transparent)"
                            : "transparent",
                        border: "1px solid var(--pa-card-border)",
                        color: p.flagged ? "var(--pa-acc4)" : p.status === "PUBLISHED" ? "var(--pa-acc2)" : "var(--pa-muted)",
                      }}
                    >
                      {p.flagged ? "Flagged" : p.status === "PUBLISHED" ? "Published" : "Draft"}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{ background: "transparent", border: "1px solid var(--pa-card-border)", color: "var(--pa-muted)" }}
                    >
                      <HeartIcon /> {likes}
                    </span>
                    {typeof score === "number" ? (
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{
                          background: "transparent",
                          border: "1px solid var(--pa-card-border)",
                          color: scoreColor(score),
                        }}
                      >
                        score: {score}
                      </span>
                    ) : null}
                  </div>
                </div>
                <ButtonOutline href={viewHref(searchParams, p.id)}>View</ButtonOutline>
              </div>

              <div
                className="mt-3 max-h-36 overflow-hidden whitespace-pre-wrap break-words text-sm leading-6"
                style={{ color: "var(--pa-text)" }}
              >
                <span style={{ fontFamily: "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace", color: "var(--pa-muted)" }}>
                  {truncate(p.content, 320)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="flex-1">
                  <PublishToggle
                    promptId={p.id}
                    status={p.status}
                    size="md"
                    disabled={!canPublish && p.status !== "PUBLISHED"}
                    disabledReason={!canPublish ? "Publish requires score ≥ 50" : undefined}
                  />
                </div>
                <form action={adminRemovePrompt} className="flex-1">
                  <input type="hidden" name="promptId" value={p.id} />
                  <button type="submit" className="pa-admin-suspend w-full">
                    Remove
                  </button>
                </form>
              </div>
            </div>
          );
        })}
        {prompts.length === 0 ? (
          <div
            className="rounded-xl p-6 text-center text-sm"
            style={{ color: "var(--pa-muted)", background: "var(--pa-hint)", border: "1px solid var(--pa-card-border)" }}
          >
            No prompts found.
          </div>
        ) : null}
      </div>

      <div className="hidden overflow-auto md:block">
        <table className="min-w-[1100px] w-full text-left text-sm">
          <thead>
            <tr>
              {(["Prompt", "Author", "Score", "Likes", "Status", "Actions"] as const).map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 font-semibold uppercase tracking-wide"
                  style={{ fontSize: 10, color: "var(--pa-muted)", background: "var(--pa-hint)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {prompts.map((p) => {
              const likes = p.stats?.likes ?? 0;
              const score = effectiveScore({ score: p.score ?? null, analysis: { accuracy: p.analysis?.accuracy ?? null } });
              const canPublish = typeof score === "number" && score >= 50;
              const authorEmail = p.user.email;
              const authorLabel = labelFromEmail(authorEmail);
              const isFlagged = Boolean(p.flagged);
              const statusLabel = isFlagged ? "Flagged" : p.status === "PUBLISHED" ? "Published" : "Draft";
              const statusStyle = isFlagged
                ? {
                    background: "color-mix(in srgb, var(--pa-acc4) 14%, transparent)",
                    color: "var(--pa-acc4)",
                    border: "1px solid color-mix(in srgb, var(--pa-acc4) 35%, transparent)",
                  }
                : p.status === "PUBLISHED"
                  ? {
                      background: "color-mix(in srgb, var(--pa-acc2) 14%, transparent)",
                      color: "var(--pa-acc2)",
                      border: "1px solid color-mix(in srgb, var(--pa-acc2) 35%, transparent)",
                    }
                  : {
                      background: "transparent",
                      color: "var(--pa-muted)",
                      border: "1px solid var(--pa-card-border)",
                    };
              return (
                <tr
                  key={p.id}
                  className="pa-transition hover:bg-[var(--pa-hint)]"
                  style={{ borderBottom: "1px solid var(--pa-card-border)" }}
                >
                  <td className="px-4 py-3">
                    <div
                      className="truncate"
                      style={{
                        fontFamily: "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace",
                        fontSize: 12,
                        color: "var(--pa-muted)",
                        maxWidth: 520,
                      }}
                      title={p.content}
                    >
                      {truncate(p.content, 180)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <UserAvatar initials={initials(authorEmail)} size="sm" />
                      <div className="min-w-0">
                        <div className="truncate" style={{ fontSize: 11, fontWeight: 500, color: "var(--pa-text)" }}>
                          {authorLabel}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {typeof score === "number" ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="overflow-hidden rounded"
                          style={{ width: 60, height: 3, background: "var(--pa-hint)" }}
                        >
                          <div
                            style={{
                              width: `${Math.max(0, Math.min(100, score))}%`,
                              height: 3,
                              borderRadius: 3,
                              background: scoreColor(score),
                              transition: "width 0.25s ease",
                            }}
                          />
                        </div>
                        <span className="tabular-nums" style={{ fontSize: 11, color: "var(--pa-text)" }}>
                          {score}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: "var(--pa-muted)" }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1" style={{ fontSize: 11, color: "var(--pa-muted)" }}>
                      <HeartIcon />
                      <span className="tabular-nums">{likes}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 font-semibold" style={{ fontSize: 10, ...statusStyle }}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <ButtonOutline href={viewHref(searchParams, p.id)}>View</ButtonOutline>
                      <PublishToggle
                        promptId={p.id}
                        status={p.status}
                        disabled={!canPublish && p.status !== "PUBLISHED"}
                        disabledReason={!canPublish ? "Publish requires score ≥ 50" : undefined}
                      />
                      <form action={adminRemovePrompt}>
                        <input type="hidden" name="promptId" value={p.id} />
                        <button type="submit" className="pa-admin-suspend">
                          Remove
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {prompts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center" style={{ fontSize: 12, color: "var(--pa-muted)" }}>
                  No prompts found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div
        className="flex items-center justify-between gap-2 p-4 text-sm"
        style={{ borderTop: "1px solid var(--pa-card-border)" }}
      >
        <ButtonOutline
          href={
            page <= 1
              ? undefined
              : `/admin/prompts?${new URLSearchParams({
                  status: status,
                  minScore: searchParams.minScore ?? "",
                  maxScore: searchParams.maxScore ?? "",
                  page: String(Math.max(1, page - 1)),
                }).toString()}`
          }
          disabled={page <= 1}
        >
          Prev
        </ButtonOutline>
        <ButtonOutline
          href={
            page >= totalPages
              ? undefined
              : `/admin/prompts?${new URLSearchParams({
                  status: status,
                  minScore: searchParams.minScore ?? "",
                  maxScore: searchParams.maxScore ?? "",
                  page: String(Math.min(totalPages, page + 1)),
                }).toString()}`
          }
          disabled={page >= totalPages}
        >
          Next
        </ButtonOutline>
      </div>
    </Card>
  );
}

