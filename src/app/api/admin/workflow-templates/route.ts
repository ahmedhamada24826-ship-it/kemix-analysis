import { NextRequest, NextResponse } from "next/server";
import { getSession, checkPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/notifications";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!checkPermission(session.role, ["SUPER_ADMIN", "OPERATIONS_MANAGER", "PROJECT_LEAD"])) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const templates = await prisma.workflowTemplate.findMany({
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
    return NextResponse.json({ templates });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!checkPermission(session.role, ["SUPER_ADMIN"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, serviceType, description, stages, isDefault } = body;

    if (!name || !stages || !Array.isArray(stages) || stages.length === 0) {
      return NextResponse.json({ error: "name and stages (array) are required" }, { status: 400 });
    }

    // If this is marked default, unmark others
    if (isDefault) {
      await prisma.workflowTemplate.updateMany({ data: { isDefault: false } });
    }

    const template = await prisma.workflowTemplate.create({
      data: {
        name,
        serviceType: serviceType || null,
        description: description || null,
        stages: JSON.stringify(stages),
        isDefault: isDefault ?? false,
      },
    });

    await logAudit({ actorId: session.id, action: "CREATE", entityType: "WORKFLOW_TEMPLATE", entityId: template.id, details: { name } });
    return NextResponse.json({ template }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
