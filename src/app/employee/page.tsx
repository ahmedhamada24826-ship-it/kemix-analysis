import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, isStaffRole } from "@/lib/auth";
import { translate } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/locale-server";
import { prisma } from "@/lib/prisma";
import {
  CheckSquare, Clock, TrendingUp, FolderOpen,
  AlertTriangle, Bell, ArrowRight, Calendar
} from "lucide-react";

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700 border border-red-200",
  HIGH: "bg-orange-100 text-orange-700 border border-orange-200",
  MEDIUM: "bg-blue-100 text-blue-700 border border-blue-200",
  LOW: "bg-gray-100 text-gray-600 border border-gray-200",
};

const STATUS_COLORS: Record<string, string> = {
  TODO: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  REVIEW: "bg-yellow-100 text-yellow-700",
  DONE: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-400",
};

const PROJECT_STATUS_COLORS: Record<string, string> = {
  PLANNING: "bg-gray-100 text-gray-600",
  ACTIVE: "bg-blue-100 text-blue-700",
  IN_REVIEW: "bg-yellow-100 text-yellow-700",
  DELIVERED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-500",
  ON_HOLD: "bg-orange-100 text-orange-700",
};

function getGreeting(name: string, locale: "en" | "ar") {
  const hour = new Date().getHours();
  const key = hour < 12 ? "employeeHelloMorning" : hour < 17 ? "employeeHelloAfternoon" : "employeeHelloEvening";
  const greeting = translate(locale, key);
  return `${greeting}, ${name.split(" ")[0]}`;
}

function formatDate(date: Date | null, locale: "en" | "ar") {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", { day: "numeric", month: "short" });
}

function isOverdue(date: Date | null) {
  if (!date) return false;
  return new Date(date) < new Date();
}

export default async function EmployeeDashboard() {
  const locale = await getRequestLocale();
  const session = await getSession();
  if (!session) redirect("/auth/login");
  if (!isStaffRole(session.role)) redirect("/auth/login");

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [myTasks, myProjectMembers, notifications, stats] = await Promise.all([
    prisma.task.findMany({
      where: { assigneeId: session.id, status: { notIn: ["DONE", "CANCELLED"] } },
      include: { project: { select: { id: true, referenceNumber: true, title: true } } },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      take: 10,
    }),
    prisma.projectMember.findMany({
      where: { userId: session.id },
      include: {
        project: {
          include: {
            client: { select: { id: true, name: session.role !== "TRAINEE", companyName: session.role !== "TRAINEE" } },
            _count: { select: { milestones: true, tasks: true } },
          },
        },
      },
      take: 5,
    }),
    prisma.notification.findMany({
      where: { userId: session.id, isRead: false },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    Promise.all([
      prisma.task.count({ where: { assigneeId: session.id, status: "TODO" } }),
      prisma.task.count({ where: { assigneeId: session.id, status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { assigneeId: session.id, status: "DONE", completedAt: { gte: weekAgo } } }),
      prisma.projectMember.count({ where: { userId: session.id } }),
    ]),
  ]);

  const [openTasks, inProgressTasks, completedThisWeek, myActiveProjects] = stats;
  const upcomingDeadlines = myTasks.filter((t) => t.dueDate && new Date(t.dueDate) <= weekFromNow);

  const statCards = [
    { label: translate(locale, "openTasks"), value: openTasks, icon: CheckSquare, color: "text-blue-600", bg: "bg-blue-50" },
    { label: translate(locale, "inProgress"), value: inProgressTasks, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
    { label: translate(locale, "doneThisWeek"), value: completedThisWeek, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: translate(locale, "activeProjects"), value: myActiveProjects, icon: FolderOpen, color: "text-[#0066ff]", bg: "bg-blue-50" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0b2545]">{getGreeting(session.name, locale)}</h1>
        <p className="text-gray-500 mt-1">Here&rsquo;s what&rsquo;s on your plate today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon className={color} size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0b2545]">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Tasks */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-[#0b2545]">{translate(locale, "tasks")}</h2>
            <Link href="/employee/tasks" className="text-[#0066ff] text-sm hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {myTasks.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <CheckSquare size={36} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">No tasks assigned to you</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {myTasks.map((task) => (
                <div key={task.id} className="px-6 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{task.project.title}</p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM}`}>
                    {task.priority}
                  </span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[task.status] || ""}`}>
                    {task.status.replace("_", " ")}
                  </span>
                  {task.dueDate && (
                    <span className={`text-[11px] flex items-center gap-1 flex-shrink-0 ${isOverdue(task.dueDate) ? "text-red-500" : "text-gray-400"}`}>
                      <Calendar size={11} />
                      {formatDate(task.dueDate, locale)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Deadlines + Notifications */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#0b2545] flex items-center gap-2">
                <AlertTriangle size={16} className="text-orange-500" />
                {translate(locale, "upcomingDeadlines")}
              </h2>
            </div>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No upcoming deadlines</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {upcomingDeadlines.slice(0, 5).map((task) => (
                  <div key={task.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{task.title}</p>
                      <p className="text-[11px] text-gray-400">{task.project.title}</p>
                    </div>
                    <span className={`text-[11px] font-semibold whitespace-nowrap ${isOverdue(task.dueDate) ? "text-red-500" : "text-orange-500"}`}>
                      {isOverdue(task.dueDate) ? translate(locale, "overdue") : formatDate(task.dueDate, locale)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#0b2545] flex items-center gap-2">
                <Bell size={16} className="text-[#0066ff]" />
                Notifications
              </h2>
            </div>
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">All caught up!</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((n) => (
                  <div key={n.id} className="px-5 py-3">
                    <p className="text-xs font-medium text-gray-800">{n.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* My Projects */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#0b2545]">{translate(locale, "myProjects")}</h2>
          <Link href="/employee/projects" className="text-[#0066ff] text-sm hover:underline flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {myProjectMembers.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <FolderOpen size={36} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">You haven&rsquo;t been assigned to any projects yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {myProjectMembers.map(({ project, role }) => (
              <Link
                key={project.id}
                href={`/admin/projects/${project.id}`}
                className="border border-gray-200 rounded-lg p-4 hover:border-[#0066ff] hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[11px] font-mono text-gray-400">{project.referenceNumber}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${PROJECT_STATUS_COLORS[project.status] || "bg-gray-100 text-gray-600"}`}>
                    {project.status}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-[#0b2545] group-hover:text-[#0066ff] transition-colors line-clamp-2">
                  {project.title}
                </h3>
                {session.role !== "TRAINEE" && <p className="text-xs text-gray-400 mt-1">{project.client.companyName || project.client.name}</p>}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-[11px] text-gray-400">{project._count.tasks} tasks</span>
                  <span className="text-[11px] text-[#0066ff] font-medium">{role}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
