import Link from "next/link";
import { ABOUT_MESSAGE } from "@/app/_lib/app-config";
import { PageMeta } from "@/components/layout/PageMeta";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageMeta
        title="Home"
        actions={
          <Link
            href="/upload"
            className="rounded-lg border-[0.5px] border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            + New Analysis
          </Link>
        }
      />

      <div className="rounded-xl border-[0.5px] border-black/10 bg-white p-8">
        <h1 className="text-2xl font-medium text-gray-900">
          Prompt Library with AI Rating System
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
          {ABOUT_MESSAGE} Upload prompts, get AI-powered analysis (accuracy/clarity +
          suggestions), keep private ratings in your dashboard, then publish to a
          searchable public library with likes and copy.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/upload"
            className="rounded-lg bg-[#EEEDFE] px-4 py-2 text-sm font-medium text-[#534AB7] hover:opacity-90"
          >
            Upload a prompt
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border-[0.5px] border-black/10 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            View dashboard
          </Link>
          <Link
            href="/library"
            className="rounded-lg border-[0.5px] border-black/10 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Browse public library
          </Link>
        </div>
      </div>
    </div>
  );
}
