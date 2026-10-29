"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCurrentLocale } from "@/components/LocaleProvider";
import {
  ShieldCheck,
  Lock,
  Database,
  KeyRound,
  FileText,
  AlertTriangle,
  Server,
  ArrowRight,
} from "lucide-react";

export default function SecurityPage() {
  const locale = useCurrentLocale();
  const tr = (en: string, ar: string) => locale === "ar" ? ar : en;
  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} className="flex flex-col min-h-screen">
      <Navbar />

      <section className="bg-[#0b2545] text-white py-16 sm:py-20 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/40">
            {tr("Enterprise Confidentiality & Trust", "السرية والثقة المؤسسية")}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black">
            {tr("Data Security & Confidentiality Policy", "سياسة أمن البيانات والسرية")}
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            {tr("Data analytics requires absolute trust. Here is how KEMIX Analysis protects your proprietary records, customer data, and analytical models.", "يتطلب تحليل البيانات ثقة عالية. هنا نوضح كيف تحمي KEMIX Analysis سجلاتك وبيانات عملائك ونماذجك التحليلية.")}
          </p>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Important Disclaimer Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 sm:p-8 flex items-start gap-4">
            <ShieldCheck className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-blue-950">{tr("Our Commitment to Transparency", "التزامنا بالشفافية")}</h3>
              <p className="text-sm text-blue-800 leading-relaxed">
                {tr("We believe in straightforward engineering ethics. We implement strict server-side authorization, isolated tenant workspaces, non-disclosure agreements, and encrypted transport. We do not make unsubstantiated claims of unverified third-party certifications; our controls and security measures are detailed transparently below.", "نلتزم بممارسات هندسية واضحة، تشمل التحقق من الصلاحيات على الخادم، وعزل مساحات العملاء، واتفاقيات السرية، وتشفير الاتصال. لا ندّعي شهادات لم نتحقق منها؛ ونوضح أدناه الضوابط المطبقة.")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-7 space-y-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">{tr("Mutual Non-Disclosure Agreement (NDA)", "اتفاقية عدم إفصاح متبادلة")}</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                {tr("Before any raw datasets, database credentials, or proprietary files are exchanged, KEMIX executes a legally binding mutual NDA protecting your intellectual property, trade secrets, and customer records.", "قبل تبادل البيانات الخام أو بيانات الدخول إلى قواعد البيانات أو الملفات الخاصة، تُبرم KEMIX اتفاقية عدم إفصاح ملزمة لحماية ملكيتك الفكرية وأسرارك التجارية وسجلات عملائك.")}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-7 space-y-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">{tr("Strict Data Isolation", "عزل صارم للبيانات")}</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                {tr("Each client's records, conversations, proposals, and deliverables are isolated through multi-tier server-side authorization checks. No client can ever access or query another client's information.", "تُعزل سجلات كل عميل ومحادثاته وعروضه ومخرجاته عبر فحوص صلاحيات متعددة على الخادم، ولا يمكن للعميل الوصول إلى بيانات عميل آخر.")}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-7 space-y-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">{tr("Read-Only & Anonymized Staging", "بيئة مرحلية بصلاحية قراءة فقط وبيانات مجهولة")}</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                {tr("We advocate least-privilege connection protocols. We always request read-only credentials to replicated staging databases rather than live production servers, and encourage masked or anonymized customer identifiers.", "نتبع مبدأ الحد الأدنى من الصلاحيات؛ ونطلب بيانات دخول للقراءة فقط إلى نسخة مرحلية بدل خوادم الإنتاج، ونشجع إخفاء هوية بيانات العملاء.")}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-7 space-y-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">{tr("Zero AI Training on Client Data", "عدم تدريب نماذج الذكاء الاصطناعي على بيانات العملاء")}</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                {tr("Your data is strictly used for your scoped project. It is never added to public training corpora or used to fine-tune shared AI models. Once projects conclude and warranty periods lapse, data retention schedules are honored.", "تُستخدم بياناتك ضمن نطاق مشروعك فقط، ولا تُضاف إلى مجموعات تدريب عامة أو تستخدم لضبط نماذج مشتركة. وتُراعى جداول الاحتفاظ بالبيانات بعد انتهاء المشروع وفترة الضمان.")}
              </p>
            </div>
          </div>

          {/* Guidelines on Initial Intake */}
          <div className="bg-slate-100 rounded-2xl p-6 sm:p-8 space-y-3 border border-slate-200">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              {tr("Intake Security Guideline", "إرشادات أمن البيانات عند إرسال الطلب")}
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              {tr("Please do NOT submit live passwords, root database credentials, credit card records, or personally identifiable government numbers in initial public forms. Credential exchange happens only after NDA execution through designated secure encrypted channels.", "يُرجى عدم إدخال كلمات مرور فعالة أو بيانات مدير قاعدة البيانات أو معلومات بطاقات الدفع أو أرقام الهوية الحكومية في النماذج العامة. يتم تبادل بيانات الوصول بعد توقيع اتفاقية السرية وعبر قنوات آمنة ومشفرة.")}
            </p>
          </div>

          <div className="text-center pt-8">
            <Link
              href="/request-service"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all"
            >
              <span>{tr("Proceed to Service Request", "انتقل إلى طلب الخدمة")}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
