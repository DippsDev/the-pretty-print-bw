import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, readSessionToken } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const email = readSessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
  if (!email) return NextResponse.json({ email: null }, { status: 401 });
  return NextResponse.json({ email });
}
