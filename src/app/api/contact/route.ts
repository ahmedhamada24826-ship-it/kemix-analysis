import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (name.length < 2 || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
      subject.length < 2 || subject.length > 200 || message.length < 5 || message.length > 2000) {
      return NextResponse.json({ error: "Please check your name, email, subject, and message." }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    const ipLimit = checkRateLimit(`contact_ip_${ip}`, 10, 60 * 60 * 1000);
    const emailLimit = checkRateLimit(`contact_email_${email}`, 3, 60 * 60 * 1000);
    if (!ipLimit.success || !emailLimit.success) {
      return NextResponse.json({ error: "Too many inquiries. Please try again later." }, { status: 429 });
    }

    const inquiry = await prisma.contactInquiry.create({ data: { name, email, subject, message } });
    const team = await prisma.user.findMany({
      where: { status: "ACTIVE", role: { in: ["SUPER_ADMIN", "OPERATIONS_MANAGER", "SUPPORT_AGENT"] } },
      select: { id: true },
    });
    await Promise.all(team.map((member) => sendNotification({
      userId: member.id,
      title: "New contact inquiry",
      message: `${name}: ${subject}`,
      link: "/admin/contact-inquiries",
      type: "REQUEST",
    })));
    return NextResponse.json({ success: true, reference: inquiry.id.slice(-8).toUpperCase() }, { status: 201 });
  } catch (error) {
    console.error("Contact inquiry submission failed:", error);
    return NextResponse.json({ error: "Could not submit your inquiry. Please try again." }, { status: 500 });
  }
}
