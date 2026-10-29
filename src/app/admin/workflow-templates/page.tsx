"use client";

import { useState, useEffect } from "react";
import { Plus, GitBranch, CheckCircle, X, ChevronDown, ChevronUp } from "lucide-react";
import { useCurrentLocale } from "@/components/LocaleProvider";

interface WorkflowTemplate {
  id: string;
  name: string;
  serviceType: string | null;
  description: string | null;
  stages: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

interface Stage {
  key: string;
  title: string;
  description?: string;
  assignedDepartmentKey?: string;
}

interface DepartmentOption {
  id: string;
  name: string;
}

export default function WorkflowTemplatesPage() {
  const locale = useCurrentLocale();
  const tr = (en: string, ar: string) => locale === "ar" ? ar : en;
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    serviceType: "",
    description: "",
    isDefault: false,
    stages: [{ key: "", title: "", description: "", assignedDepartmentKey: "" }] as Stage[],
  });

  async function load() {
    setLoading(true);
    const [res, deptRes] = await Promise.all([fetch("/api/admin/workflow-templates"), fetch("/api/admin/departments")]);
    if (res.ok) { const d = await res.json(); setTemplates(d.templates || []); }
    if (deptRes.ok) { const d = await deptRes.json(); setDepartments(d.departments || []); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function addStage() {
    setForm({ ...form, stages: [...form.stages, { key: "", title: "", description: "", assignedDepartmentKey: "" }] });
  }

  function removeStage(i: number) {
    setForm({ ...form, stages: form.stages.filter((_, idx) => idx !== i) });
  }

  function updateStage(i: number, field: keyof Stage, value: string) {
    const stages = [...form.stages];
    stages[i] = { ...stages[i], [field]: value };
    setForm({ ...form, stages });
  }

  async function createTemplate() {
    setSaving(true);
    setError("");

    // Auto-generate keys from titles if empty
    const stages = form.stages.map((s, i) => ({
      key: s.key || s.title.toLowerCase().replace(/[^a-z0-9]/g, "_") || `stage_${i + 1}`,
      title: s.title,
      description: s.description,
      assignedDepartmentKey: s.assignedDepartmentKey || undefined,
    }));

    const res = await fetch("/api/admin/workflow-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, stages }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || tr("Failed to create template", "تعذر إنشاء القالب")); return; }
    setShowCreate(false);
    setForm({ name: "", serviceType: "", description: "", isDefault: false, stages: [{ key: "", title: "", description: "", assignedDepartmentKey: "" }] });
    load();
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0b2545]">{tr("Workflow Templates", "قوالب سير العمل")}</h1>
          <p className="text-slate-500 mt-1">{tr("Define reusable project workflows for different service types.", "أنشئ مسارات عمل قابلة لإعادة الاستخدام حسب نوع الخدمة.")}</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setError(""); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#0066ff] text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} /> {tr("New Template", "قالب جديد")}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#0b2545]">{tr("New Workflow Template", "قالب سير عمل جديد")}</h2>
            <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">{tr("Template Name", "اسم القالب")} *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Standard Data Analysis"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{tr("Service Type", "نوع الخدمة")} {tr("(optional)", "(اختياري)")}</label>
              <input value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                placeholder="e.g. data_analysis, business_intelligence"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">{tr("Description", "الوصف")}</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2} placeholder={tr("Brief description of this workflow…", "وصف موجز لمسار العمل…")}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30" />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="isDefault" checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="rounded" />
            <label htmlFor="isDefault" className="text-sm text-gray-700">{tr("Set as default template (applies to all new projects without a specific template)", "اجعل هذا القالب افتراضيًا للمشاريع الجديدة التي لا تستخدم قالبًا محددًا")}</label>
          </div>

          {/* Stages */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700">{tr("Stages", "المراحل")} *</label>
              <button onClick={addStage} className="text-xs text-[#0066ff] hover:underline flex items-center gap-1">
                <Plus size={13} /> {tr("Add Stage", "إضافة مرحلة")}
              </button>
            </div>
            <div className="space-y-3">
              {form.stages.map((stage, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 relative">
                  <div className="flex items-center gap-2 absolute top-3 right-3">
                    <span className="text-xs text-gray-400">{tr(`Stage ${i + 1}`, `المرحلة ${i + 1}`)}</span>
                    {form.stages.length > 1 && (
                      <button onClick={() => removeStage(i)} className="text-gray-300 hover:text-red-500">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <input value={stage.title} onChange={(e) => updateStage(i, "title", e.target.value)}
                    placeholder={tr("Stage title (e.g. Data Collection)", "عنوان المرحلة (مثال: جمع البيانات)")}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30" />
                  <input value={stage.description || ""} onChange={(e) => updateStage(i, "description", e.target.value)}
                    placeholder={tr("Stage description (optional)", "وصف المرحلة (اختياري)")}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30" />
                  <select value={stage.assignedDepartmentKey || ""} onChange={(e) => updateStage(i, "assignedDepartmentKey", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30">
                    <option value="">{tr("Use the project's primary department", "استخدم القسم الأساسي للمشروع")}</option>
                    {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50">{tr("Cancel", "إلغاء")}</button>
            <button onClick={createTemplate} disabled={saving || !form.name || form.stages.every((s) => !s.title)}
              className="flex-1 py-2.5 bg-[#0066ff] text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? tr("Creating…", "جارٍ الإنشاء…") : tr("Create Template", "إنشاء القالب")}
            </button>
          </div>
        </div>
      )}

      {/* Templates List */}
      {loading ? (
        <div className="py-16 text-center"><div className="w-7 h-7 border-2 border-[#0066ff] border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center text-gray-400">
          <GitBranch size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">{tr("No workflow templates", "لا توجد قوالب لسير العمل")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((t) => {
            const stages: Stage[] = (() => { try { return JSON.parse(t.stages); } catch { return []; } })();
            const isExpanded = expandedId === t.id;
            return (
              <div key={t.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : t.id)}
                >
                  <div className="w-9 h-9 rounded-xl bg-[#0066ff]/10 flex items-center justify-center flex-shrink-0">
                    <GitBranch size={18} className="text-[#0066ff]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#0b2545]">{t.name}</h3>
                      {t.isDefault && (
                        <span className="text-[11px] bg-[#0066ff]/10 text-[#0066ff] px-2 py-0.5 rounded-full font-medium">{tr("Default", "افتراضي")}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {tr(`${stages.length} stage${stages.length !== 1 ? "s" : ""}`, `${stages.length} مرحلة`)}
                      {t.serviceType && ` · ${t.serviceType}`}
                      {t.description && ` · ${t.description}`}
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>

                {isExpanded && (
                  <div className="px-6 pb-5 border-t border-gray-100 pt-4">
                    <div className="flex gap-2 items-center mb-4">
                      {stages.map((s, i) => (
                        <div key={s.key} className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs">
                            <span className="w-5 h-5 rounded-full bg-[#0066ff] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                              {i + 1}
                            </span>
                            <span className="font-medium text-gray-700">{s.title}</span>
                          </div>
                          {i < stages.length - 1 && (
                            <span className="text-gray-300">→</span>
                          )}
                        </div>
                      ))}
                    </div>
                    {stages.some((s) => s.description) && (
                      <div className="space-y-2">
                        {stages.filter((s) => s.description).map((s, i) => (
                          <div key={s.key} className="text-xs text-gray-500">
                            <span className="font-medium text-gray-700">{s.title}:</span> {s.description}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
