import { randomBytes, createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

const GENERIC_MESSAGE = "If an active account matches that email, password reset instructions will be sent shortly.";
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

export async function POST(req: NextRequest) {
  const genericResponse = () => NextResponse.json({ message: GENERIC_MESSAGE });
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(`password_reset_ip_${ip}`, 8, 60 * 60 * 1000).success ||
        !checkRateLimit(`password_reset_email_${email}`, 3, 60 * 60 * 1000).success) return genericResponse();

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true, status: true } });
    // Do not create un-deliverable tokens. Production must configure Resend before offering recovery.
    if (!user || user.status !== "ACTIVE" || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM || !process.env.NEXT_PUBLIC_APP_URL) return genericResponse();
    let appUrl: URL;
    try { appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL); } catch { return genericResponse(); }
    if (appUrl.protocol !== "https:" && appUrl.hostname !== "localhost") return genericResponse();

    const token = randomBytes(32).toString("base64url");
    const tokenHash = hashToken(token);
    const resetRecord = await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 30 * 60 * 1000) } });
    const resetUrl = new URL("/auth/reset-password", appUrl);
    resetUrl.searchParams.set("token", token);
    const name = escapeHtml(user.name);
    const sent = await sendEmail({
      to: user.email,
      subject: "Reset your KEMIX Analysis password",
      text: `Hello ${user.name}, use this link within 30 minutes to reset your password: ${resetUrl.toString()}. If you did not request this, ignore this email.`,
      html: `<p>Hello ${name},</p><p>Use the link below within 30 minutes to reset your KEMIX Analysis password.</p><p><a href="${resetUrl.toString()}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
    });
    if (sent) {
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, id: { not: resetRecord.id } } });
    } else {
      await prisma.passwordResetToken.deleteMany({ where: { tokenHash } });
    }
    return genericResponse();
  } catch (error) {
    console.error("Password reset request failed:", error);
    return genericResponse();
  }
}
