import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export const DAILY_LIMIT_GUEST = 3;
export const DAILY_LIMIT_USER = 20;

export function getUtcDay(d = new Date()) {
  const day = new Date(d);
  day.setUTCHours(0, 0, 0, 0);
  return day;
}

export function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || null;
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim() || null;
  return null;
}

export function hashIp(ip: string) {
  const salt = process.env.USAGE_LIMIT_SALT ?? "usage-limit";
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export async function checkAndIncrementDailyUsage(opts: {
  userId: string | null;
  ip: string | null;
  limit: number;
}) {
  const day = getUtcDay();

  const userId = opts.userId;
  if (userId) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.dailyUsage.findUnique({
        where: { day_userId: { day, userId } },
        select: { count: true },
      });

      if ((existing?.count ?? 0) >= opts.limit) {
        return { ok: false as const, remaining: 0, count: existing?.count ?? 0 };
      }

      const updated = existing
        ? await tx.dailyUsage.update({
            where: { day_userId: { day, userId } },
            data: { count: { increment: 1 } },
            select: { count: true },
          })
        : await tx.dailyUsage.create({
            data: { day, userId, count: 1 },
            select: { count: true },
          });

      return {
        ok: true as const,
        count: updated.count,
        remaining: Math.max(0, opts.limit - updated.count),
      };
    });
  }

  const ip = opts.ip ?? "unknown";
  const ipHash = hashIp(ip);

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.dailyUsage.findUnique({
      where: { day_ipHash: { day, ipHash } },
      select: { count: true },
    });

    if ((existing?.count ?? 0) >= opts.limit) {
      return { ok: false as const, remaining: 0, count: existing?.count ?? 0 };
    }

    const updated = existing
      ? await tx.dailyUsage.update({
          where: { day_ipHash: { day, ipHash } },
          data: { count: { increment: 1 } },
          select: { count: true },
        })
      : await tx.dailyUsage.create({
          data: { day, ipHash, count: 1 },
          select: { count: true },
        });

    return {
      ok: true as const,
      count: updated.count,
      remaining: Math.max(0, opts.limit - updated.count),
    };
  });
}

