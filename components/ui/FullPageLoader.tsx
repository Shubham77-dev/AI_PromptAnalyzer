"use client";

import { Spinner } from "@/components/ui/Spinner";

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9F9F7]">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-[15px] font-medium text-gray-900">
          <span
            className="h-2.5 w-2.5 rounded-full bg-[#7F77DD]"
            style={{ animation: "pulse 1.2s ease-in-out infinite" }}
            aria-hidden="true"
          />
          <span>PromptAnalyzer</span>
        </div>
        <Spinner size="lg" />
        <div className="text-xs font-medium text-gray-500">Loading your workspace...</div>
      </div>
    </div>
  );
}

export default FullPageLoader;

