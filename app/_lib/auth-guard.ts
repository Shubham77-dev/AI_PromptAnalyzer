"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";

const LOCAL_TOKEN_KEY = "pl_token";

function getCookie(name: string) {
  if (globalThis.window === undefined) return null;
  const cookies = globalThis.document?.cookie ?? "";
  const parts = cookies.split(";").map((p) => p.trim());
  for (const p of parts) {
    if (!p) continue;
    const eq = p.indexOf("=");
    if (eq === -1) continue;
    const k = p.slice(0, eq);
    const v = p.slice(eq + 1);
    if (k === name) return decodeURIComponent(v);
  }
  return null;
}

export function getAuthToken() {
  if (globalThis.window === undefined) return null;
  return globalThis.localStorage.getItem(LOCAL_TOKEN_KEY);
}

export function isAuthenticated() {
  // Prefer localStorage token (used for bearer auth in some routes),
  // but also allow a readable cookie token if present.
  const token = getAuthToken();
  if (token) return true;

  // `pl_session` is httpOnly in this repo (not readable in JS),
  // but keeping cookie check makes the helper compatible if that changes.
  return Boolean(getCookie("pl_token") || getCookie("pl_session"));
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
  if (isAuthenticated()) {
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

