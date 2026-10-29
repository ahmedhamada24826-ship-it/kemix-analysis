"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Headphones } from "lucide-react";
import { useCurrentLocale } from "@/components/LocaleProvider";

export default function AdminSupportPage() {
  const locale = useCurrentLocale();
  const tr = (en: string, ar: string) => locale === "ar" ? ar : en;
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTickets() {
      try {
        const res = await fetch("/api/support");
        if (res.ok) {
          const data = await res.json();
          setTickets(data.tickets || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadTickets();
  }, []);

  return (
    <div className="space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div>
        <h2 className="text-2xl font-black text-[#0b2545]">{tr("Support Tickets Queue", "قائمة تذاكر الدعم")}</h2>
        <p className="text-xs text-slate-500 mt-1">
          {tr("Technical issues, deliverable access questions, and client support inquiries.", "المشكلات التقنية واستفسارات التسليم وطلبات مساعدة العملاء.")}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">{tr("Loading support tickets…", "جارٍ تحميل التذاكر…")}</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Headphones className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-medium text-slate-700">{tr("No support tickets currently open.", "لا توجد تذاكر دعم مفتوحة حاليًا.")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">{tr("Ticket #", "رقم التذكرة")}</th>
                  <th className="px-5 py-3">{tr("Client", "العميل")}</th>
                  <th className="px-5 py-3">{tr("Subject", "الموضوع")}</th>
                  <th className="px-5 py-3">{tr("Category", "الفئة")}</th>
                  <th className="px-5 py-3">{tr("Priority", "الأولوية")}</th>
                  <th className="px-5 py-3">{tr("Status", "الحالة")}</th>
                  <th className="px-5 py-3">{tr("Assigned Agent", "موظف الدعم المعيّن")}</th>
                  <th className="px-5 py-3 text-right">{tr("Actions", "الإجراءات")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-blue-600">{t.ticketNumber}</td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-900 block">{t.client?.name}</span>
                      <span className="text-[11px] text-slate-400 block">{t.client?.companyName}</span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-800 max-w-sm truncate">
                      {t.subject}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{t.category}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.priority === "URGENT" || t.priority === "HIGH"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {({ LOW: tr("Low", "منخفضة"), MEDIUM: tr("Medium", "متوسطة"), HIGH: tr("High", "مرتفعة"), URGENT: tr("Urgent", "عاجلة") } as Record<string, string>)[t.priority] || t.priority}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">
                        {({ OPEN: tr("Open", "مفتوحة"), IN_PROGRESS: tr("In Progress", "قيد المعالجة"), WAITING_ON_CLIENT: tr("Waiting on Client", "بانتظار العميل"), RESOLVED: tr("Resolved", "تم الحل"), CLOSED: tr("Closed", "مغلقة") } as Record<string, string>)[t.status] || t.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {t.assignedStaff?.name || <span className="text-slate-400 italic">{tr("Unassigned", "غير معيّن")}</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/support/${t.id}`}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#0b2545] hover:bg-blue-900 transition-colors"
                      >
                        {tr("Open Ticket", "فتح التذكرة")}
                      </Link>
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
