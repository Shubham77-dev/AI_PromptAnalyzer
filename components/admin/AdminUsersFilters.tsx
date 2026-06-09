"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FilterTag } from "@/components/ui/FilterTag";
import { SearchBar } from "@/components/ui/SearchBar";

type Tag = "all" | "active" | "pro" | "free" | "flagged";

function deriveActiveTag(plan: string, status: string, flagged: boolean): Tag | null {
  if (flagged) return "flagged";
  if (status === "ACTIVE" && plan === "all") return "active";
  if (plan === "PRO") return "pro";
  if (plan === "FREE") return "free";
  if (plan === "all" && status === "all") return "all";
  return null;
}

export function AdminUsersFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(() => sp.get("q") ?? "");

  useEffect(() => {
    setQ(sp.get("q") ?? "");
  }, [sp]);

  const flagged = sp.get("flagged") === "1";
  const plan = sp.get("plan") ?? "all";
  const status = sp.get("status") ?? "all";
  const activeTag = deriveActiveTag(plan, status, flagged);

  const navigate = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const p = new URLSearchParams(sp.toString());
      p.delete("view");
      mutate(p);
      const s = p.toString();
      router.push(s ? `/admin/users?${s}` : "/admin/users");
    },
    [router, sp],
  );

  return (
    <div className="grid gap-3">
      <div
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          navigate((p) => {
            const t = q.trim();
            if (t) p.set("q", t);
            else p.delete("q");
            p.delete("page");
          });
        }}
      >
        <SearchBar
          placeholder="Search users by name or email..."
          value={q}
          onChange={setQ}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <FilterTag
          label="All users"
          active={activeTag === "all"}
          onClick={() =>
            navigate((p) => {
              p.delete("plan");
              p.delete("status");
              p.delete("flagged");
              p.delete("page");
            })
          }
        />
        <FilterTag
          label="Active"
          active={activeTag === "active"}
          onClick={() =>
            navigate((p) => {
              p.delete("flagged");
              p.delete("plan");
              p.set("status", "ACTIVE");
              p.delete("page");
            })
          }
        />
        <FilterTag
          label="Pro plan"
          active={activeTag === "pro"}
          onClick={() =>
            navigate((p) => {
              p.delete("flagged");
              p.delete("status");
              p.set("plan", "PRO");
              p.delete("page");
            })
          }
        />
        <FilterTag
          label="Free plan"
          active={activeTag === "free"}
          onClick={() =>
            navigate((p) => {
              p.delete("flagged");
              p.delete("status");
              p.set("plan", "FREE");
              p.delete("page");
            })
          }
        />
        <FilterTag
          label="Flagged"
          active={activeTag === "flagged"}
          onClick={() =>
            navigate((p) => {
              p.delete("plan");
              p.delete("status");
              p.set("flagged", "1");
              p.delete("page");
            })
          }
        />
      </div>
    </div>
  );
}
