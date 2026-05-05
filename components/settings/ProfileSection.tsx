"use client";

import type { ChangeEvent, CSSProperties } from "react";

function initialsFromEmail(email: string) {
  const name = email.split("@")[0] ?? email;
  return (name.slice(0, 2) || "U").toUpperCase();
}

export interface ProfileSectionProps {
  displayName: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  onDisplayNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onCurrentPasswordChange: (v: string) => void;
  onNewPasswordChange: (v: string) => void;
  onConfirmPasswordChange: (v: string) => void;
  onRequestDelete: () => void;
}

export function ProfileSection({
  displayName,
  email,
  currentPassword,
  newPassword,
  confirmPassword,
  onDisplayNameChange,
  onEmailChange,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onRequestDelete,
}: Readonly<ProfileSectionProps>) {
  const inputClassName =
    "mt-1.5 w-full rounded-lg border-[0.5px] px-3 py-2 text-sm outline-none focus:ring-2";
  const inputStyle: CSSProperties = {
    background: "var(--pa-card)",
    borderColor: "var(--pa-card-border)",
    color: "var(--pa-text)",
    // Keep the ring consistent with the rest of the app theme.
    // (Tailwind ring color stays as-is; this just ensures text contrast.)
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-medium" style={{ color: "var(--pa-text)" }}>
          Profile
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--pa-muted)" }}>
          Your visible name and sign-in details.
        </p>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#EEEDFE] text-lg font-semibold text-[#534AB7]"
          aria-hidden
        >
          {initialsFromEmail(displayName || email)}
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <label className="block">
            <span className="text-xs font-medium" style={{ color: "var(--pa-muted)" }}>
              Display name
            </span>
            <input
              value={displayName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onDisplayNameChange(e.target.value)}
              className={`${inputClassName} max-w-md ring-[#534AB7]/25`}
              style={inputStyle}
              autoComplete="name"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium" style={{ color: "var(--pa-muted)" }}>
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onEmailChange(e.target.value)}
              className={`${inputClassName} max-w-md ring-[#534AB7]/25`}
              style={inputStyle}
              autoComplete="email"
            />
          </label>
        </div>
      </div>

      <div
        className="rounded-xl border-[0.5px] p-5"
        style={{ background: "var(--pa-card)", borderColor: "var(--pa-card-border)" }}
      >
        <h3 className="text-sm font-medium" style={{ color: "var(--pa-text)" }}>
          Change password
        </h3>
        <div className="mt-4 grid max-w-md gap-4">
          <label className="block">
            <span className="text-xs font-medium" style={{ color: "var(--pa-muted)" }}>
              Current password
            </span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onCurrentPasswordChange(e.target.value)}
              className={`${inputClassName} ring-[#534AB7]/25`}
              style={inputStyle}
              autoComplete="current-password"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium" style={{ color: "var(--pa-muted)" }}>
              New password
            </span>
            <input
              type="password"
              value={newPassword}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onNewPasswordChange(e.target.value)}
              className={`${inputClassName} ring-[#534AB7]/25`}
              style={inputStyle}
              autoComplete="new-password"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium" style={{ color: "var(--pa-muted)" }}>
              Confirm new password
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onConfirmPasswordChange(e.target.value)}
              className={`${inputClassName} ring-[#534AB7]/25`}
              style={inputStyle}
              autoComplete="new-password"
            />
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50/80 p-5">
        <h3 className="text-sm font-medium text-red-900">Danger zone</h3>
        <p className="mt-1 text-sm text-red-800/90">
          Permanently delete your account and associated drafts. This cannot be undone.
        </p>
        <button
          type="button"
          onClick={onRequestDelete}
          className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Delete account
        </button>
      </div>
    </div>
  );
}
