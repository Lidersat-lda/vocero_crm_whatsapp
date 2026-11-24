/**
 * i18n de la UI del CRM. Tres idiomas soportados:
 *
 * - `es`     — español (por defecto y fallback)
 * - `pt-PT`  — portugués de Portugal
 * - `en`     — inglés
 *
 * El idioma es del NEGOCIO, no del navegador ni del usuario: lo elige el
 * propietario en Ajustes y aplica a todos los miembros del mismo negocio.
 * Vive en `organization.metadata.idioma` (ver `src/server/idioma.ts`).
 */
export const LOCALES = ["es", "pt-PT", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";

export function esLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function normalizarLocale(value: unknown): Locale {
  return esLocale(value) ? value : DEFAULT_LOCALE;
}

/** Etiquetas legibles para el selector de Ajustes. */
export const ETIQUETAS_LOCALE: Record<Locale, string> = {
  es: "Español",
  "pt-PT": "Português (Portugal)",
  en: "English",
};
