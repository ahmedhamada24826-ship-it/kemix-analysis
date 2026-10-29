import { NextRequest, NextResponse } from "next/server";
import { getSession, isStaffRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/notifications";
import { canAccessProject, canManageProject } from "@/lib/authorization";
import fs from "fs/promises";
import path from "path";

const PRIVATE_UPLOADS_DIR = path.join(process.cwd(), "private", "uploads");

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv", "text/plain",
  "application/zip", "application/json",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const MAX_SIZE = 52428800; // 50MB

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    if (!(await canAccessProject(session, id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const whereClause: Record<string, unknown> = { projectId: id };
    if (session.role === "CLIENT") {
      whereClause.OR = [
        { category: "DELIVERABLE", isApproved: true },
        { category: "CLIENT_UPLOAD", uploadedByUserId: session.id },
      ];
    } else if (session.role === "SUPPORT_AGENT") {
      whereClause.OR = [
        { category: "DELIVERABLE", isApproved: true },
        { category: "CLIENT_UPLOAD" },
        { category: "PROPOSAL_ATTACHMENT" },
      ];
    } else if (session.role === "TRAINEE") {
      whereClause.OR = [
        { uploadedByUserId: session.id },
        { category: "DELIVERABLE", isApproved: true },
      ];
    }

    const files = await prisma.fileUpload.findMany({
      where: whereClause,
      include: { uploadedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  try {
    // Verify project access
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, clientId: true } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    if (session.role === "CLIENT" && project.clientId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (session.role !== "CLIENT" && (!isStaffRole(session.role) || !(await canAccessProject(session, projectId)))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File exceeds 50MB limit" }, { status: 413 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: `File type '${file.type}' is not allowed` }, { status: 415 });
    }

    let category = (formData.get("category") as string) || "INTERNAL";
    if (session.role === "CLIENT") category = "CLIENT_UPLOAD";
    if (session.role !== "CLIENT" && category === "DELIVERABLE" && !(await canManageProject(session, projectId))) {
      return NextResponse.json({ error: "Only project leads can publish deliverables." }, { status: 403 });
    }
    if (!["INTERNAL", "DELIVERABLE", "CLIENT_UPLOAD", "PROPOSAL_ATTACHMENT"].includes(category)) {
      return NextResponse.json({ error: "Invalid file category" }, { status: 400 });
    }

    const description = (formData.get("description") as string) || null;

    // Sanitize and generate unique filename
    const ext = path.extname(file.name);
    const safeBase = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(ext, "");
    const uniqueName = `${crypto.randomUUID()}-${safeBase}${ext}`;
    const storageKey = `${projectId}/${uniqueName}`;
    const uploadDir = path.join(PRIVATE_UPLOADS_DIR, projectId);

    await fs.mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(uploadDir, uniqueName), buffer);

    const isApproved = category === "DELIVERABLE" && await canManageProject(session, projectId);

    const upload = await prisma.fileUpload.create({
      data: {
        projectId,
        uploadedByUserId: session.id,
        filename: uniqueName,
        originalName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        storageKey,
        category,
        description,
        isApproved,
      },
      include: { uploadedBy: { select: { id: true, name: true } } },
    });

    await logAudit({ actorId: session.id, action: "UPLOAD", entityType: "FILE", entityId: upload.id, details: { originalName: file.name, projectId, category } });
    return NextResponse.json({ file: upload }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
