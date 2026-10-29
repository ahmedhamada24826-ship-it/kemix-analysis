import { NextRequest, NextResponse } from "next/server";
import { getSession, checkPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/notifications";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!checkPermission(session.role, ["SUPER_ADMIN", "OPERATIONS_MANAGER", "PROJECT_LEAD"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (session.role === "PROJECT_LEAD" && !session.isDepartmentLead) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  try {
    const department = await prisma.department.findFirst({
      where: { id, ...(session.role === "PROJECT_LEAD" ? { id: session.departmentId || "__none__" } : {}) },
      include: {
        lead: { select: { id: true, name: true, email: true } },
        members: { select: { id: true, name: true, email: true, role: true, jobTitle: true } },
        projects: { select: { id: true, referenceNumber: true, title: true, status: true } },
      },
    });
    if (!department) return NextResponse.json({ error: "Department not found" }, { status: 404 });
    return NextResponse.json({ department });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!checkPermission(session.role, ["SUPER_ADMIN", "OPERATIONS_MANAGER"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const { name, description, leadUserId, color, orderIndex, isActive } = body;

    const existing = await prisma.department.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Department not found" }, { status: 404 });
    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      return NextResponse.json({ error: "Department name cannot be empty" }, { status: 400 });
    }
    if (description !== undefined && description !== null && typeof description !== "string") {
      return NextResponse.json({ error: "Department description must be text" }, { status: 400 });
    }
    if (color !== undefined && (typeof color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(color))) {
      return NextResponse.json({ error: "Department color must be a six-digit hex value" }, { status: 400 });
    }
    if (orderIndex !== undefined && (!Number.isInteger(orderIndex) || orderIndex < 0)) {
      return NextResponse.json({ error: "Sort order must be a non-negative integer" }, { status: 400 });
    }
    if (isActive !== undefined && typeof isActive !== "boolean") {
      return NextResponse.json({ error: "Department active state must be boolean" }, { status: 400 });
    }
    if (leadUserId !== undefined && leadUserId !== null && leadUserId !== "") {
      const lead = await prisma.user.findFirst({
        where: { id: leadUserId, role: "PROJECT_LEAD", status: "ACTIVE", departmentId: id },
        select: { id: true },
      });
      if (!lead) return NextResponse.json({ error: "Department lead must be an active project lead assigned to this department" }, { status: 400 });
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(leadUserId !== undefined && { leadUserId: leadUserId || null }),
        ...(color !== undefined && { color }),
        ...(orderIndex !== undefined && { orderIndex }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    await logAudit({ actorId: session.id, action: "UPDATE", entityType: "DEPARTMENT", entityId: id, details: body });
    return NextResponse.json({ department });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!checkPermission(session.role, ["SUPER_ADMIN"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const [members, projects, workflowStages] = await Promise.all([
      prisma.user.count({ where: { departmentId: id } }),
      prisma.project.count({ where: { departmentId: id } }),
      prisma.workflowStage.count({ where: { assignedDepartmentId: id } }),
    ]);
    if (members > 0 || projects > 0 || workflowStages > 0) {
      return NextResponse.json({ error: "Cannot delete a department while it has members, projects, or workflow stages." }, { status: 409 });
    }

    await prisma.department.delete({ where: { id } });
    await logAudit({ actorId: session.id, action: "DELETE", entityType: "DEPARTMENT", entityId: id });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
