"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCurrentLocale } from "@/components/LocaleProvider";
import {
  BarChart3,
  PieChart,
  Cpu,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Sparkles,
  FileCheck,
} from "lucide-react";

export default function ServicesPage() {
  const locale = useCurrentLocale();
  const tr = (en: string, ar: string) => locale === "ar" ? ar : en;
  const services = [
    {
      id: "data-analysis",
      icon: BarChart3,
      badge: "Core Service",
      title: "Data Analysis and Reporting",
      subtitle: "Executive KPI scorecards, diagnostic variance analysis, and clear narrative reports.",
      description:
        "Raw data rarely tells a story on its own. We extract, normalize, and analyze sales, marketing, inventory, or operational datasets to reveal what is working, what is leaking profit, and where the highest-ROI opportunities lie.",
      features: [
        "Exploratory Data Analysis (EDA) identifying distributions and anomalies",
        "Key Performance Indicator (KPI) architecture tailored to executive leadership",
        "Cohort retention, churn patterns, and unit economics breakdowns",
        "Variance analysis comparing actuals against forecasts or previous periods",
      ],
      deliverables: [
        "Comprehensive Diagnostic Analysis Report (PDF and interactive formats)",
        "Cleaned and validated summary datasets with methodology notes",
        "Executive presentation slide deck ready for stakeholder briefings",
      ],
      timeline: "1 to 2 Weeks",
      startingPrice: "$1,500",
    },
    {
      id: "business-intelligence",
      icon: PieChart,
      badge: "Most Popular",
      title: "Business Intelligence & Power BI Dashboards",
      subtitle: "High-performance interactive reporting systems connecting your databases and cloud tools.",
      description:
        "Replace slow, error-prone manual Excel files with enterprise Power BI solutions. Built with robust star-schema architecture, optimized DAX measures, role-level security, and automated cloud sync.",
      features: [
        "High-performance Star-Schema data modeling and DAX metric formulation",
        "Intuitive visual hierarchy adhering to KEMIX corporate design standards",
        "Automated daily/hourly scheduled refresh with error alerting mechanisms",
        "Row-Level Security (RLS) ensuring managers only see their designated branch data",
        "Mobile and tablet view layouts for on-the-go leadership reviews",
      ],
      deliverables: [
        "Production Power BI (.pbix) files published to your Power BI service workspace",
        "Complete data model architecture diagram and DAX calculation dictionary",
        "Recorded video walkthrough and administrator handover manual",
      ],
      timeline: "2 to 3 Weeks",
      startingPrice: "$2,800",
    },
    {
      id: "automation",
      icon: Cpu,
      badge: "Efficiency & Scale",
      title: "Data Cleaning, SQL, Python & Automation",
      subtitle: "Eliminate manual spreadsheet work with automated ETL pipelines and scheduled scripts.",
      description:
        "Tired of staff spending hours every day copying rows, fixing date formats, or reconciling exports? We build production-ready Python pipelines, SQL stored procedures, and scheduled cron workflows that do it automatically and flawlessly.",
      features: [
        "Multi-source data ingestion (CSV, Excel, Google Sheets, SQL Server, PostgreSQL, REST APIs)",
        "Automated deduplication, format standardization, and outlier flags",
        "Optimized relational schemas, views, and indexed tables",
        "Automated scheduled cron triggers with retry logic and failure notifications",
      ],
      deliverables: [
        "Clean, well-documented Python scripts or SQL migration files in a private repository",
        "Database transformation views and automated refresh triggers",
        "System execution runbook and disaster-recovery protocols",
      ],
      timeline: "1 to 3 Weeks",
      startingPrice: "$2,200",
    },
    {
      id: "forecasting",
      icon: TrendingUp,
      badge: "Advanced Analytics",
      title: "Forecasting and Data Science",
      subtitle: "Predictive modeling and machine learning tailored to specific business outcomes.",
      description:
        "Anticipate tomorrow's demand and protect revenue. We apply statistical time-series algorithms and machine learning to forecast sales, predict inventory needs, and score churn risk. Feasibility is assessed upfront before project commitment.",
      features: [
        "Time-series demand and revenue forecasting (ARIMA, Prophet, Gradient Boosting)",
        "Customer Lifetime Value (CLV) and churn propensity probability scoring",
        "Feature importance and driver sensitivity analysis (SHAP explanations)",
        "Cross-validation against historical holdout datasets to minimize error",
      ],
      deliverables: [
        "Trained model pipeline code with automated prediction export routines",
        "Model validation audit with confidence bands, error metrics, and limitations",
        "Operational implementation plan with model monitoring guidelines",
      ],
      timeline: "3 to 5 Weeks",
      startingPrice: "$3,800",
    },
  ];

  const arabicServices: Record<string, Partial<(typeof services)[number]>> = {
    "data-analysis": {
      badge: "الخدمة الأساسية", title: "تحليل البيانات وإعداد التقارير",
      subtitle: "مؤشرات تنفيذية وتحليل للفروقات وتقارير واضحة لصناع القرار.",
      description: "نستخرج بيانات المبيعات والتسويق والمخزون والعمليات وننظمها ونحللها لكشف ما يعمل جيدًا، ومصادر الهدر، وأفضل فرص تحسين العائد.",
      features: ["تحليل استكشافي يكشف التوزيعات والقيم غير المعتادة", "تصميم مؤشرات أداء مناسبة للإدارة التنفيذية", "تحليل الاحتفاظ بالعملاء والتسرب واقتصاديات الوحدة", "مقارنة النتائج الفعلية بالتوقعات أو الفترات السابقة"],
      deliverables: ["تقرير تشخيصي شامل بصيغ PDF وتفاعلية", "بيانات موجزة ومنقحة مع توثيق المنهجية", "عرض تنفيذي جاهز لاجتماعات أصحاب المصلحة"], timeline: "أسبوع إلى أسبوعين",
    },
    "business-intelligence": {
      badge: "الأكثر طلبًا", title: "ذكاء الأعمال ولوحات Power BI",
      subtitle: "أنظمة تقارير تفاعلية عالية الأداء تربط قواعد البيانات والأدوات السحابية.",
      description: "نستبدل ملفات Excel اليدوية بحلول Power BI مؤسسية، مع بنية بيانات قوية ومقاييس DAX محسّنة وصلاحيات حسب الدور ومزامنة سحابية آلية.",
      features: ["نمذجة بيانات بنمط Star Schema ومقاييس DAX محسّنة", "تصميم مرئي واضح وفق هوية KEMIX", "تحديث مجدول مع تنبيهات عند تعطل التحديث", "صلاحيات على مستوى الصف لضمان عرض بيانات الفروع المصرح بها", "واجهات مناسبة للهاتف والأجهزة اللوحية"],
      deliverables: ["ملفات Power BI جاهزة للنشر في مساحة عملك", "مخطط بنية نموذج البيانات وقاموس حسابات DAX", "شرح مسجل ودليل تسليم للمسؤولين"], timeline: "أسبوعان إلى ثلاثة أسابيع",
    },
    automation: {
      badge: "الكفاءة والتوسع", title: "تنظيف البيانات وSQL وPython والأتمتة",
      subtitle: "قلل العمل اليدوي بجداول البيانات عبر خطوط ETL وسكربتات مجدولة.",
      description: "نبني خطوط Python وإجراءات SQL وسير عمل مجدولًا لأتمتة نسخ البيانات وتنظيف التواريخ ومطابقة الملفات بدل تنفيذها يدويًا كل يوم.",
      features: ["جمع البيانات من CSV وExcel وGoogle Sheets وSQL وواجهات API", "إزالة التكرار وتوحيد التنسيقات ورصد القيم الشاذة", "تصميم قواعد بيانات وعروض وجداول مفهرسة ومحسّنة", "تشغيل مجدول مع إعادة المحاولة والتنبيه عند الفشل"],
      deliverables: ["سكربتات Python أو ملفات SQL موثقة في مستودع خاص", "عروض تحويل البيانات ومشغلات التحديث", "دليل تشغيل وخطة للتعافي من الأعطال"], timeline: "أسبوع إلى ثلاثة أسابيع",
    },
    forecasting: {
      badge: "تحليلات متقدمة", title: "التنبؤ وعلوم البيانات",
      subtitle: "نماذج تنبؤية وتعلم آلي مصممة لنتائج أعمال محددة.",
      description: "نستخدم الأساليب الإحصائية والتعلم الآلي لتوقع المبيعات والطلب واحتياجات المخزون ومخاطر فقد العملاء. نقيّم ملاءمة البيانات قبل الالتزام بالمشروع.",
      features: ["توقع الطلب والإيرادات عبر الزمن", "تقدير قيمة العميل واحتمال مغادرته", "تحليل أهمية العوامل وتأثيرها مع تفسيرات واضحة", "التحقق من النموذج على بيانات تاريخية لمعايرة الخطأ"],
      deliverables: ["خط تشغيل للنموذج مع تصدير التنبؤات", "تقرير تحقق يتضمن مقاييس الخطأ والقيود", "خطة تشغيل ومراقبة للنموذج"], timeline: "ثلاثة إلى خمسة أسابيع",
    },
  };
  const displayServices = services.map((service) => locale === "ar" ? { ...service, ...arabicServices[service.id] } : service);

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} className="flex flex-col min-h-screen">
      <Navbar />

      {/* Header */}
      <section className="bg-[#0b2545] text-white py-16 sm:py-20 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest bg-blue-900/60 px-3 py-1 rounded-full border border-blue-700/50">
            {tr("KEMIX Service Catalog", "كتالوج خدمات KEMIX")}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black">
            {tr("Services Built for Business Impact", "خدمات تحقق أثرًا ملموسًا لأعمالك")}
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            {tr("From cleaning raw transaction logs to architecting executive Power BI suites and predictive models, our deliverables are engineered for operational clarity.", "من تنظيف سجلات المعاملات إلى بناء لوحات Power BI التنفيذية والنماذج التنبؤية، نصمم مخرجاتنا لتمنحك رؤية أوضح لعملياتك.")}
          </p>
        </div>
      </section>

      {/* Transparent Feasibility Notice */}
      <section className="bg-amber-50 border-b border-amber-200/80 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-3 text-xs sm:text-sm text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p>
            <strong>{tr("Transparent Feasibility Policy:", "سياسة واضحة لملاءمة البيانات:")}</strong> {tr("We do not promise that every service is suitable for every dataset or that every project can be delivered within a rigid fixed timeframe. Every engagement begins with a data readiness assessment to guarantee feasibility before budget commitment.", "قد لا تناسب كل خدمة جميع مجموعات البيانات، وقد تتغير المدة بحسب نطاق المشروع. نبدأ بتقييم جاهزية البيانات والتحقق من الملاءمة قبل اعتماد الميزانية.")}
          </p>
        </div>
      </section>

      {/* Detailed Services Listing */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {displayServices.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                id={service.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 sm:p-10 transition-all hover:border-blue-200"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-8 space-y-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                        {service.badge}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b2545]">
                        {service.title}
                      </h2>
                      <p className="text-slate-500 font-medium text-sm mt-1">{service.subtitle}</p>
                    </div>

                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                      {service.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                          {tr("What is Included", "ما الذي تتضمنه الخدمة")}
                        </h4>
                        <ul className="space-y-2 text-xs text-slate-600">
                          {service.features.map((feat, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                          {tr("Key Deliverables", "أهم المخرجات")}
                        </h4>
                        <ul className="space-y-2 text-xs text-slate-600">
                          {service.deliverables.map((deliv, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <FileCheck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                              <span>{deliv}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Intake Card */}
                  <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-6">
                    <div>
                      <span className="text-xs font-medium text-slate-500">{tr("Starting From", "تبدأ الأسعار من")}</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-black text-[#0b2545]">
                          {service.startingPrice}
                        </span>
                        <span className="text-xs text-slate-500">{tr("subject to scope", "بحسب النطاق")}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-4 text-xs text-slate-600">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span>{tr("Estimated Timeline:", "المدة التقديرية:")} <strong>{service.timeline}</strong></span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Link
                        href={`/request-service?service=${encodeURIComponent(service.title)}`}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all"
                      >
                        <span>{tr("Request This Service", "اطلب هذه الخدمة")}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        href="/contact"
                        className="w-full block text-center py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                      >
                        {tr("Ask a question first", "أرسل استفسارًا أولًا")}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Footer />
    </div>
  );
}
