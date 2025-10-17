import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function ProfessionalSelection({ onBack }: { onBack: () => void }) {

  // Placeholder professionals
  const professionals = [
    {
      id: 0,
      name: "Any professional",
      role: "for maximum availability",
      avatar: null,
      isGroup: true,
    },
  ];

  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-4 w-full">
      <AnimatePresence>
        {professionals.map((pro, idx) => (
          <motion.div
            key={pro.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25, delay: idx * 0.05 }}
            className={`border rounded-lg p-4 bg-white flex flex-row items-center gap-4 cursor-pointer hover:bg-gray-50 transition w-full`}
            style={{ minWidth: 0 }}
            onClick={() => setSelected(pro.id)}
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
                selected === pro.id
                  ? 'border-[#33383C] text-[#33383C] bg-[#f7f7f7]'
                  : 'border-[#d1d5db] text-[#33383C] bg-transparent hover:border-[#33383C]'
              }`}
              style={{ background: 'transparent', boxShadow: 'none' }}
              onClick={e => { e.stopPropagation(); setSelected(pro.id); }}
              aria-pressed={selected === pro.id}
              type="button"
              whileTap={{ scale: 0.96 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {selected === pro.id ? (
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
  <button onClick={onBack} className="mt-4 text-[#33383C] text-sm px-3 py-1 rounded hover:bg-gray-100 transition font-medium" style={{ textDecoration: 'none', width: 'auto', display: 'inline-block' }}>Back</button>
    </div>
  );
}

export default ProfessionalSelection;
