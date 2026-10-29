"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Briefcase,
  FileCheck,
  Headphones,
  ArrowRight,
  AlertCircle,
  Plus,
} from "lucide-react";
import { useCurrentLocale } from "@/components/LocaleProvider";
import { translate } from "@/lib/i18n";

type DashboardRequest = { id: string; referenceNumber: string; serviceType: string; status: string; createdAt: string | Date; assignedStaff?: { name: string } | null };
type DashboardProject = { id: string; title: string; referenceNumber: string; status: string; description?: string | null; leadStaff?: { name: string } | null };
type DashboardProposal = { status: string };
type DashboardTicket = { status: string };

export default function ClientDashboardPage() {
  const locale = useCurrentLocale();
  const tr = (key: string) => translate(locale, key);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<DashboardRequest[]>([]);
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [proposals, setProposals] = useState<DashboardProposal[]>([]);
  const [tickets, setTickets] = useState<DashboardTicket[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [reqRes, prjRes, propRes, tktRes] = await Promise.all([
          fetch("/api/requests"),
          fetch("/api/projects"),
          fetch("/api/proposals"),
          fetch("/api/support"),
        ]);

        if (reqRes.ok) {
          const d = await reqRes.json();
          setRequests(d.requests || []);
        }
        if (prjRes.ok) {
          const d = await prjRes.json();
          setProjects(d.projects || []);
        }
        if (propRes.ok) {
          const d = await propRes.json();
          setProposals(d.proposals || []);
        }
        if (tktRes.ok) {
          const d = await tktRes.json();
          setTickets(d.tickets || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const pendingProposals = proposals.filter((p) => p.status === "SENT");
  const activeProjects = projects.filter((p) => p.status === "ACTIVE" || p.status === "PLANNING");
  const openTickets = tickets.filter((t) => t.status !== "RESOLVED" && t.status !== "CLOSED");

  const getStatusBadge = (status: string) => {
    const formatted = status.replace(/_/g, " ");
    switch (status) {
      case "NEW_REQUEST":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">{tr("newRequest")}</span>;
      case "UNDER_REVIEW":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">{tr("underReview")}</span>;
      case "PROPOSAL_SENT":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">{tr("proposalSent")}</span>;
      case "APPROVED":
      case "ACTIVE":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{locale === "ar" ? "نشط / معتمد" : "Active / Approved"}</span>;
      case "DELIVERED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">{tr("delivered")}</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">{formatted}</span>;
    }
  };

  return (
    <div className="space-y-8" dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* Header and Quick CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#0b2545]">{tr("clientDashboard")}</h2>
          <p className="text-xs text-slate-500 mt-1">
            {tr("clientDashboardHelp")}
          </p>
        </div>
        <Link
          href="/request-service"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{tr("newServiceRequest")}</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">{tr("requests")}</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-[#0b2545]">{requests.length}</p>
          <span className="text-[11px] text-slate-400">{tr("submittedInquiries")}</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">{tr("clientActiveProjects")}</span>
            <Briefcase className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-[#0b2545]">{activeProjects.length}</p>
          <span className="text-[11px] text-emerald-600 font-medium">{tr("executionTracking")}</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">{tr("pendingProposals")}</span>
            <FileCheck className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-black text-orange-600">{pendingProposals.length}</p>
          <span className="text-[11px] text-slate-400">{tr("awaitingYourApproval")}</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">{tr("openSupportTickets")}</span>
            <Headphones className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-[#0b2545]">{openTickets.length}</p>
          <span className="text-[11px] text-slate-400">{tr("technicalInquiries")}</span>
        </div>
      </div>

      {/* Pending Proposals Banner if any */}
      {pendingProposals.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-orange-950">
                {tr("proposalAwaitingMessage").replace("{count}", String(pendingProposals.length))}
              </h4>
              <p className="text-xs text-orange-800 mt-0.5">
                {tr("reviewScope")}
              </p>
            </div>
          </div>
          <Link
            href="/client/proposals"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 shadow-sm transition-colors whitespace-nowrap"
          >
            {tr("reviewProposals")}
          </Link>
        </div>
      )}

      {/* Active Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0b2545]">{tr("recentRequests")}</h3>
          <Link
            href="/client/requests"
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>{tr("viewAll")}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">{tr("loadingRequests")}</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-medium text-slate-700">{tr("noRequestsSubmitted")}</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {tr("readyToAnalyze")}
            </p>
            <Link
              href="/request-service"
              className="inline-block mt-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg"
            >
              {tr("submitServiceRequest")}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">{tr("reference")}</th>
                  <th className="px-5 py-3">{tr("service")}</th>
                  <th className="px-5 py-3">{tr("status")}</th>
                  <th className="px-5 py-3">{tr("assignedLead")}</th>
                  <th className="px-5 py-3">{tr("submitted")}</th>
                  <th className="px-5 py-3 text-right">{tr("action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.slice(0, 5).map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-blue-600">
                      {req.referenceNumber}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {req.serviceType}
                    </td>
                    <td className="px-5 py-4">{getStatusBadge(req.status)}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {req.assignedStaff?.name || (
                        <span className="text-slate-400 italic">{tr("pendingAssignment")}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(req.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/client/requests/${req.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors"
                      >
                        {tr("openDetails")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Projects and Deliverables Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Projects Widget */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0b2545]">{tr("clientActiveProjects")}</h3>
            <Link href="/client/projects" className="text-xs font-semibold text-blue-600 hover:underline">
              {tr("viewAllProjects")}
            </Link>
          </div>

          {activeProjects.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">{tr("noActiveProjectsCurrently")}</p>
          ) : (
            <div className="space-y-3">
              {activeProjects.map((p) => (
                <div key={p.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{p.title}</span>
                    <span className="text-[10px] font-mono font-semibold text-blue-600">{p.referenceNumber}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">{p.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>{tr("clientProjectLead")}: {p.leadStaff?.name || tr("kemixTeam")}</span>
                    <Link href={`/client/projects/${p.id}`} className="text-blue-600 font-semibold hover:underline">
                      {tr("trackMilestones")}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Support & Assistance Widget */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0b2545]">{tr("supportAdvisory")}</h3>
            <Link href="/client/support" className="text-xs font-semibold text-blue-600 hover:underline">
              {tr("ticketCenter")}
            </Link>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {tr("supportDashboardHelp")}
          </p>
          <div className="pt-2">
            <Link
              href="/client/support"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
            >
              <Headphones className="w-4 h-4" />
              <span>{tr("openSupport")}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
