/**
 * Tres niveles de permiso sobre la organización:
 *
 * - `owner`: configurador total. Único con acceso a `/settings` y único que
 *   puede asignar roles a otros miembros desde la UI de equipo.
 * - `admin`: operación avanzada. Accede a Agente, Laboratorio, Resultados y
 *   agenda, además de Bandeja, Pipeline y Contactos. No accede a `/settings`.
 * - `operator`: operación básica. Solo Bandeja, Pipeline y Contactos.
 *
 * Todos los roles ven el toggle de silencio de mensajes nuevos (vive en el
 * sidebar, no en /settings).
 *
 * Vive en `lib/` porque lo consultan los dos lados: el menú (cliente) y la
 * redirección/guards de las rutas (servidor).
 */

export type AppRole = "owner" | "admin" | "operator";

export function normalizeRole(role: string | null | undefined): AppRole {
  if (role === "owner" || role === "admin") return role;
  return "operator";
}

/** Solo owner. Gating de `/settings`. */
export function canConfigure(role: string | null | undefined): boolean {
  return normalizeRole(role) === "owner";
}

/** owner + admin. Gating de Agente, Laboratorio, Resultados, agenda. */
export function canAccessAdvanced(role: string | null | undefined): boolean {
  const r = normalizeRole(role);
  return r === "owner" || r === "admin";
}
