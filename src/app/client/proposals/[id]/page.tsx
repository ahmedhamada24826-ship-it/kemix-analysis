"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentLocale } from "@/components/LocaleProvider";
import {
  FileCheck,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  ChevronLeft,
  ArrowRight,
  FileText,
  DollarSign,
} from "lucide-react";

export default function ClientProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = useCurrentLocale();
  const tr = (en: string, ar: string) => locale === "ar" ? ar : en;
  const { id } = use(params);
  const router = useRouter();
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadProposal() {
      try {
        const res = await fetch(`/api/proposals`);
        if (res.ok) {
          const data = await res.json();
          const found = data.proposals?.find((p: any) => p.id === id);
          setProposal(found || null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadProposal();
  }, [id]);

  const handleRespond = async (action: "ACCEPT" | "REJECT") => {
    setResponding(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/proposals/${id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || tr("Failed to process proposal response.", "تعذر تسجيل ردك على العرض.") });
        setResponding(false);
        return;
      }

      setMessage({
        type: "success",
        text: action === "ACCEPT" ? tr("Proposal accepted successfully! Project initiated.", "تم اعتماد العرض وبدء المشروع.") : tr("Proposal response recorded.", "تم تسجيل ردك على العرض."),
      });

      // Update local proposal status
      setProposal((prev: any) => ({
        ...prev,
        status: action === "ACCEPT" ? "ACCEPTED" : "REJECTED",
        acceptedAt: action === "ACCEPT" ? new Date().toISOString() : null,
      }));

      if (action === "ACCEPT" && data.projectId) {
        setTimeout(() => {
          router.push(`/client/projects/${data.projectId}`);
        }, 1500);
      }
    } catch {
      setMessage({ type: "error", text: tr("Network error. Please try again.", "حدث خطأ في الاتصال. حاول مرة أخرى.") });
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return <div dir={locale === "ar" ? "rtl" : "ltr"} className="p-12 text-center text-xs text-slate-400">{tr("Loading proposal document...", "جارٍ تحميل مستند العرض...")}</div>;
  }

  if (!proposal) {
    return (
      <div dir={locale === "ar" ? "rtl" : "ltr"} className="p-12 text-center space-y-4">
        <h3 className="text-base font-bold text-slate-800">{tr("Proposal not found", "لم يتم العثور على العرض")}</h3>
        <Link href="/client/proposals" className="text-xs font-semibold text-blue-600 hover:underline">
          {tr("← Return to proposals list", "العودة إلى قائمة العروض ←")}
        </Link>
      </div>
    );
  }

  let deliverablesList: string[] = [];
  try {
    deliverablesList = JSON.parse(proposal.deliverables || "[]");
  } catch {
    deliverablesList = [proposal.deliverables];
  }

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} className="max-w-4xl mx-auto space-y-8">
      {/* Top Header */}
      <div>
        <Link
          href="/client/proposals"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 mb-2 font-medium"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>{tr("Back to all proposals", "العودة إلى كل العروض")}</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                {proposal.referenceNumber}
              </span>
              <span className="text-xs text-slate-400">{tr("Version", "الإصدار")} {proposal.version}</span>
            </div>
            <h2 className="text-2xl font-black text-[#0b2545] mt-1">{proposal.title}</h2>
          </div>

          <div>
            {proposal.status === "ACCEPTED" ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{tr("Formally Approved", "تم الاعتماد رسميًا")}</span>
              </span>
            ) : proposal.status === "SENT" ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>{tr("Awaiting Your Approval", "بانتظار موافقتك")}</span>
              </span>
            ) : (
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                {proposal.status}
              </span>
            )}
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Proposal Document Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
        {/* Scope of Work */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#0b2545] uppercase tracking-wider">
            {tr("1. Scope of Work Summary", "1. ملخص نطاق العمل")}
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
            {proposal.scopeSummary}
          </p>
        </div>

        {/* Agreed Deliverables */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#0b2545] uppercase tracking-wider">
            {tr("2. Agreed Project Deliverables", "2. مخرجات المشروع المتفق عليها")}
          </h3>
          <ul className="grid grid-cols-1 gap-2.5">
            {deliverablesList.map((deliv, i) => (
              <li
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/60 text-xs text-slate-800"
              >
                <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="font-medium">{deliv}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Commercials & Terms */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#0b2545] uppercase tracking-wider">
            {tr("3. Commercial Terms & Delivery Schedule", "3. الشروط التجارية وجدول التسليم")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-[11px] text-slate-500 font-medium">{tr("Fixed Investment", "التكلفة الثابتة")}</span>
              <p className="text-2xl font-black text-[#0b2545] mt-1">
                ${proposal.price.toLocaleString()} {proposal.currency}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-[11px] text-slate-500 font-medium">{tr("Estimated Delivery", "مدة التسليم التقديرية")}</span>
              <p className="text-2xl font-black text-[#0b2545] mt-1">
                {proposal.timelineDays} {tr("Calendar Days", "يومًا تقويميًا")}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-[11px] text-slate-500 font-medium">{tr("Payment Structure", "شروط الدفع")}</span>
              <p className="text-xs font-semibold text-slate-700 mt-1 leading-snug">
                {proposal.paymentTerms}
              </p>
            </div>
          </div>
        </div>

        {/* Assumptions & Exclusions */}
        {(proposal.assumptions || proposal.exclusions) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 text-xs text-slate-600">
            {proposal.assumptions && (
              <div>
                <strong className="text-slate-900 block mb-1">{tr("Key Assumptions:", "الافتراضات الأساسية:")}</strong>
                <p>{proposal.assumptions}</p>
              </div>
            )}
            {proposal.exclusions && (
              <div>
                <strong className="text-slate-900 block mb-1">{tr("Project Exclusions:", "ما لا يشمله المشروع:")}</strong>
                <p>{proposal.exclusions}</p>
              </div>
            )}
          </div>
        )}

        {/* Acceptance Audit Stamp if Accepted */}
        {proposal.status === "ACCEPTED" && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {tr("Legally Binding Digital Acceptance Audit Record", "سجل اعتماد إلكتروني موثق")}
            </p>
            <p className="text-emerald-800">
              {tr("This proposal was authenticated and formally approved on", "تم التحقق من هذا العرض واعتماده رسميًا بتاريخ")} {" "}
              <strong>{new Date(proposal.acceptedAt).toLocaleString(locale === "ar" ? "ar-EG" : "en-GB")}</strong> {tr("for Proposal Version", "للإصدار")} {" "}
              <strong>{proposal.version}</strong>. {tr("Project execution has officially begun.", "وبدأ تنفيذ المشروع رسميًا.")}
            </p>
          </div>
        )}

        {/* Action Buttons if Pending */}
        {proposal.status === "SENT" && (
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => handleRespond("REJECT")}
              disabled={responding}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              {tr("Request Changes / Decline", "طلب تعديلات / رفض العرض")}
            </button>

            <button
              type="button"
              onClick={() => handleRespond("ACCEPT")}
              disabled={responding}
              className="w-full sm:w-auto px-7 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>{responding ? tr("Recording Approval...", "جارٍ تسجيل الموافقة...") : tr("Approve & Sign Proposal", "اعتماد العرض وتوقيعه")}</span>
              <CheckCircle2 className="w-4 h-4 text-orange-300" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
