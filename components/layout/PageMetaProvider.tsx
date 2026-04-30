"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useMemo, useState } from "react";

export type PageMetaState = { title: string; actions?: ReactNode };

type Ctx = {
  meta: PageMetaState;
  setMeta: (m: PageMetaState) => void;
};

const PageMetaContext = createContext<Ctx | null>(null);

export function PageMetaProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [meta, setMeta] = useState<PageMetaState>({ title: "" });
  const value = useMemo(() => ({ meta, setMeta }), [meta]);
  return <PageMetaContext.Provider value={value}>{children}</PageMetaContext.Provider>;
}

export function usePageMeta() {
  const ctx = useContext(PageMetaContext);
  if (!ctx) throw new Error("usePageMeta must be used within PageMetaProvider");
  return ctx;
}

