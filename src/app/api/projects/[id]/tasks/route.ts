import { NextRequest, NextResponse } from "next/server";
import { getSession, isStaffRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, sendNotification } from "@/lib/notifications";
import { canAccessProject, canManageProject } from "@/lib/authorization";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaffRole(session.role) || session.role === "SUPPORT_AGENT") {
    return NextResponse.json({ error: "Internal project tasks are not available to this role." }, { status: 403 });
  }

  const { id } = await params;
  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status");
  const assigneeId = url.searchParams.get("assigneeId");
  const parentTaskId = url.searchParams.get("parentTaskId");

  try {
    if (!(await canAccessProject(session, id))) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const tasks = await prisma.task.findMany({
      where: {
        projectId: id,
        ...(session.role === "TRAINEE" ? { assigneeId: session.id } : {}),
        ...(statusFilter && { status: statusFilter }),
        ...(assigneeId && { assigneeId }),
        ...(parentTaskId ? { parentTaskId } : { parentTaskId: null }),
      },
      include: {
        assignee: { select: { id: true, name: true, email: session.role === "SUPER_ADMIN" || session.role === "OPERATIONS_MANAGER" || session.role === "PROJECT_LEAD" } },
        createdBy: { select: { id: true, name: true } },
        ...(session.role !== "TRAINEE" ? { _count: { select: { subTasks: true } } } : {}),
      },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ tasks });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await canManageProject(session, id))) return NextResponse.json({ error: "Only operations or the responsible department lead can create project tasks." }, { status: 403 });
  try {
    const body = await req.json();
    const { title, description, assigneeId, priority, dueDate, parentTaskId, stageId, orderIndex } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }
    if (title.trim().length > 200 || (description !== undefined && description !== null && (typeof description !== "string" || description.length > 10000))) {
      return NextResponse.json({ error: "Task title or description is too long" }, { status: 400 });
    }
    if (priority !== undefined && !["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority)) {
      return NextResponse.json({ error: "Invalid task priority" }, { status: 400 });
    }
    if (orderIndex !== undefined && (!Number.isInteger(orderIndex) || orderIndex < 0)) {
      return NextResponse.json({ error: "Invalid task order" }, { status: 400 });
    }
    if (dueDate !== undefined && dueDate !== null && (typeof dueDate !== "string" || Number.isNaN(Date.parse(dueDate)))) {
      return NextResponse.json({ error: "Invalid task due date" }, { status: 400 });
    }
    if (parentTaskId) {
      const parent = await prisma.task.findFirst({ where: { id: parentTaskId, projectId: id }, select: { id: true } });
      if (!parent) return NextResponse.json({ error: "Parent task must belong to this project" }, { status: 400 });
    }
    if (stageId) {
      const stage = await prisma.workflowStage.findFirst({ where: { id: stageId, projectId: id }, select: { id: true } });
      if (!stage) return NextResponse.json({ error: "Workflow stage must belong to this project" }, { status: 400 });
    }

    if (assigneeId) {
      const assignee = await prisma.user.findUnique({ where: { id: assigneeId }, select: { role: true, status: true, departmentId: true } });
      if (!assignee || assignee.role === "CLIENT" || assignee.status !== "ACTIVE") {
        return NextResponse.json({ error: "Tasks can only be assigned to active staff." }, { status: 400 });
      }
      if (session.role === "PROJECT_LEAD" && assignee.departmentId !== session.departmentId) {
        return NextResponse.json({ error: "You can only assign tasks to your department." }, { status: 403 });
      }
    }

    const task = await prisma.task.create({
      data: {
        projectId: id,
        title: title.trim(),
        description: description || null,
        assigneeId: assigneeId || null,
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        parentTaskId: parentTaskId || null,
        stageId: stageId || null,
        orderIndex: orderIndex ?? 0,
        createdById: session.id,
      },
      include: { assignee: { select: { id: true, name: true, email: true } } },
    });

    if (assigneeId) {
      await prisma.projectMember.upsert({
        where: { projectId_userId: { projectId: id, userId: assigneeId } },
        create: { projectId: id, userId: assigneeId, role: "MEMBER" },
        update: {},
      });
    }

    // Notify assignee
    if (assigneeId && assigneeId !== session.id) {
      const project = await prisma.project.findUnique({ where: { id }, select: { title: true } });
      await sendNotification({
        userId: assigneeId,
        title: "New Task Assigned",
        message: `You have been assigned "${task.title}" in project ${project?.title}`,
        type: "PROJECT",
        link: `/employee/tasks`,
      });
    }

    await logAudit({ actorId: session.id, action: "CREATE", entityType: "TASK", entityId: task.id, details: { title: task.title, projectId: id } });
    return NextResponse.json({ task }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
