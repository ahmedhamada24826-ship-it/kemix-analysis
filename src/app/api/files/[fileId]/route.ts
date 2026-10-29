import { NextRequest, NextResponse } from "next/server";
import { getSession, isStaffRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/notifications";
import fs from "fs/promises";
import path from "path";
import { canAccessProject, canManageProject } from "@/lib/authorization";

const PRIVATE_UPLOADS_DIR = path.join(process.cwd(), "private", "uploads");

export async function GET(_req: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fileId } = await params;
  try {
    const fileRecord = await prisma.fileUpload.findUnique({
      where: { id: fileId },
      include: { project: { select: { id: true, clientId: true } } },
    });

    if (!fileRecord) return NextResponse.json({ error: "File not found" }, { status: 404 });

    // Auth check
    if (session.role === "CLIENT") {
      if (fileRecord.project?.clientId !== session.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const isAccessible =
        (fileRecord.category === "DELIVERABLE" && fileRecord.isApproved) ||
        (fileRecord.category === "CLIENT_UPLOAD" && fileRecord.uploadedByUserId === session.id);
      if (!isAccessible) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } else if (session.role === "TRAINEE") {
      if (!fileRecord.project || !(await canAccessProject(session, fileRecord.project.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const isAccessible = fileRecord.uploadedByUserId === session.id || (fileRecord.category === "DELIVERABLE" && fileRecord.isApproved);
      if (!isAccessible) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } else if (!isStaffRole(session.role) || !fileRecord.project || !(await canAccessProject(session, fileRecord.project.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (session.role === "SUPPORT_AGENT" && (fileRecord.category === "INTERNAL" || (fileRecord.category === "DELIVERABLE" && !fileRecord.isApproved))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const uploadsRoot = path.resolve(PRIVATE_UPLOADS_DIR);
    const filePath = path.resolve(uploadsRoot, fileRecord.storageKey);
    if (!filePath.startsWith(`${uploadsRoot}${path.sep}`)) return NextResponse.json({ error: "Invalid file location" }, { status: 400 });
    let fileBuffer: Buffer;
    try {
      fileBuffer = await fs.readFile(filePath);
    } catch {
      return NextResponse.json({ error: "File not found on storage" }, { status: 404 });
    }

    const safeFilename = fileRecord.originalName.replace(/[\r\n"\\]/g, "_").replace(/[^\x20-\x7E]/g, "_");
    return new Response(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": fileRecord.mimeType,
        "Content-Disposition": `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(fileRecord.originalName)}`,
        "Content-Length": fileRecord.sizeBytes.toString(),
        "Cache-Control": "private, no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { fileId } = await params;
  try {
    const current = await prisma.fileUpload.findUnique({ where: { id: fileId }, select: { projectId: true, category: true } });
    if (!current?.projectId || !(await canManageProject(session, current.projectId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid file update." }, { status: 400 });
    }
    const { isApproved, description, category } = body;

    const validCategories = ["INTERNAL", "DELIVERABLE", "CLIENT_UPLOAD", "PROPOSAL_ATTACHMENT"];
    if ((isApproved !== undefined && typeof isApproved !== "boolean") ||
        (description !== undefined && description !== null && (typeof description !== "string" || description.length > 2000)) ||
        (category !== undefined && (typeof category !== "string" || !validCategories.includes(category)))) {
      return NextResponse.json({ error: "One or more file fields are invalid." }, { status: 400 });
    }
    const resetApproval = category !== undefined && category !== current.category && isApproved === undefined;

    const fileRecord = await prisma.fileUpload.update({
      where: { id: fileId },
      data: {
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(resetApproval && { isApproved: false, approvedByUserId: null, approvedAt: null }),
        ...(isApproved !== undefined && {
          isApproved,
          approvedByUserId: isApproved ? session.id : null,
          approvedAt: isApproved ? new Date() : null,
        }),
      },
    });

    await logAudit({ actorId: session.id, action: "UPDATE", entityType: "FILE", entityId: fileId, details: { isApproved, category } });
    return NextResponse.json({ file: fileRecord });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fileId } = await params;
  try {
    const fileRecord = await prisma.fileUpload.findUnique({ where: { id: fileId }, include: { project: { select: { id: true } } } });
    if (!fileRecord) return NextResponse.json({ error: "File not found" }, { status: 404 });

    // Only SUPER_ADMIN/PROJECT_LEAD or the uploader within 1 hour can delete
    const isUploader = fileRecord.uploadedByUserId === session.id;
    const isWithinHour = Date.now() - fileRecord.createdAt.getTime() < 3600000;
    const canDelete = Boolean(fileRecord.project && await canManageProject(session, fileRecord.project.id)) || (isUploader && isWithinHour && Boolean(fileRecord.project && await canAccessProject(session, fileRecord.project.id)));

    if (!canDelete) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const uploadsRoot = path.resolve(PRIVATE_UPLOADS_DIR);
    const filePath = path.resolve(uploadsRoot, fileRecord.storageKey);
    if (!filePath.startsWith(`${uploadsRoot}${path.sep}`)) return NextResponse.json({ error: "Invalid file location" }, { status: 400 });

    await prisma.fileUpload.delete({ where: { id: fileId } });

    // Delete from disk
    try { await fs.unlink(filePath); } catch { /* ignore if already missing */ }

    await logAudit({ actorId: session.id, action: "DELETE", entityType: "FILE", entityId: fileId, details: { originalName: fileRecord.originalName } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
