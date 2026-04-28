import { verifyToken } from "@/lib/jwt";

export async function getUserFromAuthorizationHeader(
  authorization: string | null,
): Promise<{ id: string; email: string } | null> {
  if (!authorization) return null;
  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;
  return { id: payload.sub, email: payload.email };
}

