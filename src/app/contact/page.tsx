"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Mail, Phone, Send, Headphones, ArrowRight } from "lucide-react";
import { useCurrentLocale } from "@/components/LocaleProvider";

export default function ContactPage() {
  const locale = useCurrentLocale();
  const tr = (en: string, ar: string) => locale === "ar" ? ar : en;
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState<{ reference: string } | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || tr("Could not submit your inquiry.", "تعذر إرسال استفسارك."));
      setSubmission({ reference: data.reference });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : tr("Could not submit your inquiry.", "تعذر إرسال استفسارك."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} className="flex flex-col min-h-screen">
      <Navbar />

      <section className="bg-[#0b2545] text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest bg-blue-900/60 px-3 py-1 rounded-full border border-blue-700/50">
            {tr("Contact & Support", "التواصل والدعم")}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black">{tr("Get in Touch with KEMIX", "تواصل مع KEMIX")}</h1>
          <p className="text-slate-300 max-w-xl mx-auto text-base leading-relaxed">
            {tr("Have questions regarding our service offerings or looking for enterprise engagement? Reach our advisory team directly.", "هل لديك استفسار عن خدماتنا أو ترغب في التعاون مع فريقنا؟ تواصل مباشرة مع فريق الاستشارات.")}
          </p>
        </div>
      </section>

      <section className="py-20 bg-slate-50 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Contact Information */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-[#0b2545]">{tr("We are here to assist.", "نحن هنا لمساعدتك")}</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {tr("For active project communications or technical support, please sign in to the client portal to maintain an authenticated ticket history.", "للتواصل بشأن مشروع قائم أو طلب دعم فني، سجّل الدخول إلى بوابة العميل لمتابعة الطلبات والمراسلات بأمان.")}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{tr("Email Inquiries", "استفسارات البريد الإلكتروني")}</h4>
                    <p className="text-xs text-slate-600 mt-0.5">contact@kemix-analysis.com</p>
                    <p className="text-[11px] text-slate-400 mt-1">{tr("Average response time: < 4 hours", "متوسط وقت الرد: أقل من 4 ساعات")}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{tr("Direct Consultation Desk", "مكتب الاستشارات المباشرة")}</h4>
                    <p className="text-xs text-slate-600 mt-0.5">+966 50 123 4567</p>
                    <p className="text-[11px] text-slate-400 mt-1">{tr("Sun - Thu: 9:00 AM - 6:00 PM AST", "الأحد إلى الخميس: 9 صباحًا - 6 مساءً بتوقيت السعودية")}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{tr("Existing Client Support", "دعم العملاء الحاليين")}</h4>
                    <p className="text-xs text-slate-600 mt-0.5">{tr("Open a ticket in your client dashboard", "افتح تذكرة من لوحة العميل")}</p>
                    <Link
                      href="/client/support"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 mt-1"
                    >
                      <span>{tr("Go to Support Center", "الانتقال إلى مركز الدعم")}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* General Inquiry Form */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              {submission ? (
                <div role="status" className="py-12 text-center">
                  <h3 className="text-xl font-bold text-emerald-800">{tr("Inquiry received", "تم استلام الاستفسار")}</h3>
                  <p className="mt-2 text-sm text-slate-600">{tr("Our team will review your message. Reference:", "سيراجع فريقنا رسالتك. الرقم المرجعي:")} <strong>{submission.reference}</strong></p>
                  <button type="button" onClick={() => { setSubmission(null); setForm({ name: "", email: "", subject: "", message: "" }); }} className="mt-5 text-sm font-semibold text-blue-600 hover:underline">{tr("Send another inquiry", "إرسال استفسار آخر")}</button>
                </div>
              ) : <form onSubmit={handleSubmit} className="space-y-5">
                  <h3 className="text-xl font-bold text-[#0b2545] mb-2">{tr("Send an Inquiry", "أرسل استفسارك")}</h3>
                  <p className="text-xs text-slate-500">{tr("Your message will be saved securely and sent to our customer service team.", "ستُحفظ رسالتك بأمان وتُرسل إلى فريق خدمة العملاء.")}</p>
                  {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {tr("Full Name", "الاسم الكامل")} *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={120}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={tr("John Doe", "الاسم الكامل")}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {tr("Business Email", "البريد الإلكتروني للعمل")} *
                      </label>
                      <input
                        type="email"
                        required
                        maxLength={254}
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={tr("john@company.com", "name@company.com")}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {tr("Subject", "الموضوع")} *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={200}
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={tr("e.g. Inquiring about enterprise Power BI engagement", "مثال: استفسار عن مشروع Power BI للشركات")}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {tr("Message", "الرسالة")} *
                    </label>
                    <textarea
                      required
                      rows={5}
                      maxLength={2000}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={tr("Please describe how we can assist you...", "اكتب كيف يمكننا مساعدتك...")}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-7 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span>{submitting ? tr("Submitting…", "جارٍ الإرسال…") : tr("Submit Inquiry", "إرسال الاستفسار")}</span>
                    <Send className="w-4 h-4" />
                  </button>
              </form>}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
