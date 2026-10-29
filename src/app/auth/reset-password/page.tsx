"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { useCurrentLocale } from "@/components/LocaleProvider";

function ResetPasswordForm() {
  const locale = useCurrentLocale();
  const tr = (en: string, ar: string) => locale === "ar" ? ar : en;
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    if (password !== confirm) { setError(tr("Passwords do not match.", "كلمتا المرور غير متطابقتين.")); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || tr("Could not reset the password.", "تعذر تغيير كلمة المرور."));
      setSuccess(true); setTimeout(() => router.push("/auth/login"), 1800);
    } catch (reason) { setError(reason instanceof Error ? reason.message : tr("Could not reset the password.", "تعذر تغيير كلمة المرور.")); }
    finally { setBusy(false); }
  }

  return <form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
    <div><h1 className="text-2xl font-bold text-[#0b2545]">{tr("Choose a new password", "اختر كلمة مرور جديدة")}</h1><p className="mt-2 text-sm text-slate-500">{tr("Use at least 12 characters. Reset links expire after 30 minutes.", "استخدم 12 حرفًا على الأقل. تنتهي صلاحية رابط الاستعادة بعد 30 دقيقة.")}</p></div>
    {!token && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{tr("Reset link is missing. Request a new one.", "رابط الاستعادة غير موجود. اطلب رابطًا جديدًا.")}</p>}
    {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {success ? <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{tr("Password updated. Redirecting to sign in…", "تم تحديث كلمة المرور. جارٍ تحويلك لتسجيل الدخول…")}</p> : <>
      <label className="block text-xs font-semibold text-slate-700">{tr("New password", "كلمة المرور الجديدة")}<input required minLength={12} maxLength={256} autoComplete="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></label>
      <label className="block text-xs font-semibold text-slate-700">{tr("Confirm password", "تأكيد كلمة المرور")}<input required minLength={12} maxLength={256} autoComplete="new-password" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></label>
      <button disabled={busy || !token} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{busy ? tr("Updating…", "جارٍ التحديث…") : tr("Update password", "تحديث كلمة المرور")}</button>
    </>}
    <p className="text-center text-xs text-slate-500"><Link className="font-semibold text-blue-600 hover:underline" href="/auth/forgot-password">{tr("Request another reset link", "طلب رابط استعادة جديد")}</Link></p>
  </form>;
}

export default function ResetPasswordPage() {
  const locale = useCurrentLocale();
  return <main dir={locale === "ar" ? "rtl" : "ltr"} className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12"><div className="mb-8"><Logo width={220} height={55} /></div><Suspense fallback={<p className="text-sm text-slate-500">{locale === "ar" ? "جارٍ التحميل…" : "Loading…"}</p>}><ResetPasswordForm /></Suspense></main>;
}
