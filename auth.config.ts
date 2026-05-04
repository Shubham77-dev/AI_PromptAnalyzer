import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import type { UserRole } from "@prisma/client";
import { SIMPLE_AUTH_MODE } from "@/lib/auth-flags";

const CredentialsSchema = z.object({
  email: z.email().max(320),
  password: z.string().min(1).max(256),
});

/** When `SIMPLE_AUTH_MODE`, password is ignored by `authorize` but may be sent as empty from the client. */
const SimpleCredentialsSchema = z.object({
  email: z.email().max(320),
  password: z.string().max(256).optional().default(""),
});

function providers(): NextAuthConfig["providers"] {
  const list: NextAuthConfig["providers"] = [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (SIMPLE_AUTH_MODE) {
          const raw = credentials as Record<string, unknown> | undefined;
          const parsed = SimpleCredentialsSchema.safeParse({
            email: typeof raw?.email === "string" ? raw.email : "",
            password: typeof raw?.password === "string" ? raw.password : "",
          });
          if (!parsed.success) return null;
          // Dynamic import keeps `pg`/Prisma out of the Edge middleware bundle (middleware imports `auth` → this file).
          const { simpleEmailLoginResolve } = await import("@/lib/simple-email-login");
          const result = await simpleEmailLoginResolve(parsed.data.email);
          if (!result.ok) return null;
          return {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            role: result.user.role,
          };
        }

        const parsed = CredentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const [{ default: bcrypt }, { prisma }] = await Promise.all([
          import("bcryptjs"),
          import("@/lib/prisma"),
        ]);

        const email = parsed.data.email.toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            role: true,
            name: true,
            password: true,
            status: true,
          },
        });

        if (!user || user.status !== "ACTIVE" || !user.password) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.password);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ];

  const googleId = process.env.GOOGLE_CLIENT_ID;
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (googleId && googleSecret) {
    list.unshift(
      Google({
        clientId: googleId,
        clientSecret: googleSecret,
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }

  return list;
}

export default {
  trustHost: true,
  // Keep in sync with `app/api/auth/[...nextauth]/route.ts` and SessionProvider. Prevents AUTH_URL pathname from overriding this.
  basePath: "/api/auth",
  secret: process.env.AUTH_SECRET ?? process.env.JWT_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/login" },
  providers: providers(),
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const { prisma } = await import("@/lib/prisma");
      const email = user.email.toLowerCase();
      const existing = await prisma.user.findUnique({
        where: { email },
        select: { status: true },
      });
      if (existing?.status === "SUSPENDED") return false;
      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && user?.email) {
        const { prisma } = await import("@/lib/prisma");
        const email = user.email.toLowerCase();
        const dbUser = await prisma.user.upsert({
          where: { email },
          create: {
            email,
            name: user.name ?? null,
            password: null,
          },
          update: {
            name: user.name ?? undefined,
          },
          select: { id: true, email: true, role: true, name: true },
        });
        token.sub = dbUser.id;
        token.email = dbUser.email;
        token.role = dbUser.role;
        token.name = dbUser.name ?? undefined;
        return token;
      }

      if (account?.provider === "credentials" && user) {
        const u = user as { id: string; email: string; role: UserRole; name?: string | null };
        token.sub = u.id;
        token.email = u.email;
        token.role = u.role;
        token.name = u.name ?? undefined;
        return token;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.sub === "string" ? token.sub : "";
        const role = token.role;
        session.user.role =
          role === "ADMIN" || role === "USER" ? role : "USER";
        if (typeof token.email === "string") session.user.email = token.email;
        if (typeof token.name === "string" && token.name) session.user.name = token.name;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
