"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function WireframeChrome() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  return (
    <>
      <motion.button
        type="button"
        onClick={() => {
          if (open) setClosing(true);
          setOpen((value) => !value);
        }}
        className="studio-chat fixed bottom-6 right-4 z-[999] m-0 flex items-center justify-center border-none bg-transparent p-0 shadow-none sm:right-6"
        aria-label={open ? "Close chat" : "Open chat"}
        style={{ background: "none", border: "none", boxShadow: "none", borderRadius: 0, width: "auto", height: "auto" }}
        whileTap={{ scale: 0.92, rotate: -10 }}
        whileHover={{ scale: 1.08, rotate: 8, filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.18))" }}
        animate={open ? { scale: 0.92, rotate: -10, filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.22))" } : { scale: 1, rotate: 0, filter: "none" }}
        transition={{ type: "spring", stiffness: 350, damping: 22 }}
      >
        {!open && !closing ? (
          <Image src="/chat.png" alt="" width={48} height={48} className="opacity-90 transition-all duration-300" priority />
        ) : (
          <motion.div
            initial={{ rotate: 0, scale: 1 }}
            animate={{
              rotate: open ? 90 : closing ? 180 : 0,
              scale: open || closing ? 1.1 : 1,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            onAnimationComplete={() => {
              if (!open) setClosing(false);
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-[#141414]">
              <motion.path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.25 }}
              />
            </svg>
          </motion.div>
        )}
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.aside
            aria-label="Assistant"
            initial={{ opacity: 0, y: 32, scale: 0.96, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 32, scale: 0.96, filter: "blur(6px)" }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="studio-chat-panel fixed bottom-24 right-4 z-[1000] w-[min(92vw,380px)] rounded-2xl border border-black/5 bg-white p-5 sm:right-6"
            style={{ boxShadow: "0 12px 48px rgba(0,0,0,0.18)" }}
          >
            <p className="text-sm font-semibold text-[#141414]">Assistant</p>
            <p className="mt-2 text-sm leading-relaxed text-[#5c5c5c]">
              Ask about a style, or book from the menu. Service, stylist, time, then confirm.
            </p>
            <Link href="/book" className="wf-btn mt-4 inline-flex" onClick={() => setOpen(false)}>
              Go to booking
            </Link>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
