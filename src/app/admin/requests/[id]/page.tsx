"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Inbox,
  User,
  Building,
  Phone,
  Mail,
  Calendar,
  Clock,
  ShieldCheck,
  Send,
  MessageSquare,
  Lock,
  ChevronLeft,
  CheckCircle2,
  FileCheck,
  Briefcase,
  AlertCircle,
  Save,
} from "lucide-react";
import { useCurrentLocale } from "@/components/LocaleProvider";

export default function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const locale = useCurrentLocale();
  const tr = (en: string, ar: string) => locale === "ar" ? ar : en;

  const [request, setRequest] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Operations controls state
  const [status, setStatus] = useState("");
  const [assignedStaffId, setAssignedStaffId] = useState("");
  const [consultationDate, setConsultationDate] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");

  // Messaging state
  const [messages, setMessages] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [msgText, setMsgText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);

  const fetchDetails = async () => {
    try {
      const [reqRes, staffRes] = await Promise.all([
        fetch(`/api/requests/${id}`),
        fetch("/api/admin/staff"),
      ]);

      if (reqRes.ok) {
        const d = await reqRes.json();
        const r = d.request;
        setRequest(r);
        setStatus(r.status);
        setAssignedStaffId(r.assignedStaffId || "");
        setConsultationDate(
          r.consultationDate ? new Date(r.consultationDate).toISOString().slice(0, 16) : ""
        );
        setFollowUpDate(
          r.followUpDate ? new Date(r.followUpDate).toISOString().slice(0, 10) : ""
        );
        setInternalNotes(r.internalNotes || "");

        if (r.conversations && r.conversations.length > 0) {
          setConversationId(r.conversations[0].id);
          setMessages(r.conversations[0].messages || []);
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
    fetchDetails();
  }, [id]);

  // Live polling for chat messages every 5s
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
    setUpdateMsg("");

    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          assignedStaffId,
          consultationDate: consultationDate ? new Date(consultationDate).toISOString() : null,
          followUpDate: followUpDate ? new Date(followUpDate).toISOString() : null,
          internalNotes,
        }),
      });

      if (res.ok) {
        setUpdateMsg(tr("Request parameters successfully updated.", "تم تحديث بيانات الطلب."));
        fetchDetails();
      }
    } catch {
      setUpdateMsg(tr("Failed to update request.", "تعذر تحديث الطلب."));
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
          isInternalStaffNote: isInternalNote,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setMsgText("");
        setIsInternalNote(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSendingMsg(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">{tr("Loading request management…", "جارٍ تحميل إدارة الطلب…")}</div>;
  }

  if (!request) {
    return (
      <div className="p-12 text-center space-y-4">
        <h3 className="text-base font-bold text-slate-800">{tr("Request not found", "لم يتم العثور على الطلب")}</h3>
        <Link href="/admin/requests" className="text-xs font-semibold text-blue-600 hover:underline">
          ← {tr("Return to requests queue", "العودة إلى قائمة الطلبات")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8" dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* Top Header */}
      <div>
        <Link
          href="/admin/requests"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 mb-2 font-medium"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>{tr("Back to requests queue", "العودة إلى قائمة الطلبات")}</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                {request.referenceNumber}
              </span>
              <span className="text-xs text-slate-500">{request.serviceType}</span>
            </div>
            <h2 className="text-2xl font-black text-[#0b2545] mt-1">
              {tr("Request Details & Operations", "تفاصيل الطلب وإدارته")}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/admin/proposals/new?requestId=${request.id}&clientId=${request.clientId}&title=${encodeURIComponent(request.serviceType)}`}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow transition-colors flex items-center gap-1.5"
            >
              <FileCheck className="w-4 h-4" />
              <span>{tr("Draft Proposal", "إعداد عرض")}</span>
            </Link>
          </div>
        </div>
      </div>

      {updateMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{updateMsg}</span>
        </div>
      )}

      {/* Grid: Left Column Details & Controls, Right Column Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* Operations Control Box */}
          <form
            onSubmit={handleSaveControls}
            className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm space-y-5 bg-gradient-to-b from-white to-blue-50/20"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-[#0b2545] uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>{tr("Operational Status & Lead Assignment", "حالة الطلب وتعيين المسؤول")}</span>
              </h3>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[#0b2545] hover:bg-blue-900 transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? tr("Saving…", "جارٍ الحفظ…") : tr("Save Changes", "حفظ التغييرات")}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {tr("Lifecycle Status", "حالة الطلب")}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-[#0b2545] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="NEW_REQUEST">{tr("NEW REQUEST", "طلب جديد")}</option>
                  <option value="UNDER_REVIEW">{tr("UNDER REVIEW", "قيد المراجعة")}</option>
                  <option value="CALL_SCHEDULED">{tr("CALL SCHEDULED", "تم تحديد موعد اتصال")}</option>
                  <option value="QUALIFIED">{tr("QUALIFIED", "مؤهل")}</option>
                  <option value="PROPOSAL_SENT">{tr("PROPOSAL SENT", "تم إرسال العرض")}</option>
                  <option value="APPROVED">{tr("APPROVED", "تمت الموافقة")}</option>
                  <option value="AWAITING_DATA">{tr("AWAITING DATA", "بانتظار البيانات")}</option>
                  <option value="IN_PROGRESS">{tr("IN PROGRESS", "قيد التنفيذ")}</option>
                  <option value="QA_REVIEW">{tr("QA REVIEW", "مراجعة الجودة")}</option>
                  <option value="DELIVERED">{tr("DELIVERED", "تم التسليم")}</option>
                  <option value="CLOSED">{tr("CLOSED", "مغلق")}</option>
                  <option value="ON_HOLD">{tr("ON HOLD", "معلّق")}</option>
                  <option value="REJECTED">{tr("REJECTED", "مرفوض")}</option>
                  <option value="CANCELLED">{tr("CANCELLED", "ملغى")}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {tr("Assigned Staff Lead", "المسؤول المعيّن")}
                </label>
                <select
                  value={assignedStaffId}
                  onChange={(e) => setAssignedStaffId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                >
                  <option value="">-- {tr("Unassigned", "غير معيّن")} --</option>
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.role.replace(/_/g, " ")})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {tr("Schedule Consultation Call", "تحديد موعد الاستشارة")}
                </label>
                <input
                  type="datetime-local"
                  value={consultationDate}
                  onChange={(e) => setConsultationDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {tr("Next Follow-Up Date", "موعد المتابعة التالي")}
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            {/* Internal Staff Notes */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{tr("Internal Staff Notes (Never Visible to Client)", "ملاحظات داخلية (لا تظهر للعميل)")}</span>
                </label>
                <span className="text-[10px] text-slate-400">{tr("Strictly confidential", "سرية تامة")}</span>
              </div>
              <textarea
                rows={3}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder={tr("Write private technical notes, risk assessment, or team instructions…", "اكتب ملاحظات فنية أو تقييم مخاطر أو تعليمات للفريق…")}
                className="w-full px-3.5 py-2.5 rounded-lg border border-amber-200 bg-amber-50/40 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
              />
            </div>
          </form>

          {/* Client Details Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#0b2545] uppercase tracking-wider">
              {tr("Client & Organization Profile", "بيانات العميل والمؤسسة")}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">{tr("Contact Name", "اسم جهة التواصل")}</span>
                <span className="font-bold text-slate-900">{request.client?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">{tr("Email Address", "البريد الإلكتروني")}</span>
                <span className="font-semibold text-blue-600">{request.client?.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">{tr("Phone Number", "رقم الهاتف")}</span>
                <span className="font-semibold text-slate-800">{request.client?.phone || tr("N/A", "غير متوفر")}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">{tr("Company Name", "اسم الشركة")}</span>
                <span className="font-semibold text-slate-800">{request.client?.companyName || tr("N/A", "غير متوفر")}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">{tr("Industry Sector", "القطاع")}</span>
                <span className="font-semibold text-slate-800">{request.client?.companySector || tr("General", "عام")}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">{tr("Client Type", "نوع العميل")}</span>
                <span className="font-semibold text-slate-800">{request.client?.clientType}</span>
              </div>
            </div>
          </div>

          {/* Problem Statement Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#0b2545] uppercase tracking-wider">
              {tr("Submitted Requirements & Problem", "المتطلبات والمشكلة المقدمة")}
            </h3>
            <div className="space-y-3 text-xs leading-relaxed text-slate-700">
              <div>
                <strong className="text-slate-900 block mb-0.5">{tr("Problem Statement", "وصف المشكلة")}:</strong>
                <p className="bg-slate-50 p-3 rounded-lg border border-slate-100">{request.problemDescription}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <strong className="text-slate-900 block mb-0.5">{tr("Business Objective", "الهدف التجاري")}:</strong>
                  <p className="bg-slate-50 p-3 rounded-lg border border-slate-100">{request.businessObjective}</p>
                </div>
                <div>
                  <strong className="text-slate-900 block mb-0.5">{tr("Desired Outcome", "النتيجة المطلوبة")}:</strong>
                  <p className="bg-slate-50 p-3 rounded-lg border border-slate-100">{request.desiredOutcome}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">{tr("Source Type", "نوع المصدر")}</span>
                  <span className="font-semibold text-slate-800 capitalize">{locale === "ar" ? ({ spreadsheets: "جداول بيانات", database: "قاعدة بيانات", business_software: "برامج أعمال", api: "واجهة API أو تخزين سحابي", manual_records: "سجلات ورقية أو PDF", unknown: "غير معروف" } as Record<string, string>)[request.dataSourceType] || request.dataSourceType : request.dataSourceType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">{tr("Approx Volume", "الحجم التقريبي")}</span>
                  <span className="font-semibold text-slate-800">{request.approxDataVolume || tr("Unknown", "غير معروف")}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">{tr("Deadline", "الموعد النهائي")}</span>
                  <span className="font-semibold text-slate-800">{request.preferredDeadline || tr("Flexible", "مرن")}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">{tr("Budget Range", "نطاق الميزانية")}</span>
                  <span className="font-semibold text-slate-800">{request.budgetRange || tr("Negotiable", "قابل للتفاوض")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dual-Channel Message & Internal Staff Notes Box */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[700px] overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <span className="text-xs font-bold text-[#0b2545]">{tr("Client & Staff Discussion", "محادثة العميل والفريق")}</span>
            <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {tr("Staff View: Internal notes highlighted", "عرض الفريق: الملاحظات الداخلية مميزة")}
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12">{tr("No messages yet.", "لا توجد رسائل بعد.")}</p>
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
                            {tr("Staff Note", "ملاحظة داخلية")}
                          </span>
                        )}
                        {!isInternal && !isClient && (
                          <span className="bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded text-[9px]">
                            {tr("Public Reply", "رد ظاهر للعميل")}
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

          {/* Message Input Box with Internal Note Toggle */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer text-amber-800 font-semibold select-none">
                <input
                  type="checkbox"
                  checked={isInternalNote}
                  onChange={(e) => setIsInternalNote(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>{tr("Internal Staff Note (Hidden from client)", "ملاحظة داخلية (لا تظهر للعميل)")}</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                placeholder={
                  isInternalNote
                    ? tr("Add internal note for KEMIX colleagues…", "أضف ملاحظة داخلية لفريق KEMIX…")
                    : tr("Reply to client…", "اكتب ردًا للعميل…")
                }
                className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                  isInternalNote
                    ? "border-amber-300 bg-amber-50/30 focus:ring-amber-500"
                    : "border-slate-300 focus:ring-blue-500"
                }`}
              />
              <button
                type="submit"
                disabled={sendingMsg || !msgText.trim()}
                className={`p-2.5 rounded-xl text-white disabled:opacity-40 transition-colors ${
                  isInternalNote ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"
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
