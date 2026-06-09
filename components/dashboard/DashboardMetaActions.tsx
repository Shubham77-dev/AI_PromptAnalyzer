"use client";

import { ButtonGradient } from "@/components/ui/ButtonGradient";
import { ButtonOutline } from "@/components/ui/ButtonOutline";

export function DashboardMetaActions() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ButtonOutline type="button">Export</ButtonOutline>
      <ButtonGradient href="/upload">+ New analysis</ButtonGradient>
    </div>
  );
}
