import { redirect } from "next/navigation";
import { LabClient } from "@/components/lab/lab-client";
import { getSessionOrNull } from "@/lib/auth/session";
import { canConfigure } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function LabPage() {
  const session = await getSessionOrNull();
  if (!session) redirect("/login");
  if (!canConfigure(session.role)) redirect("/inbox");
  return <LabClient />;
}
