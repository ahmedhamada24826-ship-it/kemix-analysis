"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { useCurrentLocale } from "@/components/LocaleProvider";

function AcceptInviteForm() {
  const locale = useCurrentLocale();
  const tr = (en: string, ar: string) => locale === "ar" ? ar : en;
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [form, setForm] = useState({ name: "", password: "", confirmPassword: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const visibleError = error || (!token ? tr("Invalid or missing invitation token.", "رابط الدعوة غير صالح أو منتهي.") : "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.name.trim().length < 2) { setError(tr("Please enter your full name.", "أدخل اسمك الكامل.")); return; }
    if (form.password.length < 8) { setError(tr("Password must be at least 8 characters.", "يجب ألا تقل كلمة المرور عن 8 أحرف.")); return; }
    if (form.password !== form.confirmPassword) { setError(tr("Passwords do not match.", "كلمتا المرور غير متطابقتين.")); return; }

    setLoading(true);
    const res = await fetch("/api/auth/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, name: form.name.trim(), password: form.password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error || tr("Something went wrong.", "حدث خطأ. حاول مرة أخرى.")); return; }
    setSuccess(true);
    setTimeout(() => router.push(["SUPER_ADMIN", "OPERATIONS_MANAGER", "SUPPORT_AGENT", "PROJECT_LEAD"].includes(data.user?.role) ? "/admin" : "/employee"), 2000);
  }

  if (success) {
    return (
      <div dir={locale === "ar" ? "rtl" : "ltr"} className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="text-green-600" size={32} />
        </div>
        <h2 className="text-xl font-bold text-[#0b2545]">{tr("Welcome to KEMIX Analysis!", "مرحبًا بك في KEMIX Analysis!")}</h2>
        <p className="text-gray-500">{tr("Your account has been created. Redirecting to your workspace...", "تم إنشاء حسابك. جارٍ تحويلك إلى مساحة العمل...")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} dir={locale === "ar" ? "rtl" : "ltr"} className="space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#0b2545]">{tr("Accept Your Invitation", "قبول الدعوة")}</h1>
        <p className="text-gray-500 mt-2 text-sm">{tr("Set up your KEMIX Analysis team account.", "أنشئ حسابك ضمن فريق KEMIX Analysis.")}</p>
      </div>

      {visibleError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{visibleError}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{tr("Full Name", "الاسم الكامل")} *</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder={tr("Your full name", "اكتب اسمك الكامل")}
          required
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30 focus:border-[#0066ff]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{tr("Password", "كلمة المرور")} *</label>
        <div className="relative">
          <input
            type={showPwd ? "text" : "password"}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={tr("At least 8 characters", "8 أحرف على الأقل")}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30 focus:border-[#0066ff] pr-11"
          />
          <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
            {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{tr("Confirm Password", "تأكيد كلمة المرور")} *</label>
        <input
          type="password"
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          placeholder={tr("Repeat your password", "أعد كتابة كلمة المرور")}
          required
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30 focus:border-[#0066ff]"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !token}
        className="w-full py-3 bg-[#0066ff] text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? tr("Creating account...", "جارٍ إنشاء الحساب...") : tr("Create My Account", "إنشاء حسابي")}
      </button>

      <p className="text-center text-xs text-gray-400">
        {tr("Already have an account?", "لديك حساب بالفعل؟")}{" "}
        <Link href="/auth/login" className="text-[#0066ff] hover:underline">{tr("Sign in", "تسجيل الدخول")}</Link>
      </p>
    </form>
  );
}

export default function AcceptInvitePage() {
  const locale = useCurrentLocale();
  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Logo width={180} height={46} />
      </div>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <Suspense fallback={<div className="text-center text-gray-400">{locale === "ar" ? "جارٍ التحميل..." : "Loading..."}</div>}>
          <AcceptInviteForm />
        </Suspense>
      </div>
    </div>
  );
}
