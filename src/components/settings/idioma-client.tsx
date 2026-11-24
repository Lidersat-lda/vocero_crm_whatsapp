"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ETIQUETAS_LOCALE, LOCALES, type Locale } from "@/i18n/routing";

/**
 * 069 — Selector de idioma del CRM. Guarda `organization.metadata.idioma` y
 * refresca la página: el layout raíz vuelve a resolver el locale y toda la UI
 * aparece traducida sin salir de aquí.
 */
export function IdiomaClient({ inicial }: { inicial: Locale }) {
  const router = useRouter();
  const t = useTranslations("settings.language");
  const common = useTranslations("common");
  const [valor, setValor] = useState<Locale>(inicial);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setAviso(null);
    setError(null);
    try {
      const res = await fetch("/api/settings/idioma", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idioma: valor }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        setError(data?.error?.message ?? "Error");
        return;
      }
      setAviso(t("saved"));
      // El idioma vive en el servidor: solo refrescando se recarga el locale.
      router.refresh();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-[18px] font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-[13.5px] text-text-2">{t("description")}</p>
      </div>
      <form onSubmit={guardar} className="space-y-4 tarjeta p-5">
        <label className="flex flex-col gap-1.5 text-[13.5px] font-semibold">
          {t("label")}
          <select
            value={valor}
            onChange={(e) => setValor(e.target.value as Locale)}
            className="h-10 rounded-md border border-border-strong bg-background px-2 text-[14px] font-normal"
          >
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {ETIQUETAS_LOCALE[l]}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={guardando || valor === inicial}
            className="rounded-md bg-brand px-4 py-2 text-[13.5px] font-semibold text-brand-fg disabled:opacity-60"
          >
            {guardando ? common("saving") : t("save")}
          </button>
          {aviso && <span className="text-[13px] text-success-text">{aviso}</span>}
          {error && <span className="text-[13px] text-danger-text">{error}</span>}
        </div>
      </form>
    </div>
  );
}
