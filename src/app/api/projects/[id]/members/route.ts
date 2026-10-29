import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/notifications";
import { canAccessProject, canManageProject } from "@/lib/authorization";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    if (!(await canAccessProject(session, id))) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const members = await prisma.projectMember.findMany({
      where: { projectId: id, ...(session.role === "TRAINEE" ? { userId: session.id } : {}) },
      include: { user: { select: { id: true, name: true, email: !["CLIENT", "TRAINEE", "ANALYST"].includes(session.role), role: true, jobTitle: true } } },
    });
    return NextResponse.json({ members });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await canManageProject(session, id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { userId, role: memberRole = "MEMBER" } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
    if (!["LEAD", "MEMBER", "VIEWER", "QA_REVIEWER"].includes(memberRole)) return NextResponse.json({ error: "Invalid project role" }, { status: 400 });
    const memberUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, status: true, departmentId: true } });
    if (!memberUser || memberUser.role === "CLIENT" || memberUser.status !== "ACTIVE") return NextResponse.json({ error: "Project members must be active staff." }, { status: 400 });
    if (session.role === "PROJECT_LEAD" && memberUser.departmentId !== session.departmentId) return NextResponse.json({ error: "You can only add staff from your department." }, { status: 403 });

    const existing = await prisma.projectMember.findUnique({ where: { projectId_userId: { projectId: id, userId } } });
    if (existing) return NextResponse.json({ error: "User is already a member of this project" }, { status: 409 });

    const member = await prisma.projectMember.create({
      data: { projectId: id, userId, role: memberRole },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    await logAudit({ actorId: session.id, action: "ASSIGN", entityType: "PROJECT", entityId: id, details: { userId, role: memberRole, action: "added" } });
    return NextResponse.json({ member }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await canManageProject(session, id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    if (session.role === "PROJECT_LEAD") {
      const memberUser = await prisma.user.findUnique({ where: { id: userId }, select: { departmentId: true } });
      if (memberUser?.departmentId !== session.departmentId) return NextResponse.json({ error: "You can only remove staff from your department." }, { status: 403 });
    }

    await prisma.projectMember.delete({ where: { projectId_userId: { projectId: id, userId } } });
    await logAudit({ actorId: session.id, action: "ASSIGN", entityType: "PROJECT", entityId: id, details: { userId, action: "removed" } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
