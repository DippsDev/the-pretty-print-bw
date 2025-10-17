"use client";

import React, { useRef, useState } from "react";
import { Inter_Tight } from "next/font/google";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { ContactForm } from "./ContactPage";
import { SERVICES } from "@/lib/servicesData";
import ServiceModal from "./ServiceModal";
import ProfessionalSelection from "./ProfessionalSelection";
import TimeSelectionModal from "./TimeSelectionModal";

const interTight = Inter_Tight({ subsets: ["latin"], weight: "400" });

const SERVICE_CATEGORIES = SERVICES.map(s => s.label);

// Progress stepper component with vertical black line between icons
function ProgressStepper({ step = 3 }: { step?: number }) {
  const { selectedService, selectedPackage } = useSelector(
    (state: RootState) => state.navigation
  );
  const steps = [
    { label: selectedService && selectedService !== "" ? selectedService : "Your service", sub: selectedPackage || undefined },
    { label: "Your reservation" },
    { label: "Your Contact Details" },
  ];
  return (
    <div className={`flex flex-col gap-6 w-full max-w-xs mx-auto mt-8 ${interTight.className}`}>
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
            <div className={`text-[15px] font-medium ${step === i ? "text-[#33383C]" : "text-[#33383C]/50"} ${interTight.className}`}>
              {i + 1}. {s.label}
            </div>
            {s.sub && (
              <div className={`text-[13px] mt-1 ${step === i ? "text-[#6E6B68]" : "text-[#6E6B68]/50"} ${interTight.className}`}>
                {s.sub}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Main ServicesPage component
function ServicesPage() {
  const [activeCategory, setActiveCategory] = useState(0);
  const tabListRef = useRef<HTMLUListElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalService, setModalService] = useState<any>(null);
  const [bookings, setBookings] = useState<
    { name: string; option: string; time: string; price: string }[]
  >([]);
  const [step, setStep] = useState<'services' | 'professionals' | 'time'>('services');

  // Helper to get service options for modal (simulate options for demo)
  function getServiceModalData(svc: any) {
    // Example: for "Eyebrows shape and tint" service, show multiple options (if you want to add custom logic for special services, do it here)
    if (svc.name === "Eyebrows shape and tint") {
      return {
        name: svc.name,
        description: svc.description,
        note: "This treatment can only be done if you have a good amount of eyebrow hair.",
        options: [
          { name: "Eyebrows shape and tint", price: "ZAR 180" },
          { name: "Add Top lip wax", price: "ZAR 190" },
          { name: "Add chin wax", price: "ZAR 200" },
          { name: "Add chin & top lip wax", price: "ZAR 210" },
          { name: "Add lash tint", price: "ZAR 220" },
        ],
        basePrice: "ZAR 180",
        timeOptions: ["30 mins", "35 mins"],
      };
    }
    // Default: single option, use timeOptions from svc
    return {
      name: svc.name,
      description: svc.description,
      options: [
        { name: svc.name, price: svc.price, description: svc.description },
      ],
      basePrice: svc.price,
      timeOptions: svc.timeOptions || [],
    };
  }

  // Scroll to the next/previous tab and update activeCategory
  const scrollTabs = (dir: "left" | "right") => {
    let newIdx = activeCategory;
    if (dir === "left" && activeCategory > 0) {
      newIdx = activeCategory - 1;
    } else if (dir === "right" && activeCategory < SERVICE_CATEGORIES.length - 1) {
      newIdx = activeCategory + 1;
    }
    setActiveCategory(newIdx);
    // Scroll to the selected tab
    if (tabListRef.current) {
      const tab = tabListRef.current.children[newIdx] as HTMLElement;
      if (tab) {
        tab.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  };

  // Add booking handler
  function handleAddBooking(booking: { name: string; option: string; time: string; price: string }) {
    setBookings(prev => [...prev, booking]);
    setModalOpen(false);
  }

  // Remove booking handler
  function handleRemoveBooking(idx: number) {
    setBookings(prev => prev.filter((_, i) => i !== idx));
  }

  // Calculate total price
  function parsePrice(price: string) {
    const match = price.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }
  const total = bookings.reduce((sum, b) => sum + parsePrice(b.price), 0);

  return (
    <div className={`relative w-full min-h-[100dvh] bg-white ${interTight.className}`} style={{overflowY: 'auto', maxHeight: '100dvh'}}>
      <div className="flex flex-row w-full min-h-[100dvh]">
        {/* Main content (left side + center) */}
        <div className="flex-1 flex flex-col px-4 py-8">
          {/* Progress tracker */}
          <div className="w-full flex mb-8 mt-16">
            <ul className="flex flex-row gap-0 items-center pl-1">
              {[
                { label: 'Services' },
                { label: 'Professional' },
                { label: 'Time' },
                { label: 'Confirm' },
              ].map((stepObj, idx) => (
                <li key={stepObj.label} className="flex items-center">
                  <span className={`font-medium text-sm whitespace-nowrap transition-colors ${
                    (step === 'services' && idx === 0) || (step === 'professionals' && idx === 1)
                      ? 'text-[#141414]'
                      : 'text-[#7B8487]'
                  }`}>
                    {stepObj.label}
                  </span>
                  {idx < 3 && (
                    <span className="mx-2" aria-hidden="true">
                      <svg fill="currentColor" width="18" height="18" viewBox="0 0 32 32"><path fillRule="evenodd" d="M19.957 9.043a1 1 0 0 1 0 1.414L14.414 16l5.543 5.543a1 1 0 0 1-1.414 1.414l-6.25-6.25a1 1 0 0 1 0-1.414l6.25-6.25a1 1 0 0 1 1.414 0" clipRule="evenodd"></path></svg>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Main content for step */}
          {step === 'services' ? (
            <>
              {/* Category carousel */}
              <div className="relative mb-8">
                <div className="flex items-center">
                  <ul
                    ref={tabListRef}
                    role="tablist"
                    className="flex gap-2 overflow-x-auto scrollbar-hide flex-1"
                    style={{ scrollBehavior: "smooth", minWidth: 0 }}
                  >
                    {SERVICE_CATEGORIES.map((cat, idx) => (
                      <li key={cat} role="tab" aria-selected={activeCategory === idx}>
                        <button
                          className={`
                            px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-colors
                            ${activeCategory === idx
                              ? "bg-[#141414] text-white"
                              : "bg-transparent text-[#141414] hover:bg-[#ededed]"}
                          `}
                          style={{
                            fontFamily: interTight.style.fontFamily,
                            boxShadow: "none",
                            border: "none",
                          }}
                          onClick={() => setActiveCategory(idx)}
                        >
                          {cat}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-1 ml-2 items-center">
                    <button
                      className="p-0 disabled:opacity-40 flex items-center justify-center hover:opacity-80"
                      style={{ background: "none", border: "none", boxShadow: "none", width: 32, height: 32 }}
                      onClick={() => scrollTabs("left")}
                      aria-label="Scroll left"
                      disabled={activeCategory === 0}
                      type="button"
                    >
                      {/* Left arrow SVG */}
                      <svg width={20} height={20} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                        <path fill="#33383C" fillRule="evenodd" d="M19.957 9.043a1 1 0 0 1 0 1.414L14.414 16l5.543 5.543a1 1 0 0 1-1.414 1.414l-6.25-6.25a1 1 0 0 1 0-1.414l6.25-6.25a1 1 0 0 1 1.414 0" clipRule="evenodd"></path>
                      </svg>
                    </button>
                    <button
                      className="p-0 disabled:opacity-40 flex items-center justify-center hover:opacity-80"
                      style={{ background: "none", border: "none", boxShadow: "none", width: 32, height: 32 }}
                      onClick={() => scrollTabs("right")}
                      aria-label="Scroll right"
                      disabled={activeCategory === SERVICE_CATEGORIES.length - 1}
                      type="button"
                    >
                      {/* Right arrow SVG */}
                      <svg width={20} height={20} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                        <path fill="#33383C" fillRule="evenodd" d="M12.293 9.043a1 1 0 0 1 1.414 0l6.25 6.25a1 1 0 0 1 0 1.414l-6.25 6.25a1 1 0 0 1-1.414-1.414L17.836 16l-5.543-5.543a1 1 0 0 1 0-1.414" clipRule="evenodd"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              {/* Services under selected category */}
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#141414]">{SERVICE_CATEGORIES[activeCategory]}</h2>
                <div className="flex flex-col gap-4">
                  {(SERVICES[activeCategory]?.services || []).map((svc, i) => (
                    <div
                      key={svc.name}
                      className={`border rounded-lg p-4 bg-white flex flex-col gap-1 cursor-pointer hover:bg-gray-50 transition`}
                      onClick={() => {
                        setModalService(getServiceModalData(svc));
                        setModalOpen(true);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-lg text-[#141414]">{svc.name}</div>
                        </div>
                      </div>
                      {svc.description && (
                        <div className="text-sm text-[#7B8487] mt-1">{svc.description}</div>
                      )}
                      <div className="text-sm text-[#232323] font-semibold mt-1">
                        {svc.price && typeof svc.price === "object"
                          ? `from ${Object.values(svc.price)[0]}`
                          : svc.price}
                      </div>
                      {svc.price && typeof svc.price === "object" && (
                        <div className="text-xs text-[#7B8487] mt-1">
                          {Object.entries(svc.price)
                            .map(([time, price]) => `${time}: ${price}`)
                            .join(" | ")}
                        </div>
                      )}
                    </div>
                  ))}
                  {(SERVICES[activeCategory]?.services || []).length === 0 && (
                    <div className="text-[#b0b0b0] italic">No services in this category yet.</div>
                  )}
                </div>
              </div>
            </>
          ) : step === 'professionals' ? (
            <div className="flex flex-col gap-6 flex-1">
              <h2 className="text-2xl font-bold mb-2 text-[#141414]">Select Professional</h2>
              <ProfessionalSelection onBack={() => setStep('services')} />
            </div>
          ) : step === 'time' ? (
            <div className="flex flex-col gap-6 flex-1">
              <h2 className="text-2xl font-bold mb-2 text-[#141414]">Select time</h2>
              <TimeSelectionModal
                onBack={() => setStep('professionals')}
                onContinue={({ date, time }) => {
                  // TODO: Go to confirm step or handle booking
                }}
                availableTimes={{
                  [new Date().toISOString().slice(0,10)]: ["09:00", "10:00", "11:00", "14:00"],
                  [(() => { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().slice(0,10); })()]: ["10:00", "13:00", "15:00"]
                }}
              />
            </div>
          ) : null}
        </div>
        {/* Right: Summary box as card, fixed position, side by side */}
        <div className="hidden md:flex md:flex-col items-center py-8 px-6" style={{width: 380, minWidth: 380, maxWidth: 380, height: '100dvh', position: 'sticky', top: 0, right: 0, zIndex: 10}}>
          <div className="w-full max-w-xs mx-auto bg-white rounded-2xl border p-6 mt-8 flex flex-col gap-6" style={{maxHeight: 'calc(100vh - 48px)', minHeight: 0, display: 'flex'}}>
            {/* Title */}
            <div className="flex flex-col gap-1">
              <span className="text-lg font-bold text-[#141414] tracking-tight truncate">Booking Summary</span>
              <hr className="my-2 border-[#ededed]" />
            </div>
            {/* Show bookings */}
            <div className="flex-1 flex flex-col gap-2 min-h-0">
              {bookings.length === 0 ? (
                <div className="text-sm text-[#7B8487]">No services selected</div>
              ) : (
                <>
                  <div className="text-sm text-[#7B8487] mb-1">Your booking:</div>
                  <ul className="flex flex-col gap-2 mb-2 overflow-y-auto" style={{maxHeight: '180px'}}>
                    {bookings.map((b, i) => (
                      <li key={i} className="flex flex-row items-center gap-2 bg-[#fafbfc] rounded-lg px-3 py-2">
                        <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
                          <span className="text-[#141414] font-medium text-sm truncate max-w-[140px]" title={b.option}>{b.option}</span>
                          <span className="text-xs text-[#232323]/70">{b.time}</span>
                        </div>
                        <span className="font-semibold text-[#232323] text-sm text-right" style={{minWidth: 64, display: 'inline-block'}}>{b.price}</span>
                        <button
                          type="button"
                          aria-label="Remove booking"
                          className="p-1 rounded-full hover:bg-gray-200 focus:outline-none"
                          onClick={() => handleRemoveBooking(i)}
                          style={{ lineHeight: 0 }}
                        >
                          {/* X SVG */}
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M4.8 4.8l6.4 6.4M11.2 4.8l-6.4 6.4" stroke="#33383C" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            <div className="flex flex-row items-center justify-between border-t border-[#ededed] pt-4 mt-2">
              <span className="font-semibold text-[#141414] text-base">Total</span>
              <span className="font-semibold text-[#232323] text-base">
                {total > 0 ? `ZAR ${total.toFixed(2)}` : "free"}
              </span>
            </div>
            <button
              className={`py-2 px-8 rounded-full font-semibold text-base mt-2 ${bookings.length > 0 ? "bg-[#33383C] text-white cursor-pointer hover:bg-[#232323]" : "bg-gray-300 text-gray-600 cursor-not-allowed"}`}
              style={{ width: 'auto', alignSelf: 'flex-end' }}
              disabled={bookings.length === 0}
              onClick={() => {
                if (bookings.length > 0) {
                  if (step === 'services') setStep('professionals');
                  else if (step === 'professionals') setStep('time');
                }
              }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
      {/* Service Modal */}
      <ServiceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        service={modalService}
        onAddBooking={handleAddBooking}
      />

    </div>
  );
}

export default ServicesPage;


