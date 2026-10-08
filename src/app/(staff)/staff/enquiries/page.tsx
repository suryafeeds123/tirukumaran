import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Dashboard } from "@/components/staff/Dashboard";

export const dynamic = "force-dynamic";

export default async function EnquiriesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/staff");
  return <Dashboard user={user} />;
}
