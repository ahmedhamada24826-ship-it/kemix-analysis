import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isStaffRole } from "@/lib/auth";
import { sendNotification } from "@/lib/notifications";
import { canManageCustomerOperations } from "@/lib/authorization";

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
    const isStaff = canManageCustomerOperations(session.role);

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, name: true, companyName: true, email: true },
        },
        assignedStaff: {
          select: { id: true, name: true, role: true },
        },
        replies: {
          where: isStaff ? {} : { isInternal: false }, // Client CANNOT see internal staff replies
          orderBy: { createdAt: "asc" },
          include: {
            sender: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (isStaffRole(session.role) && !isStaff) return NextResponse.json({ error: "Access denied" }, { status: 403 });
    if (!isStaff && ticket.clientId !== session.id) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Fetch ticket detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Post a reply to ticket
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const isStaff = canManageCustomerOperations(session.role);
    const body = await req.json();
    const { content, isInternal = false } = body;

    if (typeof content !== "string" || content.trim().length === 0 || content.length > 10000) {
      return NextResponse.json({ error: "Reply content cannot be empty." }, { status: 400 });
    }
    if (typeof isInternal !== "boolean") return NextResponse.json({ error: "Internal note flag must be boolean" }, { status: 400 });

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (isStaffRole(session.role) && !isStaff) return NextResponse.json({ error: "Access denied" }, { status: 403 });
    if (session.role === "SUPPORT_AGENT" && ticket.assignedStaffId && ticket.assignedStaffId !== session.id) {
      return NextResponse.json({ error: "This ticket is assigned to another support agent" }, { status: 403 });
    }

    if (!isStaff && ticket.clientId !== session.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const reply = await prisma.ticketReply.create({
      data: {
        ticketId: id,
        senderId: session.id,
        content: content.trim(),
        isInternal: isStaff ? Boolean(isInternal) : false,
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    // Update ticket timestamp & status
    await prisma.supportTicket.update({
      where: { id },
      data: {
        updatedAt: new Date(),
        ...(!isStaff ? { status: "IN_PROGRESS" } : !isInternal ? { status: "WAITING_ON_CLIENT" } : {}),
      },
    });

    // Notify other party
    if (isStaff && !isInternal) {
      await sendNotification({
        userId: ticket.clientId,
        title: `Reply on Ticket ${ticket.ticketNumber}`,
        message: `${session.name}: "${content.trim().slice(0, 80)}..."`,
        link: `/client/support/${ticket.id}`,
        type: "SUPPORT",
      });
    } else if (!isStaff) {
      if (ticket.assignedStaffId) {
        await sendNotification({
          userId: ticket.assignedStaffId,
          title: `Client Reply on Ticket ${ticket.ticketNumber}`,
          message: `${session.name}: "${content.trim().slice(0, 80)}..."`,
          link: `/admin/support/${ticket.id}`,
          type: "SUPPORT",
        });
      }
    }

    return NextResponse.json({ success: true, reply });
  } catch (error) {
    console.error("Reply ticket error:", error);
    return NextResponse.json({ error: "Failed to post reply" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !canManageCustomerOperations(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, priority, assignedStaffId, resolutionNotes } = body;

    if (status !== undefined && !["OPEN", "IN_PROGRESS", "WAITING_ON_CLIENT", "RESOLVED", "CLOSED"].includes(status)) {
      return NextResponse.json({ error: "Invalid ticket status" }, { status: 400 });
    }
    if (priority !== undefined && !["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority)) {
      return NextResponse.json({ error: "Invalid ticket priority" }, { status: 400 });
    }
    if (resolutionNotes !== undefined && resolutionNotes !== null && (typeof resolutionNotes !== "string" || resolutionNotes.length > 5000)) {
      return NextResponse.json({ error: "Resolution notes must be text up to 5000 characters" }, { status: 400 });
    }

    const current = await prisma.supportTicket.findUnique({ where: { id }, select: { id: true, assignedStaffId: true } });
    if (!current) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    if (session.role === "SUPPORT_AGENT" && current.assignedStaffId && current.assignedStaffId !== session.id) {
      return NextResponse.json({ error: "This ticket is assigned to another support agent" }, { status: 403 });
    }
    if (assignedStaffId !== undefined && assignedStaffId !== null && assignedStaffId !== "") {
      if (typeof assignedStaffId !== "string") return NextResponse.json({ error: "Invalid support agent" }, { status: 400 });
      const agent = await prisma.user.findFirst({ where: { id: assignedStaffId, role: "SUPPORT_AGENT", status: "ACTIVE" }, select: { id: true } });
      if (!agent) return NextResponse.json({ error: "Tickets can only be assigned to active support agents" }, { status: 400 });
      if (session.role === "SUPPORT_AGENT" && assignedStaffId !== session.id) {
        return NextResponse.json({ error: "Support agents can assign tickets to themselves only" }, { status: 403 });
      }
    }
    if (session.role === "SUPPORT_AGENT" && assignedStaffId === "") {
      return NextResponse.json({ error: "Support agents cannot unassign tickets" }, { status: 403 });
    }

    const dataToUpdate: any = {};
    if (status !== undefined) dataToUpdate.status = status;
    if (priority !== undefined) dataToUpdate.priority = priority;
    if (assignedStaffId !== undefined) dataToUpdate.assignedStaffId = assignedStaffId || null;
    if (resolutionNotes !== undefined) dataToUpdate.resolutionNotes = resolutionNotes;

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, ticket: updated });
  } catch (error) {
    console.error("Update ticket error:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}
