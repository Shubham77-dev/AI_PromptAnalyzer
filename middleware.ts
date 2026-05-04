import { NextResponse } from "next/server";
import { auth } from "@/auth";

const LOGIN = "/login";

const PROTECTED_PREFIXES = ["/dashboard", "/upload", "/settings", "/admin"] as const;

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isProtected) return NextResponse.next();

  // Admins defaulting to /dashboard (e.g. Google OAuth) should land in the admin app.
  if (pathname === "/dashboard" && req.auth?.user?.role === "ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  if (!req.auth) {
    const url = req.nextUrl.clone();
    url.pathname = LOGIN;
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/upload/:path*", "/settings/:path*", "/admin/:path*"],
};
