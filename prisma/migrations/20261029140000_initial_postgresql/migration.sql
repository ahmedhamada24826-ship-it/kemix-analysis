-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "authVersion" INTEGER NOT NULL DEFAULT 0,
    "phone" TEXT,
    "companyName" TEXT,
    "companySector" TEXT,
    "clientType" TEXT NOT NULL DEFAULT 'ORGANIZATION',
    "role" TEXT NOT NULL DEFAULT 'CLIENT',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "avatarUrl" TEXT,
    "departmentId" TEXT,
    "jobTitle" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "leadUserId" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT NOT NULL DEFAULT '#0066ff',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "fullDescription" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "features" TEXT NOT NULL,
    "deliverables" TEXT NOT NULL,
    "iconName" TEXT NOT NULL,
    "estimatedTimeline" TEXT NOT NULL,
    "startingPrice" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "problemDescription" TEXT NOT NULL,
    "businessObjective" TEXT NOT NULL,
    "desiredOutcome" TEXT NOT NULL,
    "currentChallenge" TEXT,
    "expectedValue" TEXT,
    "dataSourceType" TEXT NOT NULL DEFAULT 'spreadsheets',
    "approxDataVolume" TEXT,
    "hasDataAccess" BOOLEAN NOT NULL DEFAULT true,
    "hasRestrictions" BOOLEAN NOT NULL DEFAULT false,
    "needsPreparationHelp" BOOLEAN NOT NULL DEFAULT false,
    "preferredDeadline" TEXT,
    "budgetRange" TEXT,
    "preferredContactMethod" TEXT NOT NULL DEFAULT 'EMAIL',
    "bestTimeForCall" TEXT,
    "additionalNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW_REQUEST',
    "assignedStaffId" TEXT,
    "consultationDate" TIMESTAMP(3),
    "followUpDate" TIMESTAMP(3),
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "requestId" TEXT,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scopeOfWork" TEXT NOT NULL,
    "leadStaffId" TEXT,
    "departmentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "workflowTemplateId" TEXT,
    "startDate" TIMESTAMP(3),
    "targetDeliveryDate" TIMESTAMP(3),
    "actualDeliveryDate" TIMESTAMP(3),
    "budget" DOUBLE PRECISION,
    "qaOutcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "parentTaskId" TEXT,
    "assigneeId" TEXT,
    "createdById" TEXT,
    "stageId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serviceType" TEXT,
    "description" TEXT,
    "stages" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStage" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "templateStageKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assignedDepartmentId" TEXT,
    "assignedUserId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "submittedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileUpload" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "uploadedByUserId" TEXT NOT NULL,
    "approvedByUserId" TEXT,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'INTERNAL',
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "requestId" TEXT,
    "clientId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "scopeSummary" TEXT NOT NULL,
    "deliverables" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentTerms" TEXT NOT NULL,
    "timelineDays" INTEGER NOT NULL,
    "assumptions" TEXT,
    "exclusions" TEXT,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "acceptedAt" TIMESTAMP(3),
    "acceptedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deliverable" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "fileUrl" TEXT,
    "externalLink" TEXT,
    "fileType" TEXT,
    "fileSize" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deliverable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "requestId" TEXT,
    "projectId" TEXT,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternalStaffNote" BOOLEAN NOT NULL DEFAULT false,
    "readByClient" BOOLEAN NOT NULL DEFAULT false,
    "readByStaff" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagerMessage" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManagerMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactInquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "assignedStaffId" TEXT,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketReply" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL DEFAULT 'GENERAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInvite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ANALYST',
    "departmentId" TEXT,
    "token" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE INDEX "Department_isActive_idx" ON "Department"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_slug_idx" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_isActive_idx" ON "Service"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRequest_referenceNumber_key" ON "ServiceRequest"("referenceNumber");

-- CreateIndex
CREATE INDEX "ServiceRequest_referenceNumber_idx" ON "ServiceRequest"("referenceNumber");

-- CreateIndex
CREATE INDEX "ServiceRequest_clientId_idx" ON "ServiceRequest"("clientId");

-- CreateIndex
CREATE INDEX "ServiceRequest_status_idx" ON "ServiceRequest"("status");

