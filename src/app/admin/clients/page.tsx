"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { useCurrentLocale } from "@/components/LocaleProvider";

export default function AdminClientsPage() {
  const locale = useCurrentLocale();
  const tr = (en: string, ar: string) => locale === "ar" ? ar : en;
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClients() {
      try {
        const res = await fetch("/api/admin/clients");
        if (res.ok) {
          const data = await res.json();
          setClients(data.clients || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadClients();
  }, []);

  return (
    <div className="space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div>
        <h2 className="text-2xl font-black text-[#0b2545]">{tr("Client Relationship Management", "إدارة علاقات العملاء")}</h2>
        <p className="text-xs text-slate-500 mt-1">
          {tr("Client accounts, project counts, and request history.", "حسابات العملاء ومشاريعهم وسجل طلباتهم.")}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">{tr("Loading client directory…", "جارٍ تحميل دليل العملاء…")}</div>
        ) : clients.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-medium text-slate-700">{tr("No client accounts registered yet.", "لا توجد حسابات عملاء مسجلة بعد.")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">{tr("Client Contact", "بيانات العميل")}</th>
                  <th className="px-5 py-3">{tr("Organization", "المؤسسة")}</th>
                  <th className="px-5 py-3">{tr("Industry Sector", "القطاع")}</th>
                  <th className="px-5 py-3">{tr("Requests", "الطلبات")}</th>
                  <th className="px-5 py-3">{tr("Projects", "المشاريع")}</th>
                  <th className="px-5 py-3">{tr("Support Tickets", "تذاكر الدعم")}</th>
                  <th className="px-5 py-3">{tr("Status", "الحالة")}</th>
                  <th className="px-5 py-3">{tr("Registered", "تاريخ التسجيل")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-900 block">{c.name}</span>
                      <span className="text-[11px] text-blue-600 block">{c.email}</span>
                      {c.phone && <span className="text-[10px] text-slate-400 block">{c.phone}</span>}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {c.companyName || tr("Individual Client", "عميل فردي")}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {c.companySector || tr("General", "عام")}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {c._count?.serviceRequests || 0}
                    </td>
                    <td className="px-5 py-4 font-bold text-blue-600">
                      {c._count?.projects || 0}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-600">
                      {c._count?.supportTickets || 0}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
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
