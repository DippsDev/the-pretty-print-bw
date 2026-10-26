import { NextRequest, NextResponse } from "next/server";
import { createBooking } from "@/lib/studioStore";

export const runtime = "nodejs";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "The booking could not be read." }, { status: 400 });
  }

  const clientName = String(body.clientName || "").trim();
  const clientEmail = String(body.clientEmail || "").trim().toLowerCase();
  const clientPhone = String(body.clientPhone || "").trim().slice(0, 30);
  const date = String(body.date || "").trim().slice(0, 40);
  const time = String(body.time || "").trim().slice(0, 40);
  const notes = String(body.notes || "").trim().slice(0, 1000);
  const servicesIn = Array.isArray(body.services) ? body.services : [];

  if (!clientName || clientName.length > 80) {
    return NextResponse.json({ error: "Add the client name." }, { status: 400 });
  }
  if (!EMAIL.test(clientEmail) || clientEmail.length > 120) {
    return NextResponse.json({ error: "Add a valid email." }, { status: 400 });
  }
  if (!date || !time) {
    return NextResponse.json({ error: "Choose a date and time first." }, { status: 400 });
  }
  if (servicesIn.length < 1 || servicesIn.length > 12) {
    return NextResponse.json({ error: "Choose at least one service." }, { status: 400 });
  }

  const services = servicesIn.map((service: { name?: unknown; price?: unknown; stylist?: unknown }) => ({
    name: String(service?.name || "Style").trim().slice(0, 80) || "Style",
    price: String(service?.price || "").trim().slice(0, 24),
    stylist: String(service?.stylist || "").trim().slice(0, 80),
  }));

  const totalValue = Number(body.total);
  const total = Number.isFinite(totalValue) ? Math.max(0, Math.min(100000, totalValue)) : 0;

  const booking = await createBooking({
    clientName,
    clientEmail,
    clientPhone,
    services,
    date,
    time,
    notes,
    total,
  });

  return NextResponse.json({ booking });
}
