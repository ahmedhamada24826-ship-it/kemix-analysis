"use client";

import { useCallback, useEffect, useState } from "react";
import { Inbox, RefreshCw } from "lucide-react";
import { useCurrentLocale } from "@/components/LocaleProvider";

type Inquiry = { id: string; name: string; email: string; subject: string; message: string; status: string; createdAt: string };

export default function ContactInquiriesPage() {
  const locale = useCurrentLocale();
  const tr = (en: string, ar: string) => locale === "ar" ? ar : en;
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/admin/contact-inquiries", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || (locale === "ar" ? "تعذر تحميل الاستفسارات." : "Could not load inquiries."));
      setInquiries(data.inquiries || []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : (locale === "ar" ? "تعذر تحميل الاستفسارات." : "Could not load inquiries."));
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => { load().catch(() => undefined); }, [load]);

  async function updateStatus(inquiryId: string, status: string) {
    const response = await fetch(`/api/admin/contact-inquiries/${inquiryId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || tr("Could not update inquiry.", "تعذر تحديث حالة الاستفسار."));
      return;
    }
    await load();
  }

  const statusLabel = (status: string) => status === "NEW" ? tr("New", "جديد") : status === "IN_PROGRESS" ? tr("In progress", "قيد المتابعة") : tr("Resolved", "تم الحل");

  return (
    <main dir={locale === "ar" ? "rtl" : "ltr"} className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-700"><Inbox size={20} /></div>
          <div>
            <h1 className="text-2xl font-black text-[#0b2545]">{tr("Contact Inquiries", "استفسارات التواصل")}</h1>
            <p className="mt-1 text-sm text-slate-500">{tr("Messages submitted through the public contact form.", "الرسائل المرسلة من نموذج التواصل العام.")}</p>
          </div>
        </div>
        <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw size={14} />{tr("Refresh", "تحديث")}</button>
      </header>

      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {loading ? <p className="py-16 text-center text-sm text-slate-400">{tr("Loading inquiries…", "جارٍ تحميل الاستفسارات…")}</p> : inquiries.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">{tr("No inquiries have been submitted.", "لا توجد استفسارات حتى الآن.")}</div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <article key={inquiry.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-[#0b2545]">{inquiry.subject}</h2>
                  <p className="mt-1 text-xs text-slate-500">{inquiry.name} · <a className="text-blue-700 hover:underline" href={`mailto:${inquiry.email}`}>{inquiry.email}</a></p>
                </div>
                <select aria-label={tr("Inquiry status", "حالة الاستفسار")} value={inquiry.status} onChange={(event) => void updateStatus(inquiry.id, event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                  <option value="NEW">{statusLabel("NEW")}</option><option value="IN_PROGRESS">{statusLabel("IN_PROGRESS")}</option><option value="RESOLVED">{statusLabel("RESOLVED")}</option>
                </select>
              </div>
              <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">{inquiry.message}</p>
              <time className="mt-4 block text-[11px] text-slate-400" dateTime={inquiry.createdAt}>{new Date(inquiry.createdAt).toLocaleString(locale === "ar" ? "ar-EG" : "en-GB")}</time>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
