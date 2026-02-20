import React, { useState } from "react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import PaymentMethodModal from "../modals/PaymentMethod";

export default function ConfirmStep({
  bookings,
  selectedDate,
  selectedTime,
  professionalMode,
  selectedProfessional,
  selectedProfessionals,
  total,
  onBack,
  bookingNotes,
  onBookingNotesChange,
}: {
  bookings: { name: string; option: string; time: string; price: string }[];
  selectedDate: Date | null;
  selectedTime: string | null;
  professionalMode: 'single' | 'perService';
  selectedProfessional?: number;
  selectedProfessionals: { [bookingIdx: number]: number | undefined };
  total: number;
  onBack: () => void;
  bookingNotes: string;
  onBookingNotesChange: (value: string) => void;
}) {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const paymentMethod = useSelector((state: RootState) => state.paymentMethod.selected);

  function getProfessionalName(id: number | undefined) {
    if (id === undefined) return "Any professional";
    const professionals = [
      { id: 0, name: "Any professional" },
      { id: 1, name: "Banele" },
      { id: 2, name: "Dineo" },
      { id: 3, name: "Michelle" },
    ];
    return professionals.find(p => p.id === id)?.name || "Any professional";
  }

  // Payment method display
  let paymentLabel = "No payment method";
  let paymentDesc = "Pay with card or pay at venue";
  if (paymentMethod === "card") {
    paymentLabel = "Card";
    paymentDesc = "Pay securely by card";
  } else if (paymentMethod === "venue") {
    paymentLabel = "Pay at venue";
    paymentDesc = "Pay when you arrive";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="flex flex-col gap-8 w-full"
      style={{ minHeight: 420 }}
    >
      <h2 className="text-3xl font-bold mb-2 text-[#141414]">Review and confirm</h2>
      {/* Payment method */}
      <div className="flex flex-col gap-6">
        <div>
          <p className="font-semibold text-lg mb-2 text-[#141414]">Payment method</p>
          <div className="flex flex-row items-center gap-4 bg-[#fafbfc] rounded-xl p-4 border">
            <span aria-hidden="true">
              <svg width="32" height="32" fill="#d1d5db" viewBox="0 0 32 32">
                <path fillRule="evenodd" d="M2 8a2 2 0 0 1 2-2h24a2 2 0 0 1 2 2v5.113H4V24h7.667a1 1 0 1 1 0 2H4a2 2 0 0 1-2-2zm2 3.113h24V8H4z" clipRule="evenodd"></path>
                <path fillRule="evenodd" d="M24 16a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2h-4v4a1 1 0 1 1-2 0v-4h-4a1 1 0 1 1 0-2h4v-4a1 1 0 0 1 1-1" clipRule="evenodd"></path>
              </svg>
            </span>
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-base text-[#141414]">{paymentLabel}</span>
              <span className="text-sm text-[#7B8487]">{paymentDesc}</span>
            </div>
            <button
              type="button"
              className="ml-auto px-4 py-2 rounded-full border font-medium text-[#33383C] bg-white hover:bg-gray-100 transition"
              style={{ minWidth: 80 }}
              onClick={() => setPaymentModalOpen(true)}
            >
              Edit
            </button>
          </div>
        </div>
        {/* Terms and conditions (aligned, no deposit policy) */}
        <div>
          <p className="font-semibold text-lg mb-2 text-[#141414]">Terms and conditions</p>
          <p className="text-sm text-[#7B8487]">
            Payment is required either upfront by card or at the venue on the day of your appointment. If you need to reschedule or cancel, please notify us at least 24 hours in advance. Late cancellations or no-shows may be subject to a fee.
          </p>
        </div>
        {/* Booking notes */}
        <div>
          <p className="font-semibold text-lg mb-2 text-[#141414]">Booking notes</p>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-[#232323] font-medium" htmlFor="booking-notes">Booking notes</label>
            <textarea
              id="booking-notes"
              className="w-full border rounded-lg p-3 text-[#141414] bg-white focus:outline-none focus:ring-1 focus:ring-[#33383C]"
              placeholder="Include comments or requests about your booking"
              value={bookingNotes}
              onChange={e => onBookingNotesChange(e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </div>
      {/* Actions */}
      <div className="flex flex-row gap-4 mt-8">
        <button
          onClick={onBack}
          className="text-[#33383C] text-sm px-3 py-1 rounded hover:bg-gray-100 transition font-medium"
          style={{ textDecoration: 'none' }}
        >
          Back
        </button>
        {/* Confirm & Pay button removed, handled by ServicesPage summary */}
      </div>
      {/* Payment method modal */}
      <PaymentMethodModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
      />
    </motion.div>
  );
}
