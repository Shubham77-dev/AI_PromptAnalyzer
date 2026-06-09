"use client";

import type { CSSProperties } from "react";
import { useLayoutEffect, useRef, useState } from "react";

export type SeeMoreTextProps = {
  text: string;
  /** When not expanded, content is clipped to this max height (px). */
  collapsedMaxHeightPx: number;
  /** Wrapper around the text block + button. */
  className?: string;
  /** Classes on the scrollable text element (e.g. font-mono, padding). */
  contentClassName?: string;
  contentStyle?: CSSProperties;
  /** Optional label for the toggle (defaults to See more / See less). */
  seeMoreLabel?: string;
  seeLessLabel?: string;
  buttonClassName?: string;
  /** Overrides default accent color for the toggle (e.g. neutral on light modals). */
  buttonStyle?: CSSProperties;
};

/**
 * Long prompt/analysis text with a See more / See less toggle when content exceeds the collapsed height.
 */
export function SeeMoreText({
  text,
  collapsedMaxHeightPx,
  className = "",
  contentClassName = "",
  contentStyle,
  seeMoreLabel = "See more",
  seeLessLabel = "See less",
  buttonClassName = "",
  buttonStyle,
}: Readonly<SeeMoreTextProps>) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    if (expanded) {
      setShowToggle(true);
      return;
    }
    setShowToggle(el.scrollHeight > el.clientHeight + 1);
  }, [text, expanded, collapsedMaxHeightPx]);

  return (
    <div className={className}>
      <div
        ref={innerRef}
        className={`whitespace-pre-wrap break-words ${contentClassName}`.trim()}
        style={{
          ...contentStyle,
          maxHeight: expanded ? undefined : collapsedMaxHeightPx,
          overflow: expanded ? "visible" : "hidden",
        }}
      >
        {text}
      </div>
      {showToggle ? (
        <button
          type="button"
          className={`mt-2 text-left text-xs font-semibold underline-offset-2 hover:underline ${buttonClassName}`.trim()}
          style={{ color: "var(--pa-acc1, #2563eb)", ...buttonStyle }}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? seeLessLabel : seeMoreLabel}
        </button>
      ) : null}
    </div>
  );
}
