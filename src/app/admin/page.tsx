"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Inbox,
  Briefcase,
  FileCheck,
  Headphones,
  Activity,
} from "lucide-react";
import { useCurrentLocale } from "@/components/LocaleProvider";

type AdminMetricsResponse = {
  metrics?: {
    totalRequests?: number; newRequestsCount?: number; unassignedRequestsCount?: number;
    activeProjectsCount?: number; totalProjects?: number; pendingProposalsCount?: number;
    acceptedProposalsCount?: number; openTicketsCount?: number; totalClients?: number;
  };
  recentActivity?: { id: string; action: string; entityType: string; actor?: { name?: string; role?: string } | null; details?: string | null; createdAt: string | Date }[];
  statusBreakdown?: { status: string; count: number }[];
};

export default function AdminOverviewPage() {
  const locale = useCurrentLocale();
  const tr = (english: string, arabic: string) => locale === "ar" ? arabic : english;
  const [data, setData] = useState<AdminMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const res = await fetch("/api/admin/metrics");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">{tr("Loading operational metrics…", "جارٍ تحميل مؤشرات التشغيل…")}</div>;
  }

  const metrics = data?.metrics || {};
  const recentActivity = data?.recentActivity || [];
  const statusBreakdown = data?.statusBreakdown || [];

  return (
    <div className="space-y-8" dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#0b2545]">{tr("Operational Command Overview", "نظرة عامة على العمليات")}</h2>
          <p className="text-xs text-slate-500 mt-1">
            {tr("Live metrics calculated from recorded system activity.", "مؤشرات مباشرة محسوبة من سجلات النظام.")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/requests"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow transition-colors"
          >
            {tr("Review Intake Queue", "مراجعة الطلبات")}
          </Link>
          <Link
            href="/admin/proposals"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            {tr("Create Proposal", "إنشاء عرض")}
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">{tr("Total Requests", "إجمالي الطلبات")}</span>
            <Inbox className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-black text-[#0b2545]">{metrics.totalRequests || 0}</p>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-orange-600 font-bold">{metrics.newRequestsCount || 0} {tr("New", "جديد")}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">{metrics.unassignedRequestsCount || 0} {tr("Unassigned", "غير مسند")}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">{tr("Active Projects", "المشاريع النشطة")}</span>
            <Briefcase className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-700">{metrics.activeProjectsCount || 0}</p>
          <span className="text-[11px] text-slate-500">{metrics.totalProjects || 0} {tr("Total in system", "إجمالي المشاريع")}</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">{tr("Pending Proposals", "العروض المعلقة")}</span>
            <FileCheck className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-3xl font-black text-purple-700">{metrics.pendingProposalsCount || 0}</p>
          <span className="text-[11px] text-slate-500">
            {metrics.acceptedProposalsCount || 0} {tr("Accepted to date", "عرضًا مقبولًا")}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">{tr("Open Support Tickets", "تذاكر الدعم المفتوحة")}</span>
            <Headphones className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-3xl font-black text-rose-700">{metrics.openTicketsCount || 0}</p>
          <span className="text-[11px] text-slate-500">{metrics.totalClients || 0} {tr("Registered clients", "عميل مسجل")}</span>
        </div>
      </div>

      {/* Main Row: Status Breakdown + Real Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Status Distribution */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#0b2545] uppercase tracking-wider">
            {tr("Request Status Breakdown", "توزيع حالات الطلبات")}
          </h3>

          <div className="space-y-3">
            {statusBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">{tr("No requests logged yet.", "لا توجد طلبات مسجلة حتى الآن.")}</p>
            ) : (
              statusBreakdown.map((item) => {
                const total = metrics.totalRequests || 1;
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>{item.status.replace(/_/g, " ")}</span>
                      <span>
                        {item.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Real Audit Activity Feed */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-[#0b2545] uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>{tr("Audit Trail & Operations History", "سجل التدقيق والعمليات")}</span>
            </h3>
            <span className="text-[10px] text-slate-400">{tr("Immutable record", "سجل غير قابل للتعديل")}</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">{tr("No audit records found.", "لا توجد سجلات تدقيق.")}</p>
            ) : (
              recentActivity.map((log) => (
                <div key={log.id} className="py-3 text-xs flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {log.entityType}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      {tr("By", "بواسطة")} <strong>{log.actor?.name || tr("System", "النظام")}</strong> ({log.actor?.role || "AUTOMATED"})
                    </p>
                    {log.details && (
                      <p className="text-slate-400 text-[10px] truncate max-w-md font-mono">
                        {log.details}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
