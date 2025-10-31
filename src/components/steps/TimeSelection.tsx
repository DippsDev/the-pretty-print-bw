import React, { useState, useEffect, useRef } from "react";
import { Inter_Tight } from "next/font/google";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { useBookingActions } from "@/hooks/useBookingUpdates";

const interTight = Inter_Tight({ subsets: ["latin"], weight: "400" });

// Helper to get days for the next N days (default: 90 days)
function getDays(numDays = 90, startDate?: Date) {
  const days = [];
  const today = startDate ? new Date(startDate) : new Date();
  for (let i = 0; i < numDays; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      date: d,
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      day: d.getDate(),
      month: d.toLocaleDateString(undefined, { month: "short" }),
      iso: toLocalDateString(d),
    });
  }
  return days;
}

const TIME_SLOTS: string[] = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM"
];

type BookedSlotsMap = {
  [date: string]:
    | string[]
    | {
        all: string[];
        byProfessional: {
          [professional: string]: string[];
        };
      };
};

const DEFAULT_SLOT_DURATION = 30;

// Generate available times for every day from today, 9am-5pm, 30-minute slots
function generateAvailableTimes(
  numDays = 90,
  startDate?: Date,
  bookedSlots?: BookedSlotsMap,
  timeSlots: string[] = TIME_SLOTS
) {
  const days = getDays(numDays, startDate);
  const times = timeSlots.length ? timeSlots : TIME_SLOTS;

  const availableTimes: { [iso: string]: string[] } = {};
  days.forEach(day => {
    // If there are booked slots for this date, filter them out
    if (bookedSlots && bookedSlots[day.iso]) {
      const entry = bookedSlots[day.iso];
      if (Array.isArray(entry)) {
        availableTimes[day.iso] = times.filter(time => !entry.includes(time));
      } else if (entry) {
        const blocked = new Set(entry.all || []);
        availableTimes[day.iso] = times.filter(time => !blocked.has(time));
      } else {
        availableTimes[day.iso] = [...times];
      }
    } else {
      // All times available if no bookings for this date
      availableTimes[day.iso] = [...times];
    }
  });
  return availableTimes;
}

function toLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromIsoDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function normalizeProfessionalKey(name?: string | null) {
  if (!name) return 'any';
  const trimmed = name.trim().toLowerCase();
  if (!trimmed || trimmed === 'any professional' || trimmed === 'any') {
    return 'any';
  }
  return trimmed;
}

const NUM_DAYS = 90;
const MAX_DAYS = 90; // Maximum days to render in carousel at any time
const CALENDAR_START = new Date();

interface TimeSelectionModalProps {
  onBack: () => void;
  onContinue: (selected: { date: string; time: string }) => void;
  availableTimes?: { [isoDate: string]: string[] };
  onOpenProfessionalModal?: () => void;
  professionalMode?: 'single' | 'perService';
  bookings?: any[];
  selectedProfessionals?: { [bookingIdx: number]: number | undefined };
  setSelectedProfessionals?: (bookingIdx: number, id: number | undefined) => void;
  selectedProfessional?: number;
  // New props for user and controlled date/time
  user?: any;
  selectedDate?: Date | null;
  selectedTime?: string | null;
  setSelectedDate?: (d: Date | null) => void;
  setSelectedTime?: (t: string | null) => void;
}

