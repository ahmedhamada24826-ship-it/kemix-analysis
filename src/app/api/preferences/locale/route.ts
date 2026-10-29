import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || (body.locale !== "en" && body.locale !== "ar")) {
    return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set("kemix_locale", body.locale, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return NextResponse.json({ success: true, locale: body.locale });
}
