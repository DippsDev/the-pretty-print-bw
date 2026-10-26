import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, readSessionToken } from "@/lib/adminAuth";
import { updateBooking } from "@/lib/studioStore";
import type { StudioBooking } from "@/lib/studioTypes";
import { cancelBooking } from "@/lib/calcom/client";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

function cents(amount: number) {
  return Math.round(amount * 100);
}

async function refundCard(booking: StudioBooking) {
  const key = process.env.YOCO_SECRET_KEY;
  if (!booking.yocoCheckoutId) {
    return {
      ok: true as const,
      note: "No card payment was attached, so nothing was sent to the bank. The booking is marked refunded in the studio book.",
    };
  }
  if (!key) {
    return {
      ok: false as const,
      error: "A card payment is attached, but Yoco is not configured, so the refund was not sent.",
    };
  }
  const response = await fetch(
    `https://payments.yoco.com/api/checkouts/${encodeURIComponent(booking.yocoCheckoutId)}/refund`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `refund-${booking.id}`,
      },
      body: JSON.stringify({ amount: cents(booking.total) }),
    },
  );
  const data = (await response.json().catch(() => null)) as { status?: string; message?: string; error?: string } | null;
  if (response.ok || response.status === 202) {
    const status = data?.status;
    if (status && status !== "successful" && status !== "pending") {
      return { ok: false as const, error: data?.message || "Yoco did not accept the refund." };
    }
    return { ok: true as const, note: "The card refund was sent to Yoco." };
  }
  return { ok: false as const, error: data?.message || data?.error || "Yoco refund failed." };
}

export async function POST(request: NextRequest, context: RouteContext) {
  const email = readSessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
  if (!email) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const action = body?.action;
  if (action !== "cancel" && action !== "refund") {
    return NextResponse.json({ error: "Choose cancel or refund." }, { status: 400 });
  }

  if (action === "refund") {
    const current = await updateBooking(id, () => undefined);
    if (!current) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    if (current.payment === "refunded") {
      return NextResponse.json({ booking: current, message: "This booking is already refunded." });
    }
    const result = await refundCard(current);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
    const booking = await updateBooking(id, (record) => {
      record.payment = "refunded";
      record.refundAmount = record.total;
      record.refundNote = result.note;
    });
    return NextResponse.json({ booking, message: result.note });
  }

  let calendarNote = "";
  let alreadyCancelled = false;
  const booking = await updateBooking(id, (record) => {
    alreadyCancelled = record.status === "cancelled";
    record.status = "cancelled";
  });
  if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  if (alreadyCancelled) {
    return NextResponse.json({ booking, message: "This booking is already cancelled." });
  }

  if (booking.calUid) {
    try {
      await cancelBooking({ uid: booking.calUid, reason: "Cancelled by the studio" });
      calendarNote = " The calendar booking was cancelled.";
    } catch {
      calendarNote = " The studio booking is cancelled. The calendar could not be reached.";
    }
  }

  return NextResponse.json({
    booking,
    message: `Booking cancelled.${calendarNote}`,
  });
}
