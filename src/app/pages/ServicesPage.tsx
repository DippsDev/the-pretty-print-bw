"use client";

import React, { useRef, useState, useEffect } from "react";
import { Inter_Tight } from "next/font/google";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/redux/store";
import { SERVICES } from "@/lib/servicesData";
import ServiceModal from "../../components/modals/Service";
import ServiceSelectionStep from "../../components/steps/ServiceSelection";
import ProfessionalSelectionModal from "../../components/modals/ProfessionalSelection";
import TimeSelectionModal from "../../components/steps/TimeSelection";
import ProfessionalSelection from "../../components/steps/ProfessionalSelection";
import ProfessionalPerServiceStep from "../../components/steps/ProfessionalPerServiceStep";
import ProfessionalPerServiceModal from "../../components/modals/ProfessionalPerService";
import { motion, AnimatePresence } from "framer-motion";
import { setSelectedProfessional, setSelectedProfessionals, resetProfessionals } from "../../redux/professionalSlice";
import { setServiceSelection, clearServiceSelection } from "@/redux/features/navigationSlice";
import { addBooking, removeBooking, resetBookings } from "../../redux/serviceSlice";
import ConfirmStep from "@/components/steps/Confirm";
import AuthModal from "@/components/modals/Auth";
import { createClient } from "../../../utils/supabase/client"; // use shared client utility
import { getCalcomEventInfo, resolveProfessionalKey } from "@/lib/calcom/events";
import { resolveServiceSlugFromBooking } from "@/lib/calcom/helpers";

const interTight = Inter_Tight({ subsets: ["latin"], weight: "400" });

const SERVICE_CATEGORIES = SERVICES.map(s => s.label);

// Supabase client
const supabase = createClient();

