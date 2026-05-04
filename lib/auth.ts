import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/rbac";
import { getUserFromAuthorizationHeader } from "@/lib/auth-header";

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    });

    if (!user) return null;
    return user as CurrentUser;
  } catch {
    return null;
  }
}

/** Cookie session first; falls back to legacy Bearer JWT (e.g. older API clients). */
export async function getCurrentUserOrBearer(req: Request): Promise<CurrentUser | null> {
  const fromCookie = await getCurrentUser();
  if (fromCookie) return fromCookie;
  return getUserFromAuthorizationHeader(req.headers.get("authorization"));
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
