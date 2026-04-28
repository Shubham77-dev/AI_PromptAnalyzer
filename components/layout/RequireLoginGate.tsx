"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function RequireLoginGate() {
  const router = useRouter();

  useEffect(() => {
    toast.info("Please login to continue");
    const t = globalThis.setTimeout(() => router.replace("/login"), 1000);
    return () => globalThis.clearTimeout(t);
  }, [router]);

  return null;
}

