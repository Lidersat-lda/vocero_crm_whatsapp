import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * #86 — Quién entra a la guía y a dónde manda la raíz. Las dos páginas se
 * prueban con sus dependencias falsas: solo interesa la decisión.
 */

const getSessionOrNull = vi.hoisted(() => vi.fn());
const guideStatus = vi.hoisted(() => vi.fn());
const guideFirst = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/session", () => ({ getSessionOrNull }));
vi.mock("@/server/onboarding/guide", () => ({ guideStatus, guideFirst }));
vi.mock("@/components/onboarding/onboarding-client", () => ({
  OnboardingClient: () => null,
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));
vi.mock("@/lib/db", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({ limit: () => Promise.resolve([{ name: "Sofi" }]) }),
      }),
    }),
  }),
  schema: { agentProfile: { organizationId: "organization_id", name: "name" } },
}));

import OnboardingPage from "@/app/(app)/onboarding/page";
import Home from "@/app/page";
import { canAccessAdvanced, canConfigure } from "@/lib/auth/roles";

const owner = { userId: "usr_1", organizationId: "org_1", role: "owner" };
const admin = { userId: "usr_3", organizationId: "org_1", role: "admin" };
const operator = { userId: "usr_2", organizationId: "org_1", role: "operator" };

beforeEach(() => {
  getSessionOrNull.mockReset();
  guideStatus.mockReset();
  guideFirst.mockReset();
});

describe("quién configura", () => {
  it("solo el propietario accede a Configuraciones", () => {
    expect(canConfigure("owner")).toBe(true);
    expect(canConfigure("admin")).toBe(false);
    expect(canConfigure("operator")).toBe(false);
    expect(canConfigure(undefined)).toBe(false);
  });

  it("owner y admin acceden a funciones avanzadas; operator no", () => {
    expect(canAccessAdvanced("owner")).toBe(true);
    expect(canAccessAdvanced("admin")).toBe(true);
    expect(canAccessAdvanced("operator")).toBe(false);
    expect(canAccessAdvanced(undefined)).toBe(false);
  });
});

describe("/onboarding", () => {
  it("sin sesión manda al login", async () => {
    getSessionOrNull.mockResolvedValue(null);
    await expect(OnboardingPage()).rejects.toThrow("redirect:/login");
  });

  it("un operador del equipo va a la Bandeja: no puede hacer ningún paso", async () => {
    getSessionOrNull.mockResolvedValue(operator);
    await expect(OnboardingPage()).rejects.toThrow("redirect:/inbox");
    expect(guideStatus).not.toHaveBeenCalled();
  });

  it("un admin ve la guía igual que el propietario", async () => {
    getSessionOrNull.mockResolvedValue(admin);
    guideStatus.mockResolvedValue({ steps: [], complete: false, enabled: false });
    const page = (await OnboardingPage()) as { props: { agentName: string | null } };
    expect(guideStatus).toHaveBeenCalledWith("org_1");
    expect(page.props.agentName).toBe("Sofi");
  });

  it("el propietario ve la guía resuelta en el servidor", async () => {
    getSessionOrNull.mockResolvedValue(owner);
    guideStatus.mockResolvedValue({ steps: [], complete: false, enabled: false });
    const page = (await OnboardingPage()) as { props: { agentName: string | null } };
    expect(guideStatus).toHaveBeenCalledWith("org_1");
    expect(page.props.agentName).toBe("Sofi");
  });
});

describe("la raíz", () => {
  it("sin sesión sigue yendo a la Bandeja (que manda al login)", async () => {
    getSessionOrNull.mockResolvedValue(null);
    await expect(Home()).rejects.toThrow("redirect:/inbox");
    expect(guideFirst).not.toHaveBeenCalled();
  });

  it("al dueño con pasos pendientes lo manda a la guía", async () => {
    getSessionOrNull.mockResolvedValue(owner);
    guideFirst.mockResolvedValue(true);
    await expect(Home()).rejects.toThrow("redirect:/onboarding");
    expect(guideFirst).toHaveBeenCalledWith(owner);
  });

  it("con todo listo y el agente encendido, a la Bandeja como siempre", async () => {
    getSessionOrNull.mockResolvedValue(owner);
    guideFirst.mockResolvedValue(false);
    await expect(Home()).rejects.toThrow("redirect:/inbox");
  });
});
