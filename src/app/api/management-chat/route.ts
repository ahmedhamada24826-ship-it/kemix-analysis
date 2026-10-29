import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isOperationsRole } from "@/lib/authorization";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { logAudit, sendNotification } from "@/lib/notifications";

function canUseManagementChat(session: NonNullable<Awaited<ReturnType<typeof getSession>>>) {
  return isOperationsRole(session.role) || (session.role === "PROJECT_LEAD" && session.isDepartmentLead);
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canUseManagementChat(session)) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const messages = await prisma.managerMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { sender: { select: { id: true, name: true, role: true, department: { select: { name: true } } } } },
    });
    return NextResponse.json({ messages: messages.reverse() });
  } catch (error) {
    console.error("Management chat fetch error:", error);
    return NextResponse.json({ error: "Failed to load management chat" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canUseManagementChat(session)) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const rate = checkRateLimit(`management_chat_${session.id}`, 30, 60_000);
    if (!rate.success) return NextResponse.json({ error: "Too many messages. Please wait before sending again." }, { status: 429 });

    const body = await req.json();
    if (typeof body.content !== "string" || !body.content.trim() || body.content.length > 5000) {
      return NextResponse.json({ error: "Message must contain 1 to 5000 characters." }, { status: 400 });
    }

    const message = await prisma.managerMessage.create({
      data: { senderId: session.id, content: body.content.trim() },
      include: { sender: { select: { id: true, name: true, role: true, department: { select: { name: true } } } } },
    });
    await logAudit({
      actorId: session.id,
      action: "MANAGEMENT_MESSAGE_SENT",
      entityType: "MANAGEMENT_MESSAGE",
      entityId: message.id,
    });

    const recipients = await prisma.user.findMany({
      where: {
        status: "ACTIVE",
        id: { not: session.id },
        OR: [
          { role: { in: ["SUPER_ADMIN", "OPERATIONS_MANAGER"] } },
          { role: "PROJECT_LEAD", departmentLed: { some: {} } },
        ],
      },
      select: { id: true },
    });
    await Promise.all(recipients.map((recipient) => sendNotification({
      userId: recipient.id,
      title: "New management message",
      message: `${session.name}: ${body.content.trim().slice(0, 100)}`,
      link: "/admin/management-chat",
      type: "MESSAGE",
    })));

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Management chat send error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
