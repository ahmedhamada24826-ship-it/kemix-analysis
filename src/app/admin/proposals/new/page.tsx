"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FileCheck, ChevronLeft, ArrowRight, AlertCircle } from "lucide-react";
import { useCurrentLocale } from "@/components/LocaleProvider";

function NewProposalContent() {
  const locale = useCurrentLocale();
  const tr = (en: string, ar: string) => locale === "ar" ? ar : en;
  const router = useRouter();
  const searchParams = useSearchParams();

  const prefilledRequestId = searchParams.get("requestId") || "";
  const prefilledClientId = searchParams.get("clientId") || "";
  const prefilledTitle = searchParams.get("title") || "";

  const [clients, setClients] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  const [form, setForm] = useState({
    clientId: prefilledClientId,
    requestId: prefilledRequestId,
    title: prefilledTitle ? `${prefilledTitle} Engagement` : "",
    scopeSummary: "",
    deliverablesText: tr("1. Diagnostic Analytics & Findings Presentation Deck\n2. Power BI Interactive Executive Dashboard\n3. Optimized Star-Schema Data Model and DAX Dictionary\n4. Administrator Handover & Team Training Session", "1. عرض نتائج التحليل التشخيصي\n2. لوحة تنفيذية تفاعلية باستخدام Power BI\n3. نموذج بيانات محسّن وقاموس DAX\n4. تسليم للمسؤولين وجلسة تدريب للفريق"),
    price: "3500",
    currency: "USD",
    timelineDays: "21",
    paymentTerms: tr("50% upfront upon acceptance, 50% upon final deliverable handover and acceptance.", "50٪ عند الموافقة و50٪ عند تسليم المخرجات النهائية واعتمادها."),
    assumptions: tr("Client provides secure, read-only access to a data replica and assigns one contact for weekly check-ins.", "يوفر العميل وصولًا آمنًا للقراءة فقط إلى نسخة من البيانات ويحدد جهة اتصال للمتابعة الأسبوعية."),
    exclusions: tr("Direct ERP source code modification or third-party license subscription fees.", "تعديل الشيفرة المصدرية لنظام ERP أو رسوم تراخيص الجهات الخارجية."),
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMeta() {
      try {
        const [cRes, rRes] = await Promise.all([
          fetch("/api/admin/clients"),
          fetch("/api/requests"),
        ]);
        if (cRes.ok) {
          const cData = await cRes.json();
          setClients(cData.clients || []);
          if (!form.clientId && cData.clients?.length > 0) {
            setForm((prev) => ({ ...prev, clientId: cData.clients[0].id }));
          }
        }
        if (rRes.ok) {
          const rData = await rRes.json();
          setRequests(rData.requests || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingClients(false);
      }
    }
    loadMeta();
  }, [form.clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const deliverables = form.deliverablesText
        .split("\n")
        .map((l) => l.trim().replace(/^\d+\.\s*/, ""))
        .filter((l) => l.length > 0);

      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          deliverables,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || tr("Failed to draft proposal.", "تعذر إعداد العرض."));
        setSubmitting(false);
        return;
      }

      router.push("/admin/proposals");
      router.refresh();
    } catch {
      setError(tr("Network or server error.", "حدث خطأ في الاتصال أو الخادم."));
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <Link
        href="/admin/proposals"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 mb-2 font-medium"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        <span>{tr("Back to proposals", "العودة إلى العروض")}</span>
      </Link>

      <div>
        <h2 className="text-2xl font-black text-[#0b2545]">{tr("Draft New Formal Proposal", "إعداد عرض رسمي جديد")}</h2>
        <p className="text-xs text-slate-500 mt-1">
          {tr("Create the scope, milestones, and deliverables for client review and approval.", "أنشئ نطاق العمل والمراحل والتسليمات لإرسالها إلى العميل للمراجعة والموافقة.")}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {tr("Select Client", "اختر العميل")} *
              </label>
              <select
                required
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.companyName || tr("Individual", "فرد")})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {tr("Link to Intake Request (Optional)", "ربط بطلب خدمة (اختياري)")}
              </label>
              <select
                value={form.requestId}
                onChange={(e) => setForm({ ...form, requestId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- {tr("Standalone Proposal", "عرض مستقل")} --</option>
                {requests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.referenceNumber} - {r.serviceType}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {tr("Proposal Project Title", "عنوان المشروع في العرض")} *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={tr("e.g. Executive Power BI Warehouse Analytics Suite", "مثال: لوحة تنفيذية لتحليلات المستودعات باستخدام Power BI")}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {tr("Scope of Work Summary", "ملخص نطاق العمل")} *
            </label>
            <textarea
              required
              rows={3}
              value={form.scopeSummary}
              onChange={(e) => setForm({ ...form, scopeSummary: e.target.value })}
              placeholder={tr("Explain the technical scope, data pipelines, modeling architecture, and implementation…", "اشرح النطاق الفني وخطوط البيانات وبنية النمذجة والتنفيذ…")}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {tr("Deliverables List (One per line)", "قائمة التسليمات (تسليم واحد في كل سطر)")} *
            </label>
            <textarea
              required
              rows={4}
              value={form.deliverablesText}
              onChange={(e) => setForm({ ...form, deliverablesText: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {tr("Fixed Price", "السعر الثابت")} ({tr("USD", "دولار أمريكي")}) *
              </label>
              <input
                type="number"
                required
                min={1}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {tr("Timeline (Days)", "المدة (بالأيام)")} *
              </label>
              <input
                type="number"
                required
                min={1}
                value={form.timelineDays}
                onChange={(e) => setForm({ ...form, timelineDays: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {tr("Currency", "العملة")}
              </label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="USD">USD ($)</option>
                <option value="SAR">SAR (ر.س)</option>
                <option value="AED">AED (د.إ)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {tr("Payment Terms", "شروط الدفع")}
            </label>
            <input
              type="text"
              value={form.paymentTerms}
              onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {tr("Assumptions", "الافتراضات")}
              </label>
              <textarea
                rows={2}
                value={form.assumptions}
                onChange={(e) => setForm({ ...form, assumptions: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {tr("Exclusions", "الاستثناءات")}
              </label>
              <textarea
                rows={2}
                value={form.exclusions}
                onChange={(e) => setForm({ ...form, exclusions: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              href="/admin/proposals"
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {tr("Cancel", "إلغاء")}
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition-colors flex items-center gap-2"
            >
              <span>{submitting ? tr("Sending to Client…", "جارٍ الإرسال إلى العميل…") : tr("Generate & Send Proposal", "إنشاء العرض وإرساله")}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminNewProposalPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading proposal editor…</div>}>
      <NewProposalContent />
    </Suspense>
  );
}
