"use client";

import { useMemo, useState } from "react";

export function SuggestionClamp({
  text,
  placeholder,
  clampClassName = "max-h-16",
}: Readonly<{
  text: string | null | undefined;
  placeholder: string;
  clampClassName?: string;
}>) {
  const [expanded, setExpanded] = useState(false);

  const value = (text ?? "").trim();
  const isLong = useMemo(() => value.length > 140 || value.split("\n").length > 3, [value]);

  if (!value) return <div className="mt-1 text-sm text-gray-700">{placeholder}</div>;

  return (
    <div className="mt-1">
      <div
        className={[
          "text-sm text-gray-700 whitespace-pre-wrap",
          expanded ? "" : `${clampClassName} overflow-hidden`,
        ].join(" ")}
      >
        {value}
      </div>
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs font-medium text-gray-500 hover:text-gray-900"
        >
          {expanded ? "See less" : "See more"}
        </button>
      ) : null}
    </div>
  );
}

