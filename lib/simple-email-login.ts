import { z } from "zod";
import { Prisma, type UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const emailSchema = z.email().max(320);

export type SimpleLoginUser = {
  id: string;
  email: string;
  role: UserRole;
  name: string | null;
};

export type SimpleLoginResult =
  | { ok: true; user: SimpleLoginUser }
  | { ok: false; error: "invalid_email" | "inactive" };

/**
 * Find an active user by email, or create a new USER. Used when `SIMPLE_AUTH_MODE` is on.
 * Does not read or validate passwords.
 */
export async function simpleEmailLoginResolve(emailRaw: string): Promise<SimpleLoginResult> {
  const normalized = emailRaw.trim().toLowerCase();
  const parsed = emailSchema.safeParse(normalized);
  if (!parsed.success) return { ok: false, error: "invalid_email" };

  const email = parsed.data;
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, name: true, status: true },
  });

  if (existing) {
    if (existing.status !== "ACTIVE") return { ok: false, error: "inactive" };
    return {
      ok: true,
      user: {
        id: existing.id,
        email: existing.email,
        role: existing.role,
        name: existing.name,
      },
    };
  }

  try {
    const created = await prisma.user.create({
      data: { email, role: "USER" },
      select: { id: true, email: true, role: true, name: true },
    });

    return {
      ok: true,
      user: {
        id: created.id,
        email: created.email,
        role: created.role,
        name: created.name,
      },
    };
  } catch (e) {
    // Another request (e.g. signup + immediate sign-in) may have created the row first.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const raced = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, role: true, name: true, status: true },
      });
      if (raced?.status === "ACTIVE") {
        return {
          ok: true,
          user: {
            id: raced.id,
            email: raced.email,
            role: raced.role,
            name: raced.name,
          },
        };
      }
      if (raced) return { ok: false, error: "inactive" };
    }
    throw e;
  }
}
