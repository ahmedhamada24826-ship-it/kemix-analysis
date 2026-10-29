"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Briefcase, ArrowRight } from "lucide-react";
import { useCurrentLocale } from "@/components/LocaleProvider";

export default function AdminProjectsPage() {
  const locale = useCurrentLocale();
  const tr = (en: string, ar: string) => locale === "ar" ? ar : en;
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  return (
    <div className="space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div>
        <h2 className="text-2xl font-black text-[#0b2545]">{tr("Project Delivery Operations", "إدارة تنفيذ المشاريع")}</h2>
        <p className="text-xs text-slate-500 mt-1">
          {tr("Track project milestones, delivery leads, deadlines, QA signoffs, and deliverable releases.", "تابع مراحل المشاريع والمسؤولين والمواعيد واعتماد الجودة ونشر التسليمات.")}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">{tr("Loading projects…", "جارٍ تحميل المشاريع…")}</div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-medium text-slate-700">{tr("No active projects found.", "لا توجد مشاريع نشطة.")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">{tr("Project Ref", "مرجع المشروع")}</th>
                  <th className="px-5 py-3">{tr("Title & Client", "المشروع والعميل")}</th>
                  <th className="px-5 py-3">{tr("Status", "الحالة")}</th>
                  <th className="px-5 py-3">{tr("Project Lead", "قائد المشروع")}</th>
                  <th className="px-5 py-3">{tr("Milestones Progress", "تقدم المراحل")}</th>
                  <th className="px-5 py-3">{tr("Target Date", "موعد التسليم")}</th>
                  <th className="px-5 py-3 text-right">{tr("Actions", "الإجراءات")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((proj) => {
                  const total = proj.milestones?.length || 0;
                  const done =
                    proj.milestones?.filter((m: any) => m.status === "COMPLETED").length || 0;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                  return (
                    <tr key={proj.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-blue-600">
                        {proj.referenceNumber}
                      </td>
                      <td className="px-5 py-4 space-y-0.5">
                        <span className="font-bold text-slate-900 block">{proj.title}</span>
                        <span className="text-[11px] text-slate-500 block">
                          {tr("Client", "العميل")}: {proj.client?.name} ({proj.client?.companyName || tr("Individual", "فرد")})
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {proj.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-700 font-semibold">
                        {proj.leadStaff?.name || (
                            <span className="text-slate-400 italic">{tr("Unassigned", "غير معيّن")}</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="w-32 space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>{done}/{total} {tr("done", "مكتملة")}</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full"
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {proj.targetDeliveryDate
                          ? new Date(proj.targetDeliveryDate).toLocaleDateString()
                          : tr("Flexible", "مرن")}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/projects/${proj.id}`}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#0b2545] hover:bg-blue-900 transition-colors inline-flex items-center gap-1"
                        >
                        <span>{tr("Manage", "إدارة")}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
