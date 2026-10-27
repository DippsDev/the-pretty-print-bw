import { createHmac, timingSafeEqual } from "crypto";
import {
  findBookingByCheckoutId,
  readBooking,
  readBookings,
  updateBooking,
} from "@/lib/studioStore";
import type { StudioBooking } from "@/lib/studioTypes";

type CheckoutRecord = {
  id?: string;
  status?: string;
  redirectUrl?: string;
};

function secretKey() {
  return process.env.YOCO_SECRET_KEY || "";
}

function cents(amount: number) {
  return Math.round(amount * 100);
}

async function fetchCheckout(checkoutId: string, key: string) {
  const response = await fetch(`https://payments.yoco.com/api/checkouts/${encodeURIComponent(checkoutId)}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  if (!response.ok) return null;
  return (await response.json().catch(() => null)) as CheckoutRecord | null;
}

export async function settleIfCheckoutCompleted(id: string) {
  const key = secretKey();
  const current = readBooking(id);
  if (!current || current.payment !== "unpaid" || current.paymentMethod !== "card" || !current.yocoCheckoutId || !key) {
    return current;
  }
  try {
    const checkout = await fetchCheckout(current.yocoCheckoutId, key);
    if (checkout?.status !== "completed") return current;
    return await updateBooking(id, (record) => {
      if (record.payment === "unpaid") record.payment = "paid";
    });
  } catch {
    return current;
  }
}

export async function refreshUnpaidCardBookings() {
  if (!secretKey()) return;
  const pending = readBookings().filter(
    (booking) => booking.payment === "unpaid" && booking.paymentMethod === "card" && booking.yocoCheckoutId,
  );
  for (const booking of pending) {
    await settleIfCheckoutCompleted(booking.id);
  }
}

export function markPaidFromWebhook(input: { bookingId?: string; checkoutId?: string; amount?: number }) {
  const booking =
    (input.bookingId ? readBooking(input.bookingId) : null) ||
    (input.checkoutId ? findBookingByCheckoutId(input.checkoutId) : null);
  if (!booking || booking.payment !== "unpaid" || booking.paymentMethod !== "card") return null;
  if (typeof input.amount === "number" && input.amount !== cents(booking.total)) return null;
  return updateBooking(booking.id, (record) => {
    if (record.payment === "unpaid" && record.paymentMethod === "card") record.payment = "paid";
  });
}

export function yocoWebhookTrusted(headers: Headers, rawBody: string) {
  const secret = process.env.YOCO_WEBHOOK_SECRET || "";
  if (!secret.startsWith("whsec_")) return false;
  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signatureHeader = headers.get("webhook-signature");
  if (!id || !timestamp || !signatureHeader) return false;
  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt) || Math.abs(Date.now() / 1000 - sentAt) > 180) return false;

  const signed = `${id}.${timestamp}.${rawBody}`;
  const secretBytes = Buffer.from(secret.slice("whsec_".length), "base64");
  const expected = createHmac("sha256", secretBytes).update(signed).digest("base64");
  const expectedBuf = Buffer.from(expected);
  return signatureHeader.split(" ").some((part) => {
    const value = part.split(",")[1] || "";
    const actual = Buffer.from(value);
    return actual.length === expectedBuf.length && timingSafeEqual(actual, expectedBuf);
  });
}

function lineItems(booking: StudioBooking, amount: number) {
  const items = booking.services.map((service) => {
    const price = Number(String(service.price).replace(/[^\d.]/g, ""));
    return {
      displayName: service.name || "Style",
      quantity: 1,
      pricingDetails: { price: Number.isFinite(price) ? Math.round(price * 100) : 0 },
      description: service.stylist ? `Stylist: ${service.stylist}` : "",
    };
  });
  const sum = items.reduce((total, item) => total + item.pricingDetails.price, 0);
  if (items.length === 0 || sum !== amount) {
    return [
      {
        displayName: "Studio booking",
        quantity: 1,
        pricingDetails: { price: amount },
        description: "",
      },
    ];
  }
  return items;
}

export async function startCardCheckout(bookingId: string, origin: string) {
  const key = secretKey();
  const booking = readBooking(bookingId);
  if (!booking) return { ok: false as const, status: 404, error: "Booking not found.", fallbackVenue: false };
  if (booking.payment === "paid") {
    return { ok: false as const, status: 409, error: "This booking is already paid.", fallbackVenue: false };
  }
  if (booking.paymentMethod !== "card") {
    return { ok: false as const, status: 400, error: "This booking is set to pay at the studio.", fallbackVenue: false };
  }
  if (!key) {
    return {
      ok: false as const,
      status: 503,
      error: "Online payment could not be started, so this booking is set to pay at the studio.",
      fallbackVenue: true,
    };
  }

  if (booking.yocoCheckoutId) {
    const existing = await fetchCheckout(booking.yocoCheckoutId, key);
    if (existing?.status === "completed") {
      await settleIfCheckoutCompleted(booking.id);
      return { ok: false as const, status: 409, error: "This booking is already paid.", fallbackVenue: false };
    }
    if (existing?.redirectUrl && existing.status !== "failed" && existing.status !== "expired") {
      return { ok: true as const, url: existing.redirectUrl };
    }
  }

  const amount = cents(booking.total);
  const response = await fetch("https://payments.yoco.com/api/checkouts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `checkout-${booking.id}-${booking.yocoCheckoutId || "new"}`,
    },
    body: JSON.stringify({
      amount,
      currency: "ZAR",
      successUrl: `${origin}/book/paid?booking=${encodeURIComponent(booking.id)}`,
      cancelUrl: `${origin}/book?payment=cancelled`,
      failureUrl: `${origin}/book?payment=failed`,
      metadata: { bookingId: booking.id },
      lineItems: lineItems(booking, amount),
    }),
  });
  const data = (await response.json().catch(() => null)) as CheckoutRecord & { error?: string; message?: string } | null;
  if (!response.ok || !data?.id || !data.redirectUrl) {
    return {
      ok: false as const,
      status: 502,
      error: "Online payment could not be started, so this booking is set to pay at the studio.",
      fallbackVenue: true,
    };
  }

  await updateBooking(booking.id, (record) => {
    record.yocoCheckoutId = data.id;
    record.paymentMethod = "card";
  });
  return { ok: true as const, url: data.redirectUrl };
}
