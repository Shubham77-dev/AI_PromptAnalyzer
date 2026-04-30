"use client";

import { Copy, RefreshCw } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Toggle } from "@/components/ui/Toggle";

export interface ApiSectionProps {
  maskedApiKey: string;
  webhookUrl: string;
  webhookEnabled: boolean;
  apiUsagePct: number;
  rateLimitLabel: string;
  onWebhookUrl: (v: string) => void;
  onWebhookEnabled: (v: boolean) => void;
  onCopyKey: () => void;
  onRegenerateKey: () => void;
}

export function ApiSection({
  maskedApiKey,
  webhookUrl,
  webhookEnabled,
  apiUsagePct,
  rateLimitLabel,
  onWebhookUrl,
  onWebhookEnabled,
  onCopyKey,
  onRegenerateKey,
}: Readonly<ApiSectionProps>) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-medium text-gray-900">API & keys</h2>
        <p className="mt-1 text-sm text-gray-600">Programmatic access and automation.</p>
      </div>

      <div className="rounded-xl border-[0.5px] border-black/10 bg-white p-5">
        <h3 className="text-sm font-medium text-gray-900">API key</h3>
        <p className="mt-1 text-xs text-gray-500">Treat like a password — never commit to git.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <code className="flex-1 truncate rounded-lg border-[0.5px] border-black/10 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-800">
            {maskedApiKey}
          </code>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCopyKey}
              className="inline-flex items-center gap-1.5 rounded-lg border-[0.5px] border-black/10 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              <Copy className="h-4 w-4" />
              Copy
            </button>
            <button
              type="button"
              onClick={onRegenerateKey}
              className="inline-flex items-center gap-1.5 rounded-lg border-[0.5px] border-black/10 bg-white px-3 py-2 text-sm font-medium text-[#534AB7] hover:bg-[#EEEDFE]"
            >
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border-[0.5px] border-black/10 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Webhook</h3>
            <p className="mt-1 text-xs text-gray-500">Receive prompt analysis events at your endpoint.</p>
          </div>
          <Toggle checked={webhookEnabled} onChange={onWebhookEnabled} aria-label="Webhook enabled" />
        </div>
        <label className="mt-4 block">
          <span className="text-xs font-medium text-gray-700">Webhook URL</span>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => onWebhookUrl(e.target.value)}
            placeholder="https://example.com/webhooks/prompt-analyzer"
            className="mt-1.5 w-full rounded-lg border-[0.5px] border-black/10 bg-white px-3 py-2 text-sm outline-none ring-[#534AB7]/25 focus:ring-2"
          />
        </label>
      </div>

      <div className="rounded-xl border-[0.5px] border-black/10 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-gray-900">API usage</h3>
          <span className="rounded-full bg-[#EEEDFE] px-2.5 py-0.5 text-xs font-medium text-[#534AB7]">
            {rateLimitLabel}
          </span>
        </div>
        <div className="mt-4">
          <div className="mb-2 flex justify-between text-xs text-gray-500">
            <span>Quota</span>
            <span>{Math.round(apiUsagePct)}%</span>
          </div>
          <ProgressBar value={apiUsagePct} />
        </div>
      </div>
    </div>
  );
}
