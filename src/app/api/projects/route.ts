import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { projectVisibilityWhere } from "@/lib/authorization";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where = projectVisibilityWhere(session);

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: { id: true, name: true, companyName: true, email: session.role === "SUPER_ADMIN" || session.role === "OPERATIONS_MANAGER" || session.role === "SUPPORT_AGENT" || session.role === "PROJECT_LEAD" },
        },
        leadStaff: {
          select: { id: true, name: true, role: true, email: session.role === "SUPER_ADMIN" || session.role === "OPERATIONS_MANAGER" || session.role === "SUPPORT_AGENT" || session.role === "PROJECT_LEAD" },
        },
        ...(session.role !== "TRAINEE" && session.role !== "ANALYST" ? { milestones: {
          orderBy: { orderIndex: "asc" },
        } } : {}),
        ...(session.role !== "TRAINEE" && session.role !== "ANALYST" ? { deliverables: {
          ...(["CLIENT", "SUPPORT_AGENT"].includes(session.role) ? { where: { isApproved: true } } : {}),
          orderBy: { createdAt: "desc" },
        } } : {}),
      },
    });

    const visibleProjects = session.role === "SUPPORT_AGENT"
      ? projects.map(({ budget: _budget, qaOutcome: _qaOutcome, ...project }) => {
          void _budget;
          void _qaOutcome;
          return project;
        })
      : session.role === "TRAINEE"
        ? projects.map(({ client: _client, leadStaff: _lead, budget: _budget, qaOutcome: _qa, requestId: _requestId, clientId: _clientId, departmentId: _departmentId, workflowTemplateId: _workflowTemplateId, ...project }) => {
            void _client; void _lead; void _budget; void _qa; void _requestId; void _clientId; void _departmentId; void _workflowTemplateId;
            return project;
          })
        : projects;
    return NextResponse.json({ projects: visibleProjects });
  } catch (error) {
    console.error("Fetch projects error:", error);
    return NextResponse.json({ error: "Failed to load projects" }, { status: 500 });
  }
}
