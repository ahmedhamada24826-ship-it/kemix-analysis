import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isStaffRole, STAFF_ROLES } from "@/lib/auth";
import { isOperationsRole } from "@/lib/authorization";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !isStaffRole(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!isOperationsRole(session.role) && (session.role !== "PROJECT_LEAD" || !session.isDepartmentLead)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const staff = await prisma.user.findMany({
      where: {
        role: { in: STAFF_ROLES },
        status: "ACTIVE",
        ...(session.role === "PROJECT_LEAD" ? { departmentId: session.departmentId || "__none__" } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companySector: true,
        departmentId: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ staff });
  } catch (error) {
    console.error("Fetch staff error:", error);
    return NextResponse.json({ error: "Failed to load staff" }, { status: 500 });
  }
}
