import { getRequestConfig } from "next-intl/server";
import { getSessionOrNull } from "@/lib/auth/session";
import { idiomaActual } from "@/server/idioma";
import { DEFAULT_LOCALE, type Locale } from "./routing";

/**
 * 069 — next-intl resuelve el idioma por petición. Lo pregunta a la sesión
 * activa y, con el `organizationId`, lee `organization.metadata.idioma`.
 *
 * Sin sesión (login, raíz pública) cae al por defecto (`es`). El fallback de
 * red/BD también es el por defecto: la UI no puede quedarse en blanco porque
 * la BD esté lenta en el primer pintado.
 */
export default getRequestConfig(async () => {
  const session = await getSessionOrNull().catch(() => null);
  const locale: Locale = session
    ? await idiomaActual(session.organizationId).catch(() => DEFAULT_LOCALE)
    : DEFAULT_LOCALE;

  // Los JSON viven en la raíz del repo (`messages/<locale>.json`).
  const messages = (await import(`../../messages/${locale}.json`)).default as Record<
    string,
    unknown
  >;

  return { locale, messages };
});
