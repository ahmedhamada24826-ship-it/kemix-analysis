import { cookies } from "next/headers";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LocaleProvider } from "@/components/LocaleProvider";

export async function LocaleShell({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("kemix_locale")?.value === "ar" ? "ar" : "en";

  return (
    <LocaleProvider locale={locale}>
      {children}
      <LanguageSwitcher />
    </LocaleProvider>
  );
}
