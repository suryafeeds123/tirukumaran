import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { EnquiryDetail } from "@/components/staff/EnquiryDetail";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/staff");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  return <EnquiryDetail id={id} user={user} />;
}
