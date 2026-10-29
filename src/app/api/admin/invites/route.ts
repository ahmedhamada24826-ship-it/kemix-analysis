import { NextRequest, NextResponse } from "next/server";
import { getSession, checkPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/notifications";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!checkPermission(session.role, ["SUPER_ADMIN", "OPERATIONS_MANAGER"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const invites = await prisma.userInvite.findMany({
      where: { acceptedAt: null, expiresAt: { gt: new Date() } },
      include: { invitedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ invites });
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
    const { email: rawEmail, role, departmentId } = await req.json();
    if (!rawEmail || typeof rawEmail !== "string" || !role) return NextResponse.json({ error: "email and role are required" }, { status: 400 });
    const email = rawEmail.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "A valid email is required" }, { status: 400 });

    const validRoles = ["SUPER_ADMIN", "OPERATIONS_MANAGER", "PROJECT_LEAD", "ANALYST", "TRAINEE", "SUPPORT_AGENT"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    if (role === "SUPER_ADMIN" && session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only a super admin can invite another super admin" }, { status: 403 });
    }
    if (role === "OPERATIONS_MANAGER" && session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only a super admin can invite an operations manager" }, { status: 403 });
    }
    if (departmentId !== undefined && departmentId !== null && departmentId !== "") {
      const department = await prisma.department.findFirst({ where: { id: departmentId, isActive: true }, select: { id: true } });
      if (!department) return NextResponse.json({ error: "Active department not found" }, { status: 400 });
    }
    if (role === "PROJECT_LEAD" && !departmentId) {
      return NextResponse.json({ error: "A department is required for project leads" }, { status: 400 });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await prisma.userInvite.create({
      data: { email, role, departmentId: departmentId || null, token, invitedById: session.id, expiresAt },
    });

    const inviteLink = `/auth/accept-invite?token=${token}`;
    await logAudit({ actorId: session.id, action: "CREATE", entityType: "USER", entityId: invite.id, details: { email, role, departmentId: departmentId || null, action: "invite_created" } });
    return NextResponse.json({ invite, inviteLink }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
