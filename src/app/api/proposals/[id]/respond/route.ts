import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit, sendNotification } from "@/lib/notifications";

function departmentForService(serviceType: string | undefined): string {
  const value = (serviceType || "").toLowerCase();
  if (/forecast|data science|predictive|machine learning/.test(value)) return "Data Science & AI";
  if (/engineering|automation|etl|pipeline|sql/.test(value)) return "Data Engineering";
  if (/business intelligence|power bi|dashboard/.test(value)) return "Business Intelligence";
  return "Data Analysis";
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
    const body = await req.json();
    const { action } = body; // "ACCEPT" | "REJECT"

    if (action !== "ACCEPT" && action !== "REJECT") {
      return NextResponse.json({ error: "Invalid action. Must be ACCEPT or REJECT." }, { status: 400 });
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        client: true,
        request: true,
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Client authorization check
    if (proposal.clientId !== session.id) {
      return NextResponse.json(
        { error: "Access denied. Only the authorized client can respond to this proposal." },
        { status: 403 }
      );
    }

    if (proposal.status === "ACCEPTED") {
      return NextResponse.json(
        { error: "This proposal has already been formally accepted." },
        { status: 400 }
      );
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const now = new Date();

    if (action === "ACCEPT") {
      // 1. Update Proposal with audit details
      const updatedProposal = await prisma.proposal.update({
        where: { id },
        data: {
          status: "ACCEPTED",
          acceptedAt: now,
          acceptedByUserId: session.id,
        },
      });

      // 2. Update linked service request status to APPROVED
      if (proposal.requestId) {
        await prisma.serviceRequest.update({
          where: { id: proposal.requestId },
          data: { status: "APPROVED" },
        });
      }

      // 3. Automatically create an active Project record
      const year = now.getFullYear();
      const randomHex = Math.floor(1000 + Math.random() * 9000);
      const projectRef = `PRJ-${year}-${randomHex}`;
      const serviceDepartment = await prisma.department.findUnique({ where: { name: departmentForService(proposal.request?.serviceType) }, select: { id: true } });
      const assignedLead = proposal.request?.assignedStaffId
        ? await prisma.user.findUnique({ where: { id: proposal.request.assignedStaffId }, select: { departmentId: true } })
        : null;

      const project = await prisma.project.create({
        data: {
          referenceNumber: projectRef,
          requestId: proposal.requestId || null,
          clientId: session.id,
          title: proposal.title,
          description: proposal.scopeSummary,
          scopeOfWork: proposal.scopeSummary,
          leadStaffId: proposal.request?.assignedStaffId || null,
          departmentId: serviceDepartment?.id || assignedLead?.departmentId || null,
          status: "ACTIVE",
          startDate: now,
          targetDeliveryDate: new Date(now.getTime() + proposal.timelineDays * 24 * 3600 * 1000),
          budget: proposal.price,
        },
      });

      // Every accepted project gets one shared thread: public replies stay visible to
      // the client, while internal staff notes are reserved for project coordination.
      await prisma.conversation.create({
        data: {
          title: `Project discussion: ${project.title}`,
          requestId: proposal.requestId || null,
          projectId: project.id,
          clientId: session.id,
        },
      });

      // 4. Create standard kickoff milestones
      await prisma.milestone.createMany({
        data: [
          {
            projectId: project.id,
            title: "Data Handover & Security Isolation",
            description: "Client provides sample data extracts or secure read-only credentials.",
            dueDate: new Date(now.getTime() + 3 * 24 * 3600 * 1000),
            status: "IN_PROGRESS",
            orderIndex: 1,
          },
          {
            projectId: project.id,
            title: "Model Development & Core Implementation",
            description: "Data transformation, metric validation, and analytical pipeline construction.",
            dueDate: new Date(now.getTime() + Math.floor(proposal.timelineDays * 0.6) * 24 * 3600 * 1000),
            status: "PENDING",
            orderIndex: 2,
          },
          {
            projectId: project.id,
            title: "Executive Review, QA & Delivery Handover",
            description: "Final validation, dashboard publication, and team walkthrough.",
            dueDate: new Date(now.getTime() + proposal.timelineDays * 24 * 3600 * 1000),
            status: "PENDING",
            orderIndex: 3,
          },
        ],
      });

      // 5. Notify Staff Leaders
      const opsTeam = await prisma.user.findMany({
        where: { role: { in: ["SUPER_ADMIN", "OPERATIONS_MANAGER", "PROJECT_LEAD"] } },
      });

      for (const staff of opsTeam) {
        await sendNotification({
          userId: staff.id,
          title: `Proposal Accepted! (${proposal.referenceNumber})`,
          message: `${session.name} accepted proposal ${proposal.referenceNumber} ($${proposal.price}). Project ${projectRef} has been initiated.`,
          link: `/admin/projects/${project.id}`,
          type: "PROPOSAL",
        });
      }

      await logAudit({
        actorId: session.id,
        action: "APPROVE",
        entityType: "PROPOSAL",
        entityId: proposal.id,
        details: {
          referenceNumber: proposal.referenceNumber,
          version: proposal.version,
          price: proposal.price,
          projectReference: projectRef,
          acceptedAt: now.toISOString(),
        },
        ipAddress: ip,
      });

      return NextResponse.json({
        success: true,
        message: "Proposal successfully accepted. Project has been created.",
        proposal: updatedProposal,
        projectId: project.id,
      });
    } else {
      // Rejection
      const updatedProposal = await prisma.proposal.update({
        where: { id },
        data: { status: "REJECTED" },
      });

      const opsTeam = await prisma.user.findMany({
        where: { role: { in: ["SUPER_ADMIN", "OPERATIONS_MANAGER"] } },
      });

      for (const staff of opsTeam) {
        await sendNotification({
          userId: staff.id,
          title: `Proposal Declined (${proposal.referenceNumber})`,
          message: `${session.name} declined proposal ${proposal.referenceNumber}. Follow up may be required.`,
          link: `/admin/proposals`,
          type: "PROPOSAL",
        });
      }

      await logAudit({
        actorId: session.id,
        action: "REJECT",
        entityType: "PROPOSAL",
        entityId: proposal.id,
        details: { referenceNumber: proposal.referenceNumber },
        ipAddress: ip,
      });

      return NextResponse.json({
        success: true,
        message: "Proposal response recorded.",
        proposal: updatedProposal,
      });
    }
  } catch (error) {
    console.error("Proposal respond error:", error);
    return NextResponse.json({ error: "Failed to process proposal response" }, { status: 500 });
  }
}
