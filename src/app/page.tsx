"use client";

import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCurrentLocale } from "@/components/LocaleProvider";
import {
  BarChart3,
  PieChart,
  Cpu,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Lock,
  Layers,
  FileCheck,
  Headphones,
  Users,
} from "lucide-react";

export default function HomePage() {
  const locale = useCurrentLocale();
  const tr = (en: string, ar: string) => locale === "ar" ? ar : en;
  const steps = [
    { num: "01", title: "Submit Service Request", desc: "Share your business problem, data sources, and desired outcomes." },
    { num: "02", title: "Request Confirmation", desc: "Instant unique reference number (KMX-XXXX) and portal tracking access." },
    { num: "03", title: "KEMIX Intake Review", desc: "Senior analytics leads assess feasibility, data readiness, and prerequisites." },
    { num: "04", title: "Technical Consultation", desc: "Structured call to align on objectives, KPIs, and operational constraints." },
    { num: "05", title: "Feasibility Assessment", desc: "Rigorous verification of historical data completeness and model viability." },
    { num: "06", title: "Scope & Terms Agreement", desc: "Transparent scope of work, fixed delivery timeline, and clear pricing." },
    { num: "07", title: "Formal Proposal Approval", desc: "Authenticated one-click client signoff with recorded audit trail." },
    { num: "08", title: "Secure Data Handover", desc: "Read-only access or encrypted transfers under strict non-disclosure." },
    { num: "09", title: "Agile Project Execution", desc: "Milestone-based delivery with interactive previews and regular check-ins." },
    { num: "10", title: "Handover & Support", desc: "Production deliverable signoff, team training deck, and dedicated support." },
  ];
  const arabicSteps = [
    ["إرسال طلب خدمة", "شارك مشكلة العمل ومصادر البيانات والنتائج المرجوة."],
    ["تأكيد الطلب", "احصل فورًا على رقم مرجعي فريد وإمكانية متابعة الطلب."],
    ["مراجعة KEMIX للطلب", "يقيّم قادة التحليلات الجدوى وجاهزية البيانات والمتطلبات."],
    ["استشارة فنية", "مكالمة منظمة لمواءمة الأهداف والمؤشرات وقيود التشغيل."],
    ["تقييم الجدوى", "تحقق دقيق من اكتمال البيانات التاريخية وملاءمة النموذج."],
    ["الاتفاق على النطاق والشروط", "نطاق واضح ومدة تنفيذ وأسعار محددة."],
    ["اعتماد العرض الرسمي", "موافقة إلكترونية موثقة من لوحة العميل."],
    ["تسليم البيانات بأمان", "وصول للقراءة فقط أو نقل مشفر بموجب اتفاقية سرية."],
    ["تنفيذ المشروع بمرونة", "تنفيذ على مراحل مع معاينات ومتابعات منتظمة."],
    ["التسليم والدعم", "اعتماد المخرجات وتدريب الفريق وتوفير الدعم."],
  ];
  const displaySteps = steps.map((step, i) => locale === "ar" ? { ...step, title: arabicSteps[i][0], desc: arabicSteps[i][1] } : step);

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0b2545] via-[#07182c] to-[#040f1d] text-white pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#163a6912_1px,transparent_1px),linear-gradient(to_bottom,#163a6912_1px,transparent_1px)] bg-[size:36px_36px]"></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold tracking-wide uppercase">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
                <span>{tr("The Service Delivery Arm of KEMIX Ecosystem", "ذراع تقديم الخدمات ضمن منظومة KEMIX")}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                {tr("Turning Data into", "نحوّل البيانات إلى")}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-300">
                  {tr("Business Decisions.", "قرارات أعمال.")}
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl">
                {tr("We empower startups, growing businesses, and enterprise teams with high-impact data analytics, custom Power BI dashboards, automated SQL/Python pipelines, and predictive forecasting.", "ندعم الشركات الناشئة والنامية والمؤسسات بتحليلات بيانات مؤثرة ولوحات Power BI مخصصة وخطوط SQL وPython مؤتمتة وتنبؤات عملية.")}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
                <Link
                  href="/request-service"
                  className="inline-flex items-center justify-center gap-3 px-7 py-4 rounded-xl text-base font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>{tr("Request a Service", "اطلب خدمة")}</span>
                  <ArrowRight className="w-5 h-5 text-orange-300" />
                </Link>
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-base font-medium text-slate-200 bg-white/5 hover:bg-white/10 border border-slate-700/80 transition-all"
                >
                  <span>{tr("Explore 10-Step Workflow", "تعرّف على خطوات العمل العشر")}</span>
                </Link>
              </div>

              {/* Key Trust Signals */}
              <div className="pt-8 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>{tr("Strict NDA & Data Privacy", "اتفاقية سرية وحماية للبيانات")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <span>{tr("Feasibility Assessed First", "تقييم الجدوى أولًا")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{tr("Milestone-Based Delivery", "تسليم على مراحل")}</span>
                </div>
              </div>
            </div>

            {/* Official Logo Display Hero Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl border border-slate-100 flex flex-col items-center text-center">
                <div className="w-full flex justify-center mb-6 py-4 px-2 bg-slate-50 rounded-xl border border-slate-100">
                  <Image
                    src="/images/kemix-logo.png"
                    alt="KEMIX Analysis Official Logo"
                    width={320}
                    height={85}
                    priority
                    className="object-contain"
                  />
                </div>
                <div className="space-y-3 text-left w-full">
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                    <span className="font-semibold text-slate-700">{tr("Platform Operating Status", "حالة استقبال الطلبات")}</span>
                    <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      {tr("Accepting New Requests", "نستقبل طلبات جديدة")}
                    </span>
                  </div>
                  <div className="bg-blue-50/60 rounded-lg p-3 text-xs text-blue-900 border border-blue-100 space-y-1">
                    <p className="font-semibold">{tr("B2B Business Operations Hub", "منصة خدمات الأعمال للشركات")}</p>
                    <p className="text-blue-700">
                      {tr("Submit detailed requirements, communicate with senior data analysts in real-time, and track deliverable milestones.", "أرسل متطلباتك وتواصل مع محللي البيانات وتابع مراحل تسليم مشروعك.")}
                    </p>
                  </div>
                  <Link
                    href="/request-service"
                    className="block w-full text-center py-2.5 rounded-lg text-sm font-semibold text-white bg-[#0b2545] hover:bg-blue-900 transition-colors"
                  >
                    {tr("Start Service Intake", "ابدأ طلب الخدمة")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              {tr("Core Capabilities", "قدراتنا الأساسية")}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0b2545]">
              {tr("Tailored Data & Analytics Solutions", "حلول بيانات وتحليلات تناسب أعمالك")}
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              {tr("We do not believe in one-size-fits-all reports. Every project begins with a structured feasibility review to ensure your data architecture and business goals align for real impact.", "لا نستخدم تقارير جاهزة للجميع. يبدأ كل مشروع بمراجعة للجدوى لضمان توافق بنية البيانات مع أهداف العمل.")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0b2545]">{tr("Data Analysis & Reporting", "تحليل البيانات والتقارير")}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {tr("Turn fragmented spreadsheets and siloed figures into executive slide decks, diagnostic reports, and KPI variance trackers.", "حوّل الجداول المتفرقة إلى عروض تنفيذية وتقارير تشخيصية ومتابعة لمؤشرات الأداء.")}
                </p>
                <ul className="text-xs text-slate-500 space-y-2 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <span>{tr("Exploratory Data Analysis", "تحليل استكشافي للبيانات")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <span>{tr("Variance & Cohort Breakdown", "تحليل الفروقات ومجموعات العملاء")}</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">{tr("1–2 Weeks Delivery", "التسليم خلال أسبوع إلى أسبوعين")}</span>
                <Link
                  href="/services#data-analysis"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>{tr("Learn more", "اعرف المزيد")}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <PieChart className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0b2545]">{tr("Power BI Dashboards", "لوحات Power BI")}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {tr("Enterprise-grade Power BI dashboards with star-schema modeling, DAX measures, automated cloud refresh, and mobile layouts.", "لوحات Power BI مؤسسية بنمذجة Star Schema ومقاييس DAX وتحديث سحابي آلي وتصميم مناسب للهاتف.")}
                </p>
                <ul className="text-xs text-slate-500 space-y-2 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <span>{tr("Star-Schema Data Modeling", "نمذجة بيانات Star Schema")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <span>{tr("Row-Level Security (RLS)", "صلاحيات على مستوى الصفوف")}</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">{tr("2–3 Weeks Delivery", "التسليم خلال أسبوعين إلى ثلاثة")}</span>
                <Link
                  href="/services#business-intelligence"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>{tr("Learn more", "اعرف المزيد")}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0b2545]">{tr("SQL, Python & Automation", "SQL وPython والأتمتة")}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {tr("Eliminate repetitive manual spreadsheet handling with automated ETL pipelines, anomaly detection, and database migrations.", "قلل معالجة الجداول يدويًا عبر خطوط ETL آلية ورصد القيم غير المعتادة وتحديث قواعد البيانات.")}
                </p>
                <ul className="text-xs text-slate-500 space-y-2 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <span>{tr("Automated Ingestion & ETL", "استيراد آلي وخطوط ETL")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <span>{tr("Scheduled Cron & Error Alerts", "مهام مجدولة وتنبيهات للأخطاء")}</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">{tr("1–3 Weeks Delivery", "التسليم خلال أسبوع إلى ثلاثة")}</span>
                <Link
                  href="/services#automation"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>{tr("Learn more", "اعرف المزيد")}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0b2545]">{tr("Forecasting & Data Science", "التنبؤ وعلوم البيانات")}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {tr("Predictive machine learning models for customer churn, demand estimation, and revenue forecasting (subject to data feasibility).", "نماذج تعلم آلي لتوقع فقد العملاء والطلب والإيرادات، بعد التحقق من ملاءمة البيانات.")}
                </p>
                <ul className="text-xs text-slate-500 space-y-2 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                    <span>{tr("Time-Series & Risk Scoring", "توقعات زمنية وتقييم المخاطر")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                    <span>{tr("Feasibility Validation Upfront", "التحقق من الجدوى مسبقًا")}</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">{tr("3–5 Weeks Delivery", "التسليم خلال ثلاثة إلى خمسة أسابيع")}</span>
                <Link
                  href="/services#forecasting"
                  className="text-xs font-semibold text-orange-600 hover:text-orange-800 flex items-center gap-1"
                >
                  <span>{tr("Learn more", "اعرف المزيد")}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (10-Step Workflow) */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-orange-600 tracking-wider uppercase bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
              {tr("Transparent Methodology", "منهجية واضحة")}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0b2545]">
              {tr("How the KEMIX Process Works", "كيف تسير خطوات KEMIX")}
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              {tr("Every client engagement follows a disciplined, transparent 10-step lifecycle designed to prevent scope creep, ensure data security, and deliver measurable outcomes.", "يتبع كل مشروع دورة عمل واضحة من عشر خطوات لضبط النطاق وحماية البيانات وتحقيق نتائج قابلة للقياس.")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {displaySteps.map((step) => (
              <div
                key={step.num}
                className="relative bg-slate-50 border border-slate-200/80 rounded-xl p-5 hover:bg-white hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-black text-blue-600/30">{step.num}</span>
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">{step.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              <span>{tr("Read the comprehensive walkthrough of each step", "اقرأ شرحًا تفصيليًا لكل خطوة")}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Enterprise Security & Confidentiality Highlight */}
      <section className="py-16 bg-[#07182c] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium">
                <Lock className="w-3.5 h-3.5" />
                <span>{tr("Client Data Confidentiality Guarantee", "التزام بسرية بيانات العملاء")}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">
                {tr("Your Business Data Stays Private, Encrypted & Isolated", "بيانات أعمالك خاصة ومشفرة ومعزولة")}
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                {tr("We adhere to strict data segregation. No client data is ever made publicly accessible, shared across accounts, or used to train third-party models. We execute mutual non-disclosure agreements (NDAs) before staging data is shared.", "نلتزم بعزل بيانات العملاء؛ فلا نجعلها متاحة للعامة أو مشتركة بين الحسابات أو مستخدمة لتدريب نماذج جهات خارجية. ونبرم اتفاقيات السرية قبل مشاركة بيانات البيئة المرحلية.")}
              </p>
            </div>
            <div className="lg:col-span-4 flex justify-start lg:justify-end">
              <Link
                href="/security"
                className="px-6 py-3.5 rounded-xl text-sm font-semibold text-[#07182c] bg-white hover:bg-slate-100 transition-colors"
              >
                {tr("Review Confidentiality Notice", "اطّلع على سياسة السرية")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black">
            {tr("Ready to Turn Your Data into Business Decisions?", "هل أنت مستعد لتحويل بياناتك إلى قرارات أعمال؟")}
          </h2>
          <p className="text-blue-100 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {tr("Submit your business challenge today. Our team will review your data requirements and schedule an intake consultation.", "أرسل تحدي أعمالك اليوم، وسيراجع فريقنا متطلبات البيانات ويتواصل معك لترتيب الاستشارة الأولى.")}
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <Link
              href="/request-service"
              className="px-8 py-4 rounded-xl text-base font-bold text-slate-900 bg-white hover:bg-slate-100 shadow-xl transition-all hover:scale-105"
            >
              {tr("Start Free Service Intake", "ابدأ طلب خدمة")}
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 rounded-xl text-base font-semibold text-white bg-blue-800/60 hover:bg-blue-800 border border-blue-400/40 transition-colors"
            >
              {tr("Contact Support & Sales", "تواصل مع الدعم والمبيعات")}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
