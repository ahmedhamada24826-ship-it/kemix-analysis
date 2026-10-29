"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Send, ChevronLeft } from "lucide-react";
import { useCurrentLocale } from "@/components/LocaleProvider";
import { translate } from "@/lib/i18n";

type TicketReply = { id: string; content: string; createdAt: string | Date; sender?: { role?: string; name?: string } };
type SupportTicket = { id: string; ticketNumber: string; category: string; subject: string; status: string; priority: string; replies?: TicketReply[] };

export default function ClientSupportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const locale = useCurrentLocale();
  const tr = (key: string) => translate(locale, key);
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/support/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTicket(data.ticket);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/support/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent }),
      });

      if (res.ok) {
        setReplyContent("");
        fetchTicket();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">{tr("loadingTicket")}</div>;
  }

  if (!ticket) {
    return (
      <div className="p-12 text-center space-y-4">
        <h3 className="text-base font-bold text-slate-800">{tr("ticketNotFound")}</h3>
        <Link href="/client/support" className="text-xs font-semibold text-blue-600 hover:underline">
          ← {tr("backToSupport")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <Link
        href="/client/support"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 mb-2 font-medium"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        <span>{tr("backToSupport")}</span>
      </Link>

      {/* Ticket Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              {ticket.ticketNumber}
            </span>
            <span className="text-xs text-slate-400">• {ticket.category}</span>
          </div>
          <h2 className="text-xl font-bold text-[#0b2545]">{ticket.subject}</h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
            {({ OPEN: locale === "ar" ? "مفتوحة" : "Open", IN_PROGRESS: locale === "ar" ? "قيد المعالجة" : "In Progress", WAITING_CLIENT: locale === "ar" ? "بانتظار العميل" : "Waiting for Client", RESOLVED: locale === "ar" ? "تم الحل" : "Resolved", CLOSED: locale === "ar" ? "مغلقة" : "Closed" } as Record<string, string>)[ticket.status] || ticket.status.replace(/_/g, " ")}
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
            {({ LOW: tr("low"), MEDIUM: tr("medium"), HIGH: tr("high"), URGENT: tr("urgent") } as Record<string, string>)[ticket.priority] || ticket.priority} {tr("priorityLabel")}
          </span>
        </div>
      </div>

      {/* Replies Thread */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {tr("ticketHistory")}
        </h3>

        <div className="space-y-4">
          {ticket.replies?.map((r) => {
            const isMe = r.sender?.role === "CLIENT";
            return (
              <div
                key={r.id}
                className={`p-4 rounded-xl border text-xs leading-relaxed ${
                  isMe
                    ? "bg-slate-50 border-slate-200 ml-0 sm:ml-8"
                    : "bg-blue-50/60 border-blue-200 mr-0 sm:mr-8"
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 text-slate-500">
                  <span className="font-bold text-slate-900">
                    {r.sender?.name} {isMe ? `(${tr("you")})` : `(${tr("supportAgentLabel")})`}
                  </span>
                  <span>{new Date(r.createdAt).toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}</span>
                </div>
                <p className="text-slate-700 whitespace-pre-wrap">{r.content}</p>
              </div>
            );
          })}
        </div>

        {/* Reply Form */}
        <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-200 space-y-3">
          <label className="block text-xs font-semibold text-slate-700">
            {tr("replySupport")}
          </label>
          <textarea
            required
            rows={3}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={tr("typeResponse")}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={sending || !replyContent.trim()}
            className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-1.5 disabled:opacity-40"
          >
            <span>{sending ? tr("sending") : tr("postReply")}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
