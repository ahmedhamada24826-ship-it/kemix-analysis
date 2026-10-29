import { NextRequest, NextResponse } from "next/server";
import { getSession, checkPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/notifications";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!checkPermission(session.role, ["SUPER_ADMIN", "OPERATIONS_MANAGER"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const staff = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, name: true, role: true, status: true,
        phone: true, jobTitle: true, bio: true, createdAt: true,
        department: { select: { id: true, name: true, color: true } },
        projectMembers: {
          include: { project: { select: { id: true, referenceNumber: true, title: true, status: true } } },
        },
        _count: { select: { assignedTasks: true } },
      },
    });

    if (!staff || staff.role === "CLIENT") {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    return NextResponse.json({ staff });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!checkPermission(session.role, ["SUPER_ADMIN", "OPERATIONS_MANAGER"])) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  try {
    const body = await req.json();
    const { name, jobTitle, bio, departmentId, role, status: userStatus } = body;

    const existing = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, departmentId: true } });
    if (!existing || existing.role === "CLIENT") {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    // Only SUPER_ADMIN can change role or status
    if ((role !== undefined || userStatus !== undefined) && session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only SUPER_ADMIN can change role or status" }, { status: 403 });
    }

    const validStaffRoles = ["SUPER_ADMIN", "OPERATIONS_MANAGER", "PROJECT_LEAD", "ANALYST", "TRAINEE", "SUPPORT_AGENT"];
    if (role !== undefined && !validStaffRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid staff role" }, { status: 400 });
    }
    if (userStatus !== undefined && !["ACTIVE", "SUSPENDED"].includes(userStatus)) {
      return NextResponse.json({ error: "Invalid staff status" }, { status: 400 });
    }
    if (name !== undefined && (typeof name !== "string" || name.trim().length < 2)) {
      return NextResponse.json({ error: "Name must contain at least two characters" }, { status: 400 });
    }
    if ((jobTitle !== undefined && jobTitle !== null && typeof jobTitle !== "string") || (bio !== undefined && bio !== null && typeof bio !== "string")) {
      return NextResponse.json({ error: "Job title and biography must be text" }, { status: 400 });
    }
    if (session.id === id && session.role === "SUPER_ADMIN" && ((role !== undefined && role !== "SUPER_ADMIN") || userStatus === "SUSPENDED")) {
      return NextResponse.json({ error: "You cannot remove your own super admin access or suspend your account" }, { status: 400 });
    }
    if (departmentId !== undefined && departmentId !== null && departmentId !== "") {
      const department = await prisma.department.findFirst({ where: { id: departmentId, isActive: true }, select: { id: true } });
      if (!department) return NextResponse.json({ error: "Active department not found" }, { status: 400 });
    }

    const user = await prisma.$transaction(async (tx) => {
      if ((departmentId !== undefined && departmentId !== existing.departmentId) || (role !== undefined && role !== "PROJECT_LEAD") || userStatus === "SUSPENDED") {
        await tx.department.updateMany({ where: { leadUserId: id }, data: { leadUserId: null } });
      }
      return tx.user.update({
        where: { id },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(jobTitle !== undefined && { jobTitle }),
          ...(bio !== undefined && { bio }),
          ...(departmentId !== undefined && { departmentId: departmentId || null }),
          ...(role !== undefined && { role }),
          ...(userStatus !== undefined && { status: userStatus }),
        },
        select: { id: true, name: true, email: true, role: true, status: true, jobTitle: true, departmentId: true },
      });
    });

    await logAudit({ actorId: session.id, action: "UPDATE", entityType: "USER", entityId: id, details: body });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
