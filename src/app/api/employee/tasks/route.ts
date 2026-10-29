import { NextRequest, NextResponse } from "next/server";
import { getSession, isStaffRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaffRole(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const priority = url.searchParams.get("priority");
  const projectId = url.searchParams.get("projectId");

  try {
    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: session.id,
        ...(status && status !== "ALL" && { status }),
        ...(priority && priority !== "ALL" && { priority }),
        ...(projectId && { projectId }),
      },
      include: {
        project: { select: { id: true, referenceNumber: true, title: true } },
        _count: { select: { subTasks: true } },
      },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { dueDate: "asc" }],
    });

    return NextResponse.json({ tasks });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
