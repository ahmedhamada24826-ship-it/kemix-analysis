"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Briefcase,
  ChevronLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FolderDown,
  Plus,
  Send,
  MessageSquare,
  ExternalLink,
  ShieldCheck,
  Save,
} from "lucide-react";
import { translate } from "@/lib/i18n";
import { useCurrentLocale } from "@/components/LocaleProvider";

export default function AdminProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = useCurrentLocale();
  const tr = (en: string, ar: string) => locale === "ar" ? ar : en;
  const { id } = use(params);
  const [project, setProject] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Status & Leads Controls
  const [status, setStatus] = useState("");
  const [leadStaffId, setLeadStaffId] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [qaOutcome, setQaOutcome] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // New Milestone Form
  const [newMsTitle, setNewMsTitle] = useState("");
  const [newMsDesc, setNewMsDesc] = useState("");
  const [newMsDate, setNewMsDate] = useState("");
  const [addingMs, setAddingMs] = useState(false);

  // New Deliverable Form
  const [delivTitle, setDelivTitle] = useState("");
  const [delivDesc, setDelivDesc] = useState("");
  const [delivLink, setDelivLink] = useState("");
  const [delivType, setDelivType] = useState("PowerBI");
  const [delivVersion, setDelivVersion] = useState("1.0");
  const [addingDeliv, setAddingDeliv] = useState(false);

  // Chat
  const [messages, setMessages] = useState<any[]>([]);
  const [canPostInternal, setCanPostInternal] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [msgText, setMsgText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);

  const fetchProjectDetails = async () => {
    try {
      const [projRes, staffRes] = await Promise.all([
        fetch(`/api/projects/${id}`),
        fetch("/api/admin/staff"),
      ]);

      if (projRes.ok) {
        const d = await projRes.json();
        const p = d.project;
        setCanPostInternal(Boolean(d.canPostInternal));
        setProject(p);
        setStatus(p.status);
        setLeadStaffId(p.leadStaffId || "");
        setTargetDate(
          p.targetDeliveryDate ? new Date(p.targetDeliveryDate).toISOString().slice(0, 10) : ""
        );
        setQaOutcome(p.qaOutcome || "");

        if (p.conversations && p.conversations.length > 0) {
          setConversationId(p.conversations[0].id);
          setMessages(p.conversations[0].messages || []);
        }
      }

      if (staffRes.ok) {
        const s = await staffRes.json();
        setStaffList(s.staff || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
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

  const handleSaveControls = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          leadStaffId,
          targetDeliveryDate: targetDate ? new Date(targetDate).toISOString() : null,
          qaOutcome,
        }),
      });

      if (res.ok) {
        setSaveMsg(tr("Project controls updated successfully.", "تم تحديث بيانات المشروع."));
        fetchProjectDetails();
      }
    } catch {
      setSaveMsg(tr("Failed to save changes.", "تعذر حفظ التغييرات."));
    } finally {
      setSaving(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim() || !conversationId) return;

    setSendingMsg(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: msgText,
          isInternalStaffNote: isInternal,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setMsgText("");
        setIsInternal(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSendingMsg(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">{tr("Loading project console…", "جارٍ تحميل لوحة المشروع…")}</div>;
  }

  if (!project) {
    return (
      <div className="p-12 text-center space-y-4">
        <h3 className="text-base font-bold text-slate-800">{tr("Project not found", "لم يتم العثور على المشروع")}</h3>
        <Link href="/admin/projects" className="text-xs font-semibold text-blue-600 hover:underline">
          ← {tr("Return to projects list", "العودة إلى قائمة المشاريع")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8" dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* Top Header */}
      <div>
        <Link
          href="/admin/projects"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 mb-2 font-medium"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>{tr("Back to projects list", "العودة إلى قائمة المشاريع")}</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                {project.referenceNumber}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                {project.status}
              </span>
            </div>
            <h2 className="text-2xl font-black text-[#0b2545] mt-1">{project.title}</h2>
            <p className="text-xs text-slate-500">
              {tr("Client", "العميل")}: <strong>{project.client?.name}</strong> ({project.client?.companyName || tr("Individual", "فرد")})
            </p>
          </div>
        </div>
      </div>

      {saveMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveMsg}</span>
        </div>
      )}

      {/* Grid: Left Column Management, Right Column Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* Operations & Delivery Controls */}
          <form
            onSubmit={handleSaveControls}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-[#0b2545] uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span>{tr("Project Status & Delivery Schedule", "حالة المشروع وجدول التسليم")}</span>
              </h3>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[#0b2545] hover:bg-blue-900 transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? tr("Saving…", "جارٍ الحفظ…") : tr("Update Project", "تحديث المشروع")}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {tr("Delivery Status", "حالة التنفيذ")}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-[#0b2545] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="PLANNING">{tr("PLANNING", "تخطيط")}</option>
                  <option value="ACTIVE">{tr("ACTIVE", "نشط")}</option>
                  <option value="IN_REVIEW">{tr("IN REVIEW", "قيد المراجعة")}</option>
                  <option value="DELIVERED">{tr("DELIVERED", "تم التسليم")}</option>
                  <option value="CLOSED">{tr("CLOSED", "مغلق")}</option>
                  <option value="ON_HOLD">{tr("ON HOLD", "معلّق")}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {tr("Assigned Project Lead", "قائد المشروع المعيّن")}
                </label>
                <select
                  value={leadStaffId}
                  onChange={(e) => setLeadStaffId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                >
                  <option value="">-- {tr("Unassigned", "غير معيّن")} --</option>
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({tr(({ SUPER_ADMIN: "Super Admin", OPERATIONS_MANAGER: "Operations Manager", PROJECT_LEAD: "Project Lead", ANALYST: "Analyst", TRAINEE: "Trainee", SUPPORT_AGENT: "Support Agent" } as Record<string, string>)[st.role] || st.role, ({ SUPER_ADMIN: "مدير النظام", OPERATIONS_MANAGER: "مدير العمليات", PROJECT_LEAD: "قائد قسم", ANALYST: "محلل بيانات", TRAINEE: "متدرب", SUPPORT_AGENT: "خدمة العملاء" } as Record<string, string>)[st.role] || st.role)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {tr("Target Handover Date", "موعد التسليم المستهدف")}
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {tr("Quality Assurance (QA) Signoff & Outcome", "اعتماد ضمان الجودة ونتيجته")}
              </label>
              <input
                type="text"
                value={qaOutcome}
                onChange={(e) => setQaOutcome(e.target.value)}
                placeholder={tr("e.g. Data model validated against staging database; DAX refresh verified; RLS tested.", "مثال: تم التحقق من نموذج البيانات والتحديث واختبار صلاحيات الصفوف.")}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </form>

          {/* Milestones Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#0b2545] uppercase tracking-wider">
              {tr("Project Milestones", "مراحل المشروع")}
            </h3>
            <div className="space-y-3">
              {(project.milestones || []).map((ms: any, i: number) => (
                <div
                  key={ms.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-4 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 block">
                      {i + 1}. {ms.title}
                    </span>
                    <p className="text-slate-600 text-[11px]">{ms.description}</p>
                    {ms.dueDate && (
                      <span className="text-[10px] text-slate-400">
                        {tr("Due:", "موعد التسليم:")} {new Date(ms.dueDate).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      ms.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-800"
                        : ms.status === "IN_PROGRESS"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {({ COMPLETED: tr("Completed", "مكتملة"), IN_PROGRESS: tr("In Progress", "قيد التنفيذ"), TODO: tr("Not Started", "لم تبدأ") } as Record<string, string>)[ms.status] || ms.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Deliverables Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#0b2545] uppercase tracking-wider">
              {tr("Published Deliverables", "التسليمات المنشورة")}
            </h3>
            {(project.deliverables || []).map((d: any) => (
              <div
                key={d.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 block">{d.title}</span>
                  <span className="text-slate-500 text-[11px]">
                    v{d.version} • {d.fileType} • {d.fileSize || tr("Link", "رابط")}
                  </span>
                </div>
                {d.externalLink && (
                  <a
                    href={d.externalLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>{tr("View Link", "عرض الرابط")}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Project Delivery Chat & Internal Notes */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <span className="text-xs font-bold text-[#0b2545]">{translate(locale, "projectDiscussion")}</span>
            <span className="text-[10px] text-slate-400">{translate(locale, "staffConsole")}</span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12">{translate(locale, "noProjectMessages")}</p>
            ) : (
              messages.map((msg) => {
                const isInternal = msg.isInternalStaffNote;
                const isClient = msg.sender?.role === "CLIENT";

                return (
                  <div
                    key={msg.id}
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed space-y-1 ${
                      isInternal
                        ? "bg-amber-50 border border-amber-200 text-amber-950"
                        : isClient
                        ? "bg-slate-100 border border-slate-200 text-slate-800"
                        : "bg-blue-50 border border-blue-200 text-blue-950 ml-4"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span>{msg.sender?.name}</span>
                        {isInternal && (
                          <span className="bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded text-[9px] uppercase">
                            {translate(locale, "staffNote")}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400">
                        {new Date(msg.createdAt).toLocaleTimeString(locale === "ar" ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white space-y-2">
            {canPostInternal && <div className="flex items-center gap-2 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer text-amber-800 font-semibold select-none">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>{translate(locale, "staffNote")}</span>
              </label>
            </div>}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
              placeholder={isInternal ? translate(locale, "coordinationNote") : translate(locale, "messageClient")}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={sendingMsg || !msgText.trim()}
                className={`p-2.5 rounded-xl text-white disabled:opacity-40 transition-colors ${
                  isInternal ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
