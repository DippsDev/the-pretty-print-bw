import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AddCardModal({
  open,
  onClose,
  onSave,
  onBack,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (card: { name: string; number: string; expiry: string; cvc: string }) => void;
  onBack?: () => void;
}) {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  const canSave = name && number && expiry && cvc;

  if (!open) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center"
        style={{ minHeight: "100dvh" }}
        onClick={onClose}
        role="dialog"
        tabIndex={-1}
        aria-labelledby="add-card-modal-title"
      >
        {/* Overlay with only fade/blur, no scale */}
        <motion.div
          key="add-card-modal-overlay"
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
          key="add-card-modal-content"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.22 }}
          className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-8 flex flex-col"
          style={{ minHeight: 420, zIndex: 1 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            {onBack && (
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-100 transition font-medium text-[#33383C]"
                onClick={onBack}
              >
                <span>
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 32 32">
                    <path fillRule="evenodd" d="M14.707 6.293a1 1 0 0 1 0 1.414L7.414 15H27a1 1 0 1 1 0 2H7.414l7.293 7.293a1 1 0 0 1-1.414 1.414l-9-9a1 1 0 0 1 0-1.414l9-9a1 1 0 0 1 1.414 0" clipRule="evenodd"></path>
                  </svg>
                </span>
                <span>Go back</span>
              </button>
            )}
            <h2 id="add-card-modal-title" className="text-xl font-semibold text-[#141414] mx-0 text-left">Add card</h2>
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
          {/* Form */}
          <form
            className="flex flex-col gap-6"
            onSubmit={e => {
              e.preventDefault();
              if (canSave) {
                onSave({ name, number, expiry, cvc });
              }
            }}
          >
            <div className="flex flex-col gap-2">
              <label htmlFor="card-name" className="text-sm font-medium text-[#232323]">Name on card*</label>
              <input
                id="card-name"
                type="text"
                autoComplete="cc-name"
                placeholder="Add card holder full name"
                className="w-full border rounded-lg p-3 text-[#141414] bg-white focus:outline-none focus:ring-1 focus:ring-[#33383C]"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="card-number" className="text-sm font-medium text-[#232323]">Card number*</label>
              <input
                id="card-number"
                type="text"
                autoComplete="cc-number"
                placeholder="Card number"
                className="w-full border rounded-lg p-3 text-[#141414] bg-white focus:outline-none focus:ring-1 focus:ring-[#33383C]"
                value={number}
                onChange={e => setNumber(e.target.value)}
                required
                maxLength={19}
                inputMode="numeric"
              />
            </div>
            <div className="flex flex-row gap-4">
              <div className="flex flex-col gap-2 flex-1">
                <label htmlFor="card-expiry" className="text-sm font-medium text-[#232323]">Expiry date*</label>
                <input
                  id="card-expiry"
                  type="text"
                  autoComplete="cc-exp"
                  placeholder="MM/YY"
                  className="w-full border rounded-lg p-3 text-[#141414] bg-white focus:outline-none focus:ring-1 focus:ring-[#33383C]"
                  value={expiry}
                  onChange={e => setExpiry(e.target.value)}
                  required
                  maxLength={5}
                />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <label htmlFor="card-cvc" className="text-sm font-medium text-[#232323]">Security code*</label>
                <input
                  id="card-cvc"
                  type="text"
                  autoComplete="cc-csc"
                  placeholder="CVC"
                  className="w-full border rounded-lg p-3 text-[#141414] bg-white focus:outline-none focus:ring-1 focus:ring-[#33383C]"
                  value={cvc}
                  onChange={e => setCvc(e.target.value)}
                  required
                  maxLength={4}
                  inputMode="numeric"
                />
              </div>
            </div>
            {/* Payment brands */}
            <div className="flex flex-col gap-2 mt-2">
              <p className="text-sm text-[#7B8487]">Pay securely with</p>
              <div className="flex flex-row gap-3 items-center">
                {/* Only SVGs, no names */}
                <img src="/cards/visa.svg" alt="Visa" className="h-6" />
                <img src="/cards/mastercard.svg" alt="Mastercard" className="h-6" />
                <img src="/cards/amex.svg" alt="Amex" className="h-6" />
                <img src="/cards/discover.svg" alt="Discover" className="h-6" />
                <img src="/cards/diners.svg" alt="Diners" className="h-6" />
              </div>
            </div>
            {/* Actions */}
            <div className="flex flex-row gap-4 mt-8">
              <button
                type="button"
                className="py-2 px-8 rounded-full font-semibold text-base bg-gray-200 text-[#33383C] hover:bg-gray-300 transition"
                onClick={onClose}
                style={{
                  border: "2px solid #d1d5db",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`py-2 px-8 rounded-full font-semibold text-base ${canSave ? "bg-[#33383C] text-white hover:bg-[#232323]" : "bg-gray-300 text-gray-600 cursor-not-allowed"}`}
                disabled={!canSave}
                style={{
                  border: "2px solid",
                  borderColor: canSave ? "#33383C" : "#d1d5db",
                  background: "#33383C",
                  color: "#fff",
                }}
              >
                Save
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
