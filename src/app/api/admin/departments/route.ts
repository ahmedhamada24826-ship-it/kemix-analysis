import { NextRequest, NextResponse } from "next/server";
import { getSession, checkPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/notifications";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!checkPermission(session.role, ["SUPER_ADMIN", "OPERATIONS_MANAGER", "PROJECT_LEAD"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (session.role === "PROJECT_LEAD" && !session.isDepartmentLead) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const departments = await prisma.department.findMany({
      where: session.role === "PROJECT_LEAD" ? { id: session.departmentId || "__none__" } : undefined,
      include: {
        lead: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true, projects: true } },
      },
      orderBy: { orderIndex: "asc" },
    });
    return NextResponse.json({ departments });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!checkPermission(session.role, ["SUPER_ADMIN", "OPERATIONS_MANAGER"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, description, color, orderIndex } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Department name is required" }, { status: 400 });
    }

    const department = await prisma.department.create({
      data: {
        name: name.trim(),
        description: description || null,
        color: color || "#0066ff",
        orderIndex: orderIndex ?? 0,
      },
    });

    await logAudit({ actorId: session.id, action: "CREATE", entityType: "DEPARTMENT", entityId: department.id, details: { name: department.name } });
    return NextResponse.json({ department }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "A department with this name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
