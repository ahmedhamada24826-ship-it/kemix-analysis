import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateToken, setSessionCookie, Role } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAudit, sendNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateCheck = checkRateLimit(`register_${ip}`, 5, 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again in a minute." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid registration details." }, { status: 400 });
    const { name, email, password, phone, companyName, companySector, clientType } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length < 2 || name.length > 120) {
      return NextResponse.json({ error: "Please provide a valid full name." }, { status: 400 });
    }

    if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please provide a valid business email." }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 8 || password.length > 256) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }
    if ((phone !== undefined && phone !== null && (typeof phone !== "string" || phone.length > 40)) || (companyName !== undefined && companyName !== null && (typeof companyName !== "string" || companyName.length > 200)) || (companySector !== undefined && companySector !== null && (typeof companySector !== "string" || companySector.length > 160))) {
      return NextResponse.json({ error: "Optional profile fields must be text." }, { status: 400 });
    }

    // Check duplicate
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const validClientType = clientType === "INDIVIDUAL" ? "INDIVIDUAL" : "ORGANIZATION";

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        phone: phone ? phone.trim() : null,
        companyName: companyName ? companyName.trim() : null,
        companySector: companySector ? companySector.trim() : null,
        clientType: validClientType,
        role: "CLIENT",
        status: "ACTIVE",
      },
    });

    // Session token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      companyName: user.companyName,
      clientType: user.clientType,
    });

    await setSessionCookie(token);

    // Welcome notification
    await sendNotification({
      userId: user.id,
      title: "Welcome to KEMIX Analysis",
      message: "Your client account has been created. You can now submit service requests and track your data projects.",
      link: "/client",
      type: "GENERAL",
    });

    await logAudit({
      actorId: user.id,
      action: "REGISTER",
      entityType: "USER",
      entityId: user.id,
      details: { email: user.email, company: user.companyName },
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration. Please try again." },
      { status: 500 }
    );
  }
}