// Main ServicesPage component
function ServicesPage() {
  const [activeCategory, setActiveCategory] = useState(0);
  // Listen for currentSection from Redux
  const currentSection = useSelector((state: RootState) => state.navigation.currentSection);
  // When currentSection changes, update activeCategory to match the group/tab
  useEffect(() => {
    if (currentSection) {
      const idx = SERVICE_CATEGORIES.findIndex(
        (cat) => cat.toLowerCase() === currentSection.toLowerCase()
      );
      if (idx !== -1 && idx !== activeCategory) {
        setActiveCategory(idx);
        // Optionally scroll to the selected tab
        if (tabListRef.current) {
          const tab = tabListRef.current.children[idx] as HTMLElement;
          if (tab) {
            tab.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
          }
        }
      }
    }
  }, [currentSection]);
  const tabListRef = useRef<HTMLUListElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalService, setModalService] = useState<any>(null);
  const dispatch = useDispatch();
  const selectedProfessional = useSelector((state: RootState) => state.professional.selectedProfessional);
  const selectedProfessionals = useSelector((state: RootState) => state.professional.selectedProfessionals);
  const bookings = useSelector((state: RootState) => state.service.bookings);
  const paymentMethod = useSelector((state: RootState) => state.paymentMethod.selected);

  const [step, setStep] = useState<'services' | 'professionals' | 'professionalPerService' | 'time' | 'confirm'>('services');
  // Listen for navigation step from Redux (for chat triggers)
  const navigationStep = useSelector((state: RootState) => state.navigation.currentStep);
  const navigationSelectedTime = useSelector((state: RootState) => state.navigation.selectedTime);
  useEffect(() => {
    if (navigationStep && navigationStep !== step) {
      // Only set if different
      if (navigationStep === 'professionals' || navigationStep === 'professionalPerService' || navigationStep === 'time' || navigationStep === 'confirm' || navigationStep === 'services') {
        setStep(navigationStep);
      }
    }
  }, [navigationStep]);
  const [professionalMode, setProfessionalMode] = useState<'single' | 'perService'>('single');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [professionalModalOpen, setProfessionalModalOpen] = useState(false);
  const [perServiceModalOpen, setPerServiceModalOpen] = useState(false);
  const [activeProfessionalIdx, setActiveProfessionalIdx] = useState<number | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [bookingNotes, setBookingNotes] = useState("");
  const [mobileSheetExpanded, setMobileSheetExpanded] = useState(false);
  const profileBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!navigationSelectedTime) return;
    const match = navigationSelectedTime.match(/^(\d{4}-\d{2}-\d{2})\s+at\s+(.+)$/i);
    if (!match) return;
    const [, datePart, timePart] = match;
    if (!datePart || !timePart) return;
    const [yearStr, monthStr, dayStr] = datePart.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    if (!year || !month || !day) return;
    const nextDate = new Date(year, month - 1, day);
    if (Number.isNaN(nextDate.getTime())) return;

    setSelectedDate(nextDate);
    setSelectedTime(timePart);
  }, [navigationSelectedTime]);

  useEffect(() => {
    if (!selectedDate && !selectedTime) {
      dispatch(clearServiceSelection());
    }
  }, [selectedDate, selectedTime, dispatch]);

  useEffect(() => {
    if (bookings.length === 0) {
      setBookingNotes("");
    }
  }, [bookings.length]);

  // Check user session on mount and after login
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setAuthModalOpen(false);
    });
    return () => { listener?.subscription?.unsubscribe(); };
  }, []);

  // Logout handler
  async function handleLogout() {
    await supabase.auth.signOut();
    setProfileDropdownOpen(false);
    setUser(null);
  }

  // Helper to get service options for modal (simulate options for demo)
  function getServiceModalData(svc: any) {
    // If it's a package group (has label and services), show as a package modal
    if (svc.label && Array.isArray(svc.services) && (svc.prices || svc.price)) {
      // Use group-level prices for package, always as array of {label, value}
      const priceOptions =
        Array.isArray(svc.prices)
          ? svc.prices.map((p: any) =>
              typeof p === "string"
                ? { label: "For 1", value: p }
                : p
            )
          : svc.price
            ? [{ label: "For 1", value: svc.price }]
            : [];
      return {
        name: svc.label,
        slug: svc.slug,
        description: "",
        options: [
          {
            name: svc.label,
            price: priceOptions,
            packages: svc.services.map((s: any) => ({
              name: s.name,
              description: s.description,
              price: s.price || "Included",
            })),
          },
        ],
        basePrice: priceOptions[0]?.value,
        timeOptions: [],
      };
    }
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
      slug: svc.slug,
      description: svc.description,
      options: [
        { name: svc.name, price: svc.price, description: svc.description, slug: svc.slug },
      ],
      basePrice: svc.price,
      timeOptions: svc.timeOptions || [],
      durationMinutes: svc.durationMinutes,
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
  function handleAddBooking(booking: { name: string; option: string; time: string; price: string; metadata?: { serviceSlug?: string; durationMinutes?: number } }) {
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
    // Remove currency, spaces, and thousands separators, handle both comma and dot decimals
    // E.g. "R1 399" -> 1399, "R2 499.50" -> 2499.50, "R1,399.50" -> 1399.50
    if (!price) return 0;
    // Remove everything except digits, comma, dot
    let cleaned = price.replace(/[^\d.,]/g, '').replace(/\s/g, '');
    // If both comma and dot exist, assume comma is thousands separator, remove it
    if (cleaned.includes(',') && cleaned.includes('.')) {
      cleaned = cleaned.replace(/,/g, '');
    } else if ((cleaned.match(/,/g) || []).length === 1 && !cleaned.includes('.')) {
      // If only one comma and no dot, treat comma as decimal
      cleaned = cleaned.replace(',', '.');
    } else {
      // Remove all commas (thousands sep)
      cleaned = cleaned.replace(/,/g, '');
    }
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
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
  async function handleContinue() {
    if (bookings.length === 0) return;
    // Only block continue if user is not logged in at confirm step
    if (step === 'time') {
      if (!user) {
        setAuthModalOpen(true);
        return;
      }
      // Only allow continue if date and time are selected
      if (!selectedDate || !selectedTime) {
        return;
      }
      setStep('confirm');
      return;
    }
    if (step === 'confirm') {
        const { data } = await supabase.auth.getUser();
        const userObj = data?.user;
        const email = userObj?.email || userObj?.user_metadata?.email;

      if (paymentMethod === "card") {
        if (!email) {
          alert("Please update your profile with an email address before paying by card.");
          return;
        }

        const bookingSummary = bookings.map(b => ({
          name: b.name && b.option && !b.name.includes(b.option) ? `${b.name} - ${b.option}` : b.name,
          option: b.option,
          time: b.time,
          price: b.price,
        }));

        const res = await fetch("/api/yoco/create-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            total,
            bookings: bookingSummary,
            date: selectedDate ? selectedDate.toISOString() : null,
            time: selectedTime,
            notes: bookingNotes || undefined,
          }),
        });
        const result = await res.json();
        if (result.url) {
          window.location.assign(result.url);
        } else {
          alert("Failed to initiate payment. Please try again.");
        }
        return;
      }

      if (!selectedDate || !selectedTime) {
        alert("Please choose a date and time before confirming your booking.");
        return;
      }

      const primaryBooking = bookings[0];
      if (!primaryBooking) {
        alert("We couldn't find a service to book. Please try again.");
        return;
      }

      const serviceSlug = resolveServiceSlugFromBooking(primaryBooking);
      if (!serviceSlug) {
        alert("This service is not linked to Cal.com yet. Please contact support.");
        return;
      }

      const eventInfo = getCalcomEventInfo(serviceSlug);
      if (!eventInfo) {
        alert("This service is not linked to Cal.com yet. Please contact support.");
        return;
      }

      const professionalIdForBooking = (() => {
        if (professionalMode === 'perService' && selectedProfessionals) {
          const perServiceSelection = selectedProfessionals[0];
          if (typeof perServiceSelection === 'number') {
            return perServiceSelection;
          }
        }
        return selectedProfessional;
      })();

      const professionalKey = resolveProfessionalKey(professionalIdForBooking);
      const eventTypeId = eventInfo.eventTypeIds?.[professionalKey];

      if (!eventTypeId) {
        alert("We couldn't match an event type for this professional. Please try another selection.");
        return;
      }

      if (!email) {
        alert("Please update your profile with an email address before completing the booking.");
        return;
      }

      const bookingDateIso = selectedDate.toISOString().split("T")[0];
      const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const startDateTime = new Date(selectedDate);
      const timeMatch = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (timeMatch) {
        const [, hourStr, minuteStr, periodStr] = timeMatch;
        let hours = parseInt(hourStr, 10);
        const minutes = parseInt(minuteStr, 10);
        const period = periodStr.toUpperCase();
        if (period === "PM" && hours !== 12) {
          hours += 12;
        } else if (period === "AM" && hours === 12) {
          hours = 0;
        }
        startDateTime.setHours(hours, minutes, 0, 0);
      }
      const startIso = startDateTime.toISOString();
      const customerName =
        userObj?.user_metadata?.full_name ||
        userObj?.user_metadata?.name ||
        email ||
        "Bel Amour Guest";

      const response = await fetch("/api/calcom/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventTypeId,
          start: startIso,
          date: bookingDateIso,
          time: selectedTime,
          timeZone: localTimeZone,
          durationMinutes: eventInfo.durationMinutes,
          service: {
            name: primaryBooking.name,
            option: primaryBooking.option,
            slug: serviceSlug,
          },
          professional: {
            id: professionalIdForBooking ?? 0,
            name: getProfessionalName(professionalIdForBooking),
          },
          customer: {
            name: customerName,
            email,
            timeZone: localTimeZone,
          },
          notes: bookingNotes || undefined,
          metadata: {
            paymentMethod: paymentMethod || "venue",
            total,
            bookingOption: primaryBooking.option,
            bookingPrice: primaryBooking.price,
            ...primaryBooking.metadata,
          },
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        const message = result?.error || result?.message || "Failed to create booking.";
        alert(message);
        return;
      }

      const bookingReference = result.booking?.uid || result.booking?.id;
      alert(
        bookingReference
          ? `Booking confirmed! Your reference is ${bookingReference}. We’ll see you soon.`
          : "Booking confirmed! We’ll see you soon."
      );

      dispatch(resetBookings());
      dispatch(resetProfessionals());
      setSelectedDate(null);
      setSelectedTime(null);
      setBookingNotes("");
      setProfessionalMode('single');
      setProfessionalModalOpen(false);
      setPerServiceModalOpen(false);
      setStep('services');
      return;
    }
    if (step === 'services') setStep('professionals');
    else if (step === 'professionals') {
      if (professionalMode === 'perService') setStep('professionalPerService');
      else setStep('time');
    }
    else if (step === 'professionalPerService') setStep('time');
  }

  // Handler for time selection (update date/time immediately)
  function handleTimeSelection({ date, time }: { date: string; time: string }) {
    setSelectedDate(new Date(date));
    setSelectedTime(time);
    dispatch(setServiceSelection({ service: '', pkg: '', time: `${date} at ${time}` }));
    // Do NOT open auth modal here anymore
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

  // Handler for professional dropdown in TimeSelection
  function handleOpenProfessionalModal(idx?: number) {
    // If idx is provided (clicked from mobile sheet or time selection), open modal for that specific service
    if (typeof idx === "number") {
      setActiveProfessionalIdx(idx);
      // If we have multiple bookings, ensure we're in perService mode
      if (bookings.length > 1 && professionalMode !== 'perService') {
        setProfessionalMode('perService');
      }
      setProfessionalModalOpen(true);
    } else if (bookings.length > 1) {
      // If no idx and multiple bookings, open per-service modal
      setPerServiceModalOpen(true);
      setActiveProfessionalIdx(null);
    } else {
      // Single booking, no idx
      setActiveProfessionalIdx(null);
      setProfessionalModalOpen(true);
    }
  }

  return (
    <div className={`relative w-full min-h-[100dvh] bg-white ${interTight.className}`} style={{overflowY: 'auto', maxHeight: '100dvh'}}>
      {/* Profile icon top right */}
      {user && (
        <div className="fixed top-6 right-4 sm:right-8 z-[201]">
          <button
            ref={profileBtnRef}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#f5f5f5] hover:bg-[#e5e5e5] border border-[#ededed] shadow-sm transition"
            onClick={() => setProfileDropdownOpen(v => !v)}
            aria-haspopup="menu"
            aria-expanded={profileDropdownOpen}
            aria-label="User menu"
            type="button"
          >
            {/* Simple user icon */}
            <svg width="28" height="28" fill="none" viewBox="0 0 32 32">
              <circle cx="16" cy="12" r="6" fill="#33383C"/>
              <rect x="7" y="22" width="18" height="6" rx="3" fill="#33383C"/>
            </svg>
          </button>
          {/* Dropdown */}
          {profileDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-48 bg-white border border-[#ededed] rounded-xl shadow-lg z-[202] py-2"
              style={{ minWidth: 180 }}
              tabIndex={-1}
              onBlur={e => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setProfileDropdownOpen(false);
              }}
            >
              <div className="px-4 py-2 text-sm font-semibold text-[#232323] border-b border-[#ededed]">
                {user.user_metadata?.full_name || user.email}
              </div>
              <button
                className="w-full text-left px-4 py-2 text-[#d32f2f] hover:bg-[#f9eaea] rounded-b-xl text-sm font-medium transition"
                onClick={handleLogout}
                type="button"
                role="menuitem"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      )}
      <div className="flex flex-col lg:flex-row w-full min-h-[100dvh]">
        {/* Main content (left side + center) */}
        <div className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-24 lg:pb-8">
          {/* Progress tracker */}
          <div className="w-full flex mb-4 sm:mb-6 lg:mb-8 mt-12 sm:mt-14 lg:mt-16 overflow-x-auto">
            <ul className="flex flex-row gap-0 items-center pl-1 min-w-max">
              {[
                { label: 'Services' },
                { label: 'Professional' },
                { label: 'Time' },
                { label: 'Confirm' },
              ].map((stepObj, idx) => (
                <li key={stepObj.label} className="flex items-center">
                  <button
                    className={`font-medium text-xs sm:text-sm whitespace-nowrap transition-colors px-0 bg-transparent border-none outline-none ${
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
                    <span className="mx-1 sm:mx-2" aria-hidden="true">
                      <svg fill="currentColor" width="16" height="16" viewBox="0 0 32 32" className="sm:w-[18px] sm:h-[18px]"><path fillRule="evenodd" d="M19.957 9.043a1 1 0 0 1 0 1.414L14.414 16l5.543 5.543a1 1 0 0 1-1.414 1.414l-6.25-6.25a1 1 0 0 1 0-1.414l6.25-6.25a1 1 0 0 1 1.414 0" clipRule="evenodd"></path></svg>
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
                <div className="relative mb-4 sm:mb-6 lg:mb-8">
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
                              px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-sm sm:text-base font-semibold whitespace-nowrap transition-colors
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
                    <div className="hidden sm:flex gap-1 ml-2 items-center">
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
                  <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-[#141414]">{SERVICE_CATEGORIES[activeCategory]}</h2>
                  <ServiceSelectionStep
                    services={[SERVICES[activeCategory]]}
                    onSelectService={svc => {
                      setModalService(getServiceModalData(svc));
                      setModalOpen(true);
                    }}
                  />
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
                className="flex flex-col gap-4 sm:gap-6 flex-1"
              >
                <h2 className="text-xl sm:text-2xl font-bold mb-2 text-[#141414]">Select Professional</h2>
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
                  bookings={bookings} // <-- pass bookings here
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
                className="flex flex-col gap-4 sm:gap-6 flex-1"
              >
                <div className="flex flex-col gap-4 sm:gap-6 flex-1">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 text-[#141414]">Select time</h2>
                  <TimeSelectionModal
                    onBack={() => { setProfessionalMode('single'); setStep('professionals'); }}
                    onContinue={handleTimeSelection}
                    onOpenProfessionalModal={() => handleOpenProfessionalModal()}
                    professionalMode={professionalMode}
                    bookings={bookings}
                    selectedProfessionals={selectedProfessionals}
                    selectedProfessional={selectedProfessional}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    setSelectedDate={setSelectedDate}
                    setSelectedTime={setSelectedTime}
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
                className="flex flex-col gap-4 sm:gap-6 flex-1"
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
                  bookingNotes={bookingNotes}
                  onBookingNotesChange={setBookingNotes}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Right: Summary box as card, fixed position on desktop, bottom sheet on mobile */}
        <div className="hidden lg:flex lg:flex-col items-center py-8 px-6" style={{width: 380, minWidth: 380, maxWidth: 380, height: '100dvh', position: 'sticky', top: 0, right: 0, zIndex: 10}}>
          <div className="w-full max-w-xs mx-auto bg-white rounded-2xl border p-6 mt-16 flex flex-col gap-6" style={{maxHeight: 'calc(100vh - 48px)', minHeight: 0, display: 'flex'}}>
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
                          <span className="text-[#141414] font-medium text-sm truncate max-w-[140px]" title={b.option}>{b.name}</span>
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
              className={`py-2 px-8 rounded-full font-semibold text-base mt-2 ${
                bookings.length > 0 &&
                (
                  (step !== 'time' && step !== 'confirm') ||
                  (step === 'time' && selectedDate && selectedTime) ||
                  (step === 'confirm')
                )
                  ? "bg-[#33383C] text-white cursor-pointer hover:bg-[#232323]"
                  : "bg-gray-300 text-gray-600 cursor-not-allowed"
              }`}
              style={{ width: 'auto', alignSelf: 'flex-end' }}
              disabled={
                bookings.length === 0 ||
                (step === 'time' && (!selectedDate || !selectedTime))
              }
              onClick={handleContinue}
            >
              {step === 'confirm' && paymentMethod === "card"
                ? "Confirm & Pay"
                : "Continue"}
            </button>
          </div>
        </div>
        
        {/* Mobile bottom sheet for booking summary */}
        <AnimatePresence>
          {bookings.length > 0 && (
            <motion.div
              key={`mobile-sheet-${bookings.length}-${JSON.stringify(selectedProfessionals)}`}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#ededed] shadow-2xl z-[100] safe-area-inset-bottom"
              style={{ maxHeight: mobileSheetExpanded ? '70vh' : 'auto' }}
            >
              {/* Expandable header */}
              <button
                onClick={() => setMobileSheetExpanded(!mobileSheetExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between border-b border-[#ededed]"
              >
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-xs text-[#7B8487]">{bookings.length} {bookings.length === 1 ? 'service' : 'services'}</span>
                  <span className="font-semibold text-[#232323] text-base truncate">
                    {total > 0 ? `ZAR ${total.toFixed(2)}` : "free"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#7B8487]">{mobileSheetExpanded ? 'Hide' : 'View'} details</span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className={`transition-transform duration-200 ${mobileSheetExpanded ? 'rotate-180' : ''}`}
                  >
                    <path d="M6 9l6 6 6-6" stroke="#7B8487" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </button>

              {/* Expanded content */}
              <AnimatePresence>
                {mobileSheetExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 py-3 max-h-[50vh] overflow-y-auto">
                      {/* Date & Time */}
                      {(selectedDate && selectedTime) && (
                        <div className="flex flex-col gap-2 mb-4 pb-4 border-b border-[#ededed]">
                          <div className="flex flex-row items-center gap-2">
                            <svg width="18" height="18" fill="#7B8487" viewBox="0 0 32 32">
                              <path fillRule="evenodd" d="M10 2a1 1 0 0 1 1 1v1h10V3a1 1 0 1 1 2 0v1h3a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3V3a1 1 0 0 1 1-1M9 6H6v4h20V6h-3v1a1 1 0 1 1-2 0V6H11v1a1 1 0 1 1-2 0zm17 6H6v14h20z" clipRule="evenodd"></path>
                            </svg>
                            <p className="text-sm text-[#232323] font-medium">
                              {selectedDate.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" })}
                            </p>
                          </div>
                          <div className="flex flex-row items-center gap-2">
                            <svg width="18" height="18" fill="#7B8487" viewBox="0 0 32 32">
                              <path fillRule="evenodd" d="M16 5C9.925 5 5 9.925 5 16s4.925 11 11 11 11-4.925 11-11S22.075 5 16 5M3 16C3 8.82 8.82 3 16 3s13 5.82 13 13-5.82 13-13 13S3 23.18 3 16m13-8a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2h-7a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1" clipRule="evenodd"></path>
                            </svg>
                            <p className="text-sm text-[#232323] font-medium">{selectedTime}</p>
                          </div>
                        </div>
                      )}

                      {/* Helper text */}
                      {bookings.length > 0 && (
                        <div className="mb-3 text-xs text-[#7B8487] flex items-center gap-1">
                          <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                          </svg>
                          <span>Tap professional name to change</span>
                        </div>
                      )}

                      {/* Bookings list */}
                      <div className="space-y-2 mb-4">
                        {bookings.map((b, i) => (
                          <div key={i} className="flex items-start gap-2 bg-[#fafbfc] rounded-lg p-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-[#141414] mb-1">{b.name}</div>
                              {b.option && b.option !== b.name && (
                                <div className="text-xs text-[#7B8487] mb-1">{b.option}</div>
                              )}
                              {b.time && (
                                <div className="text-xs text-[#7B8487] mb-1">{b.time}</div>
                              )}
                              {/* Clickable professional selector */}
                              <button
                                onClick={() => handleOpenProfessionalModal(i)}
                                className="text-xs text-[#33383C] mt-1 flex items-center gap-1 hover:text-[#141414] transition-colors"
                              >
                                <svg width="14" height="14" fill="currentColor" viewBox="0 0 32 32">
                                  <circle cx="16" cy="12" r="5" />
                                  <path d="M7 24c0-4 4-7 9-7s9 3 9 7" />
                                </svg>
                                <span className="underline">
                                  {professionalMode === "perService"
                                    ? getProfessionalName(selectedProfessionals[i])
                                    : getProfessionalName(selectedProfessional)
                                  }
                                </span>
                                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M7 10l5 5 5-5z"/>
                                </svg>
                              </button>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="font-semibold text-[#232323] text-sm whitespace-nowrap">{b.price}</span>
                              <button
                                type="button"
                                aria-label="Remove booking"
                                className="p-1 rounded-full hover:bg-gray-200 focus:outline-none"
                                onClick={() => handleRemoveBooking(i)}
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                  <path d="M4.8 4.8l6.4 6.4M11.2 4.8l-6.4 6.4" stroke="#33383C" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total */}
                      <div className="flex items-center justify-between pt-3 border-t border-[#ededed]">
                        <span className="font-semibold text-[#141414] text-base">Total</span>
                        <span className="font-semibold text-[#232323] text-base">
                          {total > 0 ? `ZAR ${total.toFixed(2)}` : "free"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Continue button */}
              <div className="px-4 py-4 border-t border-[#ededed]">
                <button
                  className={`w-full py-3 rounded-full font-semibold text-base ${
                    bookings.length > 0 &&
                    (
                      (step !== 'time' && step !== 'confirm') ||
                      (step === 'time' && selectedDate && selectedTime) ||
                      (step === 'confirm')
                    )
                      ? "bg-[#33383C] text-white cursor-pointer hover:bg-[#232323]"
                      : "bg-gray-300 text-gray-600 cursor-not-allowed"
                  }`}
                  disabled={
                    bookings.length === 0 ||
                    (step === 'time' && (!selectedDate || !selectedTime))
                  }
                  onClick={handleContinue}
                >
                  {step === 'confirm' && paymentMethod === "card"
                    ? "Confirm & Pay"
                    : "Continue"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Service Modal with AnimatePresence for smooth transitions */}
      <AnimatePresence>
        {modalOpen && (
          <ServiceModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            service={modalService}
            onAddBooking={handleAddBooking}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {professionalModalOpen && (
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
              setActiveProfessionalIdx(null);
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
        )}
      </AnimatePresence>
      <AnimatePresence>
        {perServiceModalOpen && (
          <ProfessionalPerServiceModal
            open={perServiceModalOpen}
            onClose={() => {
              setPerServiceModalOpen(false);
              setActiveProfessionalIdx(null);
            }}
            bookings={bookings}
            selectedProfessionals={selectedProfessionals}
            setSelectedProfessionals={(bookingIdx: number, id: number | undefined) => dispatch(setSelectedProfessionals({ bookingIdx, id }))
            }
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {authModalOpen && (
          <AuthModal
            open={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
            onSignupSuccess={user => {
              setUser(user);
              setAuthModalOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default ServicesPage;


