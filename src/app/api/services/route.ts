import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: "asc" },
    });

    const parsed = services.map((s) => ({
      ...s,
      features: JSON.parse(s.features || "[]"),
      deliverables: JSON.parse(s.deliverables || "[]"),
    }));

    return NextResponse.json({ services: parsed });
  } catch (error) {
    console.error("Fetch services error:", error);
    return NextResponse.json({ error: "Failed to load services" }, { status: 500 });
  }
}
