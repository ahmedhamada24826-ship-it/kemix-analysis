import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canManageCustomerOperations } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/notifications";

const STATUSES = ["NEW", "IN_PROGRESS", "RESOLVED"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !canManageCustomerOperations(session.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  if (!STATUSES.includes(body.status)) return NextResponse.json({ error: "Invalid inquiry status" }, { status: 400 });
  const result = await prisma.contactInquiry.updateMany({ where: { id }, data: { status: body.status } });
  if (!result.count) return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
  const inquiry = await prisma.contactInquiry.findUnique({ where: { id } });
  await logAudit({ actorId: session.id, action: "CONTACT_INQUIRY_STATUS_CHANGED", entityType: "CONTACT_INQUIRY", entityId: id, details: { status: body.status } });
  return NextResponse.json({ inquiry });
}
