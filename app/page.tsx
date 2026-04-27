import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Prompt Library with AI Rating System
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
          Upload prompts, get AI-powered analysis (accuracy/clarity + suggestions),
          keep private ratings in your dashboard, then publish to a searchable public
          library with likes and copy.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/upload"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Upload a prompt
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            View dashboard
          </Link>
          <Link
            href="/library"
            className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            Browse public library
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 p-4">
            <div className="text-sm font-semibold">Analyze</div>
            <div className="mt-1 text-sm text-zinc-600">
              AI scores your prompt and suggests improvements.
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4">
            <div className="text-sm font-semibold">Dashboard</div>
            <div className="mt-1 text-sm text-zinc-600">
              Your private drafts + ratings. Publish when ready.
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4">
            <div className="text-sm font-semibold">Library</div>
            <div className="mt-1 text-sm text-zinc-600">
              Search, copy, and like published prompts.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
