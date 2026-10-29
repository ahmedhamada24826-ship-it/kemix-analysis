import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, isStaffRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FolderOpen, ArrowRight } from "lucide-react";
import { translate } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/locale-server";

const STATUS_COLORS: Record<string, string> = {
  PLANNING: "bg-gray-100 text-gray-600",
  ACTIVE: "bg-blue-100 text-blue-700",
  IN_REVIEW: "bg-yellow-100 text-yellow-700",
  DELIVERED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-200 text-gray-500",
  ON_HOLD: "bg-orange-100 text-orange-700",
};

const ROLE_LABELS: Record<string, string> = {
  LEAD: "projectLeadRole",
  MEMBER: "memberRole",
  VIEWER: "viewerRole",
  QA_REVIEWER: "qaReviewerRole",
};

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "planningStatus",
  ACTIVE: "activeStatus",
  IN_REVIEW: "inReviewStatus",
  DELIVERED: "deliveredStatus",
  CLOSED: "closedStatus",
  ON_HOLD: "onHoldStatus",
};

export default async function MyProjectsPage() {
  const locale = await getRequestLocale();
  const session = await getSession();
  if (!session) redirect("/auth/login");
  if (!isStaffRole(session.role)) redirect("/auth/login");

  const memberships = await prisma.projectMember.findMany({
    where: { userId: session.id },
    include: {
      project: {
        include: {
          client: { select: { id: true, name: session.role !== "TRAINEE", companyName: session.role !== "TRAINEE" } },
          leadStaff: { select: { id: true, name: true } },
          department: { select: { id: true, name: true, color: true } },
          _count: { select: { tasks: true, milestones: true } },
          ...(session.role !== "TRAINEE" ? { milestones: { select: { status: true } } } : {}),
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0b2545]">{translate(locale, "myProjects")}</h1>
        <p className="text-gray-500 mt-1">{translate(locale, "myProjectsHelp")}</p>
      </div>

      {memberships.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 text-center text-gray-400">
          <FolderOpen size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-medium text-lg">{translate(locale, "noAssignedProjects")}</p>
          <p className="text-sm mt-2">{translate(locale, "askManager")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {memberships.map(({ project, role }) => {
            const milestones = "milestones" in project ? project.milestones : [];
            const completedMilestones = milestones.filter((m) => m.status === "COMPLETED").length;
            const totalMilestones = milestones.length;
            const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

            return (
              <div key={project.id} className="bg-white rounded-xl border border-gray-200 hover:border-[#0066ff] hover:shadow-md transition-all">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-[11px] font-mono text-gray-400">{project.referenceNumber}</span>
                      {project.department && (
                        <span
                          className="ml-2 text-[11px] px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: project.department.color }}
                        >
                          {project.department.name}
                        </span>
                      )}
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${STATUS_COLORS[project.status] || "bg-gray-100 text-gray-600"}`}>
                      {translate(locale, STATUS_LABELS[project.status] || "unknownStatus")}
                    </span>
                  </div>

                  <h3 className="font-semibold text-[#0b2545] line-clamp-2">{project.title}</h3>
                  {session.role !== "TRAINEE" && <p className="text-sm text-gray-400 mt-1">{project.client.companyName || project.client.name}</p>}

                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    {/* Progress */}
                    {totalMilestones > 0 && (
                      <div>
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>{translate(locale, "milestones")}</span>
                          <span>{completedMilestones}/{totalMilestones} ({progress}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-[#0066ff] h-1.5 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{session.role === "TRAINEE" ? translate(locale, "assignedProject") : `${project._count.tasks} ${translate(locale, "tasksCount")}`}</span>
                      <span className="text-[#0066ff] font-medium">{translate(locale, ROLE_LABELS[role] || "memberRole")}</span>
                    </div>

                    {project.leadStaff && (
                      <p className="text-xs text-gray-400">{translate(locale, "lead")}: {project.leadStaff.name}</p>
                    )}
                  </div>
                </div>

                <div className="px-5 pb-4">
                  <Link
                    href={`/employee/projects/${project.id}`}
                    className="flex items-center justify-center gap-2 w-full py-2 text-sm text-[#0066ff] border border-[#0066ff]/30 rounded-lg hover:bg-[#0066ff] hover:text-white transition-colors"
                  >
                    {translate(locale, "viewProject")} <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
