import { verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/rbac";

export async function getUserFromAuthorizationHeader(
  authorization: string | null,
): Promise<CurrentUser | null> {
  if (!authorization) return null;
  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true },
    });
    return user ? (user as CurrentUser) : null;
  } catch {
    return null;
  }
}

