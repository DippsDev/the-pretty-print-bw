import { NextRequest, NextResponse } from "next/server";
import { markPaidFromWebhook, yocoWebhookTrusted } from "@/lib/yocoPayments";

export const runtime = "nodejs";

type WebhookBody = {
  type?: string;
  payload?: {
    amount?: number;
    metadata?: { checkoutId?: string; bookingId?: string };
  };
};

export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!process.env.YOCO_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret is not configured." }, { status: 503 });
  }
  if (!yocoWebhookTrusted(request.headers, raw)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 403 });
  }

  let event: WebhookBody;
  try {
    event = JSON.parse(raw) as WebhookBody;
  } catch {
    return NextResponse.json({ error: "The webhook could not be read." }, { status: 400 });
  }
  if (event.type === "payment.succeeded") {
    await markPaidFromWebhook({
      bookingId: event.payload?.metadata?.bookingId,
      checkoutId: event.payload?.metadata?.checkoutId,
      amount: event.payload?.amount,
    });
  }

  return NextResponse.json({ received: true });
}
