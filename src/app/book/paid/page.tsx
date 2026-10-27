import Link from "next/link";
import { DM_Sans, Italiana } from "next/font/google";
import { Scissors } from "lucide-react";
import { readBooking } from "@/lib/studioStore";
import { settleIfCheckoutCompleted } from "@/lib/yocoPayments";
import "../../booking.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm",
});

const italiana = Italiana({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-italiana",
});

export default async function PaidPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string }>;
}) {
  const { booking: bookingId = "" } = await searchParams;
  const booking = bookingId ? (await settleIfCheckoutCompleted(bookingId)) || readBooking(bookingId) : null;
  const paid = booking?.payment === "paid";

  return (
    <div className={`booking-page min-h-[100dvh] ${dmSans.variable} ${italiana.variable} ${dmSans.className}`}>
      <header className="booking-header">
        <Link href="/" className="booking-brand" aria-label="thePRETTYPRINT home">
          <Scissors size={19} strokeWidth={1.5} />
          <span>thePRETTYPRINT</span>
          <small>HAIR STUDIO</small>
        </Link>
        <span className="booking-header-label">Booking</span>
      </header>
      <div className="booking-shell flex justify-center px-6 py-12">
        <article className="booking-panel w-full max-w-md">
          <p className="booking-kicker">{paid ? "Paid online" : "Payment"}</p>
          <h1 className="booking-heading">{paid ? "Payment received." : "We're confirming the card."}</h1>
          <p className="text-sm leading-relaxed text-[#626262]">
            {booking
              ? paid
                ? "The studio book shows this visit as paid."
                : "The booking is saved. It shows as paid on the studio book once Yoco confirms the card."
              : "This payment link does not match a booking."}
          </p>
          <Link href="/" className="booking-continue mt-8 inline-flex items-center justify-center">
            Return to the studio
          </Link>
        </article>
      </div>
    </div>
  );
}
