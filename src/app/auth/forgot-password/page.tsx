"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useCurrentLocale } from "@/components/LocaleProvider";
import { Mail, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const locale = useCurrentLocale();
  const tr = (en: string, ar: string) => locale === "ar" ? ar : en;
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || tr("Could not submit the request.", "تعذر إرسال الطلب."));
      setMessage(tr("If an active account matches that email and email delivery is configured, reset instructions will be sent shortly.", "إذا كان البريد مرتبطًا بحساب نشط وخدمة البريد مهيأة، فستصلك تعليمات إعادة تعيين كلمة المرور قريبًا."));
    } catch (reason) { setError(reason instanceof Error ? reason.message : tr("Could not submit the request.", "تعذر إرسال الطلب.")); }
    finally { setBusy(false); }
  }

  return <main dir={locale === "ar" ? "rtl" : "ltr"} className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
    <div className="mb-8"><Logo width={220} height={55} /></div>
    <form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div><h1 className="text-2xl font-bold text-[#0b2545]">{tr("Reset your password", "إعادة تعيين كلمة المرور")}</h1><p className="mt-2 text-sm text-slate-500">{tr("Enter your account email. If it matches an active account, we will send a reset link.", "أدخل البريد الإلكتروني لحسابك. سنرسل رابط إعادة التعيين إذا كان مرتبطًا بحساب نشط.")}</p></div>
      {error && <p role="alert" className="flex gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700"><AlertCircle size={16} />{error}</p>}
      {message && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      <label className="block text-xs font-semibold text-slate-700">{tr("Email address", "البريد الإلكتروني")}
        <span className="relative mt-1 block"><input required type="email" maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pe-10 text-sm outline-none focus:ring-2 focus:ring-blue-500" /><Mail size={16} className="absolute end-3 top-3 text-slate-400" /></span>
      </label>
      <button disabled={busy} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{busy ? tr("Submitting…", "جارٍ الإرسال…") : tr("Send reset instructions", "إرسال تعليمات الاستعادة")}</button>
      <p className="text-center text-xs text-slate-500"><Link className="font-semibold text-blue-600 hover:underline" href="/auth/login">{tr("Back to sign in", "العودة لتسجيل الدخول")}</Link></p>
    </form>
  </main>;
}
