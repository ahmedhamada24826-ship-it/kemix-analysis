import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isStaffRole } from "@/lib/auth";
import { sendNotification } from "@/lib/notifications";
import { canAccessProject, canReadInternalProjectDiscussion, isOperationsRole } from "@/lib/authorization";

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

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        request: { select: { id: true, referenceNumber: true, assignedStaffId: true } },
        project: { select: { id: true, referenceNumber: true, leadStaffId: true } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (!isStaff && conversation.clientId !== session.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (isStaff) {
      const canView = conversation.projectId
        ? session.role !== "TRAINEE" && await canAccessProject(session, conversation.projectId)
        : isOperationsRole(session.role) || session.role === "SUPPORT_AGENT" ||
          (session.role === "PROJECT_LEAD" && conversation.request?.assignedStaffId === session.id);
      if (!canView) return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const canViewInternal = conversation.projectId
      ? await canReadInternalProjectDiscussion(session, conversation.projectId)
      : isOperationsRole(session.role) || (session.role === "PROJECT_LEAD" && conversation.request?.assignedStaffId === session.id);

    // Mark messages as read
    if (isStaff) {
      await prisma.message.updateMany({
        where: { conversationId: id, readByStaff: false },
        data: { readByStaff: true },
      });
    } else {
      await prisma.message.updateMany({
        where: { conversationId: id, readByClient: false },
        data: { readByClient: true },
      });
    }

    // Fetch messages with strict staff note filtering
    const messages = await prisma.message.findMany({
      where: {
        conversationId: id,
        ...((isStaff && canViewInternal) ? {} : { isInternalStaffNote: false }),
      },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ messages, conversation });
  } catch (error) {
    console.error("Fetch messages error:", error);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

export async function POST(
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
    const body = await req.json();
    const { content, isInternalStaffNote = false } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0 || content.length > 10000) {
      return NextResponse.json({ error: "Message content cannot be empty." }, { status: 400 });
    }
    if (isInternalStaffNote !== undefined && typeof isInternalStaffNote !== "boolean") {
      return NextResponse.json({ error: "Internal note flag must be boolean" }, { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        request: true,
        project: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (!isStaff && conversation.clientId !== session.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (isStaff) {
      const canView = conversation.projectId
        ? session.role !== "TRAINEE" && await canAccessProject(session, conversation.projectId)
        : isOperationsRole(session.role) || session.role === "SUPPORT_AGENT" ||
          (session.role === "PROJECT_LEAD" && conversation.request?.assignedStaffId === session.id);
      if (!canView) return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // A client can NEVER create an internal staff note!
    const effectiveIsInternal = isStaff ? Boolean(isInternalStaffNote) : false;
    const canViewInternal = conversation.projectId
      ? await canReadInternalProjectDiscussion(session, conversation.projectId)
      : isOperationsRole(session.role) || (session.role === "PROJECT_LEAD" && conversation.request?.assignedStaffId === session.id);
    if (effectiveIsInternal && !canViewInternal) {
      return NextResponse.json({ error: "Only operations and project leads can post internal coordination notes." }, { status: 403 });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: session.id,
        content: content.trim(),
        isInternalStaffNote: effectiveIsInternal,
        readByClient: !isStaff,
        readByStaff: isStaff,
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    // Send notifications
    if (isStaff && !effectiveIsInternal) {
      // Staff replied publicly -> notify client
      await sendNotification({
        userId: conversation.clientId,
        title: "New Message from KEMIX Analysis",
        message: `${session.name}: "${content.trim().slice(0, 80)}..."`,
        link: conversation.projectId
          ? `/client/projects/${conversation.projectId}`
          : `/client/requests/${conversation.requestId}`,
        type: "MESSAGE",
      });
    } else if (!isStaff) {
      // Client sent message -> notify assigned staff or ops
      const targetStaffId =
        conversation.project?.leadStaffId ||
        conversation.request?.assignedStaffId;

      if (targetStaffId) {
        await sendNotification({
          userId: targetStaffId,
          title: `New Client Message: ${conversation.title}`,
          message: `${session.name}: "${content.trim().slice(0, 80)}..."`,
          link: `/admin/requests/${conversation.requestId || ""}`,
          type: "MESSAGE",
        });
      } else {
        // Broadcast to ops team
        const ops = await prisma.user.findMany({
          where: { role: { in: ["SUPER_ADMIN", "OPERATIONS_MANAGER"] } },
        });
        for (const op of ops) {
          await sendNotification({
            userId: op.id,
            title: `Client Message: ${conversation.title}`,
            message: `${session.name}: "${content.trim().slice(0, 80)}..."`,
            link: `/admin/requests/${conversation.requestId || ""}`,
            type: "MESSAGE",
          });
        }
      }
    } else if (effectiveIsInternal && conversation.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: conversation.projectId },
        select: {
          id: true,
          title: true,
          departmentId: true,
          leadStaffId: true,
          members: { where: { role: "LEAD" }, select: { userId: true } },
          workflowStages: { select: { assignedDepartmentId: true } },
        },
      });
      if (project) {
        const departmentIds = [...new Set([project.departmentId, ...project.workflowStages.map((stage) => stage.assignedDepartmentId)].filter((value): value is string => Boolean(value)))];
        const departments = departmentIds.length
          ? await prisma.department.findMany({ where: { id: { in: departmentIds } }, select: { leadUserId: true } })
          : [];
        const recipientIds = new Set([
          project.leadStaffId,
          ...project.members.map((member) => member.userId),
          ...departments.map((department) => department.leadUserId),
        ].filter((value): value is string => Boolean(value)));
        const managers = await prisma.user.findMany({
          where: { id: { in: [...recipientIds] }, role: { in: ["PROJECT_LEAD", "OPERATIONS_MANAGER", "SUPER_ADMIN"] }, status: "ACTIVE" },
          select: { id: true },
        });
        for (const manager of managers) {
          if (manager.id === session.id) continue;
          await sendNotification({
            userId: manager.id,
            title: `Project coordination: ${project.title}`,
            message: `${session.name} added an internal project message.`,
            link: `/admin/projects/${project.id}`,
            type: "MESSAGE",
          });
        }
      }
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
