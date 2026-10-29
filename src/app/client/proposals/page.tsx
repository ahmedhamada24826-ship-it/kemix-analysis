"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileCheck, ArrowRight } from "lucide-react";
import { useCurrentLocale } from "@/components/LocaleProvider";
import { translate } from "@/lib/i18n";

type ClientProposal = { id: string; referenceNumber: string; title: string; price: number; currency: string; timelineDays: number; status: string };

export default function ClientProposalsPage() {
  const locale = useCurrentLocale();
  const tr = (key: string) => translate(locale, key);
  const [proposals, setProposals] = useState<ClientProposal[]>([]);
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
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">{tr("acceptedProposal")}</span>;
      case "SENT":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">{tr("awaitingApproval")}</span>;
      case "REJECTED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">{tr("declinedProposal")}</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div>
        <h2 className="text-2xl font-black text-[#0b2545]">{tr("proposalAgreements")}</h2>
        <p className="text-xs text-slate-500 mt-1">
          {tr("proposalHelp")}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">{tr("loadingProposals")}</div>
        ) : proposals.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-medium text-slate-700">{tr("noProposals")}</p>
            <p className="text-xs text-slate-400">
              {tr("proposalWillAppear")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">{tr("proposalNumber")}</th>
                  <th className="px-5 py-3">{tr("projectTitle")}</th>
                  <th className="px-5 py-3">{tr("fixedPrice")}</th>
                  <th className="px-5 py-3">{tr("deliveryTimeline")}</th>
                  <th className="px-5 py-3">{tr("status")}</th>
                  <th className="px-5 py-3 text-right">{tr("action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {proposals.map((prop) => (
                  <tr key={prop.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-blue-600">
                      {prop.referenceNumber}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-900 max-w-sm truncate">
                      {prop.title}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      ${prop.price.toLocaleString()} {prop.currency}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {prop.timelineDays} {tr("days")}
                    </td>
                    <td className="px-5 py-4">{getStatusBadge(prop.status)}</td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/client/proposals/${prop.id}`}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
                      >
                        <span>{prop.status === "SENT" ? tr("reviewSign") : tr("viewTerms")}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
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
