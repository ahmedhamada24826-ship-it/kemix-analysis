"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCurrentLocale } from "@/components/LocaleProvider";
import {
  FileText,
  MailCheck,
  Search,
  Calendar,
  ShieldCheck,
  Scale,
  CheckCircle,
  Database,
  Terminal,
  Award,
  ArrowRight,
  Lock,
} from "lucide-react";

export default function HowItWorksPage() {
  const locale = useCurrentLocale();
  const tr = (en: string, ar: string) => locale === "ar" ? ar : en;
  const workflowSteps = [
    {
      step: 1,
      title: "Submit a Service Request",
      icon: FileText,
      summary: "Client completes our guided 5-step structured intake form.",
      details:
        "Provide your business problem, desired outcome, data source type, and preferred deadlines. No deep technical jargon is required. We accept spreadsheet exports, database schemas, or manual record summaries.",
    },
    {
      step: 2,
      title: "Receive Request Confirmation",
      icon: MailCheck,
      summary: "Instant unique reference code (KMX-YYYYMM-XXXX) and portal access.",
      details:
        "You receive an authenticated dashboard link where you can track status, view incoming messages from the KEMIX engineering team, and upload supplemental notes.",
    },
    {
      step: 3,
      title: "KEMIX Intake Review",
      icon: Search,
      summary: "Our operations lead and senior analyst examine the business context.",
      details:
        "We verify scope completeness, identify potential edge cases, check whether the requested service aligns with your business goals, and assign a dedicated project lead.",
    },
    {
      step: 4,
      title: "Schedule a Consultation",
      icon: Calendar,
      summary: "A focused 30-minute discovery call to align expectations.",
      details:
        "We discuss your decision-making workflows, reporting frequency, user permissions, and technical constraints to ensure the solution fits seamlessly into your organization.",
    },
    {
      step: 5,
      title: "Assess Feasibility & Data Requirements",
      icon: ShieldCheck,
      summary: "Rigorous verification of historical records, volume, and data cleanliness.",
      details:
        "We do not promise results on unvalidated data. We verify whether the historical records, row counts, and data consistency can mathematically support the desired dashboards or predictive models.",
    },
    {
      step: 6,
      title: "Agree on Scope, Price, Timeline & Terms",
      icon: Scale,
      summary: "Clear, transparent proposal without surprise billing.",
      details:
        "We specify exact deliverables, milestones, assumptions, exclusions, fixed milestone pricing, and payment terms (typically 50% upfront, 50% upon final acceptance).",
    },
    {
      step: 7,
      title: "Approve the Formal Proposal",
      icon: CheckCircle,
      summary: "Recorded digital sign-off directly inside your client dashboard.",
      details:
        "Approval creates a binding digital record with user verification, timestamp, and versioning. Upon approval, your project is officially queued for execution.",
    },
    {
      step: 8,
      title: "Securely Provide Required Data",
      icon: Database,
      summary: "Encrypted, isolated access following strict NDA protocols.",
      details:
        "Provide read-only staging credentials, anonymized extracts, or encrypted files. Client data is never stored in public buckets and is isolated per client account.",
    },
    {
      step: 9,
      title: "Execute & Review Agile Milestones",
      icon: Terminal,
      summary: "Iterative development with live progress updates and interim previews.",
      details:
        "Follow real-time milestone progress on your dashboard. Test staging reports, review data validation scripts, and provide timely feedback through direct project chat.",
    },
    {
      step: 10,
      title: "Deliver Agreed Outputs & Collect Feedback",
      icon: Award,
      summary: "Handover of production files, documentation, training, and ongoing support.",
      details:
        "Download final Power BI models, SQL scripts, or analytical PDFs. We conduct a team handover walkthrough and remain available for support through the client ticket center.",
    },
  ];

  const arabicSteps = [
    ["إرسال طلب الخدمة", "أكمل نموذجنا الإرشادي المنظم من خمس خطوات.", "اكتب مشكلة العمل والنتيجة المرجوة ومصدر البيانات والموعد المناسب. لا تحتاج إلى مصطلحات تقنية متخصصة؛ نقبل ملفات الجداول ومخططات قواعد البيانات والملخصات اليدوية."],
    ["استلام تأكيد الطلب", "تحصل على رقم مرجعي فريد وإمكانية الدخول إلى البوابة.", "تابع حالة الطلب والرسائل الواردة من فريق KEMIX وأرسل الملاحظات أو المعلومات الإضافية من لوحة العميل."],
    ["مراجعة الطلب", "يراجع فريق العمليات ومحلل أول سياق العمل.", "نتحقق من اكتمال النطاق ونحدد التحديات المحتملة وملاءمة الخدمة لأهدافك، ثم نعين قائدًا للمشروع."],
    ["تحديد موعد استشارة", "مكالمة استكشافية مركزة لمواءمة التوقعات.", "نناقش آلية اتخاذ القرار وتكرار التقارير وصلاحيات المستخدمين والقيود التقنية لضمان ملاءمة الحل لمؤسستك."],
    ["تقييم الجدوى ومتطلبات البيانات", "نتحقق من السجلات التاريخية وحجم البيانات وجودتها.", "لا نعد بنتائج قبل التحقق من البيانات؛ نراجع السجلات وعدد الصفوف واتساقها لمعرفة مدى دعمها للوحات أو النماذج المطلوبة."],
    ["الاتفاق على النطاق والسعر والمدة والشروط", "عرض واضح بالتسليمات والمراحل والتكاليف.", "نحدد المخرجات والمراحل والافتراضات والاستثناءات والأسعار وشروط الدفع بوضوح قبل بدء التنفيذ."],
    ["اعتماد العرض الرسمي", "سجل موافقة إلكتروني داخل لوحة العميل.", "تُسجل الموافقة مع التحقق من المستخدم والتوقيت وإصدار العرض. وبعدها يُدرج المشروع في خطة التنفيذ."],
    ["توفير البيانات المطلوبة بأمان", "وصول مشفر ومعزول بعد استكمال اتفاقية السرية.", "يمكنك توفير بيانات مرحلية للقراءة فقط أو ملفات مجهولة الهوية ومشفرة. تُعزل بيانات كل عميل عن حسابات العملاء الأخرى."],
    ["التنفيذ ومراجعة المراحل", "تحديثات تقدم ومراجعات مرحلية.", "تابع تقدم المراحل من لوحة العميل وراجع التقارير التجريبية وسكربتات التحقق وأرسل ملاحظاتك عبر محادثة المشروع."],
    ["تسليم المخرجات وجمع الملاحظات", "تسليم الملفات والتوثيق والتدريب والدعم.", "نزّل النماذج والسكربتات والتقارير النهائية، واحصل على جلسة تسليم للفريق، ثم تواصل معنا عبر مركز تذاكر الدعم."],
  ];
  const displaySteps = workflowSteps.map((item, index) => locale === "ar"
    ? { ...item, title: arabicSteps[index][0], summary: arabicSteps[index][1], details: arabicSteps[index][2] }
    : item);

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} className="flex flex-col min-h-screen">
      <Navbar />

      {/* Header */}
      <section className="bg-[#0b2545] text-white py-16 sm:py-20 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs font-semibold text-orange-400 uppercase tracking-widest bg-orange-950/60 px-3 py-1 rounded-full border border-orange-800/40">
            {tr("End-to-End Client Engagement Lifecycle", "رحلة العميل من البداية إلى التسليم")}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black">
            {tr("How KEMIX Analysis Works", "كيف تعمل KEMIX Analysis")}
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            {tr("From initial request submission to final deliverable handover, our 10-step process guarantees transparency, data confidentiality, and rigorous quality assurance.", "من إرسال الطلب الأول وحتى تسليم المخرجات، توضح الخطوات العشر سير العمل وتدعم الشفافية وسرية البيانات ومراجعة الجودة.")}
          </p>
        </div>
      </section>

      {/* Steps List */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {displaySteps.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row gap-6 items-start"
              >
                <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 font-black text-lg border border-blue-100">
                  {item.step < 10 ? `0${item.step}` : item.step}
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-bold text-[#0b2545]">{item.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                      <Icon className="w-3.5 h-3.5 text-blue-600" />
                      <span>{tr("Phase", "المرحلة")} {item.step <= 3 ? tr("Intake", "استقبال الطلب") : item.step <= 7 ? tr("Alignment", "المواءمة") : tr("Delivery", "التسليم")}</span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{item.summary}</p>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.details}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="max-w-3xl mx-auto px-4 mt-16 text-center space-y-4">
          <h3 className="text-2xl font-bold text-[#0b2545]">{tr("Ready to initiate Step 1?", "هل أنت جاهز للخطوة الأولى؟")}</h3>
          <p className="text-sm text-slate-600">
            {tr("It takes under 3 minutes to submit your service requirements.", "يستغرق إرسال متطلبات الخدمة أقل من ثلاث دقائق.")}
          </p>
          <Link
            href="/request-service"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all"
          >
            <span>{tr("Start Step 1: Submit Request", "ابدأ الخطوة الأولى: أرسل طلب الخدمة")}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
