function appOriginFromRequest(req: Request): string {
  const fromEnv = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;

  return "http://localhost:3000";
}

export function buildPasswordResetUrl(req: Request, rawToken: string): string {
  const base = appOriginFromRequest(req);
  const path = `/reset-password?token=${encodeURIComponent(rawToken)}`;
  return `${base}${path}`;
}

export async function sendPasswordResetEmail(
  req: Request,
  to: string,
  rawToken: string,
): Promise<{ ok: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[email] RESEND_API_KEY is not set; password reset email was not sent.");
    }
    return { ok: false };
  }

  const resetUrl = buildPasswordResetUrl(req, rawToken);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Reset your password",
      html: `
        <p>You requested a password reset.</p>
        <p><a href="${resetUrl}">Set a new password</a> (expires in 15 minutes).</p>
        <p>If you did not request this, you can ignore this email.</p>
      `.trim(),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[email] Resend error:", res.status, text.slice(0, 500));
    return { ok: false };
  }

  return { ok: true };
}
