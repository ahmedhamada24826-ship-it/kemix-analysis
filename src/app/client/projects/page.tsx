"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Briefcase, ArrowRight, Calendar } from "lucide-react";
import { useCurrentLocale } from "@/components/LocaleProvider";
import { translate } from "@/lib/i18n";

type ClientProject = {
  id: string; referenceNumber: string; title: string; status: string; description?: string | null;
  milestones?: { status: string }[]; leadStaff?: { name: string } | null; targetDeliveryDate?: string | Date | null;
};

export default function ClientProjectsPage() {
  const locale = useCurrentLocale();
  const tr = (key: string) => translate(locale, key);
  const [projects, setProjects] = useState<ClientProject[]>([]);
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
        <h2 className="text-2xl font-black text-[#0b2545]">{tr("clientActiveProjects")}</h2>
        <p className="text-xs text-slate-500 mt-1">
          {tr("projectTrackingHelp")}
        </p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">{tr("loadingProjects")}</div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-medium text-slate-700">{tr("noActiveProjects")}</p>
            <p className="text-xs text-slate-400">
              {tr("projectWillAppear")}
            </p>
          </div>
        ) : (
          projects.map((proj) => {
            const totalMilestones = proj.milestones?.length || 0;
            const completedMilestones =
              proj.milestones?.filter((m) => m.status === "COMPLETED").length || 0;
            const progress =
              totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

            return (
              <div
                key={proj.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-blue-200 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                      {proj.referenceNumber}
                    </span>
                    <h3 className="text-lg font-bold text-[#0b2545] mt-1">{proj.title}</h3>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto">
                    {proj.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                  {proj.description}
                </p>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{tr("projectProgress")}</span>
                    <span>
                      {completedMilestones} / {totalMilestones} {tr("milestonesCompleted")} ({progress}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-4">
                    <span>
                      {tr("clientProjectLead")}: <strong>{proj.leadStaff?.name || tr("kemixTeam")}</strong>
                    </span>
                    {proj.targetDeliveryDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{tr("target")}: {new Date(proj.targetDeliveryDate).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}</span>
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/client/projects/${proj.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    <span>{tr("openMilestones")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
