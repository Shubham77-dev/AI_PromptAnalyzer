import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { prismaKnownRequestResponse } from "@/lib/prisma-errors";
import { validatePasswordStrength } from "@/lib/password-policy";

const BodySchema = z.object({
  email: z.email().max(320),
  password: z.string().min(8).max(256),
  name: z.string().trim().min(1).max(120).optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const config = await prisma.appConfig.findUnique({ where: { id: 1 } }).catch(() => null);
    if (config && !config.allowPublicRegistration) {
      return NextResponse.json({ error: "Registration is currently disabled." }, { status: 403 });
    }

    const email = parsed.data.email.toLowerCase();
    const strength = validatePasswordStrength(parsed.data.password);
    if (!strength.ok) {
      return NextResponse.json({ error: strength.error }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        name: parsed.data.name?.trim() || null,
        role: "USER",
      },
      select: { id: true, email: true },
    });

    return NextResponse.json({ ok: true, message: "Account created. You can sign in." });
  } catch (e) {
    const mapped = prismaKnownRequestResponse(e);
    if (mapped) {
      return NextResponse.json(mapped.body, { status: mapped.status });
    }

    const code = typeof e === "object" && e !== null && "code" in e ? String((e as { code: string }).code) : "";
    if (code === "P2002") {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    console.error("[auth/signup]", e);
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
