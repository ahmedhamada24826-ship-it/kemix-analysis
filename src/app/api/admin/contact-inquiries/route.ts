import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canManageCustomerOperations } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || !canManageCustomerOperations(session.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }
  const inquiries = await prisma.contactInquiry.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 300,
  });
  return NextResponse.json({ inquiries });
}
