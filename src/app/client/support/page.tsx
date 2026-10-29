"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Headphones, Plus } from "lucide-react";
import { useCurrentLocale } from "@/components/LocaleProvider";
import { translate } from "@/lib/i18n";

type SupportTicketSummary = {
  id: string; ticketNumber: string; subject: string; category: string;
  priority: string; status: string; updatedAt: string | Date;
};

export default function ClientSupportPage() {
  const locale = useCurrentLocale();
  const tr = (key: string) => translate(locale, key);
  const [tickets, setTickets] = useState<SupportTicketSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    category: "Deliverable Access",
    priority: "MEDIUM",
    message: "",
  });
  const [creating, setCreating] = useState(false);

  const loadTickets = async () => {
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
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setForm({ subject: "", category: "Deliverable Access", priority: "MEDIUM", message: "" });
        loadTickets();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#0b2545]">{tr("supportCenter")}</h2>
          <p className="text-xs text-slate-500 mt-1">
            {tr("supportHelp")}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{tr("openSupportTicket")}</span>
        </button>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">{tr("loadingTickets")}</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Headphones className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-medium text-slate-700">{tr("noTickets")}</p>
            <p className="text-xs text-slate-400">
              {tr("createTicketHelp")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">{tr("ticketNumber")}</th>
                  <th className="px-5 py-3">{tr("subject")}</th>
                  <th className="px-5 py-3">{tr("category")}</th>
                  <th className="px-5 py-3">{tr("priority")}</th>
                  <th className="px-5 py-3">{tr("status")}</th>
                  <th className="px-5 py-3">{tr("lastUpdated")}</th>
                  <th className="px-5 py-3 text-right">{tr("action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-blue-600">{t.ticketNumber}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900 max-w-sm truncate">
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
                        {({ LOW: tr("low"), MEDIUM: tr("medium"), HIGH: tr("high"), URGENT: tr("urgent") } as Record<string, string>)[t.priority] || t.priority}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">
                        {({ OPEN: locale === "ar" ? "مفتوحة" : "Open", IN_PROGRESS: locale === "ar" ? "قيد المعالجة" : "In Progress", WAITING_CLIENT: locale === "ar" ? "بانتظار العميل" : "Waiting for Client", RESOLVED: locale === "ar" ? "تم الحل" : "Resolved", CLOSED: locale === "ar" ? "مغلقة" : "Closed" } as Record<string, string>)[t.status] || t.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(t.updatedAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/client/support/${t.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors"
                      >
                        {tr("viewThread")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0b2545]">{tr("openTicket")}</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{tr("subject")} *</label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder={tr("briefInquiry")}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {tr("category")} *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Deliverable Access">{tr("deliverableAccess")}</option>
                    <option value="Technical Issue">{tr("technicalIssue")}</option>
                    <option value="Scope Revision">{tr("scopeRevision")}</option>
                    <option value="Billing & Invoicing">{tr("billing")}</option>
                    <option value="General">{tr("generalInquiry")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {tr("priority")}
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="LOW">{tr("low")}</option>
                    <option value="MEDIUM">{tr("medium")}</option>
                    <option value="HIGH">{tr("high")}</option>
                    <option value="URGENT">{tr("urgent")}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{tr("message")} *</label>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder={tr("provideDetails")}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {tr("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow"
                >
                  {creating ? tr("submitting") : tr("submitTicket")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
