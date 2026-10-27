import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, readSessionToken } from "@/lib/adminAuth";
import { readBookings, readGroups } from "@/lib/studioStore";
import { buildStudioReport } from "@/lib/studioReport";
import { refreshUnpaidCardBookings } from "@/lib/yocoPayments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const email = readSessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
  if (!email) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  await refreshUnpaidCardBookings();
  const bytes = await buildStudioReport(readBookings(), readGroups());
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="thePRETTYPRINT-studio-book-${stamp}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
