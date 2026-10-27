import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, readSessionToken } from "@/lib/adminAuth";
import { readBookings } from "@/lib/studioStore";
import { refreshUnpaidCardBookings } from "@/lib/yocoPayments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const email = readSessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
  if (!email) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  await refreshUnpaidCardBookings();
  return NextResponse.json({ bookings: readBookings() });
}
