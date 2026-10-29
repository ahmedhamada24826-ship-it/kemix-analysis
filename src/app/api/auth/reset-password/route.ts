import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (typeof body.token !== "string" || body.token.length < 32 || body.token.length > 256 ||
        typeof body.password !== "string" || body.password.length < 12 || body.password.length > 256) {
      return NextResponse.json({ error: "Use a valid reset link and a password with at least 12 characters." }, { status: 400 });
    }
    const tokenHash = createHash("sha256").update(body.token).digest("hex");
    const candidate = await prisma.passwordResetToken.findUnique({ where: { tokenHash }, select: { id: true, expiresAt: true, usedAt: true } });
    if (!candidate || candidate.usedAt || candidate.expiresAt <= new Date()) {
      return NextResponse.json({ error: "This reset link is invalid or expired. Request a new one." }, { status: 400 });
    }
    const passwordHash = await hashPassword(body.password);
    const now = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      const token = await tx.passwordResetToken.findUnique({ where: { tokenHash }, select: { id: true, userId: true, expiresAt: true, usedAt: true } });
      if (!token || token.usedAt || token.expiresAt <= now) return false;
      const claimed = await tx.passwordResetToken.updateMany({ where: { id: token.id, usedAt: null, expiresAt: { gt: now } }, data: { usedAt: now } });
      if (claimed.count !== 1) return false;
      await tx.user.update({ where: { id: token.userId }, data: { passwordHash, authVersion: { increment: 1 } } });
      await tx.passwordResetToken.deleteMany({ where: { userId: token.userId, id: { not: token.id } } });
      return true;
    });
    if (!updated) return NextResponse.json({ error: "This reset link is invalid or expired. Request a new one." }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password reset failed:", error);
    return NextResponse.json({ error: "Could not reset the password. Request a new link and try again." }, { status: 500 });
  }
}
