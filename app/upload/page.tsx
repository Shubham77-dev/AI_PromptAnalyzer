import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { UploadForm } from "@/app/_components/UploadForm";

export default async function UploadPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Upload a prompt</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Analyze your prompt, then save it as a draft to your dashboard.
        </p>
      </div>
      <UploadForm />
    </div>
  );
}

