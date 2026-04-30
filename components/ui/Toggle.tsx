"use client";

export interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
  disabled?: boolean;
  "aria-label"?: string;
}

/** 36×20px pill; knob slides; purple track when on (#7F77DD). */
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
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#534AB7] disabled:opacity-50 ${checked ? "bg-[#7F77DD]" : "bg-gray-200"}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${checked ? "translate-x-4" : ""}`}
        aria-hidden
      />
    </button>
  );
}
