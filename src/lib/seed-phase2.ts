import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedDepartmentsAndWorkflow() {
  console.log("🏢 Seeding departments...");

  const departments = [
    { name: "Client Relations & Project Operations", description: "Client onboarding, project coordination, proposal management, and delivery oversight.", color: "#0b2545", orderIndex: 0 },
    { name: "Data Analysis", description: "Statistical analysis, reporting, data exploration, and business insights.", color: "#0066ff", orderIndex: 1 },
    { name: "Business Intelligence", description: "Power BI dashboards, data visualization, KPI frameworks, and executive reporting.", color: "#059669", orderIndex: 2 },
    { name: "Data Science & AI", description: "Machine learning models, predictive analytics, forecasting, and AI solutions.", color: "#7c3aed", orderIndex: 3 },
    { name: "Data Engineering", description: "Data pipelines, SQL optimization, ETL processes, Python automation, and infrastructure.", color: "#ff7a00", orderIndex: 4 },
  ];

  for (const dept of departments) {
    const existing = await prisma.department.findFirst({ where: { name: dept.name } });
    if (!existing) {
      await prisma.department.create({ data: dept });
      console.log(`  ✓ Created: ${dept.name}`);
    } else {
      console.log(`  → Already exists: ${dept.name}`);
    }
  }

  console.log("\n⚙️  Seeding workflow templates...");

  const templates = [
    {
      name: "Standard Data Analysis",
      serviceType: "data_analysis",
      description: "Standard 5-stage workflow for data analysis and reporting projects.",
      isDefault: false,
      stages: JSON.stringify([
        { key: "requirements", title: "Requirements & Data Collection", description: "Gather business requirements, define KPIs, and collect raw data from client." },
        { key: "data_prep", title: "Data Preparation & Cleaning", description: "Validate, clean, transform, and standardize the dataset." },
        { key: "analysis", title: "Analysis & Modelling", description: "Perform exploratory data analysis, compute metrics, and build report structure." },
        { key: "review", title: "Internal QA Review", description: "Quality assurance check — peer review of findings and methodology." },
        { key: "delivery", title: "Client Delivery", description: "Present findings, deliver report files, and collect client feedback." },
      ]),
    },
    {
      name: "Business Intelligence Dashboard",
      serviceType: "business_intelligence",
      description: "Workflow for Power BI / dashboard projects including design and deployment.",
      isDefault: false,
      stages: JSON.stringify([
        { key: "discovery", title: "Discovery & Requirements", description: "Understand KPIs, data sources, and stakeholder needs." },
        { key: "data_model", title: "Data Modelling & Integration", description: "Build star schema, connect data sources, write DAX/SQL." },
        { key: "design", title: "Dashboard Design & Development", description: "Create visuals, layout, navigation, and interactivity." },
        { key: "testing", title: "Testing & Validation", description: "Validate numbers, test filters, cross-check against source data." },
        { key: "training", title: "Handover & Training", description: "Deliver dashboard, document usage, and train end-users." },
      ]),
    },
    {
      name: "Data Science & Forecasting",
      serviceType: "data_science",
      description: "Workflow for machine learning and predictive analytics projects.",
      isDefault: false,
      stages: JSON.stringify([
        { key: "scoping", title: "Problem Scoping & Feasibility", description: "Define the prediction target, assess data sufficiency, and confirm feasibility." },
        { key: "feature_eng", title: "Feature Engineering", description: "Create and select features from raw data for modelling." },
        { key: "modelling", title: "Model Development", description: "Train, tune, and evaluate candidate models." },
        { key: "validation", title: "Model Validation", description: "Backtesting, error analysis, and client scenario validation." },
        { key: "deployment", title: "Delivery & Documentation", description: "Deliver model, predictions, and usage documentation." },
      ]),
    },
    {
      name: "Universal Project Workflow",
      serviceType: null,
      description: "General-purpose workflow suitable for any project type.",
      isDefault: true,
      stages: JSON.stringify([
        { key: "kickoff", title: "Project Kickoff", description: "Confirm scope, assign team, and establish communication." },
        { key: "execution", title: "Execution", description: "Core project work by the assigned team." },
        { key: "review", title: "Internal Review", description: "Internal QA and peer review before client delivery." },
        { key: "delivery", title: "Client Delivery", description: "Deliver outputs and collect approval." },
      ]),
    },
  ];

  for (const t of templates) {
    const existing = await prisma.workflowTemplate.findFirst({ where: { name: t.name } });
    if (!existing) {
      // If marking as default, clear existing defaults
      if (t.isDefault) {
        await prisma.workflowTemplate.updateMany({ data: { isDefault: false } });
      }
      await prisma.workflowTemplate.create({ data: t });
      console.log(`  ✓ Created template: ${t.name}`);
    } else {
      console.log(`  → Already exists: ${t.name}`);
    }
  }

  // Assign staff to departments based on existing seed data
  console.log("\n👥 Assigning existing staff to departments...");
  
  const deptMap: Record<string, string> = {};
  const allDepts = await prisma.department.findMany();
  for (const d of allDepts) { deptMap[d.name] = d.id; }

  const staffAssignments: Array<{ email: string; dept: string; jobTitle: string }> = [
    { email: "admin@kemix-analysis.com", dept: "Client Relations & Project Operations", jobTitle: "Founder & CEO" },
    { email: "ops@kemix-analysis.com", dept: "Client Relations & Project Operations", jobTitle: "Operations Manager" },
    { email: "lead@kemix-analysis.com", dept: "Business Intelligence", jobTitle: "BI Lead" },
    { email: "analyst@kemix-analysis.com", dept: "Data Analysis", jobTitle: "Senior Data Analyst" },
    { email: "support@kemix-analysis.com", dept: "Client Relations & Project Operations", jobTitle: "Support Specialist" },
  ];

  for (const assign of staffAssignments) {
    const deptId = deptMap[assign.dept];
    if (!deptId) continue;
    const updated = await prisma.user.updateMany({
      where: { email: assign.email },
      data: { departmentId: deptId, jobTitle: assign.jobTitle },
    });
    if (updated.count > 0) console.log(`  ✓ ${assign.email} → ${assign.dept}`);
  }

  // Set department leads
  const adminUser = await prisma.user.findUnique({ where: { email: "admin@kemix-analysis.com" } });
  const leadUser = await prisma.user.findUnique({ where: { email: "lead@kemix-analysis.com" } });
  const analystUser = await prisma.user.findUnique({ where: { email: "analyst@kemix-analysis.com" } });

  if (adminUser && deptMap["Client Relations & Project Operations"]) {
    await prisma.department.update({
      where: { id: deptMap["Client Relations & Project Operations"] },
      data: { leadUserId: adminUser.id },
    });
  }
  if (leadUser && deptMap["Business Intelligence"]) {
    await prisma.department.update({
      where: { id: deptMap["Business Intelligence"] },
      data: { leadUserId: leadUser.id },
    });
  }
  if (analystUser && deptMap["Data Analysis"]) {
    await prisma.department.update({
      where: { id: deptMap["Data Analysis"] },
      data: { leadUserId: analystUser.id },
    });
  }

  console.log("\n✅ Phase 2 seed complete!");
  await prisma.$disconnect();
}

seedDepartmentsAndWorkflow().catch((e) => { console.error(e); process.exit(1); });
