import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isOperationsRole } from "@/lib/authorization";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !isOperationsRole(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 1. Total & Filtered Requests
    const totalRequests = await prisma.serviceRequest.count();
    const newRequestsCount = await prisma.serviceRequest.count({
      where: { status: "NEW_REQUEST" },
    });
    const unassignedRequestsCount = await prisma.serviceRequest.count({
      where: { assignedStaffId: null },
    });
    const inProgressRequestsCount = await prisma.serviceRequest.count({
      where: { status: "IN_PROGRESS" },
    });

    // 2. Projects
    const totalProjects = await prisma.project.count();
    const activeProjectsCount = await prisma.project.count({
      where: { status: "ACTIVE" },
    });

    // 3. Proposals
    const pendingProposalsCount = await prisma.proposal.count({
      where: { status: "SENT" },
    });
    const acceptedProposalsCount = await prisma.proposal.count({
      where: { status: "ACCEPTED" },
    });

    // 4. Support Tickets
    const openTicketsCount = await prisma.supportTicket.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_ON_CLIENT"] } },
    });

    // 5. Total Clients
    const totalClients = await prisma.user.count({
      where: { role: "CLIENT" },
    });

    // 6. Recent Audit Activity
    const recentActivity = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        actor: {
          select: { id: true, name: true, role: true, email: true },
        },
      },
    });

    // 7. Request Status Breakdown
    const statusCounts = await prisma.serviceRequest.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    return NextResponse.json({
      metrics: {
        totalRequests,
        newRequestsCount,
        unassignedRequestsCount,
        inProgressRequestsCount,
        totalProjects,
        activeProjectsCount,
        pendingProposalsCount,
        acceptedProposalsCount,
        openTicketsCount,
        totalClients,
      },
      statusBreakdown: statusCounts.map((s) => ({ status: s.status, count: s._count.id })),
      recentActivity,
    });
  } catch (error) {
    console.error("Admin metrics error:", error);
    return NextResponse.json({ error: "Failed to calculate metrics" }, { status: 500 });
  }
}
