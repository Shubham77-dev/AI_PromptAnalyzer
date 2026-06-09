"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export interface SidebarNavItemProps {
  href: string;
  label: ReactNode;
  icon: ReactNode;
  active: boolean;
  onClick?: () => void;
  title?: string;
}

export function SidebarNavItem({
  href,
  label,
  icon,
  active,
  onClick,
  title,
}: Readonly<SidebarNavItemProps>) {
  const className = [
    "pa-sidebar-nav flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium",
    active ? "is-active" : "",
  ].join(" ");

  const tip = title ?? (typeof label === "string" ? label : undefined);

  if (onClick) {
    return (
      <button type="button" title={tip} onClick={onClick} className={className}>
        <span className="h-4 w-4 shrink-0">{icon}</span>
        <span className="hidden min-w-0 flex-1 md:block">{label}</span>
      </button>
    );
  }

  return (
    <Link href={href} title={tip} className={className}>
      <span className="h-4 w-4 shrink-0">{icon}</span>
      <span className="hidden min-w-0 flex-1 md:block">{label}</span>
    </Link>
  );
}
