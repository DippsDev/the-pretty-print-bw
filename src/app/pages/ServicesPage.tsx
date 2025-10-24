"use client";

import React, { useRef, useState } from "react";
import { Inter_Tight } from "next/font/google";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/redux/store";
import { ContactForm } from "./ContactPage";
import { SERVICES } from "@/lib/servicesData";
import ServiceModal from "../../components/steps/ServiceSelection";
import ProfessionalSelectionModal, { Professional } from "../../components/modals/ProfessionalSelection";
import TimeSelectionModal from "../../components/steps/TimeSelection";
import ProfessionalSelection from "../../components/steps/ProfessionalSelection";
import ProfessionalPerServiceStep from "../../components/steps/ProfessionalPerServiceStep";
import ProfessionalPerServiceModal from "../../components/modals/ProfessionalPerService";
import { motion, AnimatePresence } from "framer-motion";
import { setSelectedProfessional, setSelectedProfessionals } from "../../redux/professionalSlice";
import { addBooking, removeBooking } from "../../redux/serviceSlice";
import ConfirmStep from "@/components/steps/Confirm";

const interTight = Inter_Tight({ subsets: ["latin"], weight: "400" });

const SERVICE_CATEGORIES = SERVICES.map(s => s.label);

// Main ServicesPage component
function ServicesPage() {
  const [activeCategory, setActiveCategory] = useState(0);
  const tabListRef = useRef<HTMLUListElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalService, setModalService] = useState<any>(null);
  const dispatch = useDispatch();
  const selectedProfessional = useSelector((state: RootState) => state.professional.selectedProfessional);
  const selectedProfessionals = useSelector((state: RootState) => state.professional.selectedProfessionals);
  const bookings = useSelector((state: RootState) => state.service.bookings);

  const [step, setStep] = useState<'services' | 'professionals' | 'professionalPerService' | 'time' | 'confirm'>('services');
  const [professionalMode, setProfessionalMode] = useState<'single' | 'perService'>('single');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [professionalModalOpen, setProfessionalModalOpen] = useState(false);
  const [perServiceModalOpen, setPerServiceModalOpen] = useState(false);
  const [activeProfessionalIdx, setActiveProfessionalIdx] = useState<number | null>(null);

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
    dispatch(addBooking(booking));
    setModalOpen(false);
    dispatch(setSelectedProfessionals({ bookingIdx: bookings.length, id: undefined }));
  }

  // Remove booking handler
  function handleRemoveBooking(idx: number) {
    dispatch(removeBooking(idx));
    dispatch(setSelectedProfessionals({ bookingIdx: idx, id: undefined }));
  }

  // Calculate total price
  function parsePrice(price: string) {
    const match = price.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }
  const total = bookings.reduce((sum, b) => sum + parsePrice(b.price), 0);

  // Step navigation logic for progress tracker
  function canGoToStep(idx: number) {
    if (idx === 0) return true; // Always can go to services
    if (idx === 1) return bookings.length > 0; // Can go to professionals if bookings exist
    if (idx === 2) return bookings.length > 0 && selectedProfessional !== null; // Can go to time if professional selected
    if (idx === 3) return bookings.length > 0 && selectedProfessional !== null && selectedDate && selectedTime; // Can go to confirm if all details are set
    return false;
  }

  // Right side continue button logic
  function handleContinue() {
    if (bookings.length === 0) return;
    if (step === 'services') setStep('professionals');
    else if (step === 'professionals') {
      if (professionalMode === 'perService') setStep('professionalPerService');
      else setStep('time');
    }
    else if (step === 'professionalPerService') setStep('time');
    else if (step === 'time') setStep('confirm');
  }

  // Handler for time selection (update date/time immediately)
  function handleTimeSelection({ date, time }: { date: string; time: string }) {
    setSelectedDate(new Date(date));
    setSelectedTime(time);
    // Optionally: setStep('confirm') or similar if you want to advance
  }

  // Helper to get professional name by id
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

  return (
    <div className={`relative w-full min-h-[100dvh] bg-white ${interTight.className}`} style={{overflowY: 'auto', maxHeight: '100dvh'}}>
      <div className="flex flex-row w-full min-h-[100dvh]">
        {/* Main content (left side + center) */}
        <div className="flex-1 flex flex-col px-8 py-8">
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
                  <button
                    className={`font-medium text-sm whitespace-nowrap transition-colors px-0 bg-transparent border-none outline-none ${
                      step === 'services' && idx === 0 ||
                      step === 'professionals' && idx === 1 ||
                      step === 'time' && idx === 2
                        ? 'text-[#141414]'
                        : canGoToStep(idx) ? 'text-[#7B8487] hover:text-[#232323] cursor-pointer' : 'text-[#d1d5db] cursor-not-allowed'
                    }`}
                    style={{ padding: 0, margin: 0 }}
                    disabled={!canGoToStep(idx)}
                    onClick={() => {
                      if (!canGoToStep(idx)) return;
                      if (idx === 0) setStep('services');
                      if (idx === 1) setStep('professionals');
                      if (idx === 2) setStep('time');
                      // Confirm step not implemented
                    }}
                    type="button"
                  >
                    {stepObj.label}
                  </button>
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
          <AnimatePresence mode="wait">
            {step === 'services' && (
              <motion.div
                key="services-step"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="flex flex-col gap-4"
              >
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
              </motion.div>
            )}
            {step === 'professionals' && (
              <motion.div
                key="professionals-step"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="flex flex-col gap-6 flex-1"
              >
                <h2 className="text-2xl font-bold mb-2 text-[#141414]">Select Professional</h2>
                <ProfessionalSelection
                  onBack={() => setStep('services')}
                  onSelect={id => {
                    dispatch(setSelectedProfessional(id));
                    setProfessionalMode('single');
                  }}
                  selectedProfessional={selectedProfessional}
                  onSelectPerService={() => {
                    setProfessionalMode('perService');
                    setStep('professionalPerService');
                  }}
                  professionalMode={professionalMode}
                />
              </motion.div>
            )}
            {step === 'professionalPerService' && (
              <motion.div
                key="professionalPerService-step"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="flex flex-col gap-6 flex-1"
              >
                <ProfessionalPerServiceStep
                  bookings={bookings}
                  selectedProfessionals={selectedProfessionals}
                  setSelectedProfessionals={(bookingIdx, id) => dispatch(setSelectedProfessionals({ bookingIdx, id }))}
                  onBack={() => {
                    setStep('professionals');
                    setProfessionalMode('single');
                  }}
                  onContinue={() => setStep('time')}
                />
              </motion.div>
            )}
            {step === 'time' && (
              <motion.div
                key="time-step"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="flex flex-col gap-6 flex-1"
              >
                <div className="flex flex-col gap-6 flex-1">
                  <h2 className="text-3xl font-bold mb-2 text-[#141414]">Select time</h2>
                  <TimeSelectionModal
                    onBack={() => { setProfessionalMode('single'); setStep('professionals'); }}
                    onContinue={handleTimeSelection}
                    availableTimes={{
                      [new Date().toISOString().slice(0,10)]: ["09:00", "10:00", "11:00", "14:00"],
                      [(() => { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().slice(0,10); })()]: ["10:00", "13:00", "15:00"]
                    }}
                    onOpenProfessionalModal={() => setProfessionalModalOpen(true)}
                    professionalMode={professionalMode}
                    bookings={bookings}
                    selectedProfessionals={selectedProfessionals}
                    setSelectedProfessionals={(bookingIdx: number, id: number | undefined) => dispatch(setSelectedProfessionals({ bookingIdx, id }))}
                    selectedProfessional={selectedProfessional}
                  />
                </div>
              </motion.div>
            )}
            {step === 'confirm' && (
              <motion.div
                key="confirm-step"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="flex flex-col gap-6 flex-1"
              >
                <ConfirmStep
                  bookings={bookings}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  professionalMode={professionalMode}
                  selectedProfessional={selectedProfessional}
                  selectedProfessionals={selectedProfessionals}
                  total={total}
                  onBack={() => setStep('time')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Right: Summary box as card, fixed position, side by side */}
        <div className="hidden md:flex md:flex-col items-center py-8 px-6" style={{width: 380, minWidth: 380, maxWidth: 380, height: '100dvh', position: 'sticky', top: 0, right: 0, zIndex: 10}}>
          <div className="w-full max-w-xs mx-auto bg-white rounded-2xl border p-6 mt-8 flex flex-col gap-6" style={{maxHeight: 'calc(100vh - 48px)', minHeight: 0, display: 'flex'}}>
            {/* Title */}
            <div className="flex flex-col gap-1">
              <span className="text-lg font-bold text-[#141414] tracking-tight truncate">Booking Summary</span>
              <hr className="my-2 border-[#ededed]" />
            </div>
            {/* Date & Time summary below "Your booking" */}
            {(selectedDate && selectedTime) && (
              <div className="flex flex-col gap-3 mb-2">
                <div className="flex flex-row items-center gap-2">
                  {/* Calendar icon */}
                  <span aria-hidden="true">
                    <svg width="20" height="20" fill="#7B8487" viewBox="0 0 32 32">
                      <path fillRule="evenodd" d="M10 2a1 1 0 0 1 1 1v1h10V3a1 1 0 1 1 2 0v1h3a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3V3a1 1 0 0 1 1-1M9 6H6v4h20V6h-3v1a1 1 0 1 1-2 0V6H11v1a1 1 0 1 1-2 0zm17 6H6v14h20z" clipRule="evenodd"></path>
                    </svg>
                  </span>
                  <p className="text-sm text-[#232323] font-medium">
                    {selectedDate.toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div className="flex flex-row items-center gap-2">
                  {/* Clock icon */}
                  <span aria-hidden="true">
                    <svg width="20" height="20" fill="#7B8487" viewBox="0 0 32 32">
                      <path fillRule="evenodd" d="M16 5C9.925 5 5 9.925 5 16s4.925 11 11 11 11-4.925 11-11S22.075 5 16 5M3 16C3 8.82 8.82 3 16 3s13 5.82 13 13-5.82 13-13 13S3 23.18 3 16m13-8a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2h-7a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1" clipRule="evenodd"></path>
                    </svg>
                  </span>
                  <p className="text-sm text-[#232323] font-medium">{selectedTime}</p>
                </div>
              </div>
            )}
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
                          {/* Professional name below time, always up to date */}
                          <span className="text-xs text-[#33383C] mt-1">
                            {professionalMode === "perService"
                              ? getProfessionalName(selectedProfessionals[i])
                              : getProfessionalName(selectedProfessional)
                            }
                          </span>
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
              onClick={handleContinue}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
      {/* Service Modal with AnimatePresence for smooth transitions */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            key="service-modal"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100 }}
          >
            <ServiceModal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              service={modalService}
              onAddBooking={handleAddBooking}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Professional modal for per-booking selection */}
      <AnimatePresence>
        {professionalModalOpen && (
          <motion.div
            key="professional-modal"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            style={{ position: 'fixed', inset: 0, zIndex: 101 }}
          >
            <ProfessionalSelectionModal
              open={professionalModalOpen}
              onClose={() => setProfessionalModalOpen(false)}
              selectedProfessional={
                activeProfessionalIdx !== null && selectedProfessionals[activeProfessionalIdx] !== undefined
                  ? selectedProfessionals[activeProfessionalIdx]
                  : selectedProfessional
              }
              onSelect={id => {
                if (activeProfessionalIdx !== null) {
                  dispatch(setSelectedProfessionals({ bookingIdx: activeProfessionalIdx, id }));
                } else {
                  dispatch(setSelectedProfessional(id));
                }
                setProfessionalModalOpen(false);
              }}
              professionals={[
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
              ]}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {/* ProfessionalPerServiceModal for perService mode */}
      <AnimatePresence>
        {perServiceModalOpen && (
          <motion.div
            key="per-service-modal"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            style={{ position: 'fixed', inset: 0, zIndex: 102 }}
          >
            <ProfessionalPerServiceModal
              open={perServiceModalOpen}
              onClose={() => setPerServiceModalOpen(false)}
              bookings={bookings}
              selectedProfessionals={selectedProfessionals}
              setSelectedProfessionals={(bookingIdx: number, id: number | undefined) => dispatch(setSelectedProfessionals({ bookingIdx, id }))}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ServicesPage;


