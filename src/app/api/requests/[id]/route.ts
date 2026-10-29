import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isStaffRole } from "@/lib/auth";
import { logAudit, sendNotification } from "@/lib/notifications";
import { canManageCustomerOperations, isOperationsRole } from "@/lib/authorization";

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
    const isStaff = isStaffRole(session.role);

    const request = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: isStaff,
            companyName: true,
            companySector: true,
            clientType: true,
          },
        },
        assignedStaff: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        proposals: {
          orderBy: { createdAt: "desc" },
        },
        projects: {
          include: {
            milestones: {
              orderBy: { orderIndex: "asc" },
            },
            deliverables: {
              orderBy: { createdAt: "desc" },
            },
          },
        },
        conversations: {
          include: {
            messages: {
              where: isOperationsRole(session.role) ? {} : { isInternalStaffNote: false },
              orderBy: { createdAt: "asc" },
              include: {
                sender: {
                  select: { id: true, name: true, role: true },
                },
              },
            },
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (isStaff && !canManageCustomerOperations(session.role) && session.role !== "PROJECT_LEAD") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    if (isStaff && !canManageCustomerOperations(session.role) && request.assignedStaffId !== session.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Security check: Client must own this request
    if (!isStaff && request.clientId !== session.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Internal operational notes are limited to operations and project leads.
    if (!isStaff || session.role === "SUPPORT_AGENT") {
      (request as any).internalNotes = undefined;
      for (const project of request.projects) {
        (project as any).budget = undefined;
        (project as any).qaOutcome = undefined;
        project.deliverables = project.deliverables.filter((deliverable) => deliverable.isApproved);
      }
    }

    return NextResponse.json({ request });
  } catch (error) {
    console.error("Fetch request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const isStaff = isStaffRole(session.role);
    const existingRequest = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!existingRequest) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    const canUpdate = canManageCustomerOperations(session.role) ||
      (session.role === "PROJECT_LEAD" && existingRequest.assignedStaffId === session.id);
    if (!canUpdate) {
      return NextResponse.json(
        { error: "Only authorized staff can update request status and assignments." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { status, assignedStaffId, consultationDate, followUpDate, internalNotes } = body;

    if (!isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const dataToUpdate: any = {};
    const auditChanges: Record<string, any> = {};

    if (status && status !== existingRequest.status) {
      dataToUpdate.status = status;
      auditChanges.oldStatus = existingRequest.status;
      auditChanges.newStatus = status;

      // Notify client about status transition
      await sendNotification({
        userId: existingRequest.clientId,
        title: `Request ${existingRequest.referenceNumber} Updated`,
        message: `Your request status has progressed to: ${status.replace(/_/g, " ")}.`,
        link: `/client/requests/${existingRequest.id}`,
        type: "REQUEST",
      });
    }

    if (assignedStaffId !== undefined) {
      dataToUpdate.assignedStaffId = assignedStaffId || null;
      auditChanges.assignedStaffId = assignedStaffId;

      if (assignedStaffId && assignedStaffId !== existingRequest.assignedStaffId) {
        await sendNotification({
          userId: assignedStaffId,
          title: `Request Assigned: ${existingRequest.referenceNumber}`,
          message: `You have been assigned to lead service request ${existingRequest.referenceNumber}.`,
          link: `/admin/requests/${existingRequest.id}`,
          type: "REQUEST",
        });
      }
    }

    if (consultationDate !== undefined) {
      dataToUpdate.consultationDate = consultationDate ? new Date(consultationDate) : null;
      auditChanges.consultationDate = consultationDate;

      if (consultationDate) {
        await sendNotification({
          userId: existingRequest.clientId,
          title: "Consultation Scheduled",
          message: `Your project consultation call is scheduled for ${new Date(consultationDate).toLocaleString()}.`,
          link: `/client/requests/${existingRequest.id}`,
          type: "REQUEST",
        });
      }
    }

    if (followUpDate !== undefined) {
      dataToUpdate.followUpDate = followUpDate ? new Date(followUpDate) : null;
    }

    if (internalNotes !== undefined) {
      dataToUpdate.internalNotes = internalNotes;
    }

    const updated = await prisma.serviceRequest.update({
      where: { id },
      data: dataToUpdate,
    });

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    await logAudit({
      actorId: session.id,
      action: "UPDATE",
      entityType: "REQUEST",
      entityId: id,
      details: auditChanges,
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (error) {
    console.error("Update request error:", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}
