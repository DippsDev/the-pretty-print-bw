import React, { useState } from "react";
import ProfessionalSelectionModal, { Professional } from "../modals/ProfessionalSelectionModal";
import { motion, AnimatePresence } from "framer-motion";

const professionals: Professional[] = [
  {
    id: 0,
    name: "Any professional",
    role: "for maximum availability",
    avatar: null,
    isGroup: true,
  },
  // Add more professionals here if needed
];

export default function ProfessionalPerServiceStep({
  bookings,
  selectedProfessionals,
  setSelectedProfessionals,
  onBack,
  onContinue,
}: {
  bookings: { name: string; option: string; time: string; price: string }[];
  selectedProfessionals: { [bookingIdx: number]: number | undefined };
  setSelectedProfessionals: React.Dispatch<React.SetStateAction<{ [bookingIdx: number]: number | undefined }>>;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [modalOpenIdx, setModalOpenIdx] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-6 w-full">
      <h2 className="text-2xl font-bold mb-2 text-[#141414]">Assign professionals per service</h2>
      <div className="flex flex-col gap-4">
        {bookings.map((b, i) => (
          <div key={i} className="border rounded-lg p-4 bg-white flex flex-row items-center gap-4">
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-semibold text-lg text-[#141414] truncate">{b.option}</span>
              <span className="text-xs text-[#232323]/70">{b.time}</span>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                className={`relative flex items-center justify-between px-8 py-2 rounded-full font-medium transition-colors min-w-[140px] bg-white text-[#141414] hover:border-[#33383C]`}
                style={{
                  fontFamily: "inherit",
                  boxShadow: "none",
                  border: "1px solid #d1d5db", // Force border color
                }}
                type="button"
                onClick={() => setModalOpenIdx(i)}
              >
                {/* Group icon on the left, no outline, no round bg */}
                <span className="flex items-center mr-2">
                  <svg width="20" height="20" fill="none" viewBox="0 0 32 32">
                    <circle cx="12" cy="15" r="3" fill="#A3A3A3" />
                    <circle cx="20" cy="15" r="3" fill="#A3A3A3" />
                    <ellipse cx="16" cy="22" rx="7" ry="3" fill="#A3A3A3" />
                  </svg>
                </span>
                <span className="flex-1 text-center">
                  {selectedProfessionals[i] !== undefined
                    ? professionals.find(p => p.id === selectedProfessionals[i])?.name || "Any professional"
                    : "Any professional"}
                </span>
                {/* Down arrow icon on the right, same as time step */}
                <span className="flex items-center ml-2">
                  <svg width="18" height="18" fill="none" viewBox="0 0 20 20">
                    <path d="M5 8l5 5 5-5" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </button>
            </div>
            <AnimatePresence>
              {modalOpenIdx === i && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  style={{ position: 'fixed', inset: 0, zIndex: 101 }}
                >
                  <ProfessionalSelectionModal
                    open={true}
                    onClose={() => setModalOpenIdx(null)}
                    selectedProfessional={selectedProfessionals[i] ?? null}
                    onSelect={(id: number) => {
                      setSelectedProfessionals(prev => ({
                        ...prev,
                        [i]: id
                      }));
                      setModalOpenIdx(null);
                    }}
                    professionals={professionals}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
      <div className="flex flex-row gap-4 mt-8">
        <button
          onClick={onBack}
          className="text-[#33383C] text-sm px-3 py-1 rounded hover:bg-gray-100 transition font-medium"
          style={{ textDecoration: 'none' }}
        >
          Back
        </button>
        {/* Continue button removed, controlled by ServicesPage */}
      </div>
    </div>
  );
}
