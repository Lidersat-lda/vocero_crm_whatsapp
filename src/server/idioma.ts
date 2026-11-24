import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { DEFAULT_LOCALE, normalizarLocale, type Locale } from "@/i18n/routing";

/**
 * 069 — Idioma de la UI del CRM. Vive en `organization.metadata.idioma`
 * (junto a la apariencia y la marca): una sola llave por negocio aplica a
 * todos los miembros. No hay cookie ni preferencia por usuario.
 *
 * Reutiliza el mismo patrón de `src/server/apariencia.ts` sin tocar el esquema
 * de la BD: `metadata` ya es `text` JSON de uso genérico.
 */

function leerMetadata(metadata: string | null): Record<string, unknown> {
  if (!metadata) return {};
  try {
    const m = JSON.parse(metadata) as unknown;
    return typeof m === "object" && m !== null ? (m as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** El idioma guardado, o `null` si nunca se eligió: vale el por defecto. */
export async function idiomaDelNegocio(organizationId?: string | null): Promise<Locale | null> {
  const db = getDb();
  const rows = organizationId
    ? await db
        .select({ metadata: schema.organization.metadata })
        .from(schema.organization)
        .where(eq(schema.organization.id, organizationId))
        .limit(1)
    : // Sin sesión: la única organización de la instancia.
      await db.select({ metadata: schema.organization.metadata }).from(schema.organization).limit(1);
  const raw = leerMetadata(rows[0]?.metadata ?? null).idioma;
  if (raw == null) return null;
  return normalizarLocale(raw);
}

/** El idioma vigente, con fallback al por defecto. */
export async function idiomaActual(organizationId?: string | null): Promise<Locale> {
  return (await idiomaDelNegocio(organizationId).catch(() => null)) ?? DEFAULT_LOCALE;
}

export async function guardarIdiomaDelNegocio(organizationId: string, locale: Locale): Promise<void> {
  const db = getDb();
  const rows = await db
    .select({ metadata: schema.organization.metadata })
    .from(schema.organization)
    .where(eq(schema.organization.id, organizationId))
    .limit(1);
  const meta = leerMetadata(rows[0]?.metadata ?? null);
  meta.idioma = normalizarLocale(locale);
  await db
    .update(schema.organization)
    .set({ metadata: JSON.stringify(meta) })
    .where(eq(schema.organization.id, organizationId));
}
