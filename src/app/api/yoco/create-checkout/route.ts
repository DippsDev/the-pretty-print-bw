import { NextRequest, NextResponse } from "next/server";
import { updateBooking } from "@/lib/studioStore";
import { startCardCheckout } from "@/lib/yocoPayments";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const bookingId = typeof body?.bookingId === "string" ? body.bookingId : "";
  if (!bookingId) {
    return NextResponse.json({ error: "Booking not found." }, { status: 400 });
  }

  try {
    const result = await startCardCheckout(bookingId, request.nextUrl.origin);
    if (!result.ok) {
      if (result.fallbackVenue) {
        await updateBooking(bookingId, (record) => {
          if (record.payment === "unpaid") record.paymentMethod = "venue";
        });
      }
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ url: result.url });
  } catch {
    await updateBooking(bookingId, (record) => {
      if (record.payment === "unpaid" && record.paymentMethod === "card") record.paymentMethod = "venue";
    });
    return NextResponse.json(
      { error: "Online payment could not be started, so this booking is set to pay at the studio." },
      { status: 502 },
    );
  }
}
