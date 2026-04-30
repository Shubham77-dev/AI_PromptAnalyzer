"use client";

export interface FilterTagProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function FilterTag({ label, active, onClick }: Readonly<FilterTagProps>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-medium transition-colors"
      style={{
        fontSize: 10,
        padding: "3px 10px",
        borderRadius: 20,
        border: active ? "1px solid var(--pa-acc1)" : "1px solid var(--pa-card-border)",
        color: active ? "var(--pa-acc1)" : "var(--pa-muted)",
        background: active ? "color-mix(in srgb, var(--pa-acc1) 10%, transparent)" : "transparent",
      }}
    >
      {label}
    </button>
  );
}