const TimeSelectionModal: React.FC<TimeSelectionModalProps> = ({
  onBack,
  onContinue,
  availableTimes,
  onOpenProfessionalModal,
  professionalMode = 'single',
  bookings,
  selectedProfessionals,
  setSelectedProfessionals,
  selectedProfessional,
  user,
  selectedDate,
  selectedTime,
  setSelectedDate,
  setSelectedTime,
}) => {
  // Get booking status from Redux
  const bookingStatus = useSelector((state: RootState) => state.bookingStatus.status);

  const baseTimeSlots = React.useMemo(() => {
    if (bookingStatus?.availableTimes?.length) {
      return bookingStatus.availableTimes;
    }
    return TIME_SLOTS;
  }, [bookingStatus?.availableTimes]);

  const { bookSlot, cancelSlot } = useBookingActions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const realTimeAvailableTimes = React.useMemo(() => {
    return generateAvailableTimes(
      NUM_DAYS,
      CALENDAR_START,
      bookingStatus?.bookedSlots,
      baseTimeSlots
    );
  }, [bookingStatus?.bookedSlots, baseTimeSlots]);

  const effectiveAvailableTimes = React.useMemo(() => {
    return availableTimes || realTimeAvailableTimes;
  }, [availableTimes, realTimeAvailableTimes]);
  // Track the start date and number of days for the carousel range
  const [carouselStartDate, setCarouselStartDate] = useState<Date>(CALENDAR_START);
  const [carouselNumDays, setCarouselNumDays] = useState(NUM_DAYS);

  // Generate days for the carousel based on current start date
  const days = getDays(carouselNumDays, carouselStartDate);

  // Find the index of the selected day in the carousel
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [visibleMonthYear, setVisibleMonthYear] = useState(() => {
    const d = days.length > 0 ? days[0].date : new Date();
    return `${d.toLocaleString(undefined, { month: "long" })} ${d.getFullYear()}`;
  });
  const tabListRef = useRef<HTMLUListElement>(null);
  const lastBookedRef = useRef<{ date: string; time: string; professional?: string } | null>(null);

  // Calendar modal state
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarIconRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setSelectedDayIdx(0);
  }, [carouselStartDate, carouselNumDays]);

  // Update visibleMonthYear when selectedDayIdx changes
  useEffect(() => {
    const safeIdx = Math.max(0, Math.min(selectedDayIdx, days.length - 1));
    const d = days[safeIdx]?.date ?? new Date();
    setVisibleMonthYear(`${d.toLocaleString(undefined, { month: "long" })} ${d.getFullYear()}`);
  }, [selectedDayIdx, days]);

  useEffect(() => {
    if (!selectedDate) return;
    const iso = toLocalDateString(selectedDate);
    const idx = days.findIndex(d => d.iso === iso);
    if (idx !== -1 && idx !== selectedDayIdx) {
      setSelectedDayIdx(idx);
    }
  }, [selectedDate, days, selectedDayIdx]);

  // Defensive: ensure selectedDayIdx is valid and days is not empty
  const safeSelectedDayIdx = Math.max(0, Math.min(selectedDayIdx, days.length - 1));
  const selectedDay = days[safeSelectedDayIdx] ?? days[0];
  const selectedDayIso = selectedDay?.iso;
  const selectedDateIso = selectedDate ? toLocalDateString(selectedDate) : null;
  const availableTimesForSelectedDay = selectedDay
    ? (effectiveAvailableTimes[selectedDay.iso] || [])
    : [];

  const professionalForApi = React.useMemo(() => {
    if (professionalMode === 'perService') {
      if (bookings && bookings.length === 1 && selectedProfessionals) {
        const id = selectedProfessionals[0];
        const name = getProfessionalName(id);
        return name === "Any professional" ? undefined : name;
      }
      return undefined;
    }
    const name = getProfessionalName(selectedProfessional);
    return name === "Any professional" ? undefined : name;
  }, [professionalMode, bookings, selectedProfessionals, selectedProfessional]);

  const professionalKey = React.useMemo(
    () => normalizeProfessionalKey(professionalForApi ?? null),
    [professionalForApi]
  );

  const times = React.useMemo(() => {
    if (!selectedDayIso) return [] as string[];
    let filtered = [...availableTimesForSelectedDay];

    if (professionalKey !== 'any') {
      const entry = bookingStatus?.bookedSlots?.[selectedDayIso];
      const blocked = entry?.byProfessional?.[professionalKey] || [];
      if (blocked.length) {
        const blockedSet = new Set(blocked);
        filtered = filtered.filter(slot => !blockedSet.has(slot));
      }
    }

    if (
      selectedDateIso === selectedDayIso &&
      selectedTime &&
      !filtered.includes(selectedTime)
    ) {
      filtered.push(selectedTime);
    }

    const unique = Array.from(new Set(filtered));
    unique.sort((a, b) => {
      const aIdx = baseTimeSlots.indexOf(a);
      const bIdx = baseTimeSlots.indexOf(b);
      return (aIdx === -1 ? Number.POSITIVE_INFINITY : aIdx) -
        (bIdx === -1 ? Number.POSITIVE_INFINITY : bIdx);
    });
    return unique;
  }, [
    availableTimesForSelectedDay,
    selectedDayIso,
    selectedDateIso,
    selectedTime,
    baseTimeSlots,
    professionalKey,
    bookingStatus?.bookedSlots,
  ]);

  useEffect(() => {
    if (!selectedDate || !selectedTime) {
      lastBookedRef.current = null;
    }
  }, [selectedDate, selectedTime]);

  // Call onContinue as soon as a time is selected (prevent infinite loop)
  const lastSentRef = useRef<{ date: string; time: string } | null>(null);
  useEffect(() => {
    if (selectedTime && selectedDay) {
      const payload = { date: selectedDay.iso, time: selectedTime };
      // Only call if changed
      if (
        !lastSentRef.current ||
        lastSentRef.current.date !== payload.date ||
        lastSentRef.current.time !== payload.time
      ) {
        onContinue?.(payload);
        lastSentRef.current = payload;
      }
    }
  }, [selectedTime, selectedDay, onContinue]);

  // Scroll to selected day in carousel (always after days update)
  useEffect(() => {
    if (tabListRef.current && days[selectedDayIdx]) {
      const tab = tabListRef.current.children[selectedDayIdx] as HTMLElement;
      if (tab) {
        // Use scrollIntoView with block: "center" for smoother experience
        tab.scrollIntoView({ behavior: "smooth", inline: "center", block: "center" });
      }
    }
  }, [selectedDayIdx, days]);

  // Handle outside click for calendar modal
  useEffect(() => {
    if (!calendarOpen) return;
    function handleClick(e: MouseEvent) {
      const modal = document.getElementById("calendar-modal");
      if (
        modal &&
        !modal.contains(e.target as Node) &&
        calendarIconRef.current &&
        !calendarIconRef.current.contains(e.target as Node)
      ) {
        setCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [calendarOpen]);

  // When a date is picked, update selectedDayIdx and close modal
  function handleCalendarSelect(date?: Date) {
    if (!date) return;
    const iso = toLocalDateString(date);

    // Get current carousel range
    const currentStart = carouselStartDate;
    const currentEnd = new Date(carouselStartDate);
    currentEnd.setDate(currentEnd.getDate() + carouselNumDays - 1);

    // Compare direction
    if (date < currentStart) {
      // Scroll left: render up to MAX_DAYS, with selected date at start
      const diffDays = Math.ceil((currentStart.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      let newNumDays = NUM_DAYS + diffDays;
      if (newNumDays > MAX_DAYS) newNumDays = MAX_DAYS;
      const newStart = new Date(date);
      setCarouselStartDate(newStart);
      setCarouselNumDays(newNumDays);
      setTimeout(() => {
        const newDays = getDays(newNumDays, newStart);
        const newIdx = newDays.findIndex(d => d.iso === iso);
        setSelectedDayIdx(newIdx !== -1 ? newIdx : 0);
        setCalendarOpen(false);
      }, 0);
      return;
    }

    if (date > currentEnd) {
      // Scroll right: render up to MAX_DAYS, with selected date at end
      const diffDays = Math.ceil((date.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
      let newNumDays = diffDays + 1;
      if (newNumDays > MAX_DAYS) {
        // Only render MAX_DAYS, shift start date so selected date is at the end
        const newStart = new Date(date);
        newStart.setDate(newStart.getDate() - (MAX_DAYS - 1));
        setCarouselStartDate(newStart);
        setCarouselNumDays(MAX_DAYS);
        setTimeout(() => {
          const newDays = getDays(MAX_DAYS, newStart);
          const newIdx = newDays.findIndex(d => d.iso === iso);
          setSelectedDayIdx(newIdx !== -1 ? newIdx : MAX_DAYS - 1);
          setCalendarOpen(false);
        }, 0);
      } else {
        setCarouselNumDays(newNumDays);
        setTimeout(() => {
          const newDays = getDays(newNumDays, carouselStartDate);
          const newIdx = newDays.findIndex(d => d.iso === iso);
          setSelectedDayIdx(newIdx !== -1 ? newIdx : 0);
          setCalendarOpen(false);
        }, 0);
      }
      return;
    }

    // If the date is in range, just select it
    const idx = days.findIndex(d => d.iso === iso);
    if (idx !== -1) {
      setSelectedDayIdx(idx);
      setCalendarOpen(false);
    }
  }

  async function handleTimeClick(timeValue: string) {
    if (!selectedDay || !selectedDayIso || isProcessing) return;

    setActionMessage(null);
    setActionError(null);
    setIsProcessing(true);

    const previousBooking = lastBookedRef.current;
    const isSameSelection =
      previousBooking?.date === selectedDayIso &&
      previousBooking?.time === timeValue;

    const displayDate = new Date(selectedDay.date);
    const formattedDate = displayDate.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    if (isSameSelection && previousBooking) {
      try {
        await cancelSlot({
          date: previousBooking.date,
          time: previousBooking.time,
          duration: DEFAULT_SLOT_DURATION,
          professional: previousBooking.professional,
        });
        setSelectedTime?.(null);
        setSelectedDate?.(null);
        lastBookedRef.current = null;
        setActionMessage(`Released ${timeValue} on ${formattedDate}`);
      } catch (error) {
        console.error('Failed to release time slot', error);
        const message = error instanceof Error
          ? error.message
          : 'Failed to release time slot. Please try again.';
        setActionError(message);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    try {
      const bookingPayload = {
        date: selectedDayIso,
        time: timeValue,
        duration: DEFAULT_SLOT_DURATION,
        professional: professionalForApi,
      };

      await bookSlot(bookingPayload);

      let releaseError: string | null = null;
      if (previousBooking) {
        try {
          await cancelSlot({
            ...previousBooking,
            duration: DEFAULT_SLOT_DURATION,
          });
        } catch (error) {
          console.error('Failed to release previous slot', error);
          releaseError = 'Previous time slot is still reserved. Please cancel it manually if needed.';
        }
      }

      setSelectedDate?.(new Date(selectedDay.date));
      setSelectedTime?.(timeValue);
      lastBookedRef.current = bookingPayload;

      setActionMessage(`Reserved ${timeValue} on ${formattedDate}`);
      if (releaseError) {
        setActionError(releaseError);
      }
    } catch (error) {
      console.error('Booking action failed', error);
      const message = error instanceof Error
        ? error.message
        : 'Failed to reserve time slot. Please try again.';
      setActionError(message);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleCancelSelected() {
    const currentBooking = lastBookedRef.current;
    if (!currentBooking || isProcessing) return;

    setActionMessage(null);
    setActionError(null);
    setIsProcessing(true);

    const displayDate = fromIsoDate(currentBooking.date).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    try {
      await cancelSlot({
        date: currentBooking.date,
        time: currentBooking.time,
        duration: DEFAULT_SLOT_DURATION,
        professional: currentBooking.professional,
      });
      setSelectedTime?.(null);
      setSelectedDate?.(null);
      lastBookedRef.current = null;
      setActionMessage(`Released ${currentBooking.time} on ${displayDate}`);
    } catch (error) {
      console.error('Failed to release time slot', error);
      const message = error instanceof Error
        ? error.message
        : 'Failed to release time slot. Please try again.';
      setActionError(message);
    } finally {
      setIsProcessing(false);
    }
  }

  // Only render the calendar for the same range as the carousel
  const calendarStartMonth = new Date(days[0].date.getFullYear(), days[0].date.getMonth(), 1);
  const calendarEndMonth = new Date(days[days.length - 1].date.getFullYear(), days[days.length - 1].date.getMonth(), 1);
  calendarEndMonth.setMonth(calendarEndMonth.getMonth() + 1);

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
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex flex-col w-full bg-white rounded-2xl shadow-none p-0" style={{ minHeight: 0, flex: 1 }}>
        {/* Filters row: professional dropdown (left), calendar icon (right) */}
        <div className="flex items-center justify-between w-full mb-10 px-1 relative">
          {/* Professional selection button */}
          <button
            type="button"
            className="relative flex items-center border rounded-full pl-8 pr-8 py-2 text-sm font-medium text-[#33383C] bg-white focus:outline-none focus:ring-1 focus:ring-[#33383C] transition"
            style={{
              minWidth: 160,
              maxWidth: 260,
              width: professionalMode === 'perService' ? 'auto' : 180,
              borderColor: "#d1d5db",
              display: 'flex',
              whiteSpace: 'nowrap',
            }}
            onClick={() => {
              if (onOpenProfessionalModal) onOpenProfessionalModal();
            }}
          >
            {/* Profile icon on the left */}
            <span className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              <svg width="20" height="20" fill="none" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="14" stroke="#232323" strokeWidth="2" fill="none"/>
                <ellipse cx="16" cy="20" rx="7" ry="5" fill="#232323" />
                <circle cx="16" cy="13" r="4" fill="#232323" />
              </svg>
            </span>
            {/* Text in the middle */}
            <span className="mx-auto flex items-center" style={{ whiteSpace: 'nowrap' }}>
              {professionalMode === 'perService'
                ? "Multiple professionals"
                : getProfessionalName(selectedProfessional)}
            </span>
            {/* Down arrow icon on the right */}
            <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              <svg width="18" height="18" fill="none" viewBox="0 0 20 20">
                <path d="M5 8l5 5 5-5" stroke="#232323" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </button>
          {/* Calendar icon button with circular outline */}
          <button
            ref={calendarIconRef}
            type="button"
            className="flex items-center justify-center p-2 rounded-full border border-[#d1d5db] bg-white hover:bg-gray-50 transition"
            aria-label="Select date from a date picker"
            style={{
              width: 40,
              height: 40,
              position: "relative",
              outline: "none", // Remove outline
              boxShadow: "none", // Remove focus ring
            }}
            onMouseDown={e => e.preventDefault()} // Prevent outline on click
            onClick={() => setCalendarOpen(v => !v)}
            tabIndex={0}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 32 32">
              <path fill="#33383C" fillRule="evenodd" d="M10 2a1 1 0 0 1 1 1v1h10V3a1 1 0 1 1 2 0v1h3a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3V3a1 1 0 0 1 1-1M9 6H6v4h20V6h-3v1a1 1 0 1 1-2 0V6H11v1a1 1 0 1 1-2 0zm17 6H6v14h20z" clipRule="evenodd"></path>
            </svg>
          </button>
          {/* Calendar modal */}
          {calendarOpen && (
            <div
              id="calendar-modal"
              className="absolute right-0 top-[52px] z-[110] bg-white rounded-2xl border border-[#ededed] p-4"
              style={{
                minWidth: 320,
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                fontFamily: interTight.style.fontFamily,
                outline: "none",
              }}
              tabIndex={-1}
            >
              <DayPicker
                mode="single"
                selected={selectedDay?.date}
                onSelect={handleCalendarSelect}
                weekStartsOn={1}
                captionLayout="label"
                navLayout="around"
                fromDate={days[0]?.date}
                toDate={days[days.length - 1]?.date}
                defaultMonth={selectedDay?.date}
                styles={{
                  months: { margin: 0 },
                  caption: { fontWeight: 600, color: "#141414" },
                  caption_label: { color: "#141414", fontWeight: 600, fontSize: "1.1rem" },
                  nav: { alignItems: "center" },
                  nav_button: {
                    color: "#141414",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontWeight: 400,
                    fontSize: "1rem",
                    width: 24,
                    height: 24,
                    minWidth: 24,
                    minHeight: 24,
                    padding: 0,
                  },
                  nav_button_previous: {
                    color: "#141414",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontWeight: 400,
                    fontSize: "1rem",
                    width: 24,
                    height: 24,
                    minWidth: 24,
                    minHeight: 24,
                    padding: 0,
                  },
                  nav_button_next: {
                    color: "#141414",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontWeight: 400,
                    fontSize: "1rem",
                    width: 24,
                    height: 24,
                    minWidth: 24,
                    minHeight: 24,
                    padding: 0,
                  },
                  day_selected: {
                    background: "#141414",
                    color: "#fff",
                    borderRadius: "9999px",
                    border: "none",
                  },
                  day: {
                    borderRadius: "9999px",
                    fontWeight: 500,
                    color: "#232323",
                  },
                  day_today: {
                    border: "1.5px solid #33383C",
                    color: "#232323",
                  },
                  head_cell: {
                    color: "#141414 !important",
                    fontWeight: 500,
                    fontSize: "1rem",
                    opacity: 1,
                  },
                  root: {
                    outline: "none",
                  },
                }}
                classNames={{
                  nav_button: "hover:bg-gray-100",
                  nav_button_previous: "hover:bg-gray-100",
                  nav_button_next: "hover:bg-gray-100",
                  caption_label: "text-[#141414] font-semibold",
                  head_cell: "!text-[#141414] !font-medium",
                  chevron: "fill-[#141414]",
                }}
                modifiersClassNames={{
                  selected: "bg-[#141414] !text-white",
                }}
                showOutsideDays
                footer={
                  <div className="pt-2 text-sm text-[#33383C] text-center">
                    Selected: ${days[safeSelectedDayIdx].date.toLocaleDateString()}
                  </div>
                }
              />
            </div>
          )}
        </div>
        {/* Month/Year above carousel */}
        <div className="mb-6 w-full text-lg font-semibold text-[#141414] px-1 select-none">
          {visibleMonthYear}
        </div>
        {/* Days carousel */}
        <div className="mb-6 w-full min-w-0">
          <div
            className="
              w-full min-w-0
              overflow-x-auto
              scrollbar-hide
              max-w-full
              md:max-w-[calc(100vw-480px)]
            "
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <ul
              ref={tabListRef}
              className="flex flex-row flex-nowrap gap-2 min-w-max scrollbar-hide"
              style={{
                scrollBehavior: "smooth",
              }}
            >
              {/* Only render the days in the selected range */}
              {days.map((d, idx) => (
                <li key={d.iso} className="px-0">
                  <button
                    className={`flex flex-col items-center px-3 py-2 rounded-lg font-semibold transition-colors min-w-[56px] ${selectedDayIdx === idx ? "bg-[#141414] text-white" : "bg-transparent text-[#141414] hover:bg-[#ededed]"}`}
                    style={{ fontFamily: interTight.style.fontFamily, boxShadow: "none", border: "none" }}
                    onClick={() => {
                      setSelectedDayIdx(idx);
                      if (setSelectedTime) setSelectedTime(null);
                    }}
                  >
                    <span className="text-xs mb-1">{d.label}</span>
                    <span className="text-lg font-bold">{d.day}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* Time slots or not available */}
        {times.length > 0 ? (
          <div className="flex flex-wrap gap-3 mb-8">
            {times.map((t) => {
              const isSelected = selectedDateIso === selectedDayIso && selectedTime === t;
              const isBookable = availableTimesForSelectedDay.includes(t);
              const isDisabled = (!isBookable && !isSelected) || (isProcessing && !isSelected);
              const label = !isBookable && isSelected ? `${t} (reserved)` : t;
              const baseClasses = "px-4 py-2 rounded-full border font-medium transition-colors";
              const stateClasses = isSelected
                ? "bg-[#141414] text-white border-[#141414]"
                : isBookable
                  ? "bg-white text-[#141414] border-[#d1d5db] hover:border-[#33383C]"
                  : "bg-[#f5f5f5] text-[#9ca3af] border-[#e5e7eb]";
              const disabledClasses = isDisabled ? " opacity-70 cursor-not-allowed" : "";

              return (
                <button
                  key={t}
                  className={`${baseClasses} ${stateClasses}${disabledClasses}`}
                  onClick={() => handleTimeClick(t)}
                  disabled={isDisabled}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 mb-8 mt-4 w-full" style={{ alignSelf: 'center' }}>
            <div className="text-lg font-semibold mt-6 text-[#141414]">Fully booked on this date</div>
            <div className="text-sm text-[#7B8487]">Available from {days.find((d, i) => (effectiveAvailableTimes[d.iso] || []).length > 0 && i > selectedDayIdx)?.label || "another day"}</div>
            <div className="flex gap-2 mt-2">
              <button className="px-4 py-2 rounded-full border font-medium text-[#33383C] hover:bg-gray-100" onClick={() => {
                // Go to next available date
                const nextIdx = days.findIndex((d, i) => (effectiveAvailableTimes[d.iso] || []).length > 0 && i > selectedDayIdx);
                if (nextIdx !== -1) setSelectedDayIdx(nextIdx);
              }}>Go to next available date</button>
              <button className="px-4 py-2 rounded-full border font-medium text-[#33383C] hover:bg-gray-100">Join waitlist</button>
            </div>
          </div>
        )}
        {(selectedDate && selectedTime) && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-[#f9fafb] border border-[#ededed] rounded-xl px-4 py-3">
            <div className="flex flex-col text-sm text-[#33383C]">
              <span className="font-semibold text-[#141414]">Selected slot</span>
              <span>
                {selectedDate.toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
                {selectedTime ? ` at ${selectedTime}` : ''}
              </span>
            </div>
            <button
              type="button"
              className="px-4 py-2 rounded-full border font-medium text-[#d32f2f] border-[#f5c7c7] hover:bg-[#fef2f2] transition"
              onClick={handleCancelSelected}
              disabled={isProcessing}
            >
              Cancel slot
            </button>
          </div>
        )}
        {(isProcessing || actionMessage || actionError) && (
          <div className="mb-6 text-sm space-y-1">
            {isProcessing && <div className="text-[#33383C]">Updating slot...</div>}
            {actionMessage && <div className="text-[#047857]">{actionMessage}</div>}
            {actionError && <div className="text-[#b91c1c]">{actionError}</div>}
          </div>
        )}
        {/* Footer actions */}
        <div className="flex flex-row gap-4 mt-auto w-full">
          <button
            onClick={onBack}
            className="text-[#33383C] text-sm px-3 py-1 rounded hover:bg-gray-100 transition font-medium"
            style={{ textDecoration: 'none' }}
          >
            Back
          </button>
          {/* Continue button removed */}
        </div>
      </div>
    </div>
  );
};

export default TimeSelectionModal;
