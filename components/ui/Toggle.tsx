"use client";

export interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
  disabled?: boolean;
  "aria-label"?: string;
}

export function Toggle({
  checked,
  onChange,
  id,
  disabled,
  "aria-label": ariaLabel,
}: Readonly<ToggleProps>) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className="relative shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50"
      style={{
        width: 34,
        height: 18,
        background: checked ? "var(--pa-acc1)" : "var(--pa-hint)",
        border: checked ? "none" : "1px solid var(--pa-card-border)",
      }}
    >
      <span
        aria-hidden
        className="absolute top-[3px] rounded-full bg-white transition-[left,right] duration-200"
        style={{
          width: 12,
          height: 12,
          left: checked ? undefined : 3,
          right: checked ? 3 : undefined,
        }}
      />
    </button>
  );
}
