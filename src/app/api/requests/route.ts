import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword, generateToken, setSessionCookie, isStaffRole, Role } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAudit, sendNotification } from "@/lib/notifications";
import { canManageCustomerOperations } from "@/lib/authorization";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateCheck = checkRateLimit(`intake_${ip}`, 10, 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many submissions. Please wait a moment before trying again." },
        { status: 429 }
      );
    }

    const session = await getSession();
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid service request details." }, { status: 400 });
    }

    // Service intake belongs to client accounts. Authenticated staff should use
    // the internal request tools, and a guest must never be able to attach a
    // request to an employee account by submitting that employee's email.
    if (session && session.role !== "CLIENT") {
      return NextResponse.json({ error: "Only client accounts can submit service requests." }, { status: 403 });
    }

    const {
      // Step 1: Client Info
      name,
      email,
      phone,
      companyName,
      companySector,
      clientType,
      password, // provided if guest client is registering simultaneously

      // Step 2: Problem
      serviceType,
      problemDescription,
      businessObjective,
      desiredOutcome,
      currentChallenge,
      expectedValue,

      // Step 3: Data Readiness
      dataSourceType,
      approxDataVolume,
      hasDataAccess,
      hasRestrictions,
      needsPreparationHelp,

      // Step 4: Delivery
      preferredDeadline,
      budgetRange,
      preferredContactMethod,
      bestTimeForCall,
      additionalNotes,
    } = body;

    const requiredText: unknown[] = [serviceType, problemDescription, businessObjective, desiredOutcome];
    if (requiredText.some((value) => typeof value !== "string" || !value.trim() || value.length > 10000)) {
      return NextResponse.json({ error: "Complete the required request fields with valid text." }, { status: 400 });
    }
    if (typeof serviceType !== "string" || serviceType.length > 160 ||
        (phone !== undefined && phone !== null && (typeof phone !== "string" || phone.length > 40)) ||
        (companyName !== undefined && companyName !== null && (typeof companyName !== "string" || companyName.length > 200)) ||
        (companySector !== undefined && companySector !== null && (typeof companySector !== "string" || companySector.length > 160)) ||
        (name !== undefined && name !== null && (typeof name !== "string" || name.length > 120)) ||
        (email !== undefined && email !== null && (typeof email !== "string" || email.length > 254))) {
      return NextResponse.json({ error: "One or more request fields have an invalid format." }, { status: 400 });
    }
    const optionalTextFields: Array<[string, unknown, number]> = [
      ["currentChallenge", currentChallenge, 10000], ["expectedValue", expectedValue, 10000],
      ["dataSourceType", dataSourceType, 160], ["approxDataVolume", approxDataVolume, 160],
      ["preferredDeadline", preferredDeadline, 160], ["budgetRange", budgetRange, 160],
      ["preferredContactMethod", preferredContactMethod, 40], ["bestTimeForCall", bestTimeForCall, 300],
      ["additionalNotes", additionalNotes, 10000],
    ];
    if (optionalTextFields.some(([, value, max]) => value !== undefined && value !== null && (typeof value !== "string" || value.length > max))) {
      return NextResponse.json({ error: "One or more optional request fields have an invalid format." }, { status: 400 });
    }
    if ([hasDataAccess, hasRestrictions, needsPreparationHelp].some((value) => value !== undefined && value !== null && typeof value !== "boolean")) {
      return NextResponse.json({ error: "Data readiness fields must be yes/no values." }, { status: 400 });
    }

    // Validation
    let clientId = session?.id;

    // If client is not signed in, look up or create client account
    if (!clientId) {
      if (!email || !name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || name.trim().length < 2) {
        return NextResponse.json(
          { error: "Client contact name and email are required." },
          { status: 400 }
        );
      }

      let existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: existingUser.role === "CLIENT"
              ? "An account already exists for this email. Please sign in before submitting a request."
              : "This email is already registered for a non-client account. Please use a client account." },
          { status: 409 }
        );
      } else {
        // Create new client account
        if (typeof password !== "string" || password.length < 8 || password.length > 256) {
          return NextResponse.json({ error: "Create a client portal password with at least 8 characters." }, { status: 400 });
        }
        const passwordHash = await hashPassword(password);

        existingUser = await prisma.user.create({
          data: {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            passwordHash,
            phone: phone || null,
            companyName: companyName || null,
            companySector: companySector || null,
            clientType: clientType === "INDIVIDUAL" ? "INDIVIDUAL" : "ORGANIZATION",
            role: "CLIENT",
            status: "ACTIVE",
          },
        });
      }

      clientId = existingUser.id;

      // Automatically sign in the client
      const token = generateToken({
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role as Role,
        companyName: existingUser.companyName,
        clientType: existingUser.clientType,
      });
      await setSessionCookie(token);
    }

    // Generate unique reference number: KMX-YYYYMM-XXXX
    const dateStr = new Date().toISOString().slice(0, 7).replace("-", "");
    const randomHex = Math.floor(1000 + Math.random() * 9000).toString();
    const referenceNumber = `KMX-${dateStr}-${randomHex}`;

    // Create Service Request
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        referenceNumber,
        clientId,
        serviceType,
        problemDescription,
        businessObjective,
        desiredOutcome,
        currentChallenge: currentChallenge || null,
        expectedValue: expectedValue || null,
        dataSourceType: dataSourceType || "spreadsheets",
        approxDataVolume: approxDataVolume || null,
        hasDataAccess: typeof hasDataAccess === "boolean" ? hasDataAccess : true,
        hasRestrictions: typeof hasRestrictions === "boolean" ? hasRestrictions : false,
        needsPreparationHelp: typeof needsPreparationHelp === "boolean" ? needsPreparationHelp : false,
        preferredDeadline: preferredDeadline || null,
        budgetRange: budgetRange || null,
        preferredContactMethod: preferredContactMethod || "EMAIL",
        bestTimeForCall: bestTimeForCall || null,
        additionalNotes: additionalNotes || null,
        status: "NEW_REQUEST",
      },
    });

    // Automatically create a dedicated conversation thread for this request
    const conversation = await prisma.conversation.create({
      data: {
        title: `Request ${referenceNumber}: ${serviceType}`,
        requestId: serviceRequest.id,
        clientId,
      },
    });

    // Add initial system message welcoming the client
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: clientId,
        content: `Service request ${referenceNumber} submitted. Problem summary: ${problemDescription.slice(0, 150)}...`,
        isInternalStaffNote: false,
        readByClient: true,
        readByStaff: false,
      },
    });

    // Notify authorized staff
    const staffMembers = await prisma.user.findMany({
      where: {
        role: { in: ["SUPER_ADMIN", "OPERATIONS_MANAGER"] },
        status: "ACTIVE",
      },
    });

    for (const staff of staffMembers) {
      await sendNotification({
        userId: staff.id,
        title: `New Request: ${referenceNumber}`,
        message: `${name || "A client"} submitted a new request for ${serviceType}.`,
        link: `/admin/requests/${serviceRequest.id}`,
        type: "REQUEST",
      });
    }

    // Client confirmation notification
    await sendNotification({
      userId: clientId,
      title: `Request Received (${referenceNumber})`,
      message: "Your service request has been received by KEMIX Analysis. Our team will review it and follow up shortly.",
      link: `/client/requests/${serviceRequest.id}`,
      type: "REQUEST",
    });

    await logAudit({
      actorId: clientId,
      action: "CREATE",
      entityType: "REQUEST",
      entityId: serviceRequest.id,
      details: { referenceNumber, serviceType },
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      referenceNumber,
      requestId: serviceRequest.id,
    });
  } catch (error) {
    console.error("Intake error:", error);
    return NextResponse.json(
      { error: "Failed to submit service request. Please verify your details." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const serviceType = searchParams.get("serviceType");
    const search = searchParams.get("search");

    const isStaff = isStaffRole(session.role);
    if (isStaff && !canManageCustomerOperations(session.role) && session.role !== "PROJECT_LEAD") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Customer service and operations handle the full intake queue. Other staff
    // only see requests explicitly assigned to them.
    const where: Prisma.ServiceRequestWhereInput = session.role === "CLIENT"
      ? { clientId: session.id }
      : canManageCustomerOperations(session.role)
        ? {}
        : { assignedStaffId: session.id };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (serviceType && serviceType !== "ALL") {
      where.serviceType = { contains: serviceType };
    }

    if (search) {
      where.OR = [
        { referenceNumber: { contains: search } },
        { problemDescription: { contains: search } },
        { businessObjective: { contains: search } },
        ...(isStaff
          ? [
              { client: { name: { contains: search } } },
              { client: { companyName: { contains: search } } },
            ]
          : []),
      ];
    }

    const requests = await prisma.serviceRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: isStaff, // Only staff see full client phone in request list
            companyName: true,
            companySector: true,
            clientType: true,
          },
        },
        assignedStaff: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        proposals: {
          select: {
            id: true,
            referenceNumber: true,
            status: true,
            price: true,
          },
        },
        projects: {
          select: {
            id: true,
            referenceNumber: true,
            status: true,
            title: true,
          },
        },
      },
    });

    const visibleRequests = session.role === "SUPPORT_AGENT"
      ? requests.map((request) => ({ ...request, internalNotes: undefined }))
      : requests;
    return NextResponse.json({ requests: visibleRequests });
  } catch (error) {
    console.error("Fetch requests error:", error);
    return NextResponse.json({ error: "Failed to load requests" }, { status: 500 });
  }
}
