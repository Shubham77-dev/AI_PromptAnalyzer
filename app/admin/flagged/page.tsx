import { redirect } from "next/navigation";

export default async function AdminFlaggedRedirectPage() {
  redirect("/admin/flags");
}
