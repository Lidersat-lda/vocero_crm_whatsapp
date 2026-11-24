import {
  CalendarDays,
  ChartColumn,
  FlaskConical,
  Inbox,
  Kanban,
  ListChecks,
  Settings,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { canConfigure } from "@/lib/auth/roles";

/**
 * #87 — El modelo del menú, separado del componente que lo pinta.
 *
 * Qué entradas existen lo deciden dos cosas que el nav de cliente no puede
 * leer solo: las banderas de la instancia (`AGENDA`, `CHANNELS`, `ATRIBUCION`,
 * que bajan por prop desde el servidor) y el rol de quien mira. Tenerlo aquí,
 * sin React, deja que una prueba unitaria afirme qué aparece y qué no sin
 * dibujar nada.
 */

export type NavItem = {
  href: string;
  /** Clave de i18n bajo `nav.*` (por ejemplo `inbox`, `pipeline`). */
  labelKey: string;
  icon: LucideIcon;
  /** Muestra el contador de no leídos (solo la Bandeja). */
  badge?: boolean;
};

export type NavGroup = {
  /** Clave de i18n bajo `nav.*` para el encabezado pequeño. */
  titleKey?: string;
  items: NavItem[];
};

/** La única entrada que va abajo, separada del resto. */
export const SETTINGS_ITEM: NavItem = {
  href: "/settings",
  labelKey: "settings",
  icon: Settings,
};

/**
 * Grupos de la barra lateral, en el orden en que se leen: lo que se atiende
 * cada día, lo que configura al agente y, al final, cómo va el negocio.
 */
export function appNavGroups({
  agenda = false,
  role,
}: {
  /** 015 — "Citas" solo existe si esta instancia encendió la agenda. */
  agenda?: boolean;
  /** #86 — La guía de inicio solo para quien puede configurar. */
  role?: string | null;
}): NavGroup[] {
  const trabajo: NavItem[] = [
    { href: "/inbox", labelKey: "inbox", icon: Inbox, badge: true },
    { href: "/pipeline", labelKey: "pipeline", icon: Kanban },
    { href: "/contacts", labelKey: "contacts", icon: Users },
  ];

  // Miembro: solo las tres pestañas de trabajo. Sin Citas, sin Agente,
  // sin Laboratorio, sin Resultados; Ajustes queda oculto por el componente.
  if (!canConfigure(role)) {
    return [{ titleKey: "groupWork", items: trabajo }];
  }

  // Citas va después de Contactos: es el paso siguiente de un trato, no una
  // sección aparte.
  if (agenda) trabajo.push({ href: "/bookings", labelKey: "bookings", icon: CalendarDays });

  const agente: NavItem[] = [
    { href: "/onboarding", labelKey: "onboarding", icon: ListChecks },
    { href: "/agent", labelKey: "agent", icon: Sparkles },
    { href: "/lab", labelKey: "lab", icon: FlaskConical },
  ];

  return [
    { titleKey: "groupWork", items: trabajo },
    { titleKey: "groupAgent", items: agente },
    // 019 — Se mide al final: primero se atiende y se organiza.
    { items: [{ href: "/results", labelKey: "results", icon: ChartColumn }] },
  ];
}

export type SettingsLink = {
  href: string;
  /** Clave bajo `settings.linkX`. */
  labelKey: string;
};

export type SettingsSection = {
  /** Clave bajo `settings.sectionX`. */
  titleKey: string;
  links: SettingsLink[];
};

/**
 * Ajustes en tres secciones: por dónde entran los mensajes, qué hace el agente
 * con ellos y lo que es del negocio. Una pestaña por canal no escala; una
 * sección por canal, sí: cada canal nuevo cae en "Canales" sin tocar el resto.
 *
 * Instagram no tiene pantalla propia todavía: sus credenciales se guardan
 * por API (`/api/settings/instagram`). Cuando la tenga, va aquí tras
 * `CHANNELS`, igual que Messenger.
 */
export function settingsSections({
  agenda = false,
  atribucion = false,
  instagram = false,
  messenger = false,
  tiktok = false,
}: {
  agenda?: boolean;
  /** 016 — "Anuncios" existe solo con la bandera ATRIBUCION. */
  atribucion?: boolean;
  /** 023 — "Instagram" solo si el canal está encendido con CHANNELS. */
  instagram?: boolean;
  /** 017 — "Messenger", igual. */
  messenger?: boolean;
  /** 022 — "TikTok", igual: solo con el canal en CHANNELS. */
  tiktok?: boolean;
}): SettingsSection[] {
  const canales: SettingsLink[] = [];
  // 023 — "Estado" reúne todos los canales; con WhatsApp solo no aporta nada
  // que su pantalla no diga, así que no existe (ADR-001).
  if (instagram || messenger || tiktok) {
    canales.push({ href: "/settings/channels", labelKey: "linkStatus" });
  }
  canales.push({ href: "/settings/whatsapp", labelKey: "linkWhatsapp" });
  if (instagram) canales.push({ href: "/settings/instagram", labelKey: "linkInstagram" });
  if (messenger) canales.push({ href: "/settings/messenger", labelKey: "linkMessenger" });
  if (tiktok) canales.push({ href: "/settings/tiktok", labelKey: "linkTiktok" });

  // #85 — el proveedor de IA se configura aquí; el entorno queda de respaldo.
  const agente: SettingsLink[] = [{ href: "/settings/ai", labelKey: "linkAi" }];
  if (agenda) agente.push({ href: "/settings/calendar", labelKey: "linkCalendar" });

  const negocio: SettingsLink[] = [
    { href: "/settings/branding", labelKey: "linkBranding" },
    // 062 — Tema, letra, tamaño y densidad (cada quien la suya).
    { href: "/settings/appearance", labelKey: "linkAppearance" },
    // 069 — Idioma de la UI para todo el equipo.
    { href: "/settings/language", labelKey: "linkLanguage" },
    { href: "/settings/templates", labelKey: "linkTemplates" },
    // 049 — lo que el equipo inserta con «/atajo» en la Bandeja.
    { href: "/settings/quick-replies", labelKey: "linkQuickReplies" },
    { href: "/settings/team", labelKey: "linkTeam" },
  ];
  if (atribucion) negocio.push({ href: "/settings/ads", labelKey: "linkAds" });

  return [
    { titleKey: "sectionChannels", links: canales },
    { titleKey: "sectionAgent", links: agente },
    { titleKey: "sectionBusiness", links: negocio },
  ];
}

/** Activa si la ruta es la entrada o cuelga de ella (`/inbox/cv_123`). */
export function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
