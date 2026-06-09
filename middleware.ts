import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const LOGIN = "/login";

const PROTECTED_PREFIXES = ["/dashboard", "/upload", "/settings", "/admin"] as const;

/**
 * Edge middleware must stay small (e.g. Vercel 1 MB limit). Do not import `@/auth` or
 * `auth.config` here — that pulls the full Auth.js + providers graph into the bundle.
 * Session is JWT-only; `getToken` decrypts the session cookie with `AUTH_SECRET`.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isProtected) return NextResponse.next();

  const secret = process.env.AUTH_SECRET ?? process.env.JWT_SECRET;
  if (!secret) {
    const url = req.nextUrl.clone();
    url.pathname = LOGIN;
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const useSecureCookies = req.nextUrl.protocol === "https:";
  const token = await getToken({
    req,
    secret,
    secureCookie: useSecureCookies,
  });

  if (pathname === "/dashboard" && token?.role === "ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  if (!token?.sub) {
    const url = req.nextUrl.clone();
    url.pathname = LOGIN;
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.set("error", "access_denied");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/upload/:path*", "/settings/:path*", "/admin/:path*"],
};
