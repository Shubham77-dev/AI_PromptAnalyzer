"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

export interface ButtonGradientProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  type?: "button" | "submit";
  style?: CSSProperties;
}

export function ButtonGradient({
  children,
  href,
  onClick,
  disabled,
  fullWidth,
  className = "",
  type = "button",
  style,
}: Readonly<ButtonGradientProps>) {
  const base: CSSProperties = {
    backgroundImage: "var(--pa-grad)",
    color: "white",
    border: "none",
    borderRadius: fullWidth ? 10 : 8,
    padding: fullWidth ? "10px 14px" : "5px 14px",
    fontSize: fullWidth ? 13 : 11,
    fontWeight: 500,
    width: fullWidth ? "100%" : undefined,
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
    ...style,
  };

  const hoverCls = "pa-btn-transition hover:opacity-90";

  if (href && !disabled) {
    return (
      <Link href={href} className={`inline-flex items-center justify-center ${hoverCls} ${className}`} style={base}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center ${hoverCls} ${className}`}
      style={base}
    >
      {children}
    </button>
  );
}
