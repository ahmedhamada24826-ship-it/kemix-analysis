import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateToken, setSessionCookie } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(`invite_accept_${ip}`, 10, 60 * 60 * 1000).success) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }
    const body = await req.json().catch(() => null);
    const { token, name, password } = body || {};

    if (typeof token !== "string" || token.length > 256 || typeof name !== "string" || name.trim().length < 2 || name.length > 120 || typeof password !== "string" || !password) {
      return NextResponse.json({ error: "token, name, and password are required" }, { status: 400 });
    }

    if (password.length < 8 || password.length > 256) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const invite = await prisma.userInvite.findUnique({ where: { token } });
    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid or expired invitation link" }, { status: 404 });
    }
    if (invite.role === "CLIENT") {
      return NextResponse.json({ error: "This invitation is not valid for a staff account" }, { status: 400 });
    }
    if (invite.departmentId) {
      const department = await prisma.department.findFirst({ where: { id: invite.departmentId, isActive: true }, select: { id: true } });
      if (!department) return NextResponse.json({ error: "The assigned department is no longer active" }, { status: 409 });
    }

    // Check email not already taken
    const existing = await prisma.user.findUnique({ where: { email: invite.email } });
    if (existing) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });

    const passwordHash = await hashPassword(password);
    const user = await prisma.$transaction(async (tx) => {
      const acceptedInvite = await tx.userInvite.updateMany({
        where: { token, acceptedAt: null, expiresAt: { gt: new Date() } },
        data: { acceptedAt: new Date() },
      });
      if (acceptedInvite.count !== 1) throw new Error("INVITE_ALREADY_USED");

      return tx.user.create({
        data: {
          email: invite.email,
          name: name.trim(),
          passwordHash,
          role: invite.role,
          departmentId: invite.departmentId || null,
          status: "ACTIVE",
        },
      });
    });

    // Auto-login
    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Parameters<typeof generateToken>[0]["role"],
      companyName: null,
      clientType: "ORGANIZATION",
    };
    const jwtToken = generateToken(sessionUser);
    await setSessionCookie(jwtToken);

    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "INVITE_ALREADY_USED") {
      return NextResponse.json({ error: "This invitation has already been used" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
