import { redirect } from "next/navigation";
import { AgentClient } from "@/components/agent/agent-client";
import { getSessionOrNull } from "@/lib/auth/session";
import { canAccessAdvanced } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function AgentPage() {
  const session = await getSessionOrNull();
  if (!session) redirect("/login");
  if (!canAccessAdvanced(session.role)) redirect("/inbox");
  return <AgentClient />;
}
