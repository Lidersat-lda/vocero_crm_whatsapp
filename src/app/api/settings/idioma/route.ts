import { z } from "zod";
import { apiError, parseBody, withAuth } from "@/lib/api";
import { canConfigure } from "@/lib/auth/roles";
import { LOCALES } from "@/i18n/routing";
import { guardarIdiomaDelNegocio, idiomaDelNegocio } from "@/server/idioma";

export const dynamic = "force-dynamic";

/** 069 — El idioma del CRM que ve todo el equipo. */
export const GET = withAuth(async (session) => {
  return Response.json({ idioma: await idiomaDelNegocio(session.organizationId) });
});

const schema = z.object({ idioma: z.enum(LOCALES) });

/** Solo quien configura lo cambia; aplica a todos los miembros del negocio. */
export const PUT = withAuth(async (session, req: Request) => {
  if (!canConfigure(session.role)) {
    return apiError(403, "forbidden", "Solo el dueño o un administrador cambia el idioma del CRM");
  }
  const body = await parseBody(req, schema);
  if (!body.ok) return body.response;
  await guardarIdiomaDelNegocio(session.organizationId, body.data.idioma);
  return Response.json({ ok: true });
});
