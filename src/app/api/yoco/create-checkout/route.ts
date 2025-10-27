import { NextRequest, NextResponse } from "next/server";

const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY!;
const YOCO_CHECKOUT_URL = "https://payments.yoco.com/api/checkouts"; // <-- Use correct Yoco endpoint

export async function POST(req: NextRequest) {
  try {
    const { email, total, bookings, date, time } = await req.json();

    if (!email || !total || !bookings || !Array.isArray(bookings)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Build lineItems as per Yoco API
    const lineItems = bookings.map((b: any) => ({
      displayName: b.name && b.option && !b.name.includes(b.option) ? `${b.name} - ${b.option}` : b.name,
      quantity: 1,
      pricingDetails: {
        price: parseInt(
          (b.price || "0")
            .replace(/[^\d.,]/g, "")
            .replace(/\s/g, "")
            .replace(",", "")
        ) * 100,
      },
      description: b.time ? `Time: ${b.time}` : "",
    }));

    if (lineItems.length === 0) {
      lineItems.push({
        displayName: "Booking",
        quantity: 1,
        pricingDetails: { price: Math.round(Number(total) * 100) },
        description: "",
      });
    }

    const totalAmount = Math.round(Number(total) * 100);

    const payload = {
      amount: totalAmount,
      currency: "ZAR",
      cancelUrl: process.env.NEXT_PUBLIC_YOCO_CANCEL_URL || "https://belamour.co.za/booking/cancel",
      successUrl: process.env.NEXT_PUBLIC_YOCO_SUCCESS_URL || "https://belamour.co.za/booking/success",
      failureUrl: process.env.NEXT_PUBLIC_YOCO_FAILURE_URL || "https://belamour.co.za/booking/failed",
      metadata: { bookings, date, time, email },
      lineItems,
    };

    const yocoRes = await fetch(YOCO_CHECKOUT_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${YOCO_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const yocoData = await yocoRes.json();

    if (yocoRes.ok && yocoData?.redirectUrl) {
      return NextResponse.json({ url: yocoData.redirectUrl });
    } else {
      return NextResponse.json({ error: yocoData?.error || "Failed to create Yoco checkout session" }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
