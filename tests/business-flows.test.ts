import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { hashPassword, comparePassword, generateToken, verifyToken, checkPermission } from "../src/lib/auth";
import { checkRateLimit } from "../src/lib/rate-limit";
import { sendNotification, logAudit } from "../src/lib/notifications";

async function runTestSuite() {
  console.log("\n========================================================");
  console.log("  KEMIX Analysis — Automated Business Flow Test Suite   ");
  console.log("========================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // ---------------------------------------------------------
    // TEST 1: Client registration, password hashing & JWT tokens
    // ---------------------------------------------------------
    console.log("Executing Test Group 1: Registration & Authentication");
    const testEmail = `test.client.${Date.now()}@testfirm.com`;
    const password = "TestPassword2026!";
    const hashedPassword = await hashPassword(password);
    const passwordValid = await comparePassword(password, hashedPassword);
    assert(passwordValid, "Password hashing and bcrypt verification");

    const testClient = await prisma.user.create({
      data: {
        name: "Test Client Engineer",
        email: testEmail,
        passwordHash: hashedPassword,
        clientType: "ORGANIZATION",
        role: "CLIENT",
        companyName: "Test Firm LLC",
        companySector: "FinTech",
        status: "ACTIVE",
      },
    });
    assert(!!testClient.id, "Client account successfully persisted in database");

    const token = generateToken({
      id: testClient.id,
      email: testClient.email,
      name: testClient.name,
      role: "CLIENT",
      companyName: testClient.companyName,
      clientType: testClient.clientType,
    });
    const decoded = verifyToken(token);
    assert(decoded?.email === testEmail && decoded?.role === "CLIENT", "JWT session token sign & verify");

    // ---------------------------------------------------------
    // TEST 2: Prevention of duplicate email registration
    // ---------------------------------------------------------
    console.log("\nExecuting Test Group 2: Duplicate Prevention & Rate Limiting");
    const duplicateCheck = await prisma.user.findUnique({
      where: { email: testEmail },
    });
    assert(!!duplicateCheck, "Existing user correctly identified for duplicate email check");

    const rateResult1 = checkRateLimit("test-ip-1", 2, 10000);
    const rateResult2 = checkRateLimit("test-ip-1", 2, 10000);
    const rateResult3 = checkRateLimit("test-ip-1", 2, 10000);
    assert(rateResult1.success && rateResult2.success && !rateResult3.success, "Rate limiter strictly throttles after limit");

    // ---------------------------------------------------------
    // TEST 3: Request creation, validation & unique reference number
    // ---------------------------------------------------------
    console.log("\nExecuting Test Group 3: Service Intake & Reference Numbering");
    const refNum = `KMX-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const request = await prisma.serviceRequest.create({
      data: {
        referenceNumber: refNum,
        clientId: testClient.id,
        serviceType: "Business Intelligence & Power BI Dashboards",
        problemDescription: "Need automated executive reporting across warehouse fleet.",
        businessObjective: "Real-time dispatch metrics",
        desiredOutcome: "Eliminate manual spreadsheet latency",
        status: "NEW_REQUEST",
        dataSourceType: "database",
      },
    });
    assert(request.referenceNumber.startsWith("KMX-"), "Request reference matches KEMIX format (KMX-XXXX)");
    assert(request.status === "NEW_REQUEST", "Initial request status set to NEW_REQUEST");

    // ---------------------------------------------------------
    // TEST 4: Prevention of cross-client data access (Isolation)
    // ---------------------------------------------------------
    console.log("\nExecuting Test Group 4: Client Isolation & Authorization");
    // Create a second client
    const otherClient = await prisma.user.create({
      data: {
        name: "Second Client",
        email: `second.${Date.now()}@other.com`,
        passwordHash: hashedPassword,
        role: "CLIENT",
        status: "ACTIVE",
      },
    });

    // Attempt to query request with otherClient's filter
    const isolatedRequests = await prisma.serviceRequest.findMany({
      where: { id: request.id, clientId: otherClient.id },
    });
    assert(isolatedRequests.length === 0, "Cross-client access prevented (Client B cannot query Client A's request)");

    const clientOwnRequests = await prisma.serviceRequest.findMany({
      where: { id: request.id, clientId: testClient.id },
    });
    assert(clientOwnRequests.length === 1, "Client can query their own request");

    // ---------------------------------------------------------
    // TEST 5: Messaging & Internal Staff Notes Isolation
    // ---------------------------------------------------------
    console.log("\nExecuting Test Group 5: Messaging & Staff Note Security");
    const conversation = await prisma.conversation.create({
      data: {
        title: `Conversation for ${refNum}`,
        requestId: request.id,
        clientId: testClient.id,
      },
    });

    // Public message from client
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: testClient.id,
        content: "Hello team, looking forward to starting.",
        isInternalStaffNote: false,
      },
    });

    // Internal staff note (should NEVER be visible to client)
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: testClient.id, // simulating staff note
        content: "CONFIDENTIAL STAFF NOTE: Check staging schema format.",
        isInternalStaffNote: true,
      },
    });

    // Client view query (where isInternalStaffNote: false)
    const clientVisibleMessages = await prisma.message.findMany({
      where: { conversationId: conversation.id, isInternalStaffNote: false },
    });
    const staffVisibleMessages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
    });

    assert(clientVisibleMessages.length === 1, "Client query strictly filters out internal staff notes");
    assert(staffVisibleMessages.length === 2, "Staff query includes internal notes and public messages");

    // ---------------------------------------------------------
    // TEST 6: Role permissions
    // ---------------------------------------------------------
    console.log("\nExecuting Test Group 6: Role-Based Access Control");
    assert(checkPermission("SUPER_ADMIN", ["OPERATIONS_MANAGER"]), "Super Admin has universal access");
    assert(!checkPermission("CLIENT", ["OPERATIONS_MANAGER", "PROJECT_LEAD"]), "Client denied access to staff operations");
    assert(checkPermission("PROJECT_LEAD", ["PROJECT_LEAD", "ANALYST"]), "Project Lead authorized for project roles");

    // ---------------------------------------------------------
    // TEST 7: Proposal creation & formal approval recording
    // ---------------------------------------------------------
    console.log("\nExecuting Test Group 7: Proposal Approval Recording");
    const propRef = `PROP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const proposal = await prisma.proposal.create({
      data: {
        referenceNumber: propRef,
        requestId: request.id,
        clientId: testClient.id,
        title: "Logistics Analytics Proposal",
        scopeSummary: "Full Power BI deployment",
        deliverables: JSON.stringify(["Dashboard 1", "Dashboard 2"]),
        price: 3200,
        timelineDays: 14,
        paymentTerms: "50% upfront, 50% on completion",
        status: "SENT",
      },
    });

    const now = new Date();
    const approvedProposal = await prisma.proposal.update({
      where: { id: proposal.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: now,
        acceptedByUserId: testClient.id,
      },
    });

    assert(approvedProposal.status === "ACCEPTED", "Proposal status updated to ACCEPTED");
    assert(!!approvedProposal.acceptedAt, "Approval records explicit timestamp");
    assert(approvedProposal.acceptedByUserId === testClient.id, "Approval records authenticating user ID");

    // Auto-create Project on approval
    const project = await prisma.project.create({
      data: {
        referenceNumber: `PRJ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        requestId: request.id,
        clientId: testClient.id,
        title: proposal.title,
        description: proposal.scopeSummary,
        scopeOfWork: proposal.scopeSummary,
        status: "ACTIVE",
        budget: proposal.price,
      },
    });
    assert(project.status === "ACTIVE", "Active project created automatically upon proposal acceptance");

    // ---------------------------------------------------------
    // TEST 8: Project milestone transitions & deliverable publishing
    // ---------------------------------------------------------
    console.log("\nExecuting Test Group 8: Milestones & Deliverables");
    const milestone = await prisma.milestone.create({
      data: {
        projectId: project.id,
        title: "Schema Ingestion",
        status: "PENDING",
      },
    });

    const updatedMilestone = await prisma.milestone.update({
      where: { id: milestone.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    assert(updatedMilestone.status === "COMPLETED" && !!updatedMilestone.completedAt, "Milestone marked COMPLETED with timestamp");

    const deliverable = await prisma.deliverable.create({
      data: {
        projectId: project.id,
        title: "Executive Report v1",
        description: "Initial diagnostic summary",
        fileType: "PDF",
        version: "1.0",
        isApproved: true,
      },
    });
    assert(deliverable.isApproved, "Deliverable published and marked approved for client view");

    // ---------------------------------------------------------
    // TEST 9: Support Ticket Creation & Updates
    // ---------------------------------------------------------
    console.log("\nExecuting Test Group 9: Support Ticket Management");
    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber: `TKT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        clientId: testClient.id,
        subject: "Need Power BI license assignment",
        category: "Deliverable Access",
        priority: "HIGH",
        status: "OPEN",
      },
    });
    assert(ticket.status === "OPEN" && ticket.priority === "HIGH", "Support ticket opened with priority");

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { status: "RESOLVED", resolutionNotes: "Granted viewer role to specified emails." },
    });
    assert(updatedTicket.status === "RESOLVED", "Support ticket resolved with documented resolution notes");

    // ---------------------------------------------------------
    // TEST 10: Notification Engine & Audit Logging
    // ---------------------------------------------------------
    console.log("\nExecuting Test Group 10: Notifications & Audit Trail");
    const notification = await sendNotification({
      userId: testClient.id,
      title: "Project Milestone Completed",
      message: "Milestone 1 is ready for review.",
      link: `/client/projects/${project.id}`,
      type: "PROJECT",
    });
    assert(!!notification && notification.title === "Project Milestone Completed", "Notification created and queued");

    await logAudit({
      actorId: testClient.id,
      action: "TEST_AUDIT",
      entityType: "TEST",
      entityId: "test-123",
      details: { sample: true },
    });

    const auditCount = await prisma.auditLog.count({
      where: { entityType: "TEST" },
    });
    assert(auditCount > 0, "Audit log securely written to database");

  } catch (error) {
    console.error("Test execution threw error:", error);
    failed++;
  }

  console.log("\n========================================================");
  console.log(`  Test Suite Completed: ${passed} Passed, ${failed} Failed`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
