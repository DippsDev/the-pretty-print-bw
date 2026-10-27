"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DM_Sans, Italiana } from "next/font/google";
import { ArrowLeft, ArrowRight } from "lucide-react";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const italiana = Italiana({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-italiana",
  display: "swap",
});

export default function WireframeChrome() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [onFooter, setOnFooter] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const inBooking = pathname === "/book";

  useEffect(() => {
    setOpen(false);
    setClosing(false);
  }, [pathname]);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const footer = document.querySelector("footer");
      const button = buttonRef.current;
      if (!footer || !button) {
        setOnFooter((current) => (current ? false : current));
        return;
      }
      const footerRect = footer.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const overlapping =
        footerRect.top < buttonRect.bottom - 4 && footerRect.bottom > buttonRect.top + 4;
      setOnFooter((current) => (current === overlapping ? current : overlapping));
    };

    const requestUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return (
    <>
      <motion.button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (open) setClosing(true);
          setOpen((value) => !value);
        }}
        className="studio-chat fixed bottom-6 right-6 z-[999] m-0 flex items-center justify-center border-none bg-transparent p-0 shadow-none md:right-12"
        aria-label={open ? "Close chat" : "Open chat"}
        style={{ background: "none", border: "none", boxShadow: "none", borderRadius: 0, width: "auto", height: "auto" }}
        whileTap={{ scale: 0.92, rotate: -10 }}
        whileHover={{ scale: 1.08, rotate: 8, filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.18))" }}
        animate={open ? { scale: 0.92, rotate: -10, filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.22))" } : { scale: 1, rotate: 0, filter: "none" }}
        transition={{ type: "spring", stiffness: 350, damping: 22 }}
      >
        {!open && !closing ? (
          <Image
            src="/chat.png"
            alt=""
            width={48}
            height={48}
            priority
            className={`transition-all duration-300 ${onFooter ? "opacity-100" : "opacity-90"}`}
            style={{ filter: onFooter ? "brightness(0) invert(1)" : "none" }}
          />
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
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              className={`transition-colors duration-300 ${onFooter ? "text-white" : "text-[#141414]"}`}
            >
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
            className={`studio-chat-panel fixed bottom-24 right-6 z-[1000] w-[min(92vw,360px)] md:right-12 ${dmSans.className} ${italiana.variable}`}
          >
            <p className="studio-chat-kicker">
              <span /> Assistant
            </p>
            <p className="studio-chat-title">Ask the studio.</p>
            <p className="studio-chat-copy">
              Ask about a style, or book from the menu. Service, stylist, time, then confirm.
            </p>
            <Link href={inBooking ? "/" : "/book"} className="studio-chat-action">
              {inBooking ? "Return to the studio" : "Go to booking"}
              {inBooking ? <ArrowLeft size={16} strokeWidth={1.5} /> : <ArrowRight size={16} strokeWidth={1.5} />}
            </Link>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
