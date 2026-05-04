import type { ReactNode } from "react";

export interface AuthCardProps {
  width: number;
  children: ReactNode;
  className?: string;
}

export function AuthCard({ width, children, className = "" }: Readonly<AuthCardProps>) {
  return (
    <div
      className={`pa-card mx-auto w-full p-5 ${className}`.trim()}
      style={{ maxWidth: width }}
    >
      {children}
    </div>
  );
}
