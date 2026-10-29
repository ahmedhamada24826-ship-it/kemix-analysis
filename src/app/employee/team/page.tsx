import { redirect } from "next/navigation";
import { getSession, isStaffRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Users, Mail, Briefcase } from "lucide-react";
import { isOperationsRole } from "@/lib/authorization";
import { translate } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/locale-server";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "superAdminRole",
  OPERATIONS_MANAGER: "operationsManagerRole",
  PROJECT_LEAD: "projectLeadRole",
  ANALYST: "analystRole",
  TRAINEE: "traineeRole",
  SUPPORT_AGENT: "supportAgentRole",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
  OPERATIONS_MANAGER: "bg-[#0b2545] text-white",
  PROJECT_LEAD: "bg-[#0066ff] text-white",
  ANALYST: "bg-teal-100 text-teal-700",
  TRAINEE: "bg-cyan-100 text-cyan-700",
  SUPPORT_AGENT: "bg-orange-100 text-orange-700",
};

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default async function TeamPage() {
  const locale = await getRequestLocale();
  const session = await getSession();
  if (!session) redirect("/auth/login");
  if (!isStaffRole(session.role)) redirect("/auth/login");

  // Get all departments with their members
  const canViewAllDepartments = isOperationsRole(session.role);
  const departments = await prisma.department.findMany({
    where: { isActive: true, ...(canViewAllDepartments ? {} : { id: session.departmentId || "__none__" }) },
    include: {
      lead: { select: { id: true, name: true } },
      members: {
        where: { role: { not: "CLIENT" } },
        select: { id: true, name: true, email: true, role: true, jobTitle: true, status: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { orderIndex: "asc" },
  });

  // Staff without a department
  const unassigned = canViewAllDepartments ? await prisma.user.findMany({
    where: { role: { not: "CLIENT" }, departmentId: null },
    select: { id: true, name: true, email: true, role: true, jobTitle: true, status: true },
    orderBy: { name: "asc" },
  }) : [];

  const MemberCard = ({ member }: { member: typeof unassigned[0] }) => (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 ${member.status === "SUSPENDED" ? "opacity-50" : ""}`}>
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
        style={{ backgroundColor: "#0b2545" }}
      >
        {getInitials(member.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 truncate">{member.name}</p>
        {member.jobTitle && <p className="text-xs text-gray-400 truncate">{member.jobTitle}</p>}
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[member.role] || "bg-gray-100 text-gray-600"}`}>
            {translate(locale, ROLE_LABELS[member.role] || "teamMemberRole")}
          </span>
        </div>
      </div>
      <a
        href={`mailto:${member.email}`}
        className="p-2 rounded-lg text-gray-400 hover:text-[#0066ff] hover:bg-blue-50 transition-colors flex-shrink-0"
        title={member.email}
      >
        <Mail size={16} />
      </a>
    </div>
  );

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0b2545]">{translate(locale, "teamDirectory")}</h1>
        <p className="text-gray-500 mt-1">{translate(locale, canViewAllDepartments ? "allTeamMembers" : "departmentMembers")}</p>
      </div>

      {departments.map((dept) => (
        <section key={dept.id}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-8 rounded-full" style={{ backgroundColor: dept.color }} />
            <div>
              <h2 className="text-lg font-semibold text-[#0b2545]">{dept.name}</h2>
              {dept.lead && (
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Briefcase size={11} /> {translate(locale, "lead")}: {dept.lead.name}
                </p>
              )}
            </div>
            <span className="ml-auto text-sm text-gray-400">{dept.members.length} {translate(locale, "membersCount")}</span>
          </div>

          {dept.members.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl py-8 text-center text-gray-400">
              <Users size={24} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">{translate(locale, "noDepartmentMembers")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {dept.members.map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          )}
        </section>
      ))}

      {unassigned.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-8 rounded-full bg-gray-300" />
            <h2 className="text-lg font-semibold text-[#0b2545]">{translate(locale, "unassigned")}</h2>
            <span className="ml-auto text-sm text-gray-400">{unassigned.length} {translate(locale, "membersCount")}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {unassigned.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
