"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export interface SidebarNavItemProps {
  href: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  onClick?: () => void;
}

export function SidebarNavItem({
  href,
  label,
  icon,
  active,
  onClick,
}: Readonly<SidebarNavItemProps>) {
  const className = [
    "pa-sidebar-nav flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium",
    active ? "is-active" : "",
  ].join(" ");

  if (onClick) {
    return (
      <button type="button" title={label} onClick={onClick} className={className}>
        <span className="h-4 w-4 shrink-0">{icon}</span>
        <span className="hidden md:block">{label}</span>
      </button>
    );
  }

  return (
    <Link href={href} title={label} className={className}>
      <span className="h-4 w-4 shrink-0">{icon}</span>
      <span className="hidden md:block">{label}</span>
    </Link>
  );
}
