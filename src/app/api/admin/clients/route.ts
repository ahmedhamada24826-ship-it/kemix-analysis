import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canManageCustomerOperations } from "@/lib/authorization";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !canManageCustomerOperations(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const clients = await prisma.user.findMany({
      where: { role: "CLIENT" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        companyName: true,
        companySector: true,
        clientType: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            serviceRequests: true,
            projects: true,
            supportTickets: true,
          },
        },
      },
    });

    return NextResponse.json({ clients });
  } catch (error) {
    console.error("Fetch clients error:", error);
    return NextResponse.json({ error: "Failed to load clients" }, { status: 500 });
  }
}
