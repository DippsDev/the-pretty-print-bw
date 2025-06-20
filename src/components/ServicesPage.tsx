"use client";

import React from "react";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { ContactForm } from "./ContactPage";

const inter = Inter({ subsets: ["latin"], weight: "400" });

// Progress stepper component with vertical black line between icons
function ProgressStepper({ step = 3 }: { step?: number }) {
  const { selectedService, selectedPackage, selectedTime } = useSelector(
    (state: RootState) => state.navigation
  );
  const steps = [
    { label: selectedService && selectedService !== "" ? selectedService : "Your service", sub: selectedPackage || undefined },
    { label: "Your reservation", sub: selectedTime || undefined },
    { label: "Your Contact Details" },
  ];
  return (
    <div className="flex flex-col gap-6 w-full max-w-xs mx-auto mt-8">
      {steps.map((s, i) => (
        <div key={i} className="flex flex-row items-start gap-3">
          <div className="flex flex-col items-center relative">
            {/* Icon */}
            {step > i ? (
              <span className="w-4 h-4 flex items-center justify-center z-10">
                <svg width="16" height="16" viewBox="0 0 16 16" className="text-[#33383C]" style={{ opacity: 1 }}>
                  <circle cx="8" cy="8" r="8" fill="#33383C" />
                  <polyline points="4,9 7,12 12,5" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            ) : step === i ? (
              <span className="w-4 h-4 flex items-center justify-center z-10">
                <svg width="16" height="16" viewBox="0 0 16 16" className="text-[#33383C]" style={{ opacity: 1 }}>
                  <rect x="3" y="3" width="10" height="10" rx="2" fill="#33383C" />
                </svg>
              </span>
            ) : (
              <span className="w-4 h-4 flex items-center justify-center z-10">
                <svg width="16" height="16" viewBox="0 0 16 16" className="text-[#33383C]" style={{ opacity: 0.5 }}>
                  <rect x="3" y="3" width="10" height="10" rx="2" fill="#33383C" />
                </svg>
              </span>
            )}
            {/* Vertical black line between icons */}
            {i < steps.length - 1 && (
              <div className="absolute left-1/2 top-full h-[40px] w-px bg-black" style={{ transform: "translateX(-50%)" }} />
            )}
          </div>
          <div>
            <div className={`text-[15px] font-medium ${step === i ? "text-[#33383C]" : "text-[#33383C]/50"} ${inter.className}`}>
              {i + 1}. {s.label}
            </div>
            {s.sub && (
              <div className={`text-[13px] mt-1 ${step === i ? "text-[#6E6B68]" : "text-[#6E6B68]/50"} ${inter.className}`}>
                {s.sub}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ServicesPage() {
  const { selectedService } = useSelector((state: RootState) => state.navigation);

  return (
    <div className={`flex flex-col md:flex-row min-h-[100dvh] w-full bg-white ${inter.className}`}>
      {/* Left side: Progress only */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-white">
        {/* Pass step=1 if you want to highlight the first step, or step=3 if all steps are done */}
        <ProgressStepper step={1} />
      </div>
      {/* Right side: Contact form only */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-[420px]">
          {/* Show selected service name above the form if available */}
          {selectedService && (
            <div className="mb-6 text-center text-lg font-semibold text-[#33383C]">
              {selectedService}
            </div>
          )}
          <ContactForm />
        </div>
      </div>
    </div>
  );
}


