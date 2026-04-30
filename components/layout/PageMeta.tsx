"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { usePageMeta } from "@/components/layout/PageMetaProvider";

export function PageMeta({
  title,
  actions,
}: Readonly<{ title: string; actions?: ReactNode }>) {
  const { setMeta } = usePageMeta();

  useEffect(() => {
    setMeta({ title, actions });
    return () => setMeta({ title: "", actions: undefined });
  }, [actions, setMeta, title]);

  return null;
}

