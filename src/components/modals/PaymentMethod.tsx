import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { setPaymentMethod } from "@/redux/features/paymentMethodSlice";
import type { RootState } from "@/redux/store";
import AddCardModal from "./AddCard";

export default function PaymentMethodModal({
  open,
  onClose,
  payNowAmount,
}: {
  open: boolean;
  onClose: () => void;
  payNowAmount?: string;
}) {
  const dispatch = useDispatch();
  const selected = useSelector((state: RootState) => state.paymentMethod.selected);
  const [addCardOpen, setAddCardOpen] = useState(false);

  function handleSelect(type: "card" | "venue") {
    dispatch(setPaymentMethod(type));
  }

  // Select button logic (copied from ProfessionalSelection)
  function renderSelectButton(type: "card" | "venue", isAddCard?: boolean) {
    // For "Add card" option, highlight only when addCardOpen is true
    const isSelected = isAddCard ? addCardOpen : selected === type;
    return (
      <motion.button
        className={`px-4 py-2 rounded-full border-2 font-semibold transition-colors duration-200 flex items-center justify-center min-w-[80px] ${
          isSelected
            ? 'border-[#33383C] text-[#33383C] bg-[#f7f7f7]'
            : 'border-[#d1d5db] text-[#33383C] bg-transparent hover:border-[#33383C]'
        }`}
        style={{ background: 'transparent', boxShadow: 'none' }}
        type="button"
        aria-pressed={isSelected}
        whileTap={{ scale: 0.96 }}
      >
        <motion.span
          key={isSelected ? "check" : "select"}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.18 }}
          className={isSelected ? "flex items-center justify-center" : ""}
        >
          {isSelected ? (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="11" fill="#33383C"/>
              <path d="M6 11.5l3 3 7-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            "Select"
          )}
        </motion.span>
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center"
          style={{ minHeight: "100dvh" }}
          onClick={onClose}
          role="dialog"
          tabIndex={-1}
          aria-labelledby="payment-method-modal-title"
        >
          {/* Overlay with only fade/blur, no scale */}
          <motion.div
            key="payment-method-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "linear" }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            style={{ zIndex: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            key="payment-method-modal-content"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 sm:p-8 flex flex-col"
            style={{ minHeight: 380, zIndex: 1 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-end mb-6">
              <button
                type="button"
                className="p-2 rounded-full hover:bg-gray-100 transition"
                aria-label="Close modal"
                onClick={onClose}
              >
                <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                  <path fill="#33383C" fillRule="evenodd" d="M7.293 7.293a1 1 0 0 1 1.414 0L16 14.586l7.293-7.293a1 1 0 1 1 1.414 1.414L17.414 16l7.293 7.293a1 1 0 0 1-1.414 1.414L16 17.414l-7.293 7.293a1 1 0 0 1-1.414-1.414L14.586 16 7.293 8.707a1 1 0 0 1 0-1.414" clipRule="evenodd"></path>
                </svg>
              </button>
            </div>
            {/* Modal body */}
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-lg font-semibold text-[#141414] mb-1">Select payment method</p>
                {payNowAmount && (
                  <p className="text-sm text-[#7B8487]">{payNowAmount} to pay now</p>
                )}
              </div>
              <div className="flex flex-col gap-4 mt-2">
                {/* Pay with Card Option */}
                <div
                  className={`border rounded-lg p-4 bg-white flex flex-row items-center gap-3 cursor-pointer hover:bg-gray-50 transition w-full relative`}
                  style={{
                    border: "2px solid",
                    borderColor: selected === "card" ? "#33383C" : "#d1d5db",
                  }}
                  onClick={() => handleSelect("card")}
                >
                  <span>
                    <svg width="28" height="28" fill="#d1d5db" viewBox="0 0 32 32">
                      <path fillRule="evenodd" d="M2 8a2 2 0 0 1 2-2h24a2 2 0 0 1 2 2v5.113H4V24h7.667a1 1 0 1 1 0 2H4a2 2 0 0 1-2-2zm2 3.113h24V8H4z" clipRule="evenodd"></path>
                      <path fillRule="evenodd" d="M24 16a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2h-4v4a1 1 0 1 1-2 0v-4h-4a1 1 0 1 1 0-2h4v-4a1 1 0 0 1 1-1" clipRule="evenodd"></path>
                    </svg>
                  </span>
                  <span className="font-medium text-base text-[#141414]">Pay with card</span>
                  <span className="ml-auto flex items-center justify-center min-w-[80px]">
                    {renderSelectButton("card")}
                  </span>
                </div>
                {/* Pay at Venue Option */}
                <div
                  className={`border rounded-lg p-4 bg-white flex flex-row items-center gap-3 cursor-pointer hover:bg-gray-50 transition w-full relative`}
                  style={{
                    border: "2px solid",
                    borderColor: selected === "venue" ? "#33383C" : "#d1d5db",
                  }}
                  onClick={() => handleSelect("venue")}
                >
                  <span>
                    <svg width="28" height="28" fill="currentColor" viewBox="0 0 32 32">
                      <circle cx="16" cy="16" r="14" stroke="#232323" strokeWidth="2" fill="none"/>
                      <ellipse cx="16" cy="20" rx="7" ry="5" fill="#232323" />
                      <circle cx="16" cy="13" r="4" fill="#232323" />
                    </svg>
                  </span>
                  <span className="font-medium text-base text-[#141414]">Pay at venue</span>
                  <span className="ml-auto flex items-center justify-center min-w-[80px]">
                    {renderSelectButton("venue")}
                  </span>
                </div>
              </div>
            </div>
            {/* Actions */}
            <div className="flex flex-row gap-4 mt-8">
              <button
                type="button"
                className="py-2 px-8 rounded-full font-semibold text-base bg-[#33383C] text-white hover:bg-[#232323] transition"
                onClick={onClose}
              >
                Done
              </button>
            </div>
            {/* Add Card Modal */}
            <AddCardModal
              open={addCardOpen}
              onClose={() => setAddCardOpen(false)}
              onSave={card => {
                setAddCardOpen(false);
                // You can handle saving the card here
              }}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
