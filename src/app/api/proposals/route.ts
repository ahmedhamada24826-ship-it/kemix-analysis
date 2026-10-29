import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isStaffRole } from "@/lib/auth";
import { logAudit, sendNotification } from "@/lib/notifications";
import { canManageCustomerOperations } from "@/lib/authorization";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isStaffRole(session.role) && !canManageCustomerOperations(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const where = canManageCustomerOperations(session.role) ? {} : { clientId: session.id };

    const proposals = await prisma.proposal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: { id: true, name: true, companyName: true, email: true },
        },
        request: {
          select: { id: true, referenceNumber: true, serviceType: true },
        },
      },
    });

    return NextResponse.json({ proposals });
  } catch (error) {
    console.error("Fetch proposals error:", error);
    return NextResponse.json({ error: "Failed to load proposals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !canManageCustomerOperations(session.role)) {
      return NextResponse.json(
        { error: "Only authorized staff can generate proposals." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      requestId,
      clientId,
      title,
      scopeSummary,
      deliverables,
      price,
      currency = "USD",
      paymentTerms,
      timelineDays,
      assumptions,
      exclusions,
      expiresAt,
    } = body;

    if (!clientId || !title || !scopeSummary || !price || !timelineDays) {
      return NextResponse.json(
        { error: "Missing required proposal fields (client, title, scope, price, timeline)." },
        { status: 400 }
      );
    }

    const year = new Date().getFullYear();
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const referenceNumber = `PROP-${year}-${randomHex}`;

    const deliverablesFormatted = Array.isArray(deliverables)
      ? JSON.stringify(deliverables)
      : typeof deliverables === "string"
      ? deliverables
      : JSON.stringify([deliverables]);

    const proposal = await prisma.proposal.create({
      data: {
        referenceNumber,
        requestId: requestId || null,
        clientId,
        title,
        scopeSummary,
        deliverables: deliverablesFormatted,
        price: parseFloat(price.toString()),
        currency,
        paymentTerms: paymentTerms || "50% upfront upon acceptance, 50% upon final delivery.",
        timelineDays: parseInt(timelineDays.toString(), 10),
        assumptions: assumptions || null,
        exclusions: exclusions || null,
        expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 14 * 24 * 3600 * 1000),
        status: "SENT",
      },
    });

    // If linked to a request, update request status to PROPOSAL_SENT
    if (requestId) {
      await prisma.serviceRequest.update({
        where: { id: requestId },
        data: { status: "PROPOSAL_SENT" },
      });
    }

    // Notify client
    await sendNotification({
      userId: clientId,
      title: `New Proposal: ${title}`,
      message: `A formal proposal (${referenceNumber}) has been sent for your review and approval.`,
      link: `/client/proposals/${proposal.id}`,
      type: "PROPOSAL",
    });

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    await logAudit({
      actorId: session.id,
      action: "CREATE",
      entityType: "PROPOSAL",
      entityId: proposal.id,
      details: { referenceNumber, title, price, clientId },
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, proposal });
  } catch (error) {
    console.error("Create proposal error:", error);
    return NextResponse.json({ error: "Failed to create proposal" }, { status: 500 });
  }
}
