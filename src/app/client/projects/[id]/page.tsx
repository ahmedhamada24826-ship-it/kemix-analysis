"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  FolderDown,
  MessageSquare,
  Send,
  ChevronLeft,
  ExternalLink,
} from "lucide-react";
import { useCurrentLocale } from "@/components/LocaleProvider";
import { translate } from "@/lib/i18n";

type ProjectMilestone = { id: string; title: string; status: string; description?: string | null; dueDate?: string | Date | null };
type ProjectDeliverable = { id: string; fileType?: string | null; version: number; fileSize?: string | null; title: string; description?: string | null; publishedAt: string | Date; externalLink?: string | null };
type ProjectMessage = { id: string; content: string; createdAt: string | Date; sender?: { role?: string; name?: string } };
type ClientProjectDetail = {
  id: string; referenceNumber: string; status: string; title: string; leadStaff?: { name: string } | null;
  milestones?: ProjectMilestone[]; deliverables?: ProjectDeliverable[];
  conversations?: { id: string; messages: ProjectMessage[] }[];
};

export default function ClientProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const locale = useCurrentLocale();
  const tr = (key: string) => translate(locale, key);
  const [project, setProject] = useState<ClientProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"milestones" | "deliverables" | "chat">("milestones");

  // Messaging state
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);

        if (data.project.conversations && data.project.conversations.length > 0) {
          const conv = data.project.conversations[0];
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
    fetchProject();
  }, [id]);

  // Polling for chat messages
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
    return <div className="p-12 text-center text-xs text-slate-400">{tr("clientProjectLoading")}</div>;
  }

  if (!project) {
    return (
      <div className="p-12 text-center space-y-4">
        <h3 className="text-base font-bold text-slate-800">{tr("clientProjectMissing")}</h3>
        <Link href="/client/projects" className="text-xs font-semibold text-blue-600 hover:underline">
          ← {tr("clientProjectBack")}
        </Link>
      </div>
    );
  }

  const milestones = project.milestones || [];
  const deliverables = project.deliverables || [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto" dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* Top Header */}
      <div>
        <Link
          href="/client/projects"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 mb-2 font-medium"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>{tr("clientProjectBack")}</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                {project.referenceNumber}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">
                {project.status}
              </span>
            </div>
            <h2 className="text-2xl font-black text-[#0b2545] mt-1">{project.title}</h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              {project.leadStaff?.name?.charAt(0) || "K"}
            </div>
            <div className="text-xs">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                {tr("projectLeadLabel")}
              </span>
              <span className="font-bold text-slate-800">
                {project.leadStaff?.name || (locale === "ar" ? "قائد التحليلات في KEMIX" : "KEMIX Analytics Lead")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-bold">
        <button
          onClick={() => setTab("milestones")}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            tab === "milestones"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{tr("milestonesTab")} ({milestones.length})</span>
        </button>

        <button
          onClick={() => setTab("deliverables")}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            tab === "deliverables"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FolderDown className="w-4 h-4" />
          <span>{tr("deliverablesTab")} ({deliverables.length})</span>
        </button>

        <button
          onClick={() => setTab("chat")}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            tab === "chat"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>{tr("projectChatTab")} ({messages.length})</span>
        </button>
      </div>

      {/* Tab: Milestones */}
      {tab === "milestones" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-[#0b2545] uppercase tracking-wider">
              {tr("executionMilestones")}
            </h3>

            {milestones.length === 0 ? (
              <p className="text-xs text-slate-400">{tr("milestonesDefined")}</p>
            ) : (
              <div className="space-y-4">
                {milestones.map((ms: ProjectMilestone, index: number) => {
                  const isDone = ms.status === "COMPLETED";
                  const isCurrent = ms.status === "IN_PROGRESS";

                  return (
                    <div
                      key={ms.id}
                      className={`p-4 rounded-xl border transition-all flex items-start gap-4 ${
                        isDone
                          ? "bg-emerald-50/50 border-emerald-200"
                          : isCurrent
                          ? "bg-blue-50/50 border-blue-200 shadow-sm"
                          : "bg-slate-50/50 border-slate-200"
                      }`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : isCurrent ? (
                          <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                        )}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">
                            {index + 1}. {ms.title}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isDone
                                ? "bg-emerald-100 text-emerald-800"
                                : isCurrent
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {({ COMPLETED: tr("completedLabel"), IN_PROGRESS: tr("inProgressLabel"), PENDING: tr("pendingLabel"), NOT_STARTED: tr("pendingLabel") } as Record<string, string>)[ms.status] || ms.status}
                          </span>
                        </div>
                        {ms.description && (
                          <p className="text-xs text-slate-600 leading-relaxed">{ms.description}</p>
                        )}
                        {ms.dueDate && (
                          <p className="text-[11px] text-slate-400 pt-1">
                            {tr("milestoneDue")} {new Date(ms.dueDate).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Deliverables */}
      {tab === "deliverables" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-[#0b2545] uppercase tracking-wider">
            {tr("approvedDeliverables")}
          </h3>

          {deliverables.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              {tr("deliverablesPublished")}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deliverables.map((deliv: ProjectDeliverable) => (
                <div
                  key={deliv.id}
                  className="p-5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                        {deliv.fileType || tr("reportLabel")} • v{deliv.version}
                      </span>
                      <span className="text-[10px] text-slate-400">{deliv.fileSize || tr("cloudLink")}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{deliv.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{deliv.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {tr("publishedLabel")} {new Date(deliv.publishedAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                    </span>
                    {deliv.externalLink ? (
                      <a
                        href={deliv.externalLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                      >
                        <span>{tr("openDashboard")}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <button
                        onClick={() => alert(locale === "ar" ? `التسليم ${deliv.title} جاهز للتنزيل.` : `Deliverable ${deliv.title} is ready for client download.`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                      >
                        <span>{tr("downloadLabel")}</span>
                        <FolderDown className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Project Chat */}
      {tab === "chat" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[550px] overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <span className="text-xs font-bold text-[#0b2545]">{tr("deliveryChat")}</span>
            <span className="text-[10px] text-slate-400">{tr("privateIsolated")}</span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12">
                {tr("noProjectChat")}
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
                      className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={tr("askProjectLead")}
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
      )}
    </div>
  );
}
