import type { Metadata } from "next";
import { Suspense } from "react";
import { LocaleShell } from "@/components/LocaleShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "KEMIX Analysis — Turning Data into Business Decisions",
  description:
    "Enterprise Data Analytics, Business Intelligence & Power BI, Data Engineering, and Predictive Modeling Services.",
  icons: {
    icon: "/images/kemix-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50 text-slate-900 antialiased">
      <body className="min-h-full flex flex-col font-sans selection:bg-blue-500 selection:text-white">
        <Suspense fallback={<div className="min-h-screen bg-slate-50" aria-busy="true" />}>
          <LocaleShell>
          {children}
          </LocaleShell>
        </Suspense>
      </body>
    </html>
  );
}
