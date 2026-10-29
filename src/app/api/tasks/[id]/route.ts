import { NextRequest, NextResponse } from "next/server";
import { getSession, isStaffRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, sendNotification } from "@/lib/notifications";
import { canAccessProject, canManageProject } from "@/lib/authorization";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaffRole(session.role) || session.role === "SUPPORT_AGENT") return NextResponse.json({ error: "Internal project tasks are not available to this role." }, { status: 403 });

  const { id } = await params;
  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, email: session.role !== "TRAINEE" && session.role !== "ANALYST" && session.role !== "CLIENT" } },
        createdBy: { select: { id: true, name: true } },
        subTasks: { where: session.role === "TRAINEE" ? { assigneeId: session.id } : undefined, include: { assignee: { select: { id: true, name: true } } } },
        project: { select: { id: true, referenceNumber: true, title: true, clientId: session.role !== "TRAINEE" } },
      },
    });

    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    if (!(await canAccessProject(session, task.project.id))) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    if (session.role === "TRAINEE" && task.assigneeId !== session.id) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    return NextResponse.json({ task });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaffRole(session.role) || session.role === "SUPPORT_AGENT") return NextResponse.json({ error: "Only project staff can update project tasks." }, { status: 403 });

  const { id } = await params;
  try {
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { project: { select: { clientId: true } } },
    });
    if (!existingTask) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    // Only staff or the assignee can update
    const isAssignee = existingTask.assigneeId === session.id;
    const canManage = await canManageProject(session, existingTask.projectId);
    if (!(await canAccessProject(session, existingTask.projectId)) || (!canManage && !isAssignee)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, status, priority, assigneeId, dueDate, orderIndex } = body;
    if (status !== undefined && !["TODO", "IN_PROGRESS", "REVIEW", "DONE", "CANCELLED"].includes(status)) {
      return NextResponse.json({ error: "Invalid task status" }, { status: 400 });
    }
    if (title !== undefined && (typeof title !== "string" || !title.trim() || title.trim().length > 200)) {
      return NextResponse.json({ error: "Task title must contain 1 to 200 characters" }, { status: 400 });
    }
    if (description !== undefined && description !== null && (typeof description !== "string" || description.length > 10000)) {
      return NextResponse.json({ error: "Task description is too long" }, { status: 400 });
    }
    if (!canManage && (title !== undefined || description !== undefined || priority !== undefined || assigneeId !== undefined || dueDate !== undefined || orderIndex !== undefined)) {
      return NextResponse.json({ error: "Assignees can update task status only." }, { status: 403 });
    }
    if (!canManage && status === "CANCELLED") return NextResponse.json({ error: "Only a project lead can cancel a task." }, { status: 403 });
    if (priority !== undefined && !["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority)) {
      return NextResponse.json({ error: "Invalid task priority" }, { status: 400 });
    }
    if (orderIndex !== undefined && (!Number.isInteger(orderIndex) || orderIndex < 0)) {
      return NextResponse.json({ error: "Invalid task order" }, { status: 400 });
    }
    if (dueDate !== undefined && dueDate !== null && (typeof dueDate !== "string" || Number.isNaN(Date.parse(dueDate)))) {
      return NextResponse.json({ error: "Invalid task due date" }, { status: 400 });
    }
    if (canManage && assigneeId) {
      const assignee = await prisma.user.findUnique({ where: { id: assigneeId }, select: { role: true, status: true, departmentId: true } });
      if (!assignee || assignee.role === "CLIENT" || assignee.status !== "ACTIVE") return NextResponse.json({ error: "Tasks can only be assigned to active staff." }, { status: 400 });
      if (session.role === "PROJECT_LEAD" && assignee.departmentId !== session.departmentId) return NextResponse.json({ error: "You can only assign tasks to your department." }, { status: 403 });
    }

    const previousStatus = existingTask.status;
    const completedAt = status === "DONE" && previousStatus !== "DONE" ? new Date() : existingTask.completedAt;

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(orderIndex !== undefined && { orderIndex }),
        completedAt,
      },
      include: { assignee: { select: { id: true, name: true } } },
    });

    // Notify on status change
    if (status && status !== previousStatus) {
      await logAudit({ actorId: session.id, action: "STATUS_CHANGE", entityType: "TASK", entityId: id, details: { from: previousStatus, to: status } });

      if (task.assigneeId && task.assigneeId !== session.id) {
        await sendNotification({
          userId: task.assigneeId,
          title: "Task Status Updated",
          message: `Task "${task.title}" status changed to ${status}`,
          type: "PROJECT",
        });
      }
    }

    // Notify new assignee
    if (assigneeId && assigneeId !== existingTask.assigneeId && assigneeId !== session.id) {
      await sendNotification({
        userId: assigneeId,
        title: "Task Assigned to You",
        message: `You have been assigned task "${task.title}"`,
        type: "PROJECT",
        link: `/employee/tasks`,
      });
    }

    return NextResponse.json({ task });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaffRole(session.role)) return NextResponse.json({ error: "Only staff accounts can delete project tasks." }, { status: 403 });
  const { id } = await params;
  try {
    const task = await prisma.task.findUnique({ where: { id }, select: { id: true, title: true, projectId: true } });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    if (!(await canManageProject(session, task.projectId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.task.delete({ where: { id } });
    await logAudit({ actorId: session.id, action: "DELETE", entityType: "TASK", entityId: id, details: { title: task.title } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
