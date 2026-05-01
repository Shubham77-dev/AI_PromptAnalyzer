import { prisma } from "@/lib/prisma";
import { ButtonOutline } from "@/components/ui/ButtonOutline";
import { Card } from "@/components/ui/Card";

function fmtDateTime(d: Date) {
  return d.toISOString().slice(0, 19).replace("T", " ");
}

export async function UserDetailPanel({
  userId,
  closeHref,
}: Readonly<{
  userId: string;
  closeHref: string;
}>) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, status: true, plan: true, createdAt: true },
  });

  if (!user) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
        style={{ background: "var(--pa-overlay)" }}
      >
        <Card className="w-full max-w-2xl">
          <div className="flex items-center justify-between gap-3 p-5">
            <div className="text-sm font-semibold" style={{ color: "var(--pa-text)" }}>
              User not found
            </div>
            <ButtonOutline href={closeHref}>Close</ButtonOutline>
          </div>
        </Card>
      </div>
    );
  }

  const [promptTotal, promptPublished, promptDrafts, promptUnderReview, likesGiven] = await Promise.all([
    prisma.prompt.count({ where: { userId: user.id } }),
    prisma.prompt.count({ where: { userId: user.id, status: "PUBLISHED" } }),
    prisma.prompt.count({ where: { userId: user.id, status: "DRAFT" } }),
    prisma.prompt.count({ where: { userId: user.id, status: "UNDER_REVIEW" } }),
    prisma.like.count({ where: { userId: user.id } }),
  ]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
      style={{ background: "var(--pa-overlay)" }}
    >
      <Card className="w-full max-w-2xl">
        <div className="p-5">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div
                className="truncate text-base font-semibold"
                style={{ color: "var(--pa-text)" }}
              >
                {user.email}
              </div>
              <div
                className="mt-1 flex flex-wrap items-center gap-2 text-xs"
                style={{ color: "var(--pa-muted)" }}
              >
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 font-semibold"
                  style={{
                    background: "var(--pa-hint)",
                    border: "1px solid var(--pa-card-border)",
                  }}
                >
                  Role: {user.role}
                </span>
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 font-semibold"
                  style={{
                    background: "var(--pa-hint)",
                    border: "1px solid var(--pa-card-border)",
                  }}
                >
                  Plan: {user.plan}
                </span>
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 font-semibold"
                  style={{
                    background:
                      user.status === "ACTIVE"
                        ? "color-mix(in srgb, var(--pa-acc2) 15%, transparent)"
                        : "color-mix(in srgb, var(--pa-acc3) 15%, transparent)",
                    color: user.status === "ACTIVE" ? "var(--pa-acc2)" : "var(--pa-acc3)",
                    border:
                      user.status === "ACTIVE"
                        ? "1px solid color-mix(in srgb, var(--pa-acc2) 35%, transparent)"
                        : "1px solid color-mix(in srgb, var(--pa-acc3) 35%, transparent)",
                  }}
                >
                  Status: {user.status}
                </span>
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 font-semibold"
                  style={{
                    background: "var(--pa-hint)",
                    border: "1px solid var(--pa-card-border)",
                  }}
                >
                  Joined: {fmtDateTime(user.createdAt)}
                </span>
              </div>
            </div>

            <ButtonOutline href={closeHref} className="shrink-0">
              Close
            </ButtonOutline>
          </div>

          {/* Stats Grid */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {/* Prompts Card */}
            <div
              className="rounded-xl p-4"
              style={{
                background: "var(--pa-hint)",
                border: "1px solid var(--pa-card-border)",
              }}
            >
              <div
                className="text-xs font-semibold"
                style={{ color: "var(--pa-muted)" }}
              >
                Prompts
              </div>
              <div
                className="mt-1 text-2xl font-semibold"
                style={{ color: "var(--pa-text)" }}
              >
                {promptTotal}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div
                  className="rounded-lg p-2"
                  style={{
                    background: "var(--pa-card)",
                    border: "1px solid var(--pa-card-border)",
                  }}
                >
                  <div
                    className="font-semibold"
                    style={{ color: "var(--pa-text)" }}
                  >
                    {promptPublished}
                  </div>
                  <div style={{ color: "var(--pa-muted)" }}>Published</div>
                </div>
                <div
                  className="rounded-lg p-2"
                  style={{
                    background: "var(--pa-card)",
                    border: "1px solid var(--pa-card-border)",
                  }}
                >
                  <div
                    className="font-semibold"
                    style={{ color: "var(--pa-text)" }}
                  >
                    {promptDrafts}
                  </div>
                  <div style={{ color: "var(--pa-muted)" }}>Drafts</div>
                </div>
                <div
                  className="rounded-lg p-2"
                  style={{
                    background: "var(--pa-card)",
                    border: "1px solid var(--pa-card-border)",
                  }}
                >
                  <div
                    className="font-semibold"
                    style={{ color: "var(--pa-text)" }}
                  >
                    {promptUnderReview}
                  </div>
                  <div style={{ color: "var(--pa-muted)" }}>Review</div>
                </div>
              </div>
            </div>

            {/* Engagement Card */}
            <div
              className="rounded-xl p-4"
              style={{
                background: "var(--pa-hint)",
                border: "1px solid var(--pa-card-border)",
              }}
            >
              <div
                className="text-xs font-semibold"
                style={{ color: "var(--pa-muted)" }}
              >
                Engagement
              </div>
              <div
                className="mt-1 text-2xl font-semibold"
                style={{ color: "var(--pa-text)" }}
              >
                {likesGiven}
              </div>
              <div
                className="mt-1 text-xs"
                style={{ color: "var(--pa-muted)" }}
              >
                Likes given
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

