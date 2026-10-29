"use client";

import { createContext, useContext, useEffect } from "react";
import type { Locale } from "@/lib/i18n";

const LocaleContext = createContext<Locale>("en");

export function LocaleProvider({ children, locale }: { children: React.ReactNode; locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useCurrentLocale(): Locale {
  return useContext(LocaleContext);
}
