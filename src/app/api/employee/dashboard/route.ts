import { NextRequest, NextResponse } from "next/server";
import { getSession, isStaffRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaffRole(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [myTasks, myProjects, notifications, openTasks, inProgressTasks, completedThisWeek] = await Promise.all([
      prisma.task.findMany({
        where: { assigneeId: session.id, status: { notIn: ["DONE", "CANCELLED"] } },
        include: {
          project: { select: { id: true, referenceNumber: true, title: true } },
        },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: 10,
      }),
      prisma.projectMember.findMany({
        where: { userId: session.id },
        include: {
          project: {
            include: {
              client: { select: { id: true, name: session.role !== "TRAINEE", companyName: session.role !== "TRAINEE" } },
              leadStaff: { select: { id: true, name: true } },
              _count: { select: { milestones: true, tasks: true } },
            },
          },
        },
        take: 10,
      }),
      prisma.notification.findMany({
        where: { userId: session.id, isRead: false },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.task.count({ where: { assigneeId: session.id, status: "TODO" } }),
      prisma.task.count({ where: { assigneeId: session.id, status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { assigneeId: session.id, status: "DONE", completedAt: { gte: weekAgo } } }),
    ]);

    const upcomingDeadlines = myTasks.filter(
      (t) => t.dueDate && t.dueDate <= weekFromNow
    );

    return NextResponse.json({
      myTasks,
      myProjects: myProjects.map((m) => ({ ...m.project, myRole: m.role })),
      upcomingDeadlines,
      notifications,
      stats: {
        openTasks,
        inProgressTasks,
        completedThisWeek,
        myActiveProjects: myProjects.length,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
