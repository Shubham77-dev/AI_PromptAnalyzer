"use client";

import { ButtonGradient } from "@/components/ui/ButtonGradient";
import { ButtonOutline } from "@/components/ui/ButtonOutline";

export function AdminPromptsTopActions() {
  return (
    <div className="flex items-center gap-2">
      <ButtonOutline type="button" onClick={() => {}}>
        Export
      </ButtonOutline>
      <ButtonGradient type="button" onClick={() => {}}>
        + Add prompt
      </ButtonGradient>
    </div>
  );
}

