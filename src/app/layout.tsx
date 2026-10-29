import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LocaleProvider } from "@/components/LocaleProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "KEMIX Analysis — Turning Data into Business Decisions",
  description:
    "Enterprise Data Analytics, Business Intelligence & Power BI, Data Engineering, and Predictive Modeling Services.",
  icons: {
    icon: "/images/kemix-logo.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("kemix_locale")?.value === "ar" ? "ar" : "en";
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className="h-full bg-slate-50 text-slate-900 antialiased">
      <body className="min-h-full flex flex-col font-sans selection:bg-blue-500 selection:text-white">
        <LocaleProvider locale={locale}>
          {children}
          <LanguageSwitcher />
        </LocaleProvider>
      </body>
    </html>
  );
}
