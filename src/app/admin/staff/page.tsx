"use client";

import { useState, useEffect } from "react";
import { useCurrentLocale } from "@/components/LocaleProvider";

export default function AdminStaffPage() {
  const locale = useCurrentLocale();
  const tr = (en: string, ar: string) => locale === "ar" ? ar : en;
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStaff() {
      try {
        const res = await fetch("/api/admin/staff");
        if (res.ok) {
          const data = await res.json();
          setStaff(data.staff || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadStaff();
  }, []);

  const roleDescriptions: Record<string, string> = {
    SUPER_ADMIN: tr("Full platform permissions, system initialization, client isolation auditing, and global settings.", "صلاحيات النظام الكاملة وتهيئة النظام ومراجعة عزل بيانات العملاء والإعدادات العامة."),
    OPERATIONS_MANAGER: tr("Intake queue triage, service request assignment, consultation schedules, and team workflow oversight.", "فرز الطلبات وتوزيعها وجدولة الاستشارات والإشراف على سير عمل الفريق."),
    PROJECT_LEAD: tr("Architecture, milestone execution, scope delivery, Power BI review, and client technical meetings.", "تخطيط الحل وتنفيذ المراحل والتسليم ومراجعة Power BI والاجتماعات الفنية مع العملاء."),
    ANALYST: tr("Data cleaning, SQL ETL, Python pipelines, mathematical modeling, and dashboard construction.", "تنظيف البيانات وعمليات SQL وخطوط Python والنمذجة وإنشاء لوحات البيانات."),
    TRAINEE: tr("Assigned learning tasks and supervised project work within the trainee's department.", "مهام تدريبية وعمل على المشاريع بإشراف داخل القسم."),
    SUPPORT_AGENT: tr("Client ticket response, link permissions, minor revisions, and client communication.", "الرد على تذاكر العملاء ومساعدتهم في الوصول والتعديلات والتواصل."),
  };

  return (
    <div className="space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div>
        <h2 className="text-2xl font-black text-[#0b2545]">{tr("Staff & Role-Based Permissions", "الفريق وصلاحيات الأدوار")}</h2>
        <p className="text-xs text-slate-500 mt-1">
          {tr("KEMIX Analysis team members and their role-based access.", "أعضاء فريق KEMIX Analysis وصلاحيات الوصول المحددة لكل دور.")}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">{tr("Loading staff directory…", "جارٍ تحميل دليل الموظفين…")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">{tr("Staff Member", "الموظف")}</th>
                  <th className="px-5 py-3">{tr("Assigned Role", "الدور المعيّن")}</th>
                  <th className="px-5 py-3">{tr("Functional Responsibilities", "المسؤوليات")}</th>
                  <th className="px-5 py-3">{tr("Department", "القسم")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{s.name}</span>
                          <span className="text-[11px] text-slate-400 block">{s.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {tr(({ SUPER_ADMIN: "Super Admin", OPERATIONS_MANAGER: "Operations Manager", PROJECT_LEAD: "Project Lead", ANALYST: "Analyst", TRAINEE: "Trainee", SUPPORT_AGENT: "Support Agent" } as Record<string, string>)[s.role] || s.role, ({ SUPER_ADMIN: "مدير النظام", OPERATIONS_MANAGER: "مدير العمليات", PROJECT_LEAD: "قائد قسم", ANALYST: "محلل بيانات", TRAINEE: "متدرب", SUPPORT_AGENT: "خدمة العملاء" } as Record<string, string>)[s.role] || s.role)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 max-w-md leading-relaxed text-[11px]">
                      {roleDescriptions[s.role] || tr("Operational duties", "مهام تشغيلية")}
                    </td>
                    <td className="px-5 py-4 text-slate-700 font-medium">
                      {s.companySector || tr("Data Operations", "عمليات البيانات")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
