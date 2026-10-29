"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Lock, Mail, User, Building, Phone, ArrowRight, AlertCircle } from "lucide-react";
import { useCurrentLocale } from "@/components/LocaleProvider";

export default function RegisterPage() {
  const locale = useCurrentLocale();
  const tr = (en: string, ar: string) => locale === "ar" ? ar : en;
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    companyName: "",
    companySector: "Technology & Software",
    clientType: "ORGANIZATION",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || tr("Failed to create account.", "تعذر إنشاء الحساب."));
        setLoading(false);
        return;
      }

      router.push("/client");
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
          {tr("Create a Client Account", "إنشاء حساب عميل")}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {tr("Track service requests, review proposals, and communicate with the team", "تابع طلبات الخدمة والعروض وتواصل مع فريق العمل")}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {tr("Full Name", "الاسم الكامل")} *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                    placeholder="Ahmed Salem"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {tr("Business Email", "البريد الإلكتروني للعمل")} *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                    placeholder="ahmed@company.com"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {tr("Password", "كلمة المرور")} *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                    placeholder={tr("Min 8 characters", "8 أحرف على الأقل")}
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {tr("Phone Number", "رقم الهاتف")}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                    placeholder="+966 50 000 0000"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>
            </div>

            {/* Client Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {tr("Client Type", "نوع العميل")}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, clientType: "ORGANIZATION" })}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                    form.clientType === "ORGANIZATION"
                      ? "bg-blue-50 border-blue-600 text-blue-700"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {tr("Organization / Business", "شركة أو مؤسسة")}
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, clientType: "INDIVIDUAL" })}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                    form.clientType === "INDIVIDUAL"
                      ? "bg-blue-50 border-blue-600 text-blue-700"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {tr("Individual Professional", "عميل فرد")}
                </button>
              </div>
            </div>

            {/* Company Details */}
            {form.clientType === "ORGANIZATION" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {tr("Company Name", "اسم الشركة")}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.companyName}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                      placeholder="Acme Holdings"
                    />
                    <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {tr("Industry Sector", "القطاع")}
                  </label>
                  <select
                    value={form.companySector}
                    onChange={(e) => setForm({ ...form, companySector: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Supply Chain & Logistics">{tr("Supply Chain & Logistics", "سلاسل الإمداد واللوجستيات")}</option>
                    <option value="FinTech & Banking">{tr("FinTech & Banking", "التقنية المالية والمصارف")}</option>
                    <option value="Healthcare & Life Sciences">{tr("Healthcare & Life Sciences", "الرعاية الصحية وعلوم الحياة")}</option>
                    <option value="Retail & E-Commerce">{tr("Retail & E-Commerce", "التجزئة والتجارة الإلكترونية")}</option>
                    <option value="Manufacturing & Industrial">{tr("Manufacturing & Industrial", "التصنيع والصناعة")}</option>
                    <option value="Real Estate & Construction">{tr("Real Estate & Construction", "العقارات والإنشاءات")}</option>
                    <option value="Professional Services">{tr("Professional Services", "الخدمات المهنية")}</option>
                    <option value="Other">{tr("Other", "أخرى")}</option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow transition-all disabled:opacity-50"
            >
              <span>{loading ? tr("Creating Account...", "جارٍ إنشاء الحساب...") : tr("Create Account & Continue", "إنشاء الحساب والمتابعة")}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            {tr("Already registered?", "لديك حساب بالفعل؟")}{" "}
            <Link href="/auth/login" className="font-semibold text-blue-600 hover:underline">
              {tr("Sign In", "تسجيل الدخول")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
