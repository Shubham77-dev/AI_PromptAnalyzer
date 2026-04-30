"use client";

import type { ReactNode } from "react";
import type { DigestFrequency } from "@/components/settings/settingsDraft";
import { Bell, Mail, Shield } from "lucide-react";
import { Toggle } from "@/components/ui/Toggle";

export interface NotificationsSectionProps {
  emailProduct: boolean;
  emailDigest: boolean;
  emailSecurity: boolean;
  digestFrequency: DigestFrequency;
  onEmailProduct: (v: boolean) => void;
  onEmailDigest: (v: boolean) => void;
  onEmailSecurity: (v: boolean) => void;
  onDigestFrequency: (v: DigestFrequency) => void;
}

export function NotificationsSection({
  emailProduct,
  emailDigest,
  emailSecurity,
  digestFrequency,
  onEmailProduct,
  onEmailDigest,
  onEmailSecurity,
  onDigestFrequency,
}: Readonly<NotificationsSectionProps>) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-medium text-gray-900">Notifications</h2>
        <p className="mt-1 text-sm text-gray-600">Choose what we send to your inbox.</p>
      </div>

      <div className="space-y-4 rounded-xl border-[0.5px] border-black/10 bg-white p-5">
        <NotifyRow
          icon={<Mail className="h-4 w-4 text-[#534AB7]" />}
          title="Product updates"
          description="Tips, feature announcements, and surveys."
        >
          <Toggle checked={emailProduct} onChange={onEmailProduct} aria-label="Product emails" />
        </NotifyRow>
        <NotifyRow
          icon={<Bell className="h-4 w-4 text-[#534AB7]" />}
          title="Weekly digest"
          description="Summary of new prompts in your library."
        >
          <Toggle checked={emailDigest} onChange={onEmailDigest} aria-label="Weekly digest emails" />
        </NotifyRow>
        <NotifyRow
          icon={<Shield className="h-4 w-4 text-[#534AB7]" />}
          title="Security alerts"
          description="Login attempts and credential changes."
        >
          <Toggle checked={emailSecurity} onChange={onEmailSecurity} aria-label="Security emails" />
        </NotifyRow>

        <div className="flex flex-col gap-2 border-t border-black/5 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium text-gray-900">Digest frequency</div>
            <p className="text-xs text-gray-500">When “Weekly digest” is on, choose cadence.</p>
          </div>
          <select
            value={digestFrequency}
            onChange={(e) => onDigestFrequency(e.target.value as DigestFrequency)}
            disabled={!emailDigest}
            className="rounded-lg border-[0.5px] border-black/10 bg-white px-3 py-2 text-sm outline-none ring-[#534AB7]/25 focus:ring-2 disabled:opacity-50"
          >
            <option value="off">Off</option>
            <option value="daily">Daily summary</option>
            <option value="weekly">Weekly summary</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function NotifyRow({
  icon,
  title,
  description,
  children,
}: Readonly<{
  icon: React.ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}>) {
  return (
    <div className="flex flex-col gap-3 border-b border-black/5 pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEEDFE]">
          {icon}
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">{title}</div>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
