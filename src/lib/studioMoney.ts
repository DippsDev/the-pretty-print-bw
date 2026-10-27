import type { StudioBooking } from "@/lib/studioTypes";

export function formatPula(total: number) {
  const value = Number.isFinite(total) ? total : 0;
  return `P${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2)}`;
}

export function paymentLabel(booking: StudioBooking) {
  if (booking.payment === "refunded") return "Refunded";
  if (booking.payment === "paid") return booking.paymentMethod === "card" ? "Paid online" : "Paid at studio";
  if (booking.paymentMethod === "card") return "Awaiting online payment";
  return "Pay at studio";
}

export function paidAmount(booking: StudioBooking) {
  return booking.payment === "paid" ? booking.total : 0;
}

export function refundedAmount(booking: StudioBooking) {
  if (booking.payment !== "refunded") return 0;
  return typeof booking.refundAmount === "number" ? booking.refundAmount : booking.total;
}

export function outstandingAmount(booking: StudioBooking) {
  if (booking.status === "cancelled" || booking.payment !== "unpaid") return 0;
  return booking.total;
}
