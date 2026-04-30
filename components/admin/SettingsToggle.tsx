"use client";

export interface SettingsToggleProps {
  name: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
}

export function SettingsToggle({
  name,
  label,
  description,
  defaultChecked = false,
}: Readonly<SettingsToggleProps>) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/10">
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-900">{label}</div>
        {description ? <div className="mt-1 text-xs text-gray-500">{description}</div> : null}
      </div>
      <span className="relative inline-flex items-center">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          className="peer sr-only"
        />
        <span className="h-6 w-11 rounded-full bg-gray-200 ring-1 ring-black/10 transition peer-checked:bg-red-600" />
        <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

