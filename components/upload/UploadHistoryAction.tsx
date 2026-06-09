"use client";

import { useRouter } from "next/navigation";
import { ButtonOutline } from "@/components/ui/ButtonOutline";

export function UploadHistoryAction() {
  const router = useRouter();
  return <ButtonOutline onClick={() => router.push("/dashboard")}>History</ButtonOutline>;
}
