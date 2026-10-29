"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Inbox, Search, Filter, ArrowRight, User, Building, Calendar } from "lucide-react";
import { useCurrentLocale } from "@/components/LocaleProvider";

export default function AdminRequestsPage() {
  const locale = useCurrentLocale();
  const tr = (en: string, ar: string) => locale === "ar" ? ar : en;
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const loadRequests = async () => {
    try {
      const query = new URLSearchParams();
      if (statusFilter !== "ALL") query.set("status", statusFilter);
      if (search) query.set("search", search);

      const res = await fetch(`/api/requests?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter, search]);

  const getStatusBadge = (status: string) => {
    const formatted = status.replace(/_/g, " ");
    switch (status) {
      case "NEW_REQUEST":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">{tr("New Request", "طلب جديد")}</span>;
      case "UNDER_REVIEW":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">{tr("Under Review", "قيد المراجعة")}</span>;
      case "CALL_SCHEDULED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">{tr("Call Scheduled", "تم تحديد موعد اتصال")}</span>;
      case "QUALIFIED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">{tr("Qualified", "مؤهل")}</span>;
      case "PROPOSAL_SENT":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">{tr("Proposal Sent", "تم إرسال العرض")}</span>;
      case "APPROVED":
      case "IN_PROGRESS":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">{formatted}</span>;
      case "DELIVERED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">Delivered</span>;
      case "REJECTED":
      case "CANCELLED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">{formatted}</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">{formatted}</span>;
    }
  };

  return (
    <div className="space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#0b2545]">{tr("Request Intake & Pipeline", "الطلبات ومراحل المتابعة")}</h2>
          <p className="text-xs text-slate-500 mt-1">
            {tr("Review incoming inquiries, assign analysts, schedule consultations, and advance request stages.", "راجع الطلبات الجديدة وعيّن المسؤولين وحدد الاستشارات وتابع مراحل الطلب.")}
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tr("Search by reference, company, client name, or keywords...", "ابحث بالرقم المرجعي أو الشركة أو اسم العميل أو الكلمات المفتاحية…")}
            className="w-full px-3.5 py-2 pl-9 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="ALL">{tr(`All Statuses (${requests.length})`, `كل الحالات (${requests.length})`)}</option>
            <option value="NEW_REQUEST">{tr("New Request", "طلب جديد")}</option>
            <option value="UNDER_REVIEW">{tr("Under Review", "قيد المراجعة")}</option>
            <option value="CALL_SCHEDULED">{tr("Call Scheduled", "تم تحديد موعد اتصال")}</option>
            <option value="QUALIFIED">{tr("Qualified", "مؤهل")}</option>
            <option value="PROPOSAL_SENT">{tr("Proposal Sent", "تم إرسال العرض")}</option>
            <option value="APPROVED">{tr("Approved", "تمت الموافقة")}</option>
            <option value="IN_PROGRESS">{tr("In Progress", "قيد التنفيذ")}</option>
            <option value="QA_REVIEW">{tr("QA Review", "مراجعة الجودة")}</option>
            <option value="DELIVERED">{tr("Delivered", "تم التسليم")}</option>
            <option value="CLOSED">{tr("Closed", "مغلق")}</option>
            <option value="ON_HOLD">{tr("On Hold", "معلّق")}</option>
            <option value="REJECTED">{tr("Rejected", "مرفوض")}</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">{tr("Loading requests…", "جارٍ تحميل الطلبات…")}</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-medium text-slate-700">{tr("No requests match the current filters.", "لا توجد طلبات مطابقة للتصفية الحالية.")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">{tr("Reference", "الرقم المرجعي")}</th>
                  <th className="px-5 py-3">{tr("Client / Organization", "العميل / المؤسسة")}</th>
                  <th className="px-5 py-3">{tr("Service", "الخدمة")}</th>
                  <th className="px-5 py-3">{tr("Status", "الحالة")}</th>
                  <th className="px-5 py-3">{tr("Assigned Lead", "المسؤول المعيّن")}</th>
                  <th className="px-5 py-3">{tr("Date", "التاريخ")}</th>
                  <th className="px-5 py-3 text-right">{tr("Actions", "الإجراءات")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-blue-600">
                      {req.referenceNumber}
                    </td>
                    <td className="px-5 py-4 space-y-0.5">
                      <span className="font-bold text-slate-900 block">{req.client?.name}</span>
                      <span className="text-[11px] text-slate-500 block">
                        {req.client?.companyName || tr("Individual Client", "عميل فردي")}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-800 max-w-xs truncate">
                      {req.serviceType}
                    </td>
                    <td className="px-5 py-4">{getStatusBadge(req.status)}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {req.assignedStaff?.name ? (
                        <span className="font-semibold text-slate-800">{req.assignedStaff.name}</span>
                      ) : (
                        <span className="text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded">
                          {tr("Unassigned", "غير معيّن")}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(req.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/requests/${req.id}`}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#0b2545] hover:bg-blue-900 transition-colors"
                      >
                        {tr("Manage & Review", "إدارة ومراجعة")}
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
