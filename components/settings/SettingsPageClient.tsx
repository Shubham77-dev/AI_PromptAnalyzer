"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageMeta } from "@/components/layout/PageMeta";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { ThemeSection } from "@/components/settings/ThemeSection";
import { ButtonGradient } from "@/components/ui/ButtonGradient";
import type { SettingsDraft } from "@/components/settings/settingsDraft";

const STORAGE_KEY = "promptAnalyzer.settings.v1";

const SECTIONS = [
  { id: "theme", label: "Themes" },
  { id: "profile", label: "Profile" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

function defaultDraft(initialEmail: string): SettingsDraft {
  return {
    profile: {
      displayName: initialEmail.split("@")[0] ?? "",
      email: initialEmail,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    billing: {
      planLabel: "Pro",
      promptsUsedPct: 42,
      librarySlotsUsedPct: 68,
      cardLast4: "4242",
    },
    preferences: {
      autoSave: true,
      scoreBreakdown: true,
      showImprovedPrompt: false,
      defaultSort: "recent",
      compactView: false,
      monospacePreview: false,
    },
    notifications: {
      emailProduct: true,
      emailDigest: true,
      emailSecurity: true,
      digestFrequency: "weekly",
    },
    api: {
      rawKey: `sk_live_${randomToken(24)}`,
      webhookUrl: "",
      webhookEnabled: false,
      apiUsagePct: 38,
      rateLimitLabel: "60 req / min",
    },
  };
}

function randomToken(bytes: number) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function loadDraft(initialEmail: string): SettingsDraft {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return defaultDraft(initialEmail);
    const parsed = JSON.parse(raw) as Partial<SettingsDraft>;
    const base = defaultDraft(initialEmail);
    return {
      profile: { ...base.profile, ...parsed.profile, email: parsed.profile?.email ?? initialEmail },
      billing: { ...base.billing, ...parsed.billing },
      preferences: { ...base.preferences, ...parsed.preferences },
      notifications: { ...base.notifications, ...parsed.notifications },
      api: {
        ...base.api,
        ...parsed.api,
        rawKey: parsed.api?.rawKey ?? base.api.rawKey,
      },
    };
  } catch {
    return defaultDraft(initialEmail);
  }
}

function persistDraft(draft: SettingsDraft) {
  /** Persists profile + preferences locally; swap for `supabase.auth.updateUser` when wired. */
  globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function SettingsPageClient({ initialEmail }: Readonly<{ initialEmail: string }>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");

  const [draft, setDraft] = useState<SettingsDraft>(() => defaultDraft(initialEmail));
  const [hydrated, setHydrated] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);

  useEffect(() => {
    const id = globalThis.setTimeout(() => {
      setDraft(loadDraft(initialEmail));
      setHydrated(true);
    }, 0);
    return () => globalThis.clearTimeout(id);
  }, [initialEmail]);

  const activeSection: SectionId = useMemo(() => {
    const s = sectionParam ?? "profile";
    if (s === "theme" || s === "profile") {
      return s;
    }
    return "profile";
  }, [sectionParam]);

  const setSection = useCallback(
    (id: SectionId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("section", id);
      router.replace(`/settings?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const patchDraft = useCallback((patch: Partial<SettingsDraft> | ((d: SettingsDraft) => SettingsDraft)) => {
    setDraft((d) => (typeof patch === "function" ? patch(d) : { ...d, ...patch }));
  }, []);

  const handleSave = useCallback(() => {
    persistDraft(draft);
    setSaveFeedback(true);
    globalThis.setTimeout(() => setSaveFeedback(false), 2000);
  }, [draft]);

  const saveButton = useMemo(
    () => (
      <ButtonGradient type="button" onClick={handleSave} disabled={saveFeedback}>
        {saveFeedback ? "Saved!" : "Save changes"}
      </ButtonGradient>
    ),
    [handleSave, saveFeedback],
  );

  const onDeleteAccount = useCallback(() => {
    if (
      globalThis.confirm(
        "Delete your account? This cannot be undone in this demo. (No server action was run.)",
      )
    ) {
      /* placeholder — auth/account deletion not wired */
    }
  }, []);

  return (
    <>
      <PageMeta title="Settings" actions={saveButton} />

      <div className="mx-auto flex w-full max-w-5xl gap-8">
        <nav
          className="hidden w-[148px] shrink-0 flex-col gap-1 rounded-lg md:flex"
          style={{ background: "var(--pa-sidebar)", borderRight: "1px solid var(--pa-sb-border)" }}
          aria-label="Settings sections"
        >
          {SECTIONS.map((item) => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className="rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors"
                style={{
                  background: active ? "var(--pa-hint)" : "transparent",
                  color: active ? "var(--pa-acc1)" : "var(--pa-muted)",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 flex-1 md:pl-8">
          <div className="mb-6 md:hidden">
            <label className="sr-only" htmlFor="settings-section-mob">
              Section
            </label>
            <select
              id="settings-section-mob"
              value={activeSection}
              onChange={(e) => setSection(e.target.value as SectionId)}
              className="w-full rounded-lg border-[0.5px] border-black/10 bg-white px-3 py-2 text-sm"
            >
              {SECTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {hydrated ? (
            <>
              {activeSection === "theme" ? <ThemeSection /> : null}

              {activeSection === "profile" ? (
                <ProfileSection
                  displayName={draft.profile.displayName}
                  email={draft.profile.email}
                  currentPassword={draft.profile.currentPassword}
                  newPassword={draft.profile.newPassword}
                  confirmPassword={draft.profile.confirmPassword}
                  onDisplayNameChange={(v) =>
                    patchDraft((d) => ({ ...d, profile: { ...d.profile, displayName: v } }))
                  }
                  onEmailChange={(v) => patchDraft((d) => ({ ...d, profile: { ...d.profile, email: v } }))}
                  onCurrentPasswordChange={(v) =>
                    patchDraft((d) => ({ ...d, profile: { ...d.profile, currentPassword: v } }))
                  }
                  onNewPasswordChange={(v) =>
                    patchDraft((d) => ({ ...d, profile: { ...d.profile, newPassword: v } }))
                  }
                  onConfirmPasswordChange={(v) =>
                    patchDraft((d) => ({ ...d, profile: { ...d.profile, confirmPassword: v } }))
                  }
                  onRequestDelete={onDeleteAccount}
                />
              ) : null}
            </>
          ) : (
            <p className="text-sm text-gray-500">Loading preferences…</p>
          )}
        </div>
      </div>
    </>
  );
}
