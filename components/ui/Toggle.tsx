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
      className="pa-toggle-track relative shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50"
      data-on={checked ? "true" : "false"}
      style={{ width: 32, height: 17 }}
    >
      <span className="pa-toggle-knob" aria-hidden />
    </button>
  );
}
