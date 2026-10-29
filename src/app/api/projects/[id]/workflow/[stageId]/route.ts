import { NextRequest, NextResponse } from "next/server";
import { getSession, isStaffRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, sendNotification } from "@/lib/notifications";
import { canAccessProject, canManageProject } from "@/lib/authorization";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; stageId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaffRole(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: projectId, stageId } = await params;
  if (!(await canAccessProject(session, projectId))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const stage = await prisma.workflowStage.findUnique({
      where: { id: stageId },
      include: {
        assignedDepartment: { select: { id: true, name: true, color: true } },
        assignedUser: { select: { id: true, name: true, email: !["TRAINEE", "ANALYST"].includes(session.role) } },
        submittedBy: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } },
        tasks: { where: session.role === "TRAINEE" ? { assigneeId: session.id } : undefined, include: { assignee: { select: { id: true, name: true } } } },
      },
    });
    if (!stage || stage.projectId !== projectId) return NextResponse.json({ error: "Stage not found" }, { status: 404 });
    if (session.role === "TRAINEE" && stage.assignedUserId !== session.id) return NextResponse.json({ error: "Stage not found" }, { status: 404 });
    if (session.role === "ANALYST" && stage.assignedUserId !== session.id && stage.assignedDepartmentId !== session.departmentId) return NextResponse.json({ error: "Stage not found" }, { status: 404 });
    return NextResponse.json({ stage });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; stageId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaffRole(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: projectId, stageId } = await params;
  if (!(await canAccessProject(session, projectId))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const body = await req.json();
    const { status, assignedUserId, assignedDepartmentId, reviewNotes } = body;

    const existingStage = await prisma.workflowStage.findUnique({ where: { id: stageId } });
    if (!existingStage || existingStage.projectId !== projectId) return NextResponse.json({ error: "Stage not found" }, { status: 404 });
    const canManage = await canManageProject(session, projectId);
    const isAssigned = existingStage.assignedUserId === session.id ||
      (Boolean(session.departmentId) && existingStage.assignedDepartmentId === session.departmentId);
    if (!canManage && (!isAssigned || (status !== "SUBMITTED" && status !== existingStage.status) || assignedUserId !== undefined || assignedDepartmentId !== undefined)) {
      return NextResponse.json({ error: "Only the assigned team can submit this stage; project leads control review and assignment." }, { status: 403 });
    }

    const previousStatus = existingStage.status;
    const updateData: Record<string, unknown> = {};

    if (assignedUserId !== undefined) updateData.assignedUserId = assignedUserId || null;
    if (assignedDepartmentId !== undefined) updateData.assignedDepartmentId = assignedDepartmentId || null;
    if (reviewNotes !== undefined) updateData.reviewNotes = reviewNotes;

    if (status && status !== previousStatus) {
      updateData.status = status;

      if (status === "SUBMITTED") {
        updateData.submittedAt = new Date();
        updateData.submittedByUserId = session.id;
      }

      if (status === "APPROVED") {
        updateData.reviewedAt = new Date();
        updateData.reviewedByUserId = session.id;

        // Activate next stage
        const nextStage = await prisma.workflowStage.findFirst({
          where: { projectId, orderIndex: { gt: existingStage.orderIndex }, status: "PENDING" },
          orderBy: { orderIndex: "asc" },
        });
        if (nextStage) {
          await prisma.workflowStage.update({ where: { id: nextStage.id }, data: { status: "ACTIVE" } });
        } else {
          // All stages complete — update project status
          await prisma.project.update({ where: { id: projectId }, data: { status: "IN_REVIEW" } });
        }
      }

      if (status === "REJECTED") {
        if (!reviewNotes && !body.reviewNotes) {
          return NextResponse.json({ error: "Review notes are required when rejecting a stage" }, { status: 400 });
        }
        updateData.reviewedAt = new Date();
        updateData.reviewedByUserId = session.id;
      }

      // Notify assigned user on stage transitions
      if (existingStage.assignedUserId && existingStage.assignedUserId !== session.id) {
        await sendNotification({
          userId: existingStage.assignedUserId,
          title: `Stage ${status}: ${existingStage.title}`,
          message: `Workflow stage "${existingStage.title}" has been marked as ${status}.`,
          type: "PROJECT",
          link: `/admin/projects/${projectId}`,
        });
      }

      await logAudit({ actorId: session.id, action: "STATUS_CHANGE", entityType: "STAGE", entityId: stageId, details: { from: previousStatus, to: status, projectId } });
    }

    const stage = await prisma.workflowStage.update({ where: { id: stageId }, data: updateData });
    return NextResponse.json({ stage });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
