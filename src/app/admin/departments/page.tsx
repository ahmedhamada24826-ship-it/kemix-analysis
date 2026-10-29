"use client";

import { useState, useEffect } from "react";
import { Plus, Users, FolderOpen, Edit2, Trash2, Crown, X } from "lucide-react";
import { useCurrentLocale } from "@/components/LocaleProvider";
import { translate } from "@/lib/i18n";

interface Department {
  id: string;
  name: string;
  description: string | null;
  color: string;
  orderIndex: number;
  isActive: boolean;
  lead: { id: string; name: string; email: string } | null;
  _count: { members: number; projects: number };
}

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId: string | null;
}

export default function DepartmentsPage() {
  const locale = useCurrentLocale();
  const tr = (english: string, arabic: string) => locale === "ar" ? arabic : english;
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", color: "#0066ff", orderIndex: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const [dRes, sRes] = await Promise.all([
      fetch("/api/admin/departments"),
      fetch("/api/admin/staff"),
    ]);
    const dData = await dRes.json();
    const sData = await sRes.json();
    setDepartments(dData.departments || []);
    setStaffList(sData.staff || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createDept() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setForm({ name: "", description: "", color: "#0066ff", orderIndex: 0 });
    setShowCreate(false);
    setSaving(false);
    load();
  }

  async function updateDept(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/admin/departments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) load();
  }

  async function deleteDept(id: string, name: string) {
    if (!confirm(tr(`Delete department "${name}"? This cannot be undone.`, `هل تريد حذف قسم "${name}"؟ لا يمكن التراجع عن هذا الإجراء.`))) return;
    const res = await fetch(`/api/admin/departments/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) alert(data.error);
    else load();
  }

  async function setLead(deptId: string, leadUserId: string) {
    await updateDept(deptId, { leadUserId: leadUserId || null });
  }

  const DEPT_COLORS = ["#0b2545", "#0066ff", "#ff7a00", "#059669", "#7c3aed", "#db2777", "#0891b2", "#65a30d"];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0b2545]">{tr("Departments", "الأقسام")}</h1>
          <p className="text-gray-500 mt-1">{tr("Manage team structure and department assignments.", "إدارة هيكل الفريق وتوزيع الموظفين على الأقسام.")}</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setError(""); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#0066ff] text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} /> {tr("New Department", "قسم جديد")}
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#0b2545]">{tr("New Department", "قسم جديد")}</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">{tr("Name", "الاسم")} *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30"
                  placeholder={tr("e.g. Data Analysis", "مثال: تحليل البيانات")}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{tr("Description", "الوصف")}</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30"
                  placeholder={tr("Department focus and responsibilities...", "مجال عمل القسم ومسؤولياته…")}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{tr("Color", "اللون")}</label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {DEPT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${form.color === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{tr("Sort Order", "ترتيب العرض")}</label>
                <input
                  type="number"
                  value={form.orderIndex}
                  onChange={(e) => setForm({ ...form, orderIndex: parseInt(e.target.value) || 0 })}
                  className="mt-1 w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
              >
                {tr("Cancel", "إلغاء")}
              </button>
              <button
                onClick={createDept}
                disabled={saving || !form.name.trim()}
                className="flex-1 py-2 bg-[#0066ff] text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? tr("Creating…", "جارٍ الإنشاء…") : tr("Create", "إنشاء")}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-gray-400">
          <div className="w-8 h-8 border-2 border-[#0066ff] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : departments.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 py-20 text-center text-gray-400">
          <Users size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-medium text-lg">{tr("No departments yet", "لا توجد أقسام بعد")}</p>
          <p className="text-sm mt-2">{tr("Create your first department to organize your team.", "أنشئ أول قسم لتنظيم فريقك.")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {departments.map((dept) => (
            <div key={dept.id} className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${!dept.isActive ? "opacity-60" : ""}`}>
              {/* Color bar */}
              <div className="h-1.5" style={{ backgroundColor: dept.color }} />

              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#0b2545]">{dept.name}</h3>
                      {!dept.isActive && (
                        <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{tr("Inactive", "غير نشط")}</span>
                      )}
                    </div>
                    {dept.description && (
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">{dept.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <button
                      onClick={() => updateDept(dept.id, { isActive: !dept.isActive })}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#0066ff] hover:bg-blue-50 transition-colors"
                      title={dept.isActive ? tr("Deactivate", "إيقاف") : tr("Activate", "تفعيل")}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => deleteDept(dept.id, dept.name)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title={tr("Delete", "حذف")}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4 mt-4">
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Users size={14} />
                    <span>{dept._count.members} {tr("members", "موظفًا")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <FolderOpen size={14} />
                    <span>{dept._count.projects} {tr("projects", "مشروعًا")}</span>
                  </div>
                </div>

                {/* Lead selector */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Crown size={14} className="text-[#ff7a00]" />
                    <label className="text-xs font-medium text-gray-600">{tr("Department Lead", "قائد القسم")}</label>
                  </div>
                  <select
                    value={dept.lead?.id || ""}
                    onChange={(e) => setLead(dept.id, e.target.value)}
                    className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30"
                  >
                    <option value="">— {tr("No lead assigned", "لا يوجد قائد معيّن")} —</option>
                    {staffList.filter((s) => s.role === "PROJECT_LEAD" && s.departmentId === dept.id).map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({translate(locale, ({ TRAINEE: "trainee", DATA_ANALYST: "analyst", PROJECT_LEAD: "projectLead", SUPPORT_AGENT: "supportAgent", OPERATIONS_MANAGER: "operationsManager", SUPER_ADMIN: "superAdmin" } as Record<string, string>)[s.role] || s.role)})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
