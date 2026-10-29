"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileCheck, Plus } from "lucide-react";
import { useCurrentLocale } from "@/components/LocaleProvider";

export default function AdminProposalsPage() {
  const locale = useCurrentLocale();
  const tr = (en: string, ar: string) => locale === "ar" ? ar : en;
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProposals() {
      try {
        const res = await fetch("/api/proposals");
        if (res.ok) {
          const data = await res.json();
          setProposals(data.proposals || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadProposals();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">{tr("Accepted & Active", "مقبول ونشط")}</span>;
      case "SENT":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">{tr("Sent to Client", "تم إرساله للعميل")}</span>;
      case "REJECTED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">{tr("Declined", "مرفوض")}</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#0b2545]">{tr("Proposal Management", "إدارة العروض")}</h2>
          <p className="text-xs text-slate-500 mt-1">
            {tr("Generate formal scope documents, define pricing and deliverables, and track client approvals.", "أنشئ عروضًا رسمية وحدد الأسعار والتسليمات وتابع موافقات العملاء.")}
          </p>
        </div>

        <Link
          href="/admin/proposals/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{tr("Draft New Proposal", "إنشاء عرض جديد")}</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">{tr("Loading proposals…", "جارٍ تحميل العروض…")}</div>
        ) : proposals.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-medium text-slate-700">{tr("No proposals drafted yet.", "لم يتم إعداد عروض بعد.")}</p>
            <Link
              href="/admin/proposals/new"
              className="inline-block mt-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg"
            >
              {tr("Draft First Proposal", "إنشاء أول عرض")}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">{tr("Proposal #", "رقم العرض")}</th>
                  <th className="px-5 py-3">{tr("Client", "العميل")}</th>
                  <th className="px-5 py-3">{tr("Project Title", "عنوان المشروع")}</th>
                  <th className="px-5 py-3">{tr("Price", "السعر")}</th>
                  <th className="px-5 py-3">{tr("Timeline", "المدة")}</th>
                  <th className="px-5 py-3">{tr("Status", "الحالة")}</th>
                  <th className="px-5 py-3">{tr("Date", "التاريخ")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {proposals.map((prop) => (
                  <tr key={prop.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-blue-600">
                      {prop.referenceNumber}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-900 block">{prop.client?.name}</span>
                      <span className="text-[11px] text-slate-400 block">{prop.client?.companyName}</span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-800 max-w-sm truncate">
                      {prop.title}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      ${prop.price.toLocaleString()} {prop.currency}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {prop.timelineDays} {tr("Days", "أيام")}
                    </td>
                    <td className="px-5 py-4">{getStatusBadge(prop.status)}</td>
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(prop.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
