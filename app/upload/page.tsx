import { getCurrentUser } from "@/lib/auth";
import { UploadForm } from "@/app/_components/UploadForm";
import { AppShell } from "@/components/layout/AppShell";
import { RequireLoginGate } from "@/components/layout/RequireLoginGate";

export default async function UploadPage() {
  const user = await getCurrentUser();
  if (!user) return <RequireLoginGate />;

  return (
    <AppShell title="Analyze prompt" userEmail={user.email}>
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Upload a prompt</h1>
          <p className="mt-1 text-sm text-gray-600">
            Analyze your prompt, then save it as a draft to your dashboard.
          </p>
        </div>
        <UploadForm />
      </div>
    </AppShell>
  );
}

