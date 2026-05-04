import { NextResponse } from "next/server";
import { z } from "zod";
import { SIMPLE_AUTH_MODE } from "@/lib/auth-flags";
import { simpleEmailLoginResolve } from "@/lib/simple-email-login";

const BodySchema = z.object({
  email: z.string().max(320),
});

/**
 * Email-only login helper when `SIMPLE_AUTH_MODE` is enabled.
 * Session cookies are still created via `signIn("credentials", …)` on the client.
 */
export async function POST(req: Request) {
  if (!SIMPLE_AUTH_MODE) {
    return NextResponse.json(
      { error: "Simple login API is disabled when SIMPLE_AUTH_MODE is false." },
      { status: 503 },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = await simpleEmailLoginResolve(parsed.data.email);
  if (!result.ok) {
    const status = result.error === "invalid_email" ? 400 : 403;
    const message =
      result.error === "invalid_email" ? "Invalid email address." : "Account is not active.";
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({ user: result.user });
}
