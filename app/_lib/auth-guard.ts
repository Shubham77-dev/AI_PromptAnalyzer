"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { getSession } from "next-auth/react";
import { toast } from "sonner";

export async function isAuthenticated() {
  const session = await getSession();
  return Boolean(session?.user);
}

export async function requireAuth(
  action: () => void | Promise<void>,
  opts: {
    router: AppRouterInstance;
    redirectTo?: string;
    delayMs?: number;
    message?: string;
  },
) {
  if (await isAuthenticated()) {
    await action();
    return true;
  }

  toast.info(opts.message ?? "Please login to continue");
  const delayMs = opts.delayMs ?? 1000;
  globalThis.setTimeout(() => {
    opts.router.push(opts.redirectTo ?? "/login");
  }, delayMs);
  return false;
}
