import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

export async function seedDatabase() {
  // This seed creates public demo identities with a shared, documented password.
  // Never allow it to create those accounts against a production database.
  if (process.env.NODE_ENV === "production") {
    throw new Error("Demo seed data is disabled in production.");
  }

  console.log("Seeding KEMIX Analysis database...");

  // Check if users already exist
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log("Database already has data. Skipping seed.");
    return;
  }

  const demoPassword = randomBytes(24).toString("base64url");
  const defaultPassword = await bcrypt.hash(demoPassword, 12);
  console.log(`Local demo accounts share this one-time password: ${demoPassword}`);

  // 1. Create Staff Members
  const superAdmin = await prisma.user.create({
    data: {
      email: "admin@kemix-analysis.com",
      name: "Tariq Al-Mansoor",
      passwordHash: defaultPassword,
      phone: "+966 50 123 4567",
      companyName: "KEMIX Analysis HQ",
      companySector: "Executive & Data Operations",
      clientType: "ORGANIZATION",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });

  await prisma.user.create({
    data: {
      email: "ops@kemix-analysis.com",
      name: "Dina Al-Hassan",
      passwordHash: defaultPassword,
      phone: "+966 50 234 5678",
      companyName: "KEMIX Operations",
      companySector: "Operations Management",
      clientType: "ORGANIZATION",
      role: "OPERATIONS_MANAGER",
      status: "ACTIVE",
    },
  });

  const projectLead = await prisma.user.create({
    data: {
      email: "lead@kemix-analysis.com",
      name: "Karim Zaid",
      passwordHash: defaultPassword,
      phone: "+966 50 345 6789",
      companyName: "KEMIX Delivery Team",
      companySector: "Business Intelligence",
      clientType: "ORGANIZATION",
      role: "PROJECT_LEAD",
      status: "ACTIVE",
    },
  });

  const analyst = await prisma.user.create({
    data: {
      email: "analyst@kemix-analysis.com",
      name: "Lina Fakhry",
      passwordHash: defaultPassword,
      phone: "+966 50 456 7890",
      companyName: "KEMIX Delivery Team",
      companySector: "Data Analytics & Modeling",
      clientType: "ORGANIZATION",
      role: "ANALYST",
      status: "ACTIVE",
    },
  });

  const supportAgent = await prisma.user.create({
    data: {
      email: "support@kemix-analysis.com",
      name: "Rayan Qasim",
      passwordHash: defaultPassword,
      phone: "+966 50 567 8901",
      companyName: "KEMIX Client Care",
      companySector: "Technical & Customer Support",
      clientType: "ORGANIZATION",
      role: "SUPPORT_AGENT",
      status: "ACTIVE",
    },
  });

  // 2. Create Sample Clients
  const clientAcme = await prisma.user.create({
    data: {
      email: "client@acmecorp.com",
      name: "Sultan Al-Otaibi",
      passwordHash: defaultPassword,
      phone: "+966 55 987 6543",
      companyName: "Acme Logistics Ltd",
      companySector: "Supply Chain & Logistics",
      clientType: "ORGANIZATION",
      role: "CLIENT",
      status: "ACTIVE",
    },
  });

  const clientFintech = await prisma.user.create({
    data: {
      email: "sarah@growthfin.io",
      name: "Sarah Jenkins",
      passwordHash: defaultPassword,
      phone: "+971 50 876 5432",
      companyName: "GrowthFin Technologies",
      companySector: "FinTech & Payment Solutions",
      clientType: "ORGANIZATION",
      role: "CLIENT",
      status: "ACTIVE",
    },
  });

  // 3. Seed Services Catalog
  await prisma.service.createMany({
    data: [
      {
        slug: "data-analysis-and-reporting",
        title: "Data Analysis and Reporting",
        shortDescription:
          "Transform fragmented raw data into comprehensive executive reports, KPI dashboards, and data-driven insights.",
        fullDescription:
          "We analyze your sales, operational, marketing, or financial records to detect key trends, bottleneck drivers, and margin improvements. Deliverables include executive slide decks, diagnostic reports, and KPI trackers tailored to leadership.",
        category: "Analytics & Insights",
        features: JSON.stringify([
          "Exploratory Data Analysis (EDA) on structured & unstructured datasets",
          "Automated KPI calculation and variance analysis",
          "Executive summary slide decks and PDF diagnostic reports",
          "Cohort analysis, churn metrics, and revenue breakdown",
        ]),
        deliverables: JSON.stringify([
          "Comprehensive Analytical Insights Report (PDF & Interactive)",
          "Cleaned summary datasets with methodology notes",
          "Presentation-ready executive deck",
        ]),
        iconName: "BarChart3",
        estimatedTimeline: "1 to 2 Weeks",
        startingPrice: "$1,500",
        orderIndex: 1,
      },
      {
        slug: "business-intelligence-powerbi",
        title: "Business Intelligence & Power BI Dashboards",
        shortDescription:
          "Interactive, automated Power BI dashboards connecting to databases, APIs, and cloud data warehouses.",
        fullDescription:
          "Custom-designed enterprise dashboards built with best-practice DAX modeling, star-schema data architecture, automated scheduled refresh, and role-level security to give decision-makers real-time visibility.",
        category: "Business Intelligence",
        features: JSON.stringify([
          "High-performance Star-Schema data modeling and DAX optimization",
          "Custom visual layout adhering to KEMIX corporate design standards",
          "Automated scheduled data refresh with error alerting",
          "Row-level security (RLS) for departmental or branch access control",
        ]),
        deliverables: JSON.stringify([
          "Production Power BI (.pbix) files & cloud workspace publishing",
          "Data model documentation and DAX calculation dictionary",
          "Stakeholder training video walkthrough and admin handover guide",
        ]),
        iconName: "PieChart",
        estimatedTimeline: "2 to 3 Weeks",
        startingPrice: "$2,800",
        orderIndex: 2,
      },
      {
        slug: "data-cleaning-sql-python-automation",
        title: "Data Cleaning, SQL, Python & Automation",
        shortDescription:
          "End-to-end data pipeline development, automated ETL workflows, anomaly correction, and database migration.",
        fullDescription:
          "Eliminate manual spreadsheet work. We build automated Python scripts, SQL transformation stored procedures, and scheduled cron workflows that ingest, clean, validate, and store business data accurately.",
        category: "Data Engineering",
        features: JSON.stringify([
          "Automated data extraction from Excel, CSV, Google Sheets, ERP, and APIs",
          "Deduplication, normalization, and outlier detection logic",
          "Production-ready SQL queries, views, and database indexes",
          "Scheduled execution with failure alerts and logging",
        ]),
        deliverables: JSON.stringify([
          "Documented Python ETL scripts & modular code repository",
          "Optimized SQL schema scripts and migration files",
          "Execution runbook and failure recovery protocol",
        ]),
        iconName: "Cpu",
        estimatedTimeline: "1 to 3 Weeks",
        startingPrice: "$2,200",
        orderIndex: 3,
      },
      {
        slug: "forecasting-and-data-science",
        title: "Forecasting and Data Science",
        shortDescription:
          "Predictive machine learning models for demand forecasting, customer churn, and trend projection (subject to historical data feasibility).",
        fullDescription:
          "Rigorous statistical and machine learning modeling to forecast sales, optimize inventory levels, and score customer retention. Feasibility is thoroughly assessed before scope commitment to ensure data sufficiency and statistical validity.",
        category: "Predictive Analytics",
        features: JSON.stringify([
          "Statistical time-series forecasting (ARIMA, Prophet, XGBoost)",
          "Customer lifetime value (CLV) and churn propensity modeling",
          "Feature engineering and cross-validation performance evaluation",
          "Model interpretability analysis (SHAP values, driver weighting)",
        ]),
        deliverables: JSON.stringify([
          "Trained predictive model pipeline with prediction export outputs",
          "Model validation report with confidence intervals and error rates",
          "Implementation guidance and model retraining guidelines",
        ]),
        iconName: "TrendingUp",
        estimatedTimeline: "3 to 5 Weeks",
        startingPrice: "$3,800",
        orderIndex: 4,
      },
    ],
  });

  // 4. Sample Service Request 1: Acme Logistics (In Progress / Project Created)
  const requestAcme = await prisma.serviceRequest.create({
    data: {
      referenceNumber: "KMX-2026-0101",
      clientId: clientAcme.id,
      serviceType: "Business Intelligence & Power BI Dashboards",
      problemDescription:
        "Our warehouse operations suffer from delayed visibility into delivery performance across 14 distribution hubs. Fleet management data is scattered across manual spreadsheets and an older SQL Server instance.",
      businessObjective:
        "Consolidate warehouse dispatch and delivery time metrics into a centralized real-time Power BI dashboard for executive leadership and regional hub managers.",
      desiredOutcome:
        "Reduce delayed dispatches by 25% and automate daily executive morning KPI reporting.",
      currentChallenge:
        "Operations team spends 4 hours every morning manually copying numbers into Excel.",
      expectedValue: "$120,000 annual operational savings through eliminated idle fleet hours.",
      dataSourceType: "database",
      approxDataVolume: "Around 450,000 rows across 3 tables updated daily",
      hasDataAccess: true,
      hasRestrictions: true,
      needsPreparationHelp: true,
      preferredDeadline: "3 Weeks",
      budgetRange: "$3,000 - $6,000",
      preferredContactMethod: "PLATFORM",
      bestTimeForCall: "Weekdays 10:00 AM - 1:00 PM AST",
      additionalNotes: "We have NDA signed and read-only database credentials ready for the staging environment.",
      status: "IN_PROGRESS",
      assignedStaffId: projectLead.id,
      consultationDate: new Date(Date.now() - 7 * 24 * 3600 * 1000),
      internalNotes: "Client validated. Data schema received and reviewed. High priority client with multiple future projects planned.",
    },
  });

  // 5. Sample Proposal for Acme Logistics
  const proposalAcme = await prisma.proposal.create({
    data: {
      referenceNumber: "PROP-2026-0042",
      requestId: requestAcme.id,
      clientId: clientAcme.id,
      version: 1,
      title: "Warehouse Logistics Executive Power BI Dashboard Suite",
      scopeSummary:
        "Architect and implement a high-performance Power BI dashboard suite connecting to Acme's SQL database with automated daily refresh, hub performance scorecards, and fleet delivery SLA tracking.",
      deliverables: JSON.stringify([
        "Executive Fleet & Dispatch Overview Dashboard",
        "Regional Hub Drill-down Operational View",
        "Driver SLA and Turnaround Time Distribution Analysis",
        "Automated Scheduled Refresh Configuration with Failure Alerts",
        "Admin and User Training Session + Documentation Package",
      ]),
      price: 4500,
      currency: "USD",
      paymentTerms: "50% upfront upon acceptance, 50% upon final deliverable handover and acceptance.",
      timelineDays: 18,
      assumptions: "Client provides read-only SQL connection to staging replica and access to Power BI service workspace.",
      exclusions: "Direct ERP modifications or hardware IoT GPS sensor troubleshooting.",
      expiresAt: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      status: "ACCEPTED",
      acceptedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      acceptedByUserId: clientAcme.id,
    },
  });

  // 6. Project Created for Acme Logistics
  const projectAcme = await prisma.project.create({
    data: {
      referenceNumber: "PRJ-2026-0018",
      requestId: requestAcme.id,
      clientId: clientAcme.id,
      title: "Acme Logistics Power BI Fleet Performance Suite",
      description:
        "Centralized operations dashboard connecting 14 regional hubs with automated daily data refresh and driver turnaround analysis.",
      scopeOfWork:
        "Star-schema data model, DAX SLA metrics, hub heatmaps, mobile layout view, and scheduled gateway refresh.",
      leadStaffId: projectLead.id,
      status: "ACTIVE",
      startDate: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      targetDeliveryDate: new Date(Date.now() + 12 * 24 * 3600 * 1000),
      budget: 4500,
    },
  });

  // Milestones for Acme Project
  await prisma.milestone.createMany({
    data: [
      {
        projectId: projectAcme.id,
        title: "Data Audit, SQL Schema Inspection & Validation",
        description: "Connect to database replica, verify table integrity, and validate historical log counts.",
        dueDate: new Date(Date.now() - 3 * 24 * 3600 * 1000),
        completedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
        status: "COMPLETED",
        orderIndex: 1,
      },
      {
        projectId: projectAcme.id,
        title: "Star-Schema Data Model & DAX Metric Calculations",
        description: "Build relationships, time intelligence tables, and driver SLA formulas.",
        dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000),
        completedAt: null,
        status: "IN_PROGRESS",
        orderIndex: 2,
      },
      {
        projectId: projectAcme.id,
        title: "Interactive UI Layout, Drill-Downs & Mobile View",
        description: "Design executive visuals adhering to KEMIX standards and client branding.",
        dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        completedAt: null,
        status: "PENDING",
        orderIndex: 3,
      },
      {
        projectId: projectAcme.id,
        title: "QA Validation, User Handover & Cloud Publishing",
        description: "Verify refresh schedules, test row-level security, and deliver handover deck.",
        dueDate: new Date(Date.now() + 12 * 24 * 3600 * 1000),
        completedAt: null,
        status: "PENDING",
        orderIndex: 4,
      },
    ],
  });

  // Deliverables for Acme Project
  await prisma.deliverable.create({
    data: {
      projectId: projectAcme.id,
      title: "Data Architecture & Schema Blueprint (v1.0)",
      description: "Technical document describing the star schema, measure groups, and SQL views.",
      fileUrl: "/deliverables/acme-architecture-blueprint-v1.pdf",
      externalLink: "https://app.powerbi.com/groups/kemix-staging/reports/acme-logistics-preview",
      fileType: "PDF",
      fileSize: "1.8 MB",
      version: "1.0",
      isApproved: true,
      publishedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
    },
  });

  // Conversation thread for Acme Project
  const convAcme = await prisma.conversation.create({
    data: {
      title: "Project Discussion: Acme Fleet BI Suite",
      requestId: requestAcme.id,
      projectId: projectAcme.id,
      clientId: clientAcme.id,
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: convAcme.id,
        senderId: clientAcme.id,
        content:
          "Hello Karim, we have provisioned the read-only credentials for the staging replica database and updated the security group IP whitelist.",
        isInternalStaffNote: false,
        readByClient: true,
        readByStaff: true,
        createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
      },
      {
        conversationId: convAcme.id,
        senderId: projectLead.id,
        content:
          "Thank you Sultan! We tested the connection successfully and have begun mapping the dispatch tables into our Star Schema model. We will share the milestone update shortly.",
        isInternalStaffNote: false,
        readByClient: true,
        readByStaff: true,
        createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      },
      {
        conversationId: convAcme.id,
        senderId: analyst.id,
        content:
          "INTERNAL NOTE: Found 1,200 records in Hub 4 where timestamp format differed between AM and 24h. We patched this in the staging transformation view.",
        isInternalStaffNote: true, // Internal staff note - client cannot see!
        readByClient: false,
        readByStaff: true,
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      },
      {
        conversationId: convAcme.id,
        senderId: projectLead.id,
        content:
          "Hi Sultan, Milestone 1 is completed. The Data Architecture & Schema Blueprint is now available under your Deliverables tab. Please review when convenient.",
        isInternalStaffNote: false,
        readByClient: true,
        readByStaff: true,
        createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
      },
    ],
  });

  // 7. Sample Request 2: GrowthFin (New Request awaiting review)
  await prisma.serviceRequest.create({
    data: {
      referenceNumber: "KMX-2026-0102",
      clientId: clientFintech.id,
      serviceType: "Forecasting and Data Science",
      problemDescription:
        "We are launching a new recurring subscription tier and need to forecast churn probability based on 18 months of historical user payment and transaction behavior.",
      businessObjective:
        "Build a predictive model and risk scoring algorithm to identify accounts at risk of churn 30 days before renewal.",
      desiredOutcome:
        "Improve customer retention by 15% through proactive automated account outreach.",
      currentChallenge:
        "Currently relying on reactive cancellation tickets when it's already too late.",
      expectedValue: "Estimated $200,000 annual recurring revenue preservation.",
      dataSourceType: "database",
      approxDataVolume: "Approx 1.2 million transaction rows, Stripe export logs",
      hasDataAccess: true,
      hasRestrictions: true,
      needsPreparationHelp: true,
      preferredDeadline: "1 Month",
      budgetRange: "$5,000 - $10,000",
      preferredContactMethod: "EMAIL",
      bestTimeForCall: "Afternoons 2:00 PM - 5:00 PM GST",
      additionalNotes: "Strict GDPR and data anonymization requirements apply.",
      status: "NEW_REQUEST",
      assignedStaffId: null,
      internalNotes: null,
    },
  });

  // 8. Sample Support Ticket
  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber: "TKT-2026-0012",
      clientId: clientAcme.id,
      assignedStaffId: supportAgent.id,
      subject: "Adding two regional managers to Power BI workspace viewer role",
      category: "Deliverable Access",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      resolutionNotes: "Pending confirmation of email addresses from client IT team.",
    },
  });

  await prisma.ticketReply.createMany({
    data: [
      {
        ticketId: ticket.id,
        senderId: clientAcme.id,
        content:
          "Hi KEMIX Support, we need to grant read-only dashboard access to two regional directors: r.salem@acmecorp.com and m.nasser@acmecorp.com. How can we add them?",
        isInternal: false,
        createdAt: new Date(Date.now() - 12 * 3600 * 1000),
      },
      {
        ticketId: ticket.id,
        senderId: supportAgent.id,
        content:
          "Hello Sultan, we have received your request! We are verifying the licenses in the client workspace and will grant access within 2 hours.",
        isInternal: false,
        createdAt: new Date(Date.now() - 10 * 3600 * 1000),
      },
    ],
  });

  // 9. Sample Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: clientAcme.id,
        title: "Milestone Completed",
        message: "Data Audit & Schema Blueprint has been completed for your project.",
        link: "/client/projects",
        type: "PROJECT",
        isRead: false,
      },
      {
        userId: superAdmin.id,
        title: "New Service Request",
        message: "GrowthFin Technologies submitted request KMX-2026-0102 for Forecasting and Data Science.",
        link: "/admin/requests",
        type: "REQUEST",
        isRead: false,
      },
    ],
  });

  // 10. Audit Log
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: superAdmin.id,
        action: "SEED_INIT",
        entityType: "SYSTEM",
        entityId: "SYSTEM_INITIALIZATION",
        details: JSON.stringify({ message: "Initial system database seeded with default users and services" }),
      },
      {
        actorId: clientAcme.id,
        action: "APPROVE",
        entityType: "PROPOSAL",
        entityId: proposalAcme.id,
        details: JSON.stringify({ proposalNumber: proposalAcme.referenceNumber, version: 1, price: 4500 }),
      },
    ],
  });

  console.log("KEMIX Analysis database successfully seeded!");
}
