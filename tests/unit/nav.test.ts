import { describe, expect, it } from "vitest";
import {
  appNavGroups,
  isNavActive,
  SETTINGS_ITEM,
  settingsSections,
} from "@/lib/nav";

/**
 * #87 — El menú agrupado y Ajustes en tres secciones. Lo que aparece y lo
 * que no lo deciden las banderas (`AGENDA`, `CHANNELS`, `ATRIBUCION`) y el
 * rol; aquí se afirma sobre el modelo, sin dibujar nada.
 *
 * 069 — Los textos salen de i18n: aquí se afirma sobre `labelKey`/`titleKey`,
 * no sobre palabras. La traducción se verifica en el guión E2E.
 */

const labelKeys = (groups: { items: { labelKey: string }[] }[]) =>
  groups.map((g) => g.items.map((i) => i.labelKey));

describe("barra lateral agrupada", () => {
  it("miembro: solo el grupo Trabajo con las tres pestañas de operación", () => {
    const groups = appNavGroups({ role: "member" });
    expect(groups.map((g) => g.titleKey)).toEqual(["groupWork"]);
    expect(labelKeys(groups)).toEqual([["inbox", "pipeline", "contacts"]]);
  });

  it("miembro con AGENDA encendida: sigue sin ver Citas", () => {
    const groups = appNavGroups({ agenda: true, role: "member" });
    expect(groups).toHaveLength(1);
    expect(groups[0]!.items.map((i) => i.labelKey)).toEqual(["inbox", "pipeline", "contacts"]);
  });

  it("owner: Trabajo, Agente y Resultados", () => {
    const groups = appNavGroups({ role: "owner" });
    expect(groups.map((g) => g.titleKey)).toEqual(["groupWork", "groupAgent", undefined]);
    expect(labelKeys(groups)).toEqual([
      ["inbox", "pipeline", "contacts"],
      ["onboarding", "agent", "lab"],
      ["results"],
    ]);
  });

  it("AGENDA añade Citas al final de Trabajo para quien configura", () => {
    const [trabajo] = appNavGroups({ agenda: true, role: "owner" });
    expect(trabajo!.items.map((i) => i.labelKey)).toEqual([
      "inbox",
      "pipeline",
      "contacts",
      "bookings",
    ]);
    expect(trabajo!.items.at(-1)!.href).toBe("/bookings");
  });

  it("la guía de inicio abre el grupo Agente para owner/admin", () => {
    for (const role of ["owner", "admin"]) {
      const agente = appNavGroups({ role })[1]!;
      expect(agente.items[0]).toMatchObject({ href: "/onboarding", labelKey: "onboarding" });
    }
  });

  it("solo la Bandeja lleva el contador y Ajustes queda fuera de los grupos", () => {
    const todos = appNavGroups({ agenda: true, role: "owner" }).flatMap((g) => g.items);
    expect(todos.filter((i) => i.badge).map((i) => i.href)).toEqual(["/inbox"]);
    expect(todos.map((i) => i.href)).not.toContain("/settings");
    expect(SETTINGS_ITEM.href).toBe("/settings");
    // Cada entrada trae su icono: el renglón lo pinta sin condicionar.
    for (const item of [...todos, SETTINGS_ITEM]) expect(item.icon).toBeDefined();
  });

  it("una ruta hija activa su entrada, y /settings no activa nada más", () => {
    expect(isNavActive("/inbox/cv_123", "/inbox")).toBe(true);
    expect(isNavActive("/inbox", "/inbox")).toBe(true);
    expect(isNavActive("/inboxes", "/inbox")).toBe(false);
    expect(isNavActive("/settings/ai", "/settings")).toBe(true);
    expect(isNavActive("/settings/ai", "/agent")).toBe(false);
  });
});

describe("ajustes en tres secciones", () => {
  const links = (s: { titleKey: string; links: { labelKey: string }[] }[]) =>
    Object.fromEntries(s.map((x) => [x.titleKey, x.links.map((l) => l.labelKey)]));

  it("con todo apagado: Canales, Agente y Negocio con lo mínimo", () => {
    const sections = settingsSections({});
    expect(sections.map((s) => s.titleKey)).toEqual([
      "sectionChannels",
      "sectionAgent",
      "sectionBusiness",
    ]);
    expect(links(sections)).toEqual({
      sectionChannels: ["linkWhatsapp"],
      sectionAgent: ["linkAi"],
      sectionBusiness: [
        "linkBranding",
        "linkAppearance",
        "linkLanguage",
        "linkTemplates",
        "linkQuickReplies",
        "linkTeam",
      ],
    });
  });

  it("cada bandera añade su enlace en su sección y en ninguna otra", () => {
    // 023: con un canal social, "Estado" abre la sección.
    expect(links(settingsSections({ messenger: true }))).toEqual({
      sectionChannels: ["linkStatus", "linkWhatsapp", "linkMessenger"],
      sectionAgent: ["linkAi"],
      sectionBusiness: [
        "linkBranding",
        "linkAppearance",
        "linkLanguage",
        "linkTemplates",
        "linkQuickReplies",
        "linkTeam",
      ],
    });
    expect(links(settingsSections({ instagram: true })).sectionChannels).toEqual([
      "linkStatus",
      "linkWhatsapp",
      "linkInstagram",
    ]);
    expect(
      links(settingsSections({ instagram: true, messenger: true, tiktok: true })).sectionChannels
    ).toEqual(["linkStatus", "linkWhatsapp", "linkInstagram", "linkMessenger", "linkTiktok"]);
    expect(links(settingsSections({ agenda: true })).sectionAgent).toEqual(["linkAi", "linkCalendar"]);
    expect(links(settingsSections({ atribucion: true })).sectionBusiness).toEqual([
      "linkBranding",
      "linkAppearance",
      "linkLanguage",
      "linkTemplates",
      "linkQuickReplies",
      "linkTeam",
      "linkAds",
    ]);
  });

  it("con todo encendido, cada pantalla de Ajustes tiene exactamente un enlace", () => {
    const all = settingsSections({
      agenda: true,
      atribucion: true,
      instagram: true,
      messenger: true,
      tiktok: true,
    })
      .flatMap((s) => s.links)
      .map((l) => l.href);
    expect(new Set(all).size).toBe(all.length);
    expect(all.sort()).toEqual(
      [
        "/settings/channels",
        "/settings/whatsapp",
        "/settings/instagram",
        "/settings/messenger",
        "/settings/tiktok",
        "/settings/ai",
        "/settings/calendar",
        "/settings/branding",
        "/settings/appearance",
        "/settings/language",
        "/settings/templates",
        "/settings/quick-replies",
        "/settings/team",
        "/settings/ads",
      ].sort()
    );
  });

  it("el Laboratorio no está en Ajustes: sigue en el menú principal", () => {
    const hrefs = settingsSections({ agenda: true, atribucion: true, messenger: true })
      .flatMap((s) => s.links)
      .map((l) => l.href);
    expect(hrefs).not.toContain("/lab");
    expect(appNavGroups({ role: "owner" }).flatMap((g) => g.items).map((i) => i.href)).toContain("/lab");
  });
});
