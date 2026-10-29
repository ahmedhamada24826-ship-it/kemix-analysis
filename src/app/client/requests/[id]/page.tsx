"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Calendar,
  Send,
  MessageSquare,
  ChevronLeft,
} from "lucide-react";
import { useCurrentLocale } from "@/components/LocaleProvider";
import { translate } from "@/lib/i18n";

type ProposalSummary = { id: string; referenceNumber: string; title: string; price: number; timelineDays: number; status: string };
type RequestMessage = { id: string; content: string; createdAt: string | Date; sender?: { role?: string; name?: string } };
type RequestDetail = {
  id: string; referenceNumber: string; status: string; serviceType: string; problemDescription: string;
  businessObjective: string; desiredOutcome: string; dataSourceType: string; approxDataVolume?: string | null;
  preferredDeadline?: string | null; budgetRange?: string | null; hasRestrictions: boolean;
  preferredContactMethod: string; consultationDate?: string | Date | null;
  assignedStaff?: { name: string } | null; proposals?: ProposalSummary[];
  conversations?: { id: string; messages: RequestMessage[] }[];
};

export default function ClientRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const locale = useCurrentLocale();
  const t = (key: string) => translate(locale, key);
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<RequestMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const fetchRequestDetails = async () => {
    try {
      const res = await fetch(`/api/requests/${id}`);
      if (res.ok) {
        const data = await res.json();
        setRequest(data.request);

        if (data.request.conversations && data.request.conversations.length > 0) {
          const conv = data.request.conversations[0];
          setConversationId(conv.id);
          setMessages(conv.messages || []);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  // Polling for new messages every 5 seconds
  useEffect(() => {
    if (!conversationId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (e) {
        console.error(e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [conversationId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId) return;

    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage,
          isInternalStaffNote: false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">{t("loadingRequestDetails")}</div>;
  }

  if (!request) {
    return (
      <div className="p-12 text-center space-y-4">
        <h3 className="text-base font-bold text-slate-800">{t("requestNotFound")}</h3>
        <Link href="/client/requests" className="text-xs font-semibold text-blue-600 hover:underline">
          ← {t("backToRequests")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto" dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <Link
            href="/client/requests"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 mb-2 font-medium"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>{t("backToAllRequests")}</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-black text-[#0b2545] font-mono">
              {request.referenceNumber}
            </h2>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {({ NEW_REQUEST: t("newRequest"), UNDER_REVIEW: t("underReview"), CALL_SCHEDULED: t("callScheduled"), PROPOSAL_SENT: t("proposalSent"), APPROVED: t("approved"), IN_PROGRESS: locale === "ar" ? "قيد التنفيذ" : "In Progress", DELIVERED: t("delivered") } as Record<string, string>)[request.status] || request.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{request.serviceType}</p>
        </div>

        {/* Assigned Staff badge */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 shadow-sm">
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            {request.assignedStaff?.name?.charAt(0) || "K"}
          </div>
          <div className="text-xs">
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
              {t("assignedProjectLead")}
            </span>
            <span className="font-bold text-slate-800">
              {request.assignedStaff?.name || t("operationsTeam")}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Left column details, Right column Messaging Thread */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Scope & Proposal details */}
        <div className="lg:col-span-7 space-y-6">
          {/* Business Problem Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#0b2545] uppercase tracking-wider">
              {t("problemOutcomes")}
            </h3>
            <div className="space-y-3 text-xs leading-relaxed text-slate-700">
              <div>
                <strong className="text-slate-900 block mb-0.5">{t("problemDescription")}:</strong>
                <p className="bg-slate-50 p-3 rounded-lg border border-slate-100">{request.problemDescription}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <strong className="text-slate-900 block mb-0.5">{t("businessObjective")}:</strong>
                  <p className="bg-slate-50 p-3 rounded-lg border border-slate-100">{request.businessObjective}</p>
                </div>
                <div>
                  <strong className="text-slate-900 block mb-0.5">{t("desiredOutcome")}:</strong>
                  <p className="bg-slate-50 p-3 rounded-lg border border-slate-100">{request.desiredOutcome}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Data Readiness Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#0b2545] uppercase tracking-wider">
              {t("dataReadiness")}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">{t("sourceType")}</span>
                <span className="font-semibold text-slate-800 capitalize">{request.dataSourceType}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">{t("estimatedVolume")}</span>
                <span className="font-semibold text-slate-800">{request.approxDataVolume || t("notSpecified")}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">{locale === "ar" ? "الموعد المفضل" : "Preferred Deadline"}</span>
                <span className="font-semibold text-slate-800">{request.preferredDeadline || t("flexible")}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">{t("budgetRange")}</span>
                <span className="font-semibold text-slate-800">{request.budgetRange || t("negotiable")}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">{t("confidentialityNda")}</span>
                <span className="font-semibold text-emerald-700">
                  {request.hasRestrictions ? t("strictNda") : t("standardIsolation")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">{t("contactMethod")}</span>
                <span className="font-semibold text-slate-800">{request.preferredContactMethod}</span>
              </div>
            </div>

            {request.consultationDate && (
              <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-3 text-xs text-blue-900">
                <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <span className="font-bold block">{t("consultationScheduled")}</span>
                  <span>{new Date(request.consultationDate).toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}</span>
                </div>
              </div>
            )}
          </div>

          {/* Linked Proposals if any */}
          {request.proposals && request.proposals.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-[#0b2545] uppercase tracking-wider">
                {t("proposalsForRequest")}
              </h3>
              <div className="space-y-3">
                {request.proposals.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <span className="font-mono text-xs font-bold text-blue-600">{prop.referenceNumber}</span>
                      <h4 className="text-sm font-bold text-slate-900">{prop.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {t("fixedScope")}: <strong>${prop.price} USD</strong> • {prop.timelineDays} {t("daysDelivery")}
                      </p>
                    </div>
                    <Link
                      href={`/client/proposals/${prop.id}`}
                      className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      {prop.status === "ACCEPTED" ? t("viewApprovedTerms") : t("reviewRespond")}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Private Real-Time Messaging Thread */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
          {/* Thread Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-[#0b2545]">{t("privateProjectChat")}</h3>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {t("kemixConnected")}
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12">
                {t("noMessages")}
              </p>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender?.role === "CLIENT";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                      <span className="font-semibold text-slate-700">{msg.sender?.name}</span>
                      <span>•</span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString(locale === "ar" ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/80"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t("typeTeamMessage")}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
