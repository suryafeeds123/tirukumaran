import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/staff/LoginForm";

export const dynamic = "force-dynamic";

export default async function StaffHome() {
  if (await getCurrentUser()) redirect("/staff/enquiries");
  return <LoginForm />;
}
