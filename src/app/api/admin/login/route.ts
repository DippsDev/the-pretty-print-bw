import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  checkLogin,
  cookieOptions,
  createSessionToken,
} from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const result = checkLogin(email, password);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  const response = NextResponse.json({ email: result.email });
  response.cookies.set(ADMIN_COOKIE, createSessionToken(result.email), cookieOptions());
  return response;
}
