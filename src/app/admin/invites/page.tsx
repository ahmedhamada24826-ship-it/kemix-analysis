"use client";

import { useState, useEffect } from "react";
import { UserPlus, Copy, Clock, CheckCircle, Mail, X } from "lucide-react";
import { useCurrentLocale } from "@/components/LocaleProvider";

interface Invite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
  invitedBy: { id: string; name: string };
}

const ROLES = ["SUPER_ADMIN", "OPERATIONS_MANAGER", "PROJECT_LEAD", "ANALYST", "TRAINEE", "SUPPORT_AGENT"];
const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  OPERATIONS_MANAGER: "Operations Manager",
  PROJECT_LEAD: "Project Lead",
  ANALYST: "Analyst",
  TRAINEE: "Trainee",
  SUPPORT_AGENT: "Support Agent",
};

interface Department { id: string; name: string; }

export default function InvitesPage() {
  const locale = useCurrentLocale();
  const tr = (en: string, ar: string) => locale === "ar" ? ar : en;
  const [invites, setInvites] = useState<Invite[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", role: "ANALYST", departmentId: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [newInviteLink, setNewInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  async function load() {
    setLoading(true);
    const [iRes, dRes, uRes] = await Promise.all([
      fetch("/api/admin/invites"),
      fetch("/api/admin/departments"),
      fetch("/api/auth/me"),
    ]);
    if (iRes.ok) { const d = await iRes.json(); setInvites(d.invites || []); }
    if (dRes.ok) { const d = await dRes.json(); setDepartments(d.departments || []); }
    if (uRes.ok) { const d = await uRes.json(); setIsSuperAdmin(d.user?.role === "SUPER_ADMIN"); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function sendInvite() {
    if (form.role === "PROJECT_LEAD" && !form.departmentId) {
      setError(tr("Choose a department for the project lead.", "اختر قسمًا لقائد القسم."));
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, role: form.role, departmentId: form.departmentId || undefined }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || tr("Failed to create invite", "تعذر إنشاء الدعوة")); return; }
    const fullLink = `${window.location.origin}${data.inviteLink}`;
    setNewInviteLink(fullLink);
    setForm({ email: "", role: "ANALYST", departmentId: "" });
    load();
  }

  async function copyLink() {
    if (!newInviteLink) return;
    await navigator.clipboard.writeText(newInviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function daysUntilExpiry(expiresAt: string) {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0b2545]">{tr("Staff Invitations", "دعوات الموظفين")}</h1>
          <p className="text-slate-500 mt-1">{tr("Invite new team members to join KEMIX Analysis.", "ادعُ أعضاء جدد للانضمام إلى فريق KEMIX Analysis.")}</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setNewInviteLink(null); setError(""); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#0066ff] text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <UserPlus size={16} /> {tr("Invite Staff Member", "دعوة موظف")}
        </button>
      </div>

      {/* Invite Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#0b2545]">{tr("New Staff Invitation", "دعوة موظف جديد")}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}

          {newInviteLink ? (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-green-800 flex items-center gap-2 mb-2">
                  <CheckCircle size={16} /> {tr("Invitation created!", "تم إنشاء الدعوة!")}
                </p>
                <p className="text-xs text-green-700 mb-3">{tr("Share this link with the invited team member. It expires in 7 days.", "شارك الرابط مع الموظف المدعو. تنتهي صلاحيته خلال 7 أيام.")}</p>
                <div className="flex items-center gap-2 bg-white border border-green-200 rounded-lg p-2">
                  <code className="text-xs text-gray-600 flex-1 break-all">{newInviteLink}</code>
                  <button
                    onClick={copyLink}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition-colors flex-shrink-0"
                  >
                    {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
                    {copied ? tr("Copied!", "تم النسخ") : tr("Copy", "نسخ")}
                  </button>
                </div>
              </div>
              <button
                onClick={() => { setNewInviteLink(null); setShowForm(false); }}
                className="w-full py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50"
              >
                {tr("Done", "تم")}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">{tr("Email Address", "البريد الإلكتروني")} *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="colleague@company.com"
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">{tr("Role", "الدور")} *</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30"
                  >
                    {ROLES.filter((r) => isSuperAdmin || !["SUPER_ADMIN", "OPERATIONS_MANAGER"].includes(r)).map((r) => <option key={r} value={r}>{tr(ROLE_LABELS[r], ({ SUPER_ADMIN: "مدير النظام", OPERATIONS_MANAGER: "مدير العمليات", PROJECT_LEAD: "قائد قسم", ANALYST: "محلل بيانات", TRAINEE: "متدرب", SUPPORT_AGENT: "خدمة العملاء" } as Record<string, string>)[r])}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{tr("Assign to Department", "تعيين إلى قسم")} {form.role === "PROJECT_LEAD" ? "*" : tr("(optional)", "(اختياري)")}</label>
                <select
                  required={form.role === "PROJECT_LEAD"}
                  value={form.departmentId}
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30"
                >
                  <option value="">— {tr("No department", "بدون قسم")} —</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50"
                >{tr("Cancel", "إلغاء")}</button>
                <button
                  onClick={sendInvite}
                  disabled={saving || !form.email || !form.role}
                  className="flex-1 py-2.5 bg-[#0066ff] text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Mail size={15} />
                  {saving ? tr("Creating…", "جارٍ الإنشاء…") : tr("Generate Invite Link", "إنشاء رابط الدعوة")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pending Invites */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#0b2545]">{tr("Pending Invitations", "الدعوات المعلقة")}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{tr("Invitations that have not been accepted yet.", "الدعوات التي لم يتم قبولها بعد.")}</p>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-6 h-6 border-2 border-[#0066ff] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : invites.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <UserPlus size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{tr("No pending invitations", "لا توجد دعوات معلقة")}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {invites.map((invite) => {
              const days = daysUntilExpiry(invite.expiresAt);
              return (
                <div key={invite.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Mail size={16} className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{invite.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {tr(ROLE_LABELS[invite.role] || invite.role, ({ SUPER_ADMIN: "مدير النظام", OPERATIONS_MANAGER: "مدير العمليات", PROJECT_LEAD: "قائد قسم", ANALYST: "محلل بيانات", TRAINEE: "متدرب", SUPPORT_AGENT: "خدمة العملاء" } as Record<string, string>)[invite.role] || invite.role)} · {tr("Invited by", "بدعوة من")} {invite.invitedBy.name}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs ${days <= 1 ? "text-red-500" : days <= 3 ? "text-orange-500" : "text-gray-400"}`}>
                    <Clock size={13} />
                    {days === 0 ? tr("Expires today", "تنتهي اليوم") : tr(`${days} day${days !== 1 ? "s" : ""} left`, `متبقي ${days} يومًا`)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
