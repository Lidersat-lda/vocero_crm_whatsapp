import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SettingsNav } from "@/components/settings/settings-nav";
import { canConfigure } from "@/lib/auth/roles";
import { getSessionOrNull } from "@/lib/auth/session";
import { apiV1Enabled } from "@/server/api-v1/flag";
import { agendaEnabled } from "@/server/agenda/flag";
import { atribucionEnabled } from "@/server/attribution/flag";
import { isChannelEnabled } from "@/server/channels/enabled";

// La bandera se lee en cada petición: si esto se resolviera al construir, la
// imagen quedaría con la agenda apagada para siempre y encenderla en la
// plataforma no haría nada.
export const dynamic = "force-dynamic";

export default async function SettingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Ajustes solo para quien puede configurar. Un miembro del equipo cae al
  // Inbox: no decide tema del negocio, idioma, marca ni canales.
  const session = await getSessionOrNull();
  if (!session) redirect("/login");
  if (!canConfigure(session.role)) redirect("/inbox");
  const t = await getTranslations("settings");
  // 069 — Ajustes → API solo existe con la bandera y para quien configura.
  const api = apiV1Enabled() && canConfigure(session.role);
  return (
    <div className="flex h-full flex-col">
      <header className="border-b px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="text-[17px] font-bold tracking-tight">{t("title")}</h2>
      </header>
      {/* En móvil las pestañas van arriba (en fila), no como columna lateral. */}
      <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
        <SettingsNav
          agenda={agendaEnabled()}
          atribucion={atribucionEnabled()}
          instagram={isChannelEnabled("instagram")}
          messenger={isChannelEnabled("messenger")}
          tiktok={isChannelEnabled("tiktok")}
          api={api}
        />
        <div className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
