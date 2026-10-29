"use client";

import { useState, useEffect } from "react";
import { FolderDown, ExternalLink } from "lucide-react";
import { useCurrentLocale } from "@/components/LocaleProvider";
import { translate } from "@/lib/i18n";

type ClientDeliverable = { id: string; version: number; fileType: string; title: string; description?: string | null; publishedAt: string | Date; externalLink?: string | null; projectTitle: string; projectRef: string };
type ClientProjectDeliverables = { title: string; referenceNumber: string; deliverables?: Omit<ClientDeliverable, "projectTitle" | "projectRef">[] };

export default function ClientDeliverablesPage() {
  const locale = useCurrentLocale();
  const tr = (key: string) => translate(locale, key);
  const [projects, setProjects] = useState<ClientProjectDeliverables[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
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
    loadData();
  }, []);

  const allDeliverables: ClientDeliverable[] = [];
  projects.forEach((p) => {
    (p.deliverables || []).forEach((d) => {
      allDeliverables.push({ ...d, projectTitle: p.title, projectRef: p.referenceNumber });
    });
  });

  return (
    <div className="space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div>
        <h2 className="text-2xl font-black text-[#0b2545]">{tr("deliverablesRepository")}</h2>
        <p className="text-xs text-slate-500 mt-1">
          {tr("deliverablesHelp")}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">{tr("loadingDeliverables")}</div>
        ) : allDeliverables.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FolderDown className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-medium text-slate-700">{tr("noDeliverables")}</p>
            <p className="text-xs text-slate-400">
              {tr("deliverablesWillAppear")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {allDeliverables.map((deliv) => (
              <div
                key={deliv.id}
                className="p-5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-blue-600 font-bold">{deliv.projectRef}</span>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                      v{deliv.version} • {deliv.fileType}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{deliv.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{deliv.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {tr("publishedDate")} {new Date(deliv.publishedAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                  </span>
                  {deliv.externalLink ? (
                    <a
                      href={deliv.externalLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      <span>{tr("openLiveReport")}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <button
                      onClick={() => alert(locale === "ar" ? `التسليم ${deliv.title} جاهز للتنزيل.` : `Deliverable ${deliv.title} is ready for client download.`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      <span>{tr("downloadReport")}</span>
                      <FolderDown className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
