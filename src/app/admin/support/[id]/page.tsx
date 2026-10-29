"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Headphones, Send, ChevronLeft, CheckCircle2, ShieldCheck, Save } from "lucide-react";
import { useCurrentLocale } from "@/components/LocaleProvider";

export default function AdminSupportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const locale = useCurrentLocale();
  const tr = (en: string, ar: string) => locale === "ar" ? ar : en;
  const [ticket, setTicket] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Status & Priority
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assignedStaffId, setAssignedStaffId] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [savingControls, setSavingControls] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Reply
  const [replyText, setReplyText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  const fetchDetails = async () => {
    try {
      const [tRes, sRes] = await Promise.all([fetch(`/api/support/${id}`), fetch("/api/support")]);

      if (tRes.ok) {
        const d = await tRes.json();
        const t = d.ticket;
        setTicket(t);
        setStatus(t.status);
        setPriority(t.priority);
        setAssignedStaffId(t.assignedStaffId || "");
        setResolutionNotes(t.resolutionNotes || "");
      }

      if (sRes.ok) {
        const sData = await sRes.json();
        setStaffList(sData.supportAgents || []);
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

  const handleSaveControls = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingControls(true);
    setSaveMsg("");

    try {
      const res = await fetch(`/api/support/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          priority,
          assignedStaffId,
          resolutionNotes,
        }),
      });

      if (res.ok) {
        setSaveMsg(tr("Ticket settings saved.", "تم حفظ إعدادات التذكرة."));
        fetchDetails();
      }
    } catch {
      setSaveMsg(tr("Failed to save.", "تعذر حفظ التغييرات."));
    } finally {
      setSavingControls(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSendingReply(true);
    try {
      const res = await fetch(`/api/support/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyText,
          isInternal,
        }),
      });

      if (res.ok) {
        setReplyText("");
        setIsInternal(false);
        fetchDetails();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSendingReply(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">{tr("Loading ticket workspace…", "جارٍ تحميل مساحة التذكرة…")}</div>;
  }

  if (!ticket) {
    return (
      <div className="p-12 text-center space-y-4">
        <h3 className="text-base font-bold text-slate-800">{tr("Ticket not found", "لم يتم العثور على التذكرة")}</h3>
        <Link href="/admin/support" className="text-xs font-semibold text-blue-600 hover:underline">
          ← {tr("Return to tickets", "العودة إلى التذاكر")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <Link
        href="/admin/support"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 mb-2 font-medium"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        <span>{tr("Back to support queue", "العودة إلى قائمة الدعم")}</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              {ticket.ticketNumber}
            </span>
            <span className="text-xs text-slate-500">• {ticket.category}</span>
          </div>
          <h2 className="text-xl font-bold text-[#0b2545] mt-1">{ticket.subject}</h2>
          <p className="text-xs text-slate-500">
            {tr("Client", "العميل")}: <strong>{ticket.client?.name}</strong> ({ticket.client?.companyName || tr("Individual", "فرد")})
          </p>
        </div>
      </div>

      {saveMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveMsg}</span>
        </div>
      )}

      {/* Ticket Management Form */}
      <form
        onSubmit={handleSaveControls}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-[#0b2545] uppercase tracking-wider">
            {tr("Ticket Controls & Resolution Status", "إعدادات التذكرة وحالة الحل")}
          </span>
          <button
            type="submit"
            disabled={savingControls}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[#0b2545] hover:bg-blue-900 transition-colors flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingControls ? tr("Saving…", "جارٍ الحفظ…") : tr("Update Ticket", "تحديث التذكرة")}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{tr("Ticket Status", "حالة التذكرة")}</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-[#0b2545] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="OPEN">{tr("Open", "مفتوحة")}</option>
              <option value="IN_PROGRESS">{tr("In Progress", "قيد المعالجة")}</option>
              <option value="WAITING_ON_CLIENT">{tr("Waiting on Client", "بانتظار العميل")}</option>
              <option value="RESOLVED">{tr("Resolved", "تم الحل")}</option>
              <option value="CLOSED">{tr("Closed", "مغلقة")}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{tr("Priority", "الأولوية")}</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="LOW">{tr("Low", "منخفضة")}</option>
              <option value="MEDIUM">{tr("Medium", "متوسطة")}</option>
              <option value="HIGH">{tr("High", "مرتفعة")}</option>
              <option value="URGENT">{tr("Urgent", "عاجلة")}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {tr("Assigned Support Agent", "موظف الدعم المعيّن")}
            </label>
            <select
              value={assignedStaffId}
              onChange={(e) => setAssignedStaffId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {tr("Internal Resolution Notes", "ملاحظات الحل الداخلية")}
          </label>
          <input
            type="text"
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder={tr("Record technical solution or follow-up notes…", "سجّل الحل الفني أو ملاحظات المتابعة…")}
            className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>

      {/* Ticket Messages History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h3 className="text-xs font-bold text-[#0b2545] uppercase tracking-wider">
          {tr("Ticket Conversation Thread", "محادثة التذكرة")}
        </h3>

        <div className="space-y-4">
          {ticket.replies?.map((r: any) => {
            const isInternal = r.isInternal;
            const isClient = r.sender?.role === "CLIENT";

            return (
              <div
                key={r.id}
                className={`p-4 rounded-xl border text-xs leading-relaxed ${
                  isInternal
                    ? "bg-amber-50 border-amber-200 text-amber-950"
                    : isClient
                    ? "bg-slate-50 border-slate-200 text-slate-800"
                    : "bg-blue-50/60 border-blue-200 text-blue-950"
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{r.sender?.name}</span>
                    {isInternal && (
                      <span className="text-[9px] font-bold uppercase bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                        {tr("Internal Staff Note", "ملاحظة داخلية")}
                      </span>
                    )}
                  </div>
                  <span>{new Date(r.createdAt).toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}</span>
                </div>
                <p className="whitespace-pre-wrap">{r.content}</p>
              </div>
            );
          })}
        </div>

        {/* Reply Form */}
        <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-amber-800 font-semibold select-none">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span>{tr("Internal Note (Hidden from client)", "ملاحظة داخلية (لا تظهر للعميل)")}</span>
            </label>
          </div>

          <textarea
            required
            rows={3}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={isInternal ? tr("Add internal resolution notes…", "أضف ملاحظات الحل الداخلية…") : tr("Reply to client…", "اكتب ردًا للعميل…")}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
              isInternal
                ? "border-amber-300 bg-amber-50/30 focus:ring-amber-500"
                : "border-slate-300 focus:ring-blue-500"
            }`}
          />

          <button
            type="submit"
            disabled={sendingReply || !replyText.trim()}
            className={`px-5 py-2 rounded-lg text-xs font-bold text-white transition-colors flex items-center gap-1.5 disabled:opacity-40 ${
              isInternal ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <span>{sendingReply ? tr("Posting…", "جارٍ النشر…") : isInternal ? tr("Post Staff Note", "نشر ملاحظة داخلية") : tr("Send Reply to Client", "إرسال الرد للعميل")}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
