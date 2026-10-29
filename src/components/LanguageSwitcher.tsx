"use client";

import { useState } from "react";
import { useCurrentLocale } from "@/components/LocaleProvider";
import type { Locale } from "@/lib/i18n";

export function LanguageSwitcher() {
  const [busy, setBusy] = useState(false);
  const current = useCurrentLocale();

  async function choose(locale: Locale) {
    if (busy || locale === current) return;
    setBusy(true);
    try {
      const response = await fetch("/api/preferences/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      if (response.ok) window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div dir="ltr" className="fixed bottom-4 left-4 z-[100] flex items-center rounded-full border border-slate-200 bg-white/95 p-1 shadow-lg backdrop-blur" aria-label="Language">
      <button type="button" disabled={busy} onClick={() => choose("en")} aria-pressed={current === "en"} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${current === "en" ? "bg-[#0b2545] text-white" : "text-slate-600 hover:bg-slate-100"}`}>EN</button>
      <button type="button" disabled={busy} onClick={() => choose("ar")} aria-pressed={current === "ar"} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${current === "ar" ? "bg-[#0b2545] text-white" : "text-slate-600 hover:bg-slate-100"}`}>عربي</button>
    </div>
  );
}
