"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Search, Plus, Filter } from "lucide-react";
import { useCurrentLocale } from "@/components/LocaleProvider";
import { translate } from "@/lib/i18n";

type ClientRequest = {
  id: string;
  referenceNumber: string;
  serviceType: string;
  status: string;
  assignedStaff?: { name: string } | null;
  preferredDeadline?: string | null;
  createdAt: string | Date;
};

export default function ClientRequestsPage() {
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const locale = useCurrentLocale();
  const t = (key: string) => translate(locale, key);

  useEffect(() => {
    async function loadRequests() {
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
    }
    loadRequests();
  }, [statusFilter, search]);

  const getStatusBadge = (status: string) => {
    const labels: Record<string, string> = {
      NEW_REQUEST: t("newRequest"), UNDER_REVIEW: t("underReview"), CALL_SCHEDULED: t("callScheduled"),
      PROPOSAL_SENT: t("proposalSent"), APPROVED: t("approved"), IN_PROGRESS: locale === "ar" ? "قيد التنفيذ" : "In Progress",
      DELIVERED: t("delivered"),
    };
    const formatted = labels[status] || status.replace(/_/g, " ");
    switch (status) {
      case "NEW_REQUEST":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">{formatted}</span>;
      case "UNDER_REVIEW":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">{formatted}</span>;
      case "PROPOSAL_SENT":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">{formatted}</span>;
      case "APPROVED":
      case "IN_PROGRESS":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{formatted}</span>;
      case "DELIVERED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">{formatted}</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">{formatted}</span>;
    }
  };

  return (
    <div className="space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#0b2545]">{t("myServiceRequests")}</h2>
          <p className="text-xs text-slate-500 mt-1">
            {t("requestTrackingHelp")}
          </p>
        </div>
        <Link
          href="/request-service"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t("submitRequest")}</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchRequests")}
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
            <option value="ALL">{t("allStatuses")}</option>
            <option value="NEW_REQUEST">{t("newRequest")}</option>
            <option value="UNDER_REVIEW">{t("underReview")}</option>
            <option value="CALL_SCHEDULED">{t("callScheduled")}</option>
            <option value="PROPOSAL_SENT">{t("proposalSent")}</option>
            <option value="APPROVED">{t("approved")}</option>
            <option value="IN_PROGRESS">{locale === "ar" ? "قيد التنفيذ" : "In Progress"}</option>
            <option value="DELIVERED">{t("delivered")}</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">{t("loadingRequests")}</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-medium text-slate-700">{t("noRequestsFound")}</p>
            <p className="text-xs text-slate-400">{t("adjustSearch")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">{t("reference")}</th>
                  <th className="px-5 py-3">{t("serviceType")}</th>
                  <th className="px-5 py-3">{t("status")}</th>
                  <th className="px-5 py-3">{t("assignedLead")}</th>
                  <th className="px-5 py-3">{t("targetDeadline")}</th>
                  <th className="px-5 py-3">{t("dateSubmitted")}</th>
                  <th className="px-5 py-3 text-right">{t("action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-blue-600">
                      {req.referenceNumber}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-900 max-w-xs truncate">
                      {req.serviceType}
                    </td>
                    <td className="px-5 py-4">{getStatusBadge(req.status)}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {req.assignedStaff?.name || <span className="text-slate-400 italic">{t("unassigned")}</span>}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {req.preferredDeadline || t("flexible")}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(req.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/client/requests/${req.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors"
                      >
                        {t("openDetails")}
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
