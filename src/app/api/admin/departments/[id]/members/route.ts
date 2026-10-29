import { NextRequest, NextResponse } from "next/server";
import { getSession, checkPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/notifications";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!checkPermission(session.role, ["SUPER_ADMIN", "OPERATIONS_MANAGER"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    const department = await prisma.department.findUnique({ where: { id }, select: { id: true } });
    if (!department) return NextResponse.json({ error: "Department not found" }, { status: 404 });
    const staff = await prisma.user.findFirst({
      where: { id: userId, role: { in: ["SUPER_ADMIN", "OPERATIONS_MANAGER", "PROJECT_LEAD", "ANALYST", "TRAINEE", "SUPPORT_AGENT"] }, status: "ACTIVE" },
      select: { id: true },
    });
    if (!staff) return NextResponse.json({ error: "An active staff account is required" }, { status: 400 });

    const user = await prisma.user.update({
      where: { id: userId },
      data: { departmentId: id },
      select: { id: true, name: true, email: true, departmentId: true },
    });

    await logAudit({ actorId: session.id, action: "ASSIGN", entityType: "DEPARTMENT", entityId: id, details: { userId, action: "added" } });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!checkPermission(session.role, ["SUPER_ADMIN", "OPERATIONS_MANAGER"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    const department = await prisma.department.findUnique({ where: { id }, select: { id: true, leadUserId: true } });
    if (!department) return NextResponse.json({ error: "Department not found" }, { status: 404 });

    const user = await prisma.$transaction(async (tx) => {
      if (department.leadUserId === userId) {
        await tx.department.update({ where: { id }, data: { leadUserId: null } });
      }
      return tx.user.update({
        where: { id: userId, departmentId: id },
        data: { departmentId: null },
        select: { id: true, name: true, email: true },
      });
    });

    await logAudit({ actorId: session.id, action: "ASSIGN", entityType: "DEPARTMENT", entityId: id, details: { userId, action: "removed" } });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
