"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";
import { useCurrentLocale } from "@/components/LocaleProvider";

export default function LoginPage() {
  const locale = useCurrentLocale();
  const tr = (en: string, ar: string) => locale === "ar" ? ar : en;
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || tr("Authentication failed. Please check your credentials.", "تعذر تسجيل الدخول. راجع البريد الإلكتروني وكلمة المرور."));
        setLoading(false);
        return;
      }

      if (data.user.role === "CLIENT") {
        router.push("/client");
      } else if (["ANALYST", "TRAINEE"].includes(data.user.role)) {
        router.push("/employee");
      } else {
        router.push("/admin");
      }
      router.refresh();
    } catch {
      setError(tr("Network or server error. Please try again.", "حدث خطأ في الاتصال أو الخادم. حاول مرة أخرى."));
      setLoading(false);
    }
  };

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <Logo width={220} height={55} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[#0b2545]">
          {tr("Sign in to your account", "تسجيل الدخول إلى حسابك")}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {tr("Secure operations and client delivery platform", "منصة آمنة لإدارة العمليات وتسليم أعمال العملاء")}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {tr("Business Email Address", "البريد الإلكتروني للعمل")}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                  placeholder="name@company.com"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">{tr("Password", "كلمة المرور")}</label>
                <Link
                  href="/auth/forgot-password"
                  className="text-[11px] font-medium text-blue-600 hover:underline"
                >
                  {tr("Forgot password?", "نسيت كلمة المرور؟")}
                </Link>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                  placeholder="••••••••••••"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow transition-all disabled:opacity-50"
            >
              <span>{loading ? tr("Authenticating...", "جارٍ تسجيل الدخول...") : tr("Sign In", "دخول")}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            {tr("Don&apos;t have an account yet?", "ليس لديك حساب بعد؟")}{" "}
            <Link href="/auth/register" className="font-semibold text-blue-600 hover:underline">
              {tr("Register as a Client", "إنشاء حساب عميل")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
