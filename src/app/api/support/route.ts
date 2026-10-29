import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isStaffRole } from "@/lib/auth";
import { sendNotification } from "@/lib/notifications";
import { canManageCustomerOperations } from "@/lib/authorization";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (isStaffRole(session.role) && !canManageCustomerOperations(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const isStaff = canManageCustomerOperations(session.role);
    const where = isStaff ? {} : { clientId: session.id };

    const [tickets, supportAgents] = await Promise.all([prisma.supportTicket.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        client: {
          select: { id: true, name: true, companyName: true, email: true },
        },
        assignedStaff: {
          select: { id: true, name: true, role: true },
        },
        replies: {
          where: session.role === "CLIENT" ? { isInternal: false } : undefined,
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }), isStaff ? prisma.user.findMany({
      where: { role: "SUPPORT_AGENT", status: "ACTIVE" },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }) : Promise.resolve([])]);

    return NextResponse.json({ tickets, supportAgents });
  } catch (error) {
    console.error("Fetch tickets error:", error);
    return NextResponse.json({ error: "Failed to load support tickets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (isStaffRole(session.role)) return NextResponse.json({ error: "Only clients can open support tickets." }, { status: 403 });

    const body = await req.json();
    const { subject, category, priority = "MEDIUM", message } = body;

    if (!subject || !category || !message) {
      return NextResponse.json(
        { error: "Subject, category, and initial message are required." },
        { status: 400 }
      );
    }

    const year = new Date().getFullYear();
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `TKT-${year}-${randomHex}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        clientId: session.id,
        subject,
        category,
        priority,
        status: "OPEN",
        replies: {
          create: {
            senderId: session.id,
            content: message,
            isInternal: false,
          },
        },
      },
    });

    // Notify support staff
    const supportStaff = await prisma.user.findMany({
      where: { role: { in: ["SUPPORT_AGENT", "OPERATIONS_MANAGER", "SUPER_ADMIN"] } },
    });

    for (const staff of supportStaff) {
      await sendNotification({
        userId: staff.id,
        title: `New Support Ticket: ${ticketNumber}`,
        message: `${session.name}: ${subject}`,
        link: `/admin/support/${ticket.id}`,
        type: "SUPPORT",
      });
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error("Create ticket error:", error);
    return NextResponse.json({ error: "Failed to create support ticket" }, { status: 500 });
  }
}
