import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isStaffRole } from "@/lib/auth";
import { canManageProject, canReadInternalProjectDiscussion, projectVisibilityWhere } from "@/lib/authorization";
import { logAudit, sendNotification } from "@/lib/notifications";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const canSeeInternal = await canReadInternalProjectDiscussion(session, id);

    const project = await prisma.project.findFirst({
      where: { id, ...projectVisibilityWhere(session) },
      include: {
        client: {
            select: { id: true, name: true, companyName: true, email: session.role === "SUPPORT_AGENT" || session.role === "SUPER_ADMIN" || session.role === "OPERATIONS_MANAGER" || session.role === "PROJECT_LEAD", phone: session.role === "SUPPORT_AGENT" || session.role === "SUPER_ADMIN" || session.role === "OPERATIONS_MANAGER" || session.role === "PROJECT_LEAD" },
        },
        leadStaff: {
          select: { id: true, name: true, role: true, email: session.role === "SUPER_ADMIN" || session.role === "OPERATIONS_MANAGER" || session.role === "SUPPORT_AGENT" || session.role === "PROJECT_LEAD" },
        },
        ...(session.role !== "TRAINEE" && session.role !== "ANALYST" ? { milestones: {
          orderBy: { orderIndex: "asc" },
        } } : {}),
        ...(session.role !== "TRAINEE" && session.role !== "ANALYST" ? { deliverables: {
          ...(["CLIENT", "SUPPORT_AGENT"].includes(session.role) ? { where: { isApproved: true } } : {}),
          orderBy: { publishedAt: "desc" },
        } } : {}),
        ...(session.role !== "TRAINEE" && session.role !== "ANALYST" ? { conversations: {
          include: {
            messages: {
              where: canSeeInternal ? {} : { isInternalStaffNote: false },
              orderBy: { createdAt: "asc" },
              include: {
                sender: { select: { id: true, name: true, role: true } },
              },
            },
          },
        } } : {}),
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (session.role === "SUPPORT_AGENT") {
      const { budget: _budget, qaOutcome: _qaOutcome, ...clientFacingProject } = project;
      void _budget;
      void _qaOutcome;
      return NextResponse.json({ project: clientFacingProject, canPostInternal: false });
    }
    if (session.role === "TRAINEE") {
      const { client: _client, leadStaff: _lead, description: _description, scopeOfWork: _scope, budget: _budget, qaOutcome: _qa, requestId: _requestId, clientId: _clientId, departmentId: _departmentId, workflowTemplateId: _workflowTemplateId, ...traineeProject } = project;
      void _client; void _lead; void _description; void _scope; void _budget; void _qa; void _requestId; void _clientId; void _departmentId; void _workflowTemplateId;
      return NextResponse.json({ project: traineeProject, canPostInternal: false });
    }
    return NextResponse.json({ project, canPostInternal: canSeeInternal });
  } catch (error) {
    console.error("Fetch project detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !isStaffRole(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    if (!(await canManageProject(session, id))) {
      return NextResponse.json({ error: "Only operations and the responsible department lead can update this project." }, { status: 403 });
    }
    const body = await req.json();
    const { status, targetDeliveryDate, actualDeliveryDate, leadStaffId, qaOutcome } = body;

    if (status !== undefined && !["PLANNING", "ACTIVE", "IN_REVIEW", "DELIVERED", "CLOSED", "ON_HOLD"].includes(status)) {
      return NextResponse.json({ error: "Invalid project status" }, { status: 400 });
    }
    for (const [field, value] of [["targetDeliveryDate", targetDeliveryDate], ["actualDeliveryDate", actualDeliveryDate]] as const) {
      if (value !== undefined && value !== null && (typeof value !== "string" || Number.isNaN(Date.parse(value)))) {
        return NextResponse.json({ error: `Invalid ${field}` }, { status: 400 });
      }
    }
    if (leadStaffId !== undefined && leadStaffId !== null && typeof leadStaffId !== "string") {
      return NextResponse.json({ error: "Invalid project lead" }, { status: 400 });
    }
    if (qaOutcome !== undefined && qaOutcome !== null && (typeof qaOutcome !== "string" || qaOutcome.length > 5000)) {
      return NextResponse.json({ error: "QA outcome must be text up to 5000 characters" }, { status: 400 });
    }

    const existingProject = await prisma.project.findUnique({ where: { id } });
    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (leadStaffId) {
      const candidate = await prisma.user.findUnique({ where: { id: leadStaffId }, select: { role: true, status: true, departmentId: true } });
      if (!candidate || candidate.role !== "PROJECT_LEAD" || candidate.status !== "ACTIVE") {
        return NextResponse.json({ error: "Project lead must be an active project lead." }, { status: 400 });
      }
      if (session.role === "PROJECT_LEAD" && candidate.departmentId !== session.departmentId) {
        return NextResponse.json({ error: "You can only assign a project lead from your department." }, { status: 403 });
      }
    }

    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (targetDeliveryDate !== undefined) dataToUpdate.targetDeliveryDate = targetDeliveryDate ? new Date(targetDeliveryDate) : null;
    if (actualDeliveryDate !== undefined) dataToUpdate.actualDeliveryDate = actualDeliveryDate ? new Date(actualDeliveryDate) : null;
    if (leadStaffId !== undefined) dataToUpdate.leadStaffId = leadStaffId || null;
    if (qaOutcome !== undefined) dataToUpdate.qaOutcome = qaOutcome;

    const updated = await prisma.project.update({
      where: { id },
      data: dataToUpdate,
    });

    if (status && status !== existingProject.status) {
      await sendNotification({
        userId: existingProject.clientId,
        title: `Project Status: ${status}`,
        message: `Project ${existingProject.referenceNumber} (${existingProject.title}) is now marked as ${status}.`,
        link: `/client/projects/${existingProject.id}`,
        type: "PROJECT",
      });
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    await logAudit({
      actorId: session.id,
      action: "UPDATE",
      entityType: "PROJECT",
      entityId: id,
      details: { status, leadStaffId },
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, project: updated });
  } catch (error) {
    console.error("Update project error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}
