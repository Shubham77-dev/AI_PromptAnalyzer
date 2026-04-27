import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { AuthControls } from "@/app/_components/AuthControls";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Prompt Library
          </Link>
          <nav className="flex items-center gap-4 text-sm text-zinc-600">
            <Link className="hover:text-zinc-900" href="/upload">
              Upload
            </Link>
            <Link className="hover:text-zinc-900" href="/dashboard">
              Dashboard
            </Link>
            <Link className="hover:text-zinc-900" href="/library">
              Library
            </Link>
          </nav>
        </div>
        <AuthControls initialEmail={user?.email ?? null} />
      </div>
    </header>
  );
}

