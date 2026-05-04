"use client";

export interface PasswordStrengthProps {
  password: string;
}

function tier(pw: string): { filled: number; label: string; segColor: string } {
  const n = pw.length;
  if (n < 4) return { filled: 0, label: "", segColor: "var(--pa-hint)" };
  let score = 0;
  if (n >= 8) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  if (score <= 1) return { filled: 1, label: "Weak", segColor: "var(--pa-acc3)" };
  if (score <= 3) return { filled: Math.min(3, score + 1), label: "Medium", segColor: "var(--pa-acc4)" };
  return { filled: 4, label: "Strong", segColor: "var(--pa-acc2)" };
}

export function PasswordStrength({ password }: Readonly<PasswordStrengthProps>) {
  const { filled, label, segColor } = tier(password);
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
      {label ? (
        <span className="shrink-0 text-[10px]" style={{ color: "var(--pa-muted)" }}>
          {label}
        </span>
      ) : null}
    </div>
  );
}
