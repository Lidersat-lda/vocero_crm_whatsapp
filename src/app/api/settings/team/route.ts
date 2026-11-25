import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { apiError, parseBody, withAuth } from "@/lib/api";
import { getAuth, runInternalSignup } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { newId } from "@/lib/db/ids";
import { scoped } from "@/lib/db/tenant";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (session) => {
  const db = getDb();
  const members = await db
    .select({
      id: schema.member.id,
      role: schema.member.role,
      userId: schema.member.userId,
      createdAt: schema.member.createdAt,
      name: schema.user.name,
      email: schema.user.email,
    })
    .from(schema.member)
    .innerJoin(schema.user, eq(schema.member.userId, schema.user.id))
    .where(scoped(schema.member.organizationId, session.organizationId));
  return Response.json({
    members: members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      name: m.name,
      email: m.email,
      createdAt: m.createdAt.toISOString(),
    })),
  });
});

const ASSIGNABLE_ROLES = ["admin", "operator"] as const;

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  role: z.enum(ASSIGNABLE_ROLES).default("operator"),
});

/** Alta de cuenta de equipo (owner only): email + contraseña temporal (FR-061). */
export const POST = withAuth(async (session, req: Request) => {
  if (session.role !== "owner") {
    return apiError(403, "forbidden", "Solo el propietario puede crear cuentas");
  }
  const body = await parseBody(req, createSchema);
  if (!body.ok) return body.response;

  const auth = getAuth();
  let newUserId: string;
  try {
    const result = await runInternalSignup(() =>
      auth.api.signUpEmail({
        body: {
          name: body.data.name,
          email: body.data.email,
          password: body.data.password,
        },
      })
    );
    newUserId = result.user.id;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No se pudo crear la cuenta";
    if (/exist/i.test(message)) {
      return apiError(409, "duplicate", "Ya existe una cuenta con ese correo");
    }
    return apiError(422, "invalid", message);
  }

  const db = getDb();
  await db
    .insert(schema.member)
    .values({
      id: newId("member"),
      organizationId: session.organizationId,
      userId: newUserId,
      role: body.data.role,
    })
    .onConflictDoNothing();

  return Response.json({ ok: true }, { status: 201 });
});

const patchSchema = z.object({
  role: z.enum(ASSIGNABLE_ROLES),
});

/**
 * Cambio de rol de un miembro (owner only). No se puede tocar al propio
 * propietario desde aquí para no dejar la organización sin uno.
 */
export const PATCH = withAuth(async (session, req: Request) => {
  if (session.role !== "owner") {
    return apiError(403, "forbidden", "Solo el propietario puede cambiar roles");
  }
  const url = new URL(req.url);
  const memberId = url.searchParams.get("memberId");
  if (!memberId) return apiError(400, "invalid", "Falta memberId");

  const body = await parseBody(req, patchSchema);
  if (!body.ok) return body.response;

  const db = getDb();
  const existing = await db
    .select({ role: schema.member.role })
    .from(schema.member)
    .where(
      and(
        scoped(schema.member.organizationId, session.organizationId),
        eq(schema.member.id, memberId)
      )
    )
    .limit(1);
  if (!existing[0]) return apiError(404, "not_found", "Miembro no encontrado");
  if (existing[0].role === "owner") {
    return apiError(403, "forbidden", "No se puede cambiar el rol del propietario");
  }

  await db
    .update(schema.member)
    .set({ role: body.data.role })
    .where(
      and(
        scoped(schema.member.organizationId, session.organizationId),
        eq(schema.member.id, memberId),
        ne(schema.member.role, "owner")
      )
    );

  return Response.json({ ok: true });
});
