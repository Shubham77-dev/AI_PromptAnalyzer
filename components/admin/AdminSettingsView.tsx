"use client";

import { useMemo, useState, useTransition } from "react";
import { PageMeta } from "@/components/layout/PageMeta";
import { ButtonGradient } from "@/components/ui/ButtonGradient";
import { Toggle } from "@/components/ui/Toggle";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { SettingRow } from "@/components/admin/SettingRow";
import { DangerZone } from "@/components/admin/DangerZone";
import { adminUpsertAppConfig } from "@/app/admin/actions";

export interface AdminSettingsViewProps {
  initial: {
    minPublishScore: number;
    freeTierDailyLimit: number;
    requireEmailVerification: boolean;
    allowPublicRegistration: boolean;
    maintenanceMode: boolean;
  };
}

export function AdminSettingsView({ initial }: Readonly<AdminSettingsViewProps>) {
  const [minScore, setMinScore] = useState(String(initial.minPublishScore));
  const [freeLimit, setFreeLimit] = useState(String(initial.freeTierDailyLimit));
  const [reqEmail, setReqEmail] = useState(initial.requireEmailVerification);
  const [allowReg, setAllowReg] = useState(initial.allowPublicRegistration);
  const [maint, setMaint] = useState(initial.maintenanceMode);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const actions = useMemo(
    () => (
      <ButtonGradient
        type="button"
        disabled={pending}
        onClick={() => {
          start(async () => {
            const fd = new FormData();
            const ms = Number.parseInt(minScore, 10);
            const fl = Number.parseInt(freeLimit, 10);
            fd.set("min_publish_score", String(Number.isFinite(ms) ? ms : initial.minPublishScore));
            fd.set("free_tier_daily_limit", String(Number.isFinite(fl) ? fl : initial.freeTierDailyLimit));
            if (reqEmail) fd.set("require_email_verification", "on");
            if (allowReg) fd.set("allow_public_registration", "on");
            if (maint) fd.set("maintenance_mode", "on");
            await adminUpsertAppConfig(fd);
            setSaved(true);
            globalThis.setTimeout(() => setSaved(false), 2000);
          });
        }}
        className="rounded-[10px] px-3 py-2 text-xs"
        style={saved ? { backgroundImage: "none", background: "var(--pa-acc2)" } : undefined}
      >
        {saved ? "Saved!" : "Save settings"}
      </ButtonGradient>
    ),
    [allowReg, freeLimit, initial.freeTierDailyLimit, initial.minPublishScore, maint, minScore, pending, reqEmail, saved],
  );

  return (
    <div className="grid gap-4">
      <PageMeta title="App settings" actions={actions} />
      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader title="Library rules" />
          <SettingRow
            title="Minimum publish score"
            sub="Prompts below this score stay private until improved."
            right={
              <input
                inputMode="numeric"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                className="pa-input w-14 text-center tabular-nums"
              />
            }
          />
        </Card>

        <Card>
          <CardHeader title="User settings" />
          <SettingRow title="Allow public registration" right={<Toggle checked={allowReg} onChange={setAllowReg} aria-label="Allow public registration" />} />
          <SettingRow
            title="Free tier daily limit"
            right={
              <input
                inputMode="numeric"
                value={freeLimit}
                onChange={(e) => setFreeLimit(e.target.value)}
                className="pa-input w-14 text-center tabular-nums"
              />
            }
          />
          <SettingRow title="Require email verification" right={<Toggle checked={reqEmail} onChange={setReqEmail} aria-label="Require email verification" />} />
        </Card>

        <div className="lg:col-span-2">
          <DangerZone>
            <SettingRow title="Maintenance mode" right={<Toggle checked={maint} onChange={setMaint} aria-label="Maintenance mode" />} />
            <div className="pa-srow">
              <div className="min-w-0">
                <div className="text-xs" style={{ color: "var(--pa-text)" }}>
                  Wipe all flagged content
                </div>
                <div className="mt-0.5 text-[10px]" style={{ color: "var(--pa-muted)" }}>
                  Removes flagged prompts after review (manual).
                </div>
              </div>
              <button type="button" className="pa-fb pa-fb-red">
                Run cleanup
              </button>
            </div>
          </DangerZone>
        </div>
      </div>
    </div>
  );
}
