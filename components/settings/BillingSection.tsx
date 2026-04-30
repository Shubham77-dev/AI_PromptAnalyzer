"use client";

import { ProgressBar } from "@/components/ui/ProgressBar";

export interface BillingSectionProps {
  planLabel: string;
  promptsUsedPct: number;
  librarySlotsUsedPct: number;
  cardLast4: string;
}

export function BillingSection({
  planLabel,
  promptsUsedPct,
  librarySlotsUsedPct,
  cardLast4,
}: Readonly<BillingSectionProps>) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-medium text-gray-900">Billing</h2>
        <p className="mt-1 text-sm text-gray-600">Plan limits and payment method.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-700">Current plan</span>
        <span className="rounded-full bg-[#EEEDFE] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#534AB7]">
          {planLabel}
        </span>
      </div>

      <div className="space-y-6 rounded-xl border-[0.5px] border-black/10 bg-white p-5">
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-800">Prompts this month</span>
            <span className="text-gray-500">{Math.round(promptsUsedPct)}%</span>
          </div>
          <div className="mt-2">
            <ProgressBar value={promptsUsedPct} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-800">Library slots</span>
            <span className="text-gray-500">{Math.round(librarySlotsUsedPct)}%</span>
          </div>
          <div className="mt-2">
            <ProgressBar value={librarySlotsUsedPct} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border-[0.5px] border-black/10 bg-white p-5">
        <h3 className="text-sm font-medium text-gray-900">Payment method</h3>
        <p className="mt-2 text-sm text-gray-600">
          Visa ending in <span className="font-mono font-medium text-gray-800">{cardLast4}</span>
        </p>
        <button
          type="button"
          className="mt-4 rounded-lg border-[0.5px] border-black/10 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100"
        >
          Update payment method
        </button>
      </div>
    </div>
  );
}
