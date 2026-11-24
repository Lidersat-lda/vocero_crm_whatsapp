import { redirect } from "next/navigation";
import { getSessionOrNull } from "@/lib/auth/session";
import { canConfigure } from "@/lib/auth/roles";
import { idiomaActual } from "@/server/idioma";
import { IdiomaClient } from "@/components/settings/idioma-client";

export const dynamic = "force-dynamic";

/** 069 — Idioma del CRM para todo el equipo. Solo quien configura lo cambia. */
export default async function LanguagePage() {
  const session = await getSessionOrNull();
  if (!session) redirect("/login");
  if (!canConfigure(session.role)) redirect("/inbox");
  const inicial = await idiomaActual(session.organizationId);
  return <IdiomaClient inicial={inicial} />;
}
