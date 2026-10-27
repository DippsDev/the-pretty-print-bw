"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { DM_Sans, Italiana } from "next/font/google";
import { ArrowLeft, Scissors } from "lucide-react";
import "./../booking.css";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/redux/store";
import { HOUSE_RULES, SERVICES, type ServiceGroup } from "@/lib/servicesData";
import { STYLISTS, stylistName } from "@/lib/stylists";
import { useSearchParams } from "next/navigation";
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

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm",
});

const italiana = Italiana({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-italiana",
});

// Supabase client
const supabase = createClient();

// Main ServicesPage component
function ServicesPage() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [groups, setGroups] = useState<ServiceGroup[]>(SERVICES);
  const serviceCategories = groups.map((group) => group.label);
  const searchParams = useSearchParams();
  // Listen for currentSection from Redux
  const currentSection = useSelector((state: RootState) => state.navigation.currentSection);
  // When currentSection changes, update activeCategory to match the group/tab
  useEffect(() => {
    if (currentSection) {
      const idx = serviceCategories.findIndex(
        (cat) => cat.toLowerCase() === currentSection.toLowerCase()
      );
      if (idx !== -1 && idx !== activeCategory) {
        setActiveCategory(idx);
        // Optionally scroll to the selected tab
        const list = tabListRef.current;
        const tab = list?.children[idx] as HTMLElement | undefined;
        if (list && tab) {
          const target = tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2;
          list.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
        }
      }
    }
  }, [currentSection, groups]);

  useEffect(() => {
    const category = searchParams.get("category");
    if (!category) return;
    const idx = serviceCategories.findIndex(
      (cat) => cat.toLowerCase() === category.toLowerCase()
    );
    if (idx !== -1) setActiveCategory(idx);
  }, [searchParams, groups]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/catalog")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { groups?: ServiceGroup[] } | null) => {
        if (!cancelled && data?.groups && data.groups.length > 0) setGroups(data.groups);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const tabListRef = useRef<HTMLUListElement>(null);
  const mobileSheetRef = useRef<HTMLDivElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalService, setModalService] = useState<any>(null);
  const dispatch = useDispatch();
  const selectedProfessional = useSelector((state: RootState) => state.professional.selectedProfessional);
  const selectedProfessionals = useSelector((state: RootState) => state.professional.selectedProfessionals);
  const bookings = useSelector((state: RootState) => state.service.bookings);

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
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [savingBooking, setSavingBooking] = useState(false);
  const [mobileSheetExpanded, setMobileSheetExpanded] = useState(false);

  useEffect(() => {
    const sheet = mobileSheetRef.current;
    if (bookings.length === 0 || !sheet) {
      delete document.body.dataset.bookingSheet;
      document.body.style.removeProperty("--booking-sheet-height");
      return;
    }
    document.body.dataset.bookingSheet = "open";
    const update = () => {
      const height = Math.ceil(sheet.getBoundingClientRect().height);
      document.body.style.setProperty("--booking-sheet-height", `${height}px`);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(sheet);
    return () => {
      observer.disconnect();
      delete document.body.dataset.bookingSheet;
      document.body.style.removeProperty("--booking-sheet-height");
    };
  }, [bookings.length, mobileSheetExpanded]);
  const [prototypeBooked, setPrototypeBooked] = useState(false);
  const [bookingNote, setBookingNote] = useState("");
  const paymentMethod = useSelector((state: RootState) => state.paymentMethod.selected);
  const paymentReturn =
    searchParams.get("payment") === "cancelled"
      ? "The card payment was cancelled. The booking stays unpaid until it is paid online or at the studio."
      : searchParams.get("payment") === "failed"
        ? "The card payment did not go through. The booking stays unpaid."
        : "";
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

  const scrollTabIntoView = (idx: number) => {
    const list = tabListRef.current;
    const tab = list?.children[idx] as HTMLElement | undefined;
    if (!list || !tab) return;
    const target = tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2;
    list.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  };

  // Slide to the next or previous category and show its services
  const scrollTabs = (dir: "left" | "right") => {
    let newIdx = activeCategory;
    if (dir === "left" && activeCategory > 0) {
      newIdx = activeCategory - 1;
    } else if (dir === "right" && activeCategory < serviceCategories.length - 1) {
      newIdx = activeCategory + 1;
    }
    setActiveCategory(newIdx);
    scrollTabIntoView(newIdx);
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
    if (idx === 2) return bookings.length > 0;
    if (idx === 3) return bookings.length > 0 && !!selectedDate && !!selectedTime;
    return false;
  }

  async function handleContinue() {
    if (bookings.length === 0 || savingBooking) return;
    if (step === 'time') {
      if (!selectedDate || !selectedTime) return;
      setStep('confirm');
      return;
    }
    if (step === 'confirm') {
      const name = clientName.trim();
      const email = clientEmail.trim();
      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setBookingError("Add the client name and a valid email before confirming.");
        return;
      }
      if (!selectedDate || !selectedTime) {
        setBookingError("Choose a date and time first.");
        return;
      }
      if (paymentMethod !== "card" && paymentMethod !== "venue") {
        setBookingError("Choose card or pay at the studio.");
        return;
      }
      setSavingBooking(true);
      setBookingError("");
      try {
        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientName: name,
            clientEmail: email,
            clientPhone: clientPhone.trim(),
            date: selectedDate.toISOString(),
            time: selectedTime,
            notes: bookingNotes,
            total,
            paymentMethod,
            services: bookings.map((booking, index) => ({
              name: booking.name,
              price: booking.price,
              stylist:
                professionalMode === "perService"
                  ? stylistName(selectedProfessionals[index])
                  : stylistName(selectedProfessional),
            })),
          }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.booking?.id) {
          setBookingError(body.error || "The booking could not be saved.");
          return;
        }
        if (paymentMethod === "card") {
          const checkout = await fetch("/api/yoco/create-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId: body.booking.id }),
          });
          const checkoutBody = (await checkout.json().catch(() => ({}))) as { url?: string; error?: string };
          if (!checkout.ok || !checkoutBody.url) {
            setBookingNote(checkoutBody.error || "Online payment could not be started. Pay at the studio instead.");
            setPrototypeBooked(true);
            return;
          }
          window.location.assign(checkoutBody.url);
          return;
        }
        setBookingNote("Pay at the studio when you arrive.");
        setPrototypeBooked(true);
      } catch {
        setBookingError("The booking could not be saved.");
      } finally {
        setSavingBooking(false);
      }
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
    return stylistName(id);
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
    <div className={`booking-page relative w-full ${dmSans.variable} ${italiana.variable} ${dmSans.className}`}>
      <header className="booking-masthead">
        <div className="booking-masthead-inner">
        <Link href="/" className="booking-brand booking-home" aria-label="Return to the studio">
          <Scissors size={19} strokeWidth={1.5} />
          <span>thePRETTYPRINT</span>
          <small>
            <span className="booking-home-quiet">Hair studio</span>
            <span className="booking-home-leave">
              Return home
              <ArrowLeft size={11} strokeWidth={1.5} />
            </span>
          </small>
        </Link>
        {user ? (
          <div className="relative z-[201]">
            <button
              ref={profileBtnRef}
              className="booking-round flex items-center justify-center w-10 h-10 rounded-full bg-[#eeeeec] hover:bg-[#e4e3df] border border-[rgba(37,34,30,0.18)] transition"
              onClick={() => setProfileDropdownOpen(v => !v)}
              aria-haspopup="menu"
              aria-expanded={profileDropdownOpen}
              aria-label="User menu"
              type="button"
            >
              <svg width="28" height="28" fill="none" viewBox="0 0 32 32">
                <circle cx="16" cy="12" r="6" fill="#33383C"/>
                <rect x="7" y="22" width="18" height="6" rx="3" fill="#33383C"/>
              </svg>
            </button>
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
        ) : (
          <span className="booking-header-label">Booking</span>
        )}
        </div>
      </header>
      <div className="booking-shell flex w-full min-w-0 flex-col min-h-[100dvh] min-[1100px]:flex-row min-[1100px]:items-start min-[1100px]:gap-8 min-[1100px]:px-8 min-[1100px]:pt-10">
        {/* Main content (left side + center) */}
        <div className="flex min-w-0 w-full flex-1 flex-col overflow-x-hidden px-4 pt-8 pb-48 sm:px-8 min-[1100px]:px-0 min-[1100px]:pt-0 min-[1100px]:pb-16">
          {/* Progress tracker */}
          <div className="mb-8 flex w-full overflow-x-auto">
            <ul className="booking-steps flex min-w-max flex-row items-center gap-0">
              {[
                { label: 'Services' },
                { label: 'Stylist' },
                { label: 'Time' },
                { label: 'Confirm' },
              ].map((stepObj, idx) => (
                <li key={stepObj.label} className="flex items-center">
                  <button
                    className="booking-step"
                    data-active={
                      (step === 'services' && idx === 0) ||
                      (step === 'professionals' && idx === 1) ||
                      (step === 'time' && idx === 2) ||
                      (step === 'confirm' && idx === 3)
                        ? "true"
                        : "false"
                    }
                    data-enabled={canGoToStep(idx) ? "true" : "false"}
                    disabled={!canGoToStep(idx)}
                    onClick={() => {
                      if (!canGoToStep(idx)) return;
                      if (idx === 0) setStep('services');
                      if (idx === 1) setStep('professionals');
                      if (idx === 2) setStep('time');
                      if (idx === 3) setStep('confirm');
                    }}
                    type="button"
                  >
                    {stepObj.label}
                  </button>
                  {idx < 3 && (
                  <span className="mx-1 text-[#c4c4c4] sm:mx-2" aria-hidden="true">
                    <svg fill="currentColor" width="14" height="14" viewBox="0 0 32 32" className="sm:h-[16px] sm:w-[16px]"><path fillRule="evenodd" d="M12.293 9.043a1 1 0 0 1 1.414 0l6.25 6.25a1 1 0 0 1 0 1.414l-6.25 6.25a1 1 0 0 1-1.414-1.414L17.836 16l-5.543-5.543a1 1 0 0 1 0-1.414" clipRule="evenodd"></path></svg>
                  </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {paymentReturn && <p className="booking-panel mb-6 text-sm text-[#262626]">{paymentReturn}</p>}

          {prototypeBooked ? (
            <div className="wf-frame max-w-xl">
              <p className="wf-kicker">Confirmed</p>
              <h2 className="text-2xl font-semibold">Booking received</h2>
              <p className="mt-2 text-sm text-[#5c5c5c]">
                The studio has this booking. {bookingNote}
              </p>
              <ul className="mt-4 flex flex-col gap-2">
                {bookings.map((booking, index) => (
                  <li key={`${booking.name}-${index}`} className="flex justify-between gap-4 border-t border-[#e5e5e5] pt-2 text-sm">
                    <span>{booking.name}</span>
                    <span>{booking.price}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="wf-btn mt-6"
                onClick={() => {
                  dispatch(resetBookings());
                  dispatch(resetProfessionals());
                  setSelectedDate(null);
                  setSelectedTime(null);
                  setBookingNotes("");
                  setBookingNote("");
                  setPrototypeBooked(false);
                  setStep("services");
                }}
              >
                Start another booking
              </button>
            </div>
          ) : (
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
                <p className="wf-note">
                  Choose a style. Prices are in pula.
                </p>
                <ul className="booking-rules flex flex-col gap-1">
                  {HOUSE_RULES.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
                {/* Category carousel */}
                <div className="relative mb-4 sm:mb-6 lg:mb-8">
                  <div className="flex items-center">
                    <ul
                      ref={tabListRef}
                      role="tablist"
                      className="flex min-w-0 flex-1 flex-nowrap gap-2 overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-hide"
                      style={{ scrollBehavior: "smooth" }}
                    >
                      {serviceCategories.map((cat, idx) => (
                        <li key={cat} role="tab" aria-selected={activeCategory === idx} className="shrink-0">
                          <button
                            className="booking-chip"
                            data-active={activeCategory === idx ? "true" : "false"}
                            onClick={() => {
                              setActiveCategory(idx);
                              scrollTabIntoView(idx);
                            }}
                          >
                            {cat}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="flex shrink-0 gap-1 ml-2 items-center">
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
                        disabled={activeCategory === serviceCategories.length - 1}
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
                  <h2 className="booking-heading">{groups[activeCategory]?.label}</h2>
                  <ServiceSelectionStep
                    services={groups[activeCategory] ? [groups[activeCategory]] : []}
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
                <h2 className="booking-heading">Select stylist</h2>
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
                className="flex min-w-0 w-full max-w-full flex-1 flex-col"
              >
                <div className="flex min-w-0 w-full max-w-full flex-1 flex-col">
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
                  clientName={clientName}
                  clientEmail={clientEmail}
                  clientPhone={clientPhone}
                  onClientNameChange={setClientName}
                  onClientEmailChange={setClientEmail}
                  onClientPhoneChange={setClientPhone}
                  bookingError={bookingError}
                />
              </motion.div>
            )}
          </AnimatePresence>
          )}
        </div>
        {/* Right: Summary box sticks with the page on desktop, bottom sheet on mobile */}
        <div className="hidden w-[300px] shrink-0 min-[1100px]:sticky min-[1100px]:top-6 min-[1100px]:block min-[1100px]:self-start xl:w-[360px]">
          <div className="booking-summary">
            <div className="mb-6">
              <div className="booking-wordmark">thePRETTYPRINT</div>
              <p className="booking-kicker">Hair studio</p>
            </div>
            <div className="flex flex-col gap-4">
              {bookings.length === 0 ? (
                <div className="text-sm text-[#7B8487]">No services selected</div>
              ) : (
                bookings.map((b, i) => (
                  <div key={i} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-medium text-[#141414]">{b.name}</div>
                      <div className="mt-1 text-sm text-[#7B8487]">
                        {[b.time, professionalMode === "perService" ? getProfessionalName(selectedProfessionals[i]) : getProfessionalName(selectedProfessional)].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="whitespace-nowrap text-[15px] font-medium text-[#141414]">{b.price}</span>
                      <button
                        type="button"
                        aria-label="Remove booking"
                        className="rounded-full p-1 hover:bg-[#f3f3f3]"
                        onClick={() => handleRemoveBooking(i)}
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                          <path d="M4.8 4.8l6.4 6.4M11.2 4.8l-6.4 6.4" stroke="#7B8487" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="booking-total">
              <span>Total</span>
              <span>
                {total > 0 ? `P${Number.isInteger(total) ? total.toFixed(0) : total.toFixed(2)}` : "Free"}
              </span>
            </div>
            {(selectedDate && selectedTime) && (
              <p className="mt-3 text-sm text-[#7B8487]">
                {selectedDate.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
                {selectedTime ? ` · ${selectedTime}` : ""}
              </p>
            )}
            <button
              className="booking-continue"
              disabled={
                savingBooking ||
                prototypeBooked ||
                bookings.length === 0 ||
                (step === 'time' && (!selectedDate || !selectedTime))
              }
              onClick={handleContinue}
            >
              {savingBooking ? "Saving…" : prototypeBooked ? "Booked" : step === 'confirm' ? "Confirm booking" : "Continue"}
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
              ref={mobileSheetRef}
              className="booking-sheet min-[1100px]:hidden fixed bottom-0 left-0 right-0 z-[100] safe-area-inset-bottom"
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
                    {total > 0 ? `P${Number.isInteger(total) ? total.toFixed(0) : total.toFixed(2)}` : "Free"}
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
                          {total > 0 ? `P${Number.isInteger(total) ? total.toFixed(0) : total.toFixed(2)}` : "Free"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Continue button */}
              <div className="px-4 py-4 border-t border-[#ededed]">
                <button
                  className="booking-continue"
                  disabled={
                    savingBooking ||
                    prototypeBooked ||
                    bookings.length === 0 ||
                    (step === 'time' && (!selectedDate || !selectedTime))
                  }
                  onClick={handleContinue}
                >
                  {savingBooking ? "Saving…" : prototypeBooked ? "Booked" : step === "confirm" ? "Confirm booking" : "Continue"}
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
            professionals={STYLISTS}
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


