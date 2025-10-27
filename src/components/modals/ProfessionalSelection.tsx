import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface Professional {
  id: number;
  name: string;
  role: string;
  avatar?: string | null;
  isGroup?: boolean;
}

interface ProfessionalSelectionModalProps {
  open: boolean;
  onClose: () => void;
  selectedProfessional?: number;
  onSelect: (id?: number) => void;
  professionals?: Professional[];
}

const defaultProfessionals: Professional[] = [
  {
    id: 0,
    name: "Any professional",
    role: "for maximum availability",
    avatar: null,
    isGroup: true,
  },
  {
    id: 1,
    name: "Banele",
    role: "Therapist",
    avatar: "/professionals/banele.jpg",
  },
  {
    id: 2,
    name: "Dineo",
    role: "Therapist",
    avatar: "/professionals/dineo.jpg",
  },
  {
    id: 3,
    name: "Michelle",
    role: "Therapist",
    avatar: "/professionals/michelle.jpg",
  },
];

const ProfessionalSelectionModal: React.FC<ProfessionalSelectionModalProps> = ({
  open,
  onClose,
  selectedProfessional,
  onSelect,
  professionals = defaultProfessionals,
}) => {
  function handleSelect(id: number) {
    // Toggle selection: deselect if already selected
    if (selectedProfessional === id) {
      onSelect(undefined);
    } else {
      onSelect(id);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[201] flex items-center justify-center" style={{ minHeight: "100dvh" }}>
          {/* Overlay with only fade/blur, no scale */}
          <motion.div
            key="professional-modal-overlay"
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
            key="professional-modal-content"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 flex flex-col"
            style={{
              minHeight: 320,
              zIndex: 1,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#141414]">Select Professional</h2>
              <button
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100"
                aria-label="Close modal"
                onClick={onClose}
                type="button"
              >
                {/* Close SVG */}
                <svg width="24" height="24" viewBox="0 0 32 32" fill="none"><path fill="#33383C" fillRule="evenodd" d="M7.293 7.293a1 1 0 0 1 1.414 0L16 14.586l7.293-7.293a1 1 0 1 1 1.414 1.414L17.414 16l7.293 7.293a1 1 0 0 1-1.414 1.414L16 17.414l-7.293 7.293a1 1 0 0 1-1.414-1.414L14.586 16 7.293 8.707a1 1 0 0 1 0-1.414" clipRule="evenodd"></path></svg>
              </button>
            </div>
            <div className="flex flex-col gap-4 w-full">
              <AnimatePresence>
                {professionals.map((pro, idx) => (
                  <motion.div
                    key={pro.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.05 }}
                    className={`border rounded-lg p-4 bg-white flex flex-row items-center gap-4 cursor-pointer hover:bg-gray-50 transition w-full`}
                    style={{
                      minWidth: 0,
                      opacity: 1, // Always allow all options to be clickable
                      pointerEvents: 'auto'
                    }}
                    onClick={() => handleSelect(pro.id)}
                  >
                    {pro.isGroup ? (
                      <span className="w-14 h-14 flex items-center justify-center rounded-full bg-[#f3f3f3]">
                        {/* Group icon */}
                        <svg width="32" height="32" fill="none" viewBox="0 0 32 32">
                          <circle cx="16" cy="16" r="16" fill="none" />
                          <g>
                            <circle cx="12" cy="15" r="3" fill="#A3A3A3" />
                            <circle cx="20" cy="15" r="3" fill="#A3A3A3" />
                            <ellipse cx="16" cy="22" rx="7" ry="3" fill="#A3A3A3" />
                          </g>
                        </svg>
                      </span>
                    ) : (
                      <img src={pro.avatar!} alt={pro.name} className="w-14 h-14 rounded-full object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-lg text-[#141414] truncate">{pro.name}</div>
                      <div className="text-sm text-[#7B8487] truncate">{pro.role}</div>
                    </div>
                    <motion.button
                      className={`px-4 py-2 rounded-full border-2 font-semibold transition-colors duration-200 flex items-center justify-center min-w-[80px] ${
                        selectedProfessional === pro.id
                          ? 'border-[#33383C] text-[#33383C] bg-[#f7f7f7]'
                          : 'border-[#d1d5db] text-[#33383C] bg-transparent hover:border-[#33383C]'
                      }`}
                      style={{ background: 'transparent', boxShadow: 'none' }}
                      onClick={e => {
                        e.stopPropagation();
                        handleSelect(pro.id);
                      }}
                      aria-pressed={selectedProfessional === pro.id}
                      disabled={false} // Always allow all buttons
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {selectedProfessional === pro.id ? (
                          <motion.span
                            key="check"
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            transition={{ duration: 0.18 }}
                            className="flex items-center justify-center"
                          >
                            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="11" fill="#33383C"/><path d="M6 11.5l3 3 7-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </motion.span>
                        ) : (
                          <motion.span
                            key="select"
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            transition={{ duration: 0.18 }}
                          >
                            Select
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProfessionalSelectionModal;
