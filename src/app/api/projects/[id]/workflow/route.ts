import { NextRequest, NextResponse } from "next/server";
import { getSession, isStaffRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/notifications";
import { canAccessProject, isOperationsRole } from "@/lib/authorization";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaffRole(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!(await canAccessProject(session, id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const stageScope = session.role === "TRAINEE"
      ? { assignedUserId: session.id }
      : session.role === "ANALYST"
        ? { OR: [{ assignedUserId: session.id }, ...(session.departmentId ? [{ assignedDepartmentId: session.departmentId }] : [])] }
        : {};
    const stages = await prisma.workflowStage.findMany({
      where: { projectId: id, ...stageScope },
      include: {
        assignedDepartment: { select: { id: true, name: true, color: true } },
        assignedUser: { select: { id: true, name: true, email: !["TRAINEE", "ANALYST"].includes(session.role) } },
        submittedBy: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { orderIndex: "asc" },
    });
    return NextResponse.json({ stages });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isOperationsRole(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const { templateId } = await req.json();
    if (!templateId) return NextResponse.json({ error: "templateId is required" }, { status: 400 });

    const template = await prisma.workflowTemplate.findUnique({ where: { id: templateId } });
    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    let templateStages: Array<{ key: string; title: string; description?: string; assignedDepartmentKey?: string }>;
    try {
      templateStages = JSON.parse(template.stages);
    } catch {
      return NextResponse.json({ error: "Workflow template contains invalid stage data." }, { status: 400 });
    }
    if (!Array.isArray(templateStages) || templateStages.length === 0 || templateStages.some((stage) => !stage.key || !stage.title)) {
      return NextResponse.json({ error: "Workflow template must include valid stages." }, { status: 400 });
    }

    const departments = await prisma.department.findMany({ where: { isActive: true }, select: { id: true, name: true } });
    const stageDepartmentIds = templateStages.map((stage) => {
      if (!stage.assignedDepartmentKey) return project.departmentId;
      const key = stage.assignedDepartmentKey.trim().toLowerCase();
      const department = departments.find((item) => item.id === stage.assignedDepartmentKey || item.name.toLowerCase() === key);
      return department?.id || null;
    });
    if (templateStages.some((stage, index) => Boolean(stage.assignedDepartmentKey) && !stageDepartmentIds[index])) {
      return NextResponse.json({ error: "A workflow stage references a department that is missing or inactive." }, { status: 400 });
    }

    // Create stages
    const stageData = templateStages.map((s, idx) => ({
      projectId: id,
      templateStageKey: s.key,
      title: s.title,
      description: s.description || null,
      orderIndex: idx,
      status: idx === 0 ? "ACTIVE" : "PENDING",
      assignedDepartmentId: stageDepartmentIds[idx],
    }));

    await prisma.$transaction(async (tx) => {
      await tx.workflowStage.deleteMany({ where: { projectId: id } });
      await tx.workflowStage.createMany({ data: stageData });
      await tx.project.update({ where: { id }, data: { workflowTemplateId: templateId } });
    });

    const stages = await prisma.workflowStage.findMany({
      where: { projectId: id },
      orderBy: { orderIndex: "asc" },
    });

    await logAudit({ actorId: session.id, action: "CREATE", entityType: "PROJECT", entityId: id, details: { action: "workflow_initialized", templateId } });
    return NextResponse.json({ stages }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