-- CreateIndex
CREATE INDEX "ServiceRequest_assignedStaffId_idx" ON "ServiceRequest"("assignedStaffId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_referenceNumber_key" ON "Project"("referenceNumber");

-- CreateIndex
CREATE INDEX "Project_referenceNumber_idx" ON "Project"("referenceNumber");

-- CreateIndex
CREATE INDEX "Project_clientId_idx" ON "Project"("clientId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_leadStaffId_idx" ON "Project"("leadStaffId");

-- CreateIndex
CREATE INDEX "Project_departmentId_idx" ON "Project"("departmentId");

-- CreateIndex
CREATE INDEX "Project_priority_idx" ON "Project"("priority");

-- CreateIndex
CREATE INDEX "ProjectMember_projectId_idx" ON "ProjectMember"("projectId");

-- CreateIndex
CREATE INDEX "ProjectMember_userId_idx" ON "ProjectMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMember_projectId_userId_key" ON "ProjectMember"("projectId", "userId");

-- CreateIndex
CREATE INDEX "Milestone_projectId_idx" ON "Milestone"("projectId");

-- CreateIndex
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");

-- CreateIndex
CREATE INDEX "Task_assigneeId_idx" ON "Task"("assigneeId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_parentTaskId_idx" ON "Task"("parentTaskId");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_isActive_idx" ON "WorkflowTemplate"("isActive");

-- CreateIndex
CREATE INDEX "WorkflowStage_projectId_idx" ON "WorkflowStage"("projectId");

-- CreateIndex
CREATE INDEX "WorkflowStage_status_idx" ON "WorkflowStage"("status");

-- CreateIndex
CREATE INDEX "WorkflowStage_assignedDepartmentId_idx" ON "WorkflowStage"("assignedDepartmentId");

-- CreateIndex
CREATE INDEX "FileUpload_projectId_idx" ON "FileUpload"("projectId");

-- CreateIndex
CREATE INDEX "FileUpload_uploadedByUserId_idx" ON "FileUpload"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "FileUpload_category_idx" ON "FileUpload"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_referenceNumber_key" ON "Proposal"("referenceNumber");

-- CreateIndex
CREATE INDEX "Proposal_referenceNumber_idx" ON "Proposal"("referenceNumber");

-- CreateIndex
CREATE INDEX "Proposal_clientId_idx" ON "Proposal"("clientId");

-- CreateIndex
CREATE INDEX "Proposal_status_idx" ON "Proposal"("status");

-- CreateIndex
CREATE INDEX "Deliverable_projectId_idx" ON "Deliverable"("projectId");

-- CreateIndex
CREATE INDEX "Conversation_clientId_idx" ON "Conversation"("clientId");

-- CreateIndex
CREATE INDEX "Conversation_requestId_idx" ON "Conversation"("requestId");

-- CreateIndex
CREATE INDEX "Conversation_projectId_idx" ON "Conversation"("projectId");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "ManagerMessage_createdAt_idx" ON "ManagerMessage"("createdAt");

-- CreateIndex
CREATE INDEX "ManagerMessage_senderId_idx" ON "ManagerMessage"("senderId");

-- CreateIndex
CREATE INDEX "ContactInquiry_status_createdAt_idx" ON "ContactInquiry"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ContactInquiry_email_idx" ON "ContactInquiry"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_expiresAt_idx" ON "PasswordResetToken"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "SupportTicket_ticketNumber_idx" ON "SupportTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "SupportTicket_clientId_idx" ON "SupportTicket"("clientId");

-- CreateIndex
CREATE INDEX "SupportTicket_assignedStaffId_idx" ON "SupportTicket"("assignedStaffId");

-- CreateIndex
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");

-- CreateIndex
CREATE INDEX "TicketReply_ticketId_idx" ON "TicketReply"("ticketId");

-- CreateIndex
CREATE INDEX "TicketReply_senderId_idx" ON "TicketReply"("senderId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserInvite_token_key" ON "UserInvite"("token");

-- CreateIndex
CREATE INDEX "UserInvite_token_idx" ON "UserInvite"("token");

-- CreateIndex
CREATE INDEX "UserInvite_email_idx" ON "UserInvite"("email");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_leadUserId_fkey" FOREIGN KEY ("leadUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_leadStaffId_fkey" FOREIGN KEY ("leadStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_workflowTemplateId_fkey" FOREIGN KEY ("workflowTemplateId") REFERENCES "WorkflowTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "WorkflowStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStage" ADD CONSTRAINT "WorkflowStage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStage" ADD CONSTRAINT "WorkflowStage_assignedDepartmentId_fkey" FOREIGN KEY ("assignedDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStage" ADD CONSTRAINT "WorkflowStage_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStage" ADD CONSTRAINT "WorkflowStage_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStage" ADD CONSTRAINT "WorkflowStage_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileUpload" ADD CONSTRAINT "FileUpload_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileUpload" ADD CONSTRAINT "FileUpload_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileUpload" ADD CONSTRAINT "FileUpload_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_acceptedByUserId_fkey" FOREIGN KEY ("acceptedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerMessage" ADD CONSTRAINT "ManagerMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketReply" ADD CONSTRAINT "TicketReply_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketReply" ADD CONSTRAINT "TicketReply_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInvite" ADD CONSTRAINT "UserInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Initial public service catalog (safe, non-customer reference data).
INSERT INTO "Service" ("id", "slug", "title", "shortDescription", "fullDescription", "category", "features", "deliverables", "iconName", "estimatedTimeline", "startingPrice", "orderIndex", "updatedAt") VALUES
('service-data-analysis', 'data-analysis-and-reporting', 'Data Analysis and Reporting', 'Transform fragmented raw data into comprehensive executive reports, KPI dashboards, and data-driven insights.', 'We analyze your sales, operational, marketing, or financial records to detect key trends, bottleneck drivers, and margin improvements. Deliverables include executive slide decks, diagnostic reports, and KPI trackers tailored to leadership.', 'Analytics & Insights', '["Exploratory Data Analysis (EDA) on structured & unstructured datasets","Automated KPI calculation and variance analysis","Executive summary slide decks and PDF diagnostic reports","Cohort analysis, churn metrics, and revenue breakdown"]', '["Comprehensive Analytical Insights Report (PDF & Interactive)","Cleaned summary datasets with methodology notes","Presentation-ready executive deck"]', 'BarChart3', '1 to 2 Weeks', '$1,500', 1, CURRENT_TIMESTAMP),
('service-power-bi', 'business-intelligence-powerbi', 'Business Intelligence & Power BI Dashboards', 'Interactive, automated Power BI dashboards connecting to databases, APIs, and cloud data warehouses.', 'Custom-designed enterprise dashboards built with best-practice DAX modeling, star-schema data architecture, automated scheduled refresh, and role-level security to give decision-makers real-time visibility.', 'Business Intelligence', '["High-performance Star-Schema data modeling and DAX optimization","Custom visual layout adhering to KEMIX corporate design standards","Automated scheduled data refresh with error alerting","Row-level security (RLS) for departmental or branch access control"]', '["Production Power BI (.pbix) files & cloud workspace publishing","Data model documentation and DAX calculation dictionary","Stakeholder training video walkthrough and admin handover guide"]', 'PieChart', '2 to 3 Weeks', '$2,800', 2, CURRENT_TIMESTAMP),
('service-data-engineering', 'data-cleaning-sql-python-automation', 'Data Cleaning, SQL, Python & Automation', 'End-to-end data pipeline development, automated ETL workflows, anomaly correction, and database migration.', 'Eliminate manual spreadsheet work. We build automated Python scripts, SQL transformation stored procedures, and scheduled cron workflows that ingest, clean, validate, and store business data accurately.', 'Data Engineering', '["Automated data extraction from Excel, CSV, Google Sheets, ERP, and APIs","Deduplication, normalization, and outlier detection logic","Production-ready SQL queries, views, and database indexes","Scheduled execution with failure alerts and logging"]', '["Documented Python ETL scripts & modular code repository","Optimized SQL schema scripts and migration files","Execution runbook and failure recovery protocol"]', 'Cpu', '1 to 3 Weeks', '$2,200', 3, CURRENT_TIMESTAMP),
('service-forecasting', 'forecasting-and-data-science', 'Forecasting and Data Science', 'Predictive machine learning models for demand forecasting, customer churn, and trend projection (subject to historical data feasibility).', 'Rigorous statistical and machine learning modeling to forecast sales, optimize inventory levels, and score customer retention. Feasibility is thoroughly assessed before scope commitment to ensure data sufficiency and statistical validity.', 'Predictive Analytics', '["Statistical time-series forecasting (ARIMA, Prophet, XGBoost)","Customer lifetime value (CLV) and churn propensity modeling","Feature engineering and cross-validation performance evaluation","Model interpretability analysis (SHAP values, driver weighting)"]', '["Trained predictive model pipeline with prediction export outputs","Model validation report with confidence intervals and error rates","Implementation guidance and model retraining guidelines"]', 'TrendingUp', '3 to 5 Weeks', '$3,800', 4, CURRENT_TIMESTAMP);

