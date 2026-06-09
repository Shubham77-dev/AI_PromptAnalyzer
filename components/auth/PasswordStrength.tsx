"use client";

import { passwordStrengthTier } from "@/lib/password-policy";

export interface PasswordStrengthProps {
  password: string;
}

const TIER_STYLES = {
  weak: { filled: 1, label: "Weak", segColor: "var(--pa-acc3)" },
  fair: { filled: 2, label: "Fair", segColor: "#f59e0b" },
  strong: { filled: 4, label: "Strong", segColor: "var(--pa-acc2)" },
} as const;

export function PasswordStrength({ password }: Readonly<PasswordStrengthProps>) {
  const tier = passwordStrengthTier(password);
  if (tier === "none") return null;

  const { filled, label, segColor } = TIER_STYLES[tier === "weak" ? "weak" : tier === "fair" ? "fair" : "strong"];

  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex flex-1 gap-1" style={{ gap: 4 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-1 rounded"
            style={{ height: 2, borderRadius: 4, background: i < filled ? segColor : "var(--pa-hint)" }}
          />
        ))}
      </div>
      <span className="shrink-0 text-[10px]" style={{ color: segColor }}>
        {label}
      </span>
    </div>
  );
}
