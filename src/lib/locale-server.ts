import { cookies } from "next/headers";
import type { Locale } from "@/lib/i18n";

export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return cookieStore.get("kemix_locale")?.value === "ar" ? "ar" : "en";
}
