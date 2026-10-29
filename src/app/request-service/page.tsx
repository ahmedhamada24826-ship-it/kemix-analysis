"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCurrentLocale } from "@/components/LocaleProvider";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  Lock,
} from "lucide-react";

function RequestServiceContent() {
  const locale = useCurrentLocale();
  const ar = locale === "ar";
  const tr = (english: string, arabic: string) => ar ? arabic : english;
  const displayValue = (value: string) => {
    if (!ar) return value;
    const labels: Record<string, string> = {
      "Supply Chain & Logistics": "سلاسل الإمداد والخدمات اللوجستية", "FinTech & Banking": "التقنية المالية والمصارف",
      "Healthcare & Life Sciences": "الرعاية الصحية وعلوم الحياة", "Retail & E-Commerce": "التجزئة والتجارة الإلكترونية",
      "Manufacturing & Industrial": "التصنيع والصناعة", "Real Estate & Construction": "العقارات والإنشاءات", Other: "أخرى",
      "Data Analysis and Reporting": "تحليل البيانات وإعداد التقارير", "Business Intelligence & Power BI Dashboards": "ذكاء الأعمال ولوحات Power BI",
      "Data Cleaning, SQL, Python & Automation": "تنظيف البيانات وSQL وPython والأتمتة", "Forecasting and Data Science": "التنبؤ وعلوم البيانات",
      "Custom Data Engineering & Advisory": "هندسة بيانات واستشارات مخصصة", spreadsheets: "جداول بيانات",
      database: "قاعدة بيانات", business_software: "برامج أعمال", api: "واجهة API أو تخزين سحابي", manual_records: "سجلات ورقية أو PDF", unknown: "غير معروف",
      "Under 10,000 rows": "أقل من 10,000 صف", "10,000 to 100,000 rows": "من 10,000 إلى 100,000 صف",
      "100,000 to 1,000,000 rows": "من 100,000 إلى مليون صف", "Over 1,000,000 rows": "أكثر من مليون صف", Unknown: "غير معروف",
      "Urgent (1 to 2 Weeks)": "عاجل (أسبوع إلى أسبوعين)", "Standard (2 to 4 Weeks)": "عادي (أسبوعان إلى 4 أسابيع)",
      "Flexible (1 to 2 Months)": "مرن (شهر إلى شهرين)", "Ongoing Retainer": "تعاقد شهري مستمر",
      "Need proposal to determine": "تُحدد بعد إعداد العرض", EMAIL: "البريد الإلكتروني", PHONE: "الهاتف أو مكالمة مجدولة", PLATFORM: "بوابة KEMIX",
    };
    return labels[value] || value;
  };
  const searchParams = useSearchParams();
  const preselectedService = searchParams.get("service") || "";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [isClientSignedIn, setIsClientSignedIn] = useState(false);

  // Form State
  const [form, setForm] = useState({
    // Step 1: Client Info
    name: "",
    email: "",
    phone: "",
    companyName: "",
    companySector: "Supply Chain & Logistics",
    clientType: "ORGANIZATION",
    password: "",

    // Step 2: Business Problem
    serviceType: preselectedService || "Business Intelligence & Power BI Dashboards",
    problemDescription: "",
    businessObjective: "",
    desiredOutcome: "",
    currentChallenge: "",
    expectedValue: "",

    // Step 3: Data Readiness
    dataSourceType: "spreadsheets",
    approxDataVolume: "Under 100,000 rows",
    hasDataAccess: true,
    hasRestrictions: false,
    needsPreparationHelp: false,

    // Step 4: Delivery Expectations
    preferredDeadline: "2 to 3 Weeks",
    budgetRange: "$2,500 - $5,000",
    preferredContactMethod: "EMAIL",
    bestTimeForCall: "Mornings (9 AM - 12 PM)",
    additionalNotes: "",
  });

  // Prefill if already logged in
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setIsClientSignedIn(data.user.role === "CLIENT");
            setForm((prev) => ({
              ...prev,
              name: data.user.name || prev.name,
              email: data.user.email || prev.email,
              companyName: data.user.companyName || prev.companyName,
              clientType: data.user.clientType || prev.clientType,
            }));
          }
        }
      } catch {
        // guest mode
      }
    }
    checkAuth();
  }, []);

  const handleNext = () => {
    setError("");
    if (step === 1) {
      if (!form.name || !form.email) {
        setError(tr("Please provide your name and a valid business email.", "أدخل اسمك وبريدًا إلكترونيًا صالحًا."));
        return;
      }
      if (!isClientSignedIn && form.password.length < 8) {
        setError(tr("Create a portal password with at least 8 characters.", "أنشئ كلمة مرور لبوابة العميل لا تقل عن 8 أحرف."));
        return;
      }
    } else if (step === 2) {
      if (!form.problemDescription || !form.businessObjective || !form.desiredOutcome) {
        setError(tr("Please complete the required fields describing your problem and objectives.", "أكمل الحقول المطلوبة لوصف المشكلة والأهداف."));
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handlePrev = () => {
    setError("");
    setStep((s) => s - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || tr("Failed to submit request.", "تعذر إرسال الطلب."));
        setLoading(false);
        return;
      }

      setSubmittedRef(data.referenceNumber);
      setLoading(false);
    } catch {
      setError(tr("An unexpected network error occurred. Please try again.", "حدث خطأ في الاتصال. حاول مرة أخرى."));
      setLoading(false);
    }
  };

  const stepTitles = [
    tr("Client Profile", "بيانات العميل"),
    tr("Business Problem", "مشكلة العمل"),
    tr("Data Readiness", "جاهزية البيانات"),
    tr("Expectations", "التوقعات"),
    tr("Review & Submit", "المراجعة والإرسال"),
  ];

  return (
    <div className="flex flex-col min-h-screen" dir={ar ? "rtl" : "ltr"}>
      <Navbar />

      <section className="bg-[#0b2545] text-white py-12 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest bg-blue-900/60 px-3 py-1 rounded-full border border-blue-700/50">
            {tr("KEMIX Service Intake", "طلب خدمة من KEMIX")}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold">{tr("Service Request & Discovery", "طلب خدمة وتحديد الاحتياجات")}</h1>
          <p className="text-slate-300 max-w-xl mx-auto text-sm leading-relaxed">
            {tr("Tell us about your business goals and data sources. We will review your requirements, assess feasibility, and provide a transparent project proposal.", "أخبرنا عن أهداف عملك ومصادر بياناتك. سنراجع متطلباتك ونقيّم إمكانية التنفيذ ونقدم عرضًا واضحًا للمشروع.")}
          </p>
        </div>
      </section>

      <section className="py-12 bg-slate-50 flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {submittedRef ? (
            /* Confirmation View */
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full">
                  {tr("Request Successfully Registered", "تم تسجيل الطلب بنجاح")}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b2545]">
                  {tr("We Received Your Request", "استلمنا طلبك")}
                </h2>
                <p className="text-slate-600 text-sm max-w-md mx-auto">
                  {tr("Your service inquiry has been recorded. Our team will follow up shortly.", "تم تسجيل طلبك، وسيتواصل معك فريقنا قريبًا.")}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 max-w-sm mx-auto">
                <p className="text-xs text-slate-500 font-medium">{tr("Unique Reference Number", "الرقم المرجعي للطلب")}</p>
                <p className="text-2xl font-black text-blue-600 font-mono tracking-wider mt-1">
                  {submittedRef}
                </p>
              </div>

              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 text-xs text-blue-900 text-left space-y-2 max-w-lg mx-auto">
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  {tr("What Happens Next:", "ما الخطوات التالية؟")}
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                  <li>{tr("Our team reviews your request within 24 hours.", "يراجع فريقنا طلبك خلال 24 ساعة.")}</li>
                  <li>{tr(`We contact you through your preferred method (${form.preferredContactMethod}) for a consultation.`, `سنتواصل معك بالطريقة المفضلة (${displayValue(form.preferredContactMethod)}) لتحديد موعد استشارة.`)}</li>
                  <li>{tr("Track progress, message the team, and review proposals in your portal.", "تابع التقدم وتواصل مع الفريق وراجع العروض من بوابتك.")}</li>
                </ol>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                <Link
                  href="/client/requests"
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow transition-colors flex items-center justify-center gap-2"
                >
                  <span>{tr("Track Request in Client Portal", "تابع الطلب في بوابة العميل")}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/"
                  className="px-6 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  {tr("Return to Home", "العودة إلى الرئيسية")}
                </Link>
              </div>
            </div>
          ) : (
            /* Multi-step Form */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10">
              {/* Stepper Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-semibold text-blue-600">{tr(`Step ${step} of 5`, `الخطوة ${step} من 5`)}</span>
                  <span className="font-medium text-slate-700">{stepTitles[step - 1]}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{ width: `${(step / 5) * 100}%` }}
                  ></div>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* STEP 1: Client Information */}
                {step === 1 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div>
                      <h3 className="text-lg font-bold text-[#0b2545]">{tr("Client Profile", "بيانات العميل")}</h3>
                      <p className="text-xs text-slate-500">{tr("Who is requesting this service?", "من يطلب هذه الخدمة؟")}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {tr("Full Name", "الاسم الكامل")} *
                        </label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={tr("e.g. Sultan Al-Otaibi", "مثال: أحمد محمد")}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {tr("Business Email", "البريد الإلكتروني للعمل")} *
                        </label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={tr("e.g. sultan@acmecorp.com", "مثال: name@company.com")}
                        />
                      </div>
                    </div>

                    {!isClientSignedIn && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {tr("Create Client Portal Password", "أنشئ كلمة مرور لبوابة العميل")} *
                        </label>
                        <input
                          type="password"
                          autoComplete="new-password"
                          required
                          minLength={8}
                          maxLength={256}
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={tr("At least 8 characters", "8 أحرف على الأقل")}
                        />
                        <p className="mt-1 text-[11px] text-slate-500">
                          {tr("You will use this password to sign in and track this request.", "ستستخدم كلمة المرور لتسجيل الدخول ومتابعة طلبك.")}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {tr("Phone Number", "رقم الهاتف")}
                        </label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="+966 50 123 4567"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {tr("Client Type", "نوع العميل")}
                        </label>
                        <select
                          value={form.clientType}
                          onChange={(e) => setForm({ ...form, clientType: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="ORGANIZATION">{tr("Organization / Business", "شركة أو مؤسسة")}</option>
                          <option value="INDIVIDUAL">{tr("Individual Professional / Researcher", "فرد أو باحث")}</option>
                        </select>
                      </div>
                    </div>

                    {form.clientType === "ORGANIZATION" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            {tr("Company or Organization Name", "اسم الشركة أو المؤسسة")}
                          </label>
                          <input
                            type="text"
                            value={form.companyName}
                            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={tr("e.g. Acme Logistics Ltd", "مثال: شركة الأفق للخدمات اللوجستية")}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            {tr("Business Sector", "قطاع العمل")}
                          </label>
                          <select
                            value={form.companySector}
                            onChange={(e) => setForm({ ...form, companySector: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            <option value="Supply Chain & Logistics">{tr("Supply Chain & Logistics", "سلاسل الإمداد والخدمات اللوجستية")}</option>
                            <option value="FinTech & Banking">{tr("FinTech & Banking", "التقنية المالية والمصارف")}</option>
                            <option value="Healthcare & Life Sciences">{tr("Healthcare & Life Sciences", "الرعاية الصحية وعلوم الحياة")}</option>
                            <option value="Retail & E-Commerce">{tr("Retail & E-Commerce", "التجزئة والتجارة الإلكترونية")}</option>
                            <option value="Manufacturing & Industrial">{tr("Manufacturing & Industrial", "التصنيع والصناعة")}</option>
                            <option value="Real Estate & Construction">{tr("Real Estate & Construction", "العقارات والإنشاءات")}</option>
                            <option value="Other">{tr("Other", "أخرى")}</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 2: Business Problem */}
                {step === 2 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div>
                      <h3 className="text-lg font-bold text-[#0b2545]">{tr("Business Problem & Goals", "مشكلة العمل والأهداف")}</h3>
                      <p className="text-xs text-slate-500">
                        {tr("Help us understand your operational challenges and what success looks like.", "ساعدنا على فهم تحديات العمل والنتيجة التي تريد الوصول إليها.")}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {tr("Requested Service Category", "نوع الخدمة المطلوبة")} *
                      </label>
                      <select
                        value={form.serviceType}
                        onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-800"
                      >
                        <option value="Data Analysis and Reporting">
                          {tr("Data Analysis and Reporting", "تحليل البيانات وإعداد التقارير")}
                        </option>
                        <option value="Business Intelligence & Power BI Dashboards">
                          {tr("Business Intelligence & Power BI Dashboards", "ذكاء الأعمال ولوحات Power BI")}
                        </option>
                        <option value="Data Cleaning, SQL, Python & Automation">
                          {tr("Data Cleaning, SQL, Python & Automation", "تنظيف البيانات وSQL وPython والأتمتة")}
                        </option>
                        <option value="Forecasting and Data Science">
                          {tr("Forecasting and Data Science (Feasibility Assessed)", "التنبؤ وعلوم البيانات (بعد تقييم الجدوى)")}
                        </option>
                        <option value="Custom Data Engineering & Advisory">
                          {tr("Custom Data Engineering & Advisory", "هندسة بيانات واستشارات مخصصة")}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {tr("Problem Description", "وصف المشكلة")} *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={form.problemDescription}
                        onChange={(e) => setForm({ ...form, problemDescription: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={tr("e.g. We have delivery delays across 14 distribution centers and lack daily visibility...", "مثال: لدينا تأخر في التسليم عبر 14 مركز توزيع ونفتقر إلى متابعة يومية موحدة…")}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {tr("Business Objective", "الهدف التجاري")} *
                        </label>
                        <textarea
                          required
                          rows={2}
                          value={form.businessObjective}
                          onChange={(e) => setForm({ ...form, businessObjective: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={tr("e.g. Consolidate warehouse dispatch into an automated Power BI dashboard", "مثال: جمع بيانات الشحن في لوحة Power BI آلية")}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {tr("Desired Outcome", "النتيجة المطلوبة")} *
                        </label>
                        <textarea
                          required
                          rows={2}
                          value={form.desiredOutcome}
                          onChange={(e) => setForm({ ...form, desiredOutcome: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={tr("e.g. Cut delayed dispatches by 20% and save 3 hours of daily manual reporting", "مثال: خفض تأخر الشحن 20٪ وتوفير 3 ساعات من التقارير اليومية")}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {tr("Current Process or Challenge (Optional)", "الطريقة الحالية أو التحدي (اختياري)")}
                        </label>
                        <input
                          type="text"
                          value={form.currentChallenge}
                          onChange={(e) => setForm({ ...form, currentChallenge: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={tr("e.g. Manually copy-pasting Excel rows every morning", "مثال: نسخ صفوف Excel يدويًا كل صباح")}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {tr("Expected Business Value (Optional)", "القيمة المتوقعة للأعمال (اختياري)")}
                        </label>
                        <input
                          type="text"
                          value={form.expectedValue}
                          onChange={(e) => setForm({ ...form, expectedValue: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={tr("e.g. $100k annual operational cost reduction", "مثال: خفض تكاليف التشغيل السنوية بمقدار 100 ألف دولار")}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Data Readiness */}
                {step === 3 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div>
                      <h3 className="text-lg font-bold text-[#0b2545]">{tr("Data Readiness & Sources", "جاهزية البيانات ومصادرها")}</h3>
                      <p className="text-xs text-slate-500">
                        {tr("No technical jargon needed. Tell us what format your records are in.", "لا تحتاج إلى مصطلحات تقنية؛ أخبرنا عن صيغة بياناتك.")}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {tr("Data Source Type", "نوع مصدر البيانات")}
                        </label>
                        <select
                          value={form.dataSourceType}
                          onChange={(e) => setForm({ ...form, dataSourceType: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="spreadsheets">{tr("Spreadsheets (Excel, Google Sheets, CSV)", "جداول بيانات (Excel أو Google Sheets أو CSV)")}</option>
                          <option value="database">{tr("Database (SQL Server, PostgreSQL, MySQL)", "قاعدة بيانات (SQL Server أو PostgreSQL أو MySQL)")}</option>
                          <option value="business_software">{tr("Business Software (ERP, CRM, Stripe, Shopify)", "برامج أعمال (ERP أو CRM أو Stripe أو Shopify)")}</option>
                          <option value="api">{tr("Web API / Cloud Data Store", "واجهة API أو تخزين سحابي")}</option>
                          <option value="manual_records">{tr("Manual Paper / PDF Records", "سجلات ورقية أو ملفات PDF")}</option>
                          <option value="unknown">{tr("Not sure / Multiple sources", "غير متأكد / مصادر متعددة")}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {tr("Approximate Volume (if known)", "حجم البيانات التقريبي (إن عُرف)")}
                        </label>
                        <select
                          value={form.approxDataVolume}
                          onChange={(e) => setForm({ ...form, approxDataVolume: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="Under 10,000 rows">{tr("Under 10,000 rows (Small)", "أقل من 10,000 صف (صغير)")}</option>
                          <option value="10,000 to 100,000 rows">{tr("10,000 to 100,000 rows (Medium)", "من 10,000 إلى 100,000 صف (متوسط)")}</option>
                          <option value="100,000 to 1,000,000 rows">{tr("100,000 to 1,000,000 rows (Large)", "من 100,000 إلى مليون صف (كبير)")}</option>
                          <option value="Over 1,000,000 rows">{tr("Over 1,000,000 rows (Enterprise)", "أكثر من مليون صف (مؤسسي)")}</option>
                          <option value="Unknown">{tr("Currently Unknown", "غير معروف حاليًا")}</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.hasDataAccess}
                          onChange={(e) => setForm({ ...form, hasDataAccess: e.target.checked })}
                          className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div className="text-xs">
                          <span className="font-semibold text-slate-900 block">
                            {tr("Our team currently has access to the data", "يمتلك فريقنا حاليًا إمكانية الوصول إلى البيانات")}
                          </span>
                          <span className="text-slate-500">
                            {tr("Uncheck if you need KEMIX to assist in coordinating with third-party software vendors.", "أزل التحديد إذا كنت تحتاج إلى مساعدة KEMIX في التنسيق مع مزودي البرامج.")}
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.hasRestrictions}
                          onChange={(e) => setForm({ ...form, hasRestrictions: e.target.checked })}
                          className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div className="text-xs">
                          <span className="font-semibold text-slate-900 block">
                            {tr("There are strict confidentiality, privacy, or GDPR/HIPAA restrictions", "توجد قيود صارمة للسرية أو الخصوصية أو GDPR/HIPAA")}
                          </span>
                          <span className="text-slate-500">
                            {tr("We will execute a bilateral NDA and prepare secure isolated staging access.", "سنبرم اتفاقية سرية متبادلة ونجهّز بيئة وصول آمنة ومعزولة.")}
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.needsPreparationHelp}
                          onChange={(e) => setForm({ ...form, needsPreparationHelp: e.target.checked })}
                          className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div className="text-xs">
                          <span className="font-semibold text-slate-900 block">
                            {tr("We need help cleaning, auditing, and preparing the raw data", "نحتاج إلى مساعدة في تنظيف البيانات الأولية ومراجعتها وتجهيزها")}
                          </span>
                          <span className="text-slate-500">
                            {tr("Our data engineers will include data cleaning and anomaly patching in the scope.", "سيشمل نطاق العمل تنظيف البيانات ومعالجة القيم غير الطبيعية.")}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* STEP 4: Delivery Expectations */}
                {step === 4 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div>
                      <h3 className="text-lg font-bold text-[#0b2545]">{tr("Delivery & Communication", "التسليم والتواصل")}</h3>
                      <p className="text-xs text-slate-500">{tr("When do you need this and how should we coordinate?", "متى تحتاج إلى الخدمة وكيف تفضّل التنسيق؟")}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {tr("Preferred Timeline / Target Delivery", "الإطار الزمني أو موعد التسليم المفضل")}
                        </label>
                        <select
                          value={form.preferredDeadline}
                          onChange={(e) => setForm({ ...form, preferredDeadline: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="Urgent (1 to 2 Weeks)">{tr("Urgent (1 to 2 Weeks)", "عاجل (أسبوع إلى أسبوعين)")}</option>
                          <option value="Standard (2 to 4 Weeks)">{tr("Standard (2 to 4 Weeks)", "عادي (أسبوعان إلى 4 أسابيع)")}</option>
                          <option value="Flexible (1 to 2 Months)">{tr("Flexible (1 to 2 Months)", "مرن (شهر إلى شهرين)")}</option>
                          <option value="Ongoing Retainer">{tr("Ongoing Monthly Retainer", "تعاقد شهري مستمر")}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {tr("Estimated Budget Range (Optional)", "الميزانية التقديرية (اختياري)")}
                        </label>
                        <select
                          value={form.budgetRange}
                          onChange={(e) => setForm({ ...form, budgetRange: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="Under $2,000">Under $2,000</option>
                          <option value="$2,000 - $5,000">$2,000 - $5,000</option>
                          <option value="$5,000 - $10,000">$5,000 - $10,000</option>
                          <option value="$10,000+">$10,000+ {tr("(Enterprise)", "(مؤسسي)")}</option>
                          <option value="Need proposal to determine">{tr("Need proposal to determine", "تُحدد بعد إعداد العرض")}</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {tr("Preferred Contact Method", "طريقة التواصل المفضلة")}
                        </label>
                        <select
                          value={form.preferredContactMethod}
                          onChange={(e) => setForm({ ...form, preferredContactMethod: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="EMAIL">{tr("Business Email", "البريد الإلكتروني للعمل")}</option>
                          <option value="PHONE">{tr("Phone / Scheduled Call", "الهاتف / مكالمة مجدولة")}</option>
                          <option value="PLATFORM">{tr("KEMIX Platform Portal", "بوابة KEMIX")}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {tr("Best Time for Discovery Call", "الوقت الأنسب لمكالمة التعارف")}
                        </label>
                        <input
                          type="text"
                          value={form.bestTimeForCall}
                          onChange={(e) => setForm({ ...form, bestTimeForCall: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={tr("e.g. Weekdays 10:00 AM - 1:00 PM AST", "مثال: أيام العمل من 10 صباحًا إلى 1 ظهرًا")}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {tr("Additional Notes or Requirements", "ملاحظات أو متطلبات إضافية")}
                      </label>
                      <textarea
                        rows={3}
                        value={form.additionalNotes}
                        onChange={(e) => setForm({ ...form, additionalNotes: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={tr("Any special constraints, tools already in use (e.g., Snowflake, BigQuery), or context...", "اذكر أي قيود أو أدوات تستخدمها حاليًا (مثل Snowflake أو BigQuery) أو معلومات إضافية…")}
                      />
                    </div>
                  </div>
                )}

                {/* STEP 5: Review & Submit */}
                {step === 5 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div>
                      <h3 className="text-lg font-bold text-[#0b2545]">{tr("Review Your Service Request", "راجع طلب الخدمة")}</h3>
                      <p className="text-xs text-slate-500">
                        {tr("Please verify your submission summary before submitting your request.", "راجع ملخص الطلب قبل إرساله.")}
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 text-xs">
                      <div className="border-b border-slate-200 pb-3">
                        <span className="font-bold text-slate-900 block text-sm">{tr("Client Information", "معلومات العميل")}</span>
                        <div className="grid grid-cols-2 gap-2 mt-1 text-slate-600">
                          <div><strong>{tr("Name", "الاسم")}:</strong> {form.name}</div>
                          <div><strong>{tr("Email", "البريد الإلكتروني")}:</strong> {form.email}</div>
                          <div><strong>{tr("Company", "الشركة")}:</strong> {form.companyName || tr("N/A", "غير متوفر")}</div>
                          <div><strong>{tr("Sector", "القطاع")}:</strong> {displayValue(form.companySector)}</div>
                        </div>
                      </div>

                      <div className="border-b border-slate-200 pb-3">
                        <span className="font-bold text-slate-900 block text-sm">{tr("Requested Service & Scope", "الخدمة والنطاق المطلوب")}</span>
                        <p className="mt-1 text-blue-700 font-semibold">{displayValue(form.serviceType)}</p>
                        <p className="mt-1 text-slate-600"><strong>{tr("Problem", "المشكلة")}:</strong> {form.problemDescription}</p>
                        <p className="mt-1 text-slate-600"><strong>{tr("Outcome", "النتيجة")}:</strong> {form.desiredOutcome}</p>
                      </div>

                      <div>
                        <span className="font-bold text-slate-900 block text-sm">{tr("Data & Timeline", "البيانات والإطار الزمني")}</span>
                        <div className="grid grid-cols-2 gap-2 mt-1 text-slate-600">
                          <div><strong>{tr("Source", "المصدر")}:</strong> {displayValue(form.dataSourceType)}</div>
                          <div><strong>{tr("Volume", "الحجم")}:</strong> {displayValue(form.approxDataVolume)}</div>
                          <div><strong>{tr("Deadline", "الموعد")}:</strong> {displayValue(form.preferredDeadline)}</div>
                          <div><strong>{tr("Budget", "الميزانية")}:</strong> {displayValue(form.budgetRange)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900">
                      <Lock className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
                      <p>
                        <strong>{tr("Confidentiality Notice:", "تنبيه السرية:")}</strong> {tr("Do not upload passwords, live database credentials, or unencrypted customer records. Staging connection details will be exchanged through secured private channels following mutual NDA signoff.", "لا ترفع كلمات المرور أو بيانات الدخول الفعلية لقواعد البيانات أو سجلات العملاء غير المشفرة. سيتم تبادل بيانات الاتصال ببيئة الاختبار عبر قنوات آمنة بعد توقيع اتفاقية السرية.")}
                      </p>
                    </div>
                  </div>
                )}

                {/* Form Controls */}
                <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>{tr("Back", "السابق")}</span>
                    </button>
                  ) : (
                    <div></div>
                  )}

                  {step < 5 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition-colors"
                    >
                      <span>{tr("Continue to Next Step", "الانتقال للخطوة التالية")}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-7 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg transition-all disabled:opacity-50"
                    >
                      <span>{loading ? tr("Registering Request...", "جارٍ إرسال الطلب…") : tr("Submit Service Request", "إرسال طلب الخدمة")}</span>
                      <CheckCircle2 className="w-4 h-4 text-orange-300" />
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function RequestServicePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading intake form…</div>}>
      <RequestServiceContent />
    </Suspense>
  );
}
