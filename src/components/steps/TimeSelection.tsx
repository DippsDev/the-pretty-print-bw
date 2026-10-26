import React, { useState, useEffect, useRef } from "react";
import { Inter_Tight } from "next/font/google";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { getCalcomEventInfo, resolveProfessionalKey } from "@/lib/calcom/events";
import { resolveServiceSlugFromBooking } from "@/lib/calcom/helpers";
import type { Booking } from "@/redux/serviceSlice";

const PROTOTYPE_SLOTS = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
];

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

function toLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const NUM_DAYS = 90;
const MAX_DAYS = 90; // Maximum days to render in carousel at any time
const CALENDAR_START = new Date();

function timeLabelToMinutes(label: string): number {
  const match = label.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) {
    return Number.POSITIVE_INFINITY;
  }
  const [, hourStr, minuteStr, period] = match;
  let hours = parseInt(hourStr, 10);
  const minutes = parseInt(minuteStr, 10);
  const upperPeriod = period.toUpperCase();
  if (upperPeriod === 'PM' && hours !== 12) {
    hours += 12;
  } else if (upperPeriod === 'AM' && hours === 12) {
    hours = 0;
  }
  return hours * 60 + minutes;
}

interface TimeSelectionModalProps {
  onBack: () => void;
  onContinue: (selected: { date: string; time: string }) => void;
  availableTimes?: { [isoDate: string]: string[] };
  onOpenProfessionalModal?: () => void;
  professionalMode?: 'single' | 'perService';
  bookings?: Booking[];
  selectedProfessionals?: { [bookingIdx: number]: number | undefined };
  selectedProfessional?: number;
  selectedDate?: Date | null;
  selectedTime?: string | null;
  setSelectedDate?: (d: Date | null) => void;
  setSelectedTime?: (t: string | null) => void;
}

const TimeSelectionModal: React.FC<TimeSelectionModalProps> = ({
  onBack,
  onContinue,
  availableTimes,
  professionalMode = 'single',
  bookings,
  selectedProfessionals,
  selectedProfessional,
  selectedDate,
  selectedTime,
  setSelectedDate,
  setSelectedTime,
}) => {
  const tabListRef = useRef<HTMLUListElement>(null);
  const dayScrollerRef = useRef<HTMLDivElement>(null);
  const calendarIconRef = useRef<HTMLButtonElement>(null);

  const [availability, setAvailability] = useState<Record<string, string[]>>({});
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const primaryBooking = bookings && bookings.length > 0 ? bookings[0] : undefined;
  const serviceSlug = React.useMemo(
    () => resolveServiceSlugFromBooking(primaryBooking),
    [primaryBooking]
  );
  const eventInfo = React.useMemo(
    () => getCalcomEventInfo(serviceSlug),
    [serviceSlug]
  );

  const selectedProfessionalId = React.useMemo(() => {
    if (professionalMode === 'perService' && bookings && bookings.length > 0 && selectedProfessionals) {
      for (let idx = 0; idx < bookings.length; idx += 1) {
        const professionalId = selectedProfessionals[idx];
        if (typeof professionalId === 'number') {
          return professionalId;
        }
      }
    }
    return selectedProfessional;
  }, [professionalMode, bookings, selectedProfessionals, selectedProfessional]);

  const professionalKey = React.useMemo(
    () => resolveProfessionalKey(selectedProfessionalId),
    [selectedProfessionalId]
  );

  const eventTypeId = React.useMemo(() => {
    if (!eventInfo) return undefined;
    return eventInfo.eventTypeIds?.[professionalKey];
  }, [eventInfo, professionalKey]);

  useEffect(() => {
    if (!eventTypeId) {
      setAvailability({});
      return;
    }

    const controller = new AbortController();
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + NUM_DAYS);

    const params = new URLSearchParams({
      eventTypeId: String(eventTypeId),
      start: start.toISOString(),
      end: end.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    async function loadAvailability() {
      setAvailabilityLoading(true);
      setAvailabilityError(null);

      try {
        const response = await fetch(`/api/calcom/availability?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || 'Failed to load availability');
        }
        const data = await response.json();
        setAvailability(data.slots || {});
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Failed to load availability', error);
        setAvailability({});
        setAvailabilityError(error instanceof Error ? error.message : 'Failed to load availability');
      } finally {
        if (!controller.signal.aborted) {
          setAvailabilityLoading(false);
        }
      }
    }

    loadAvailability();

    return () => controller.abort();
  }, [eventTypeId]);

  const mergedAvailability = React.useMemo(() => {
    if (availableTimes) {
      return availableTimes;
    }
    return availability;
  }, [availableTimes, availability]);

  // Track the start date and number of days for the carousel range
  const [carouselStartDate, setCarouselStartDate] = useState<Date>(CALENDAR_START);
  const [carouselNumDays, setCarouselNumDays] = useState(NUM_DAYS);

  // Generate days for the carousel based on current start date
  const days = React.useMemo(() => getDays(carouselNumDays, carouselStartDate), [carouselNumDays, carouselStartDate]);

  // Find the index of the selected day in the carousel
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    setSelectedDayIdx(0);
  }, [carouselStartDate, carouselNumDays]);

  useEffect(() => {
    if (!selectedDate || !selectedTime) return;
    const iso = toLocalDateString(selectedDate);
    const idx = days.findIndex(d => d.iso === iso);
    if (idx !== -1 && idx !== selectedDayIdx) {
      setSelectedDayIdx(idx);
    }
  }, [selectedDate, selectedTime, days, selectedDayIdx]);

  // Defensive: ensure selectedDayIdx is valid and days is not empty
  const safeSelectedDayIdx = Math.max(0, Math.min(selectedDayIdx, days.length - 1));
  const selectedDay = days[safeSelectedDayIdx] ?? days[0];
  const selectedDayIso = selectedDay?.iso;
  const selectedDateIso = selectedDate ? toLocalDateString(selectedDate) : null;
  const availableTimesForSelectedDay = React.useMemo(() => {
    if (!selectedDayIso) {
      return [];
    }
    return mergedAvailability[selectedDayIso] || [];
  }, [mergedAvailability, selectedDayIso]);

  const prototypeSlots = Boolean(primaryBooking) && !availabilityLoading && !eventTypeId;

  const times = React.useMemo(() => {
    if (prototypeSlots) return PROTOTYPE_SLOTS;
    if (!selectedDayIso) return [] as string[];
    const filtered = [...availableTimesForSelectedDay];

    if (
      selectedDateIso === selectedDayIso &&
      selectedTime &&
      !filtered.includes(selectedTime)
    ) {
      filtered.push(selectedTime);
    }

    const unique = Array.from(new Set(filtered));
    unique.sort((a, b) => timeLabelToMinutes(a) - timeLabelToMinutes(b));
    return unique;
  }, [
    availableTimesForSelectedDay,
    selectedDayIso,
    selectedDateIso,
    selectedTime,
    prototypeSlots,
  ]);

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

  const [canScrollDatesBack, setCanScrollDatesBack] = useState(false);
  const [canScrollDatesForward, setCanScrollDatesForward] = useState(false);

  function updateDateScrollEdges() {
    const scroller = dayScrollerRef.current;
    if (!scroller) return;
    setCanScrollDatesBack(scroller.scrollLeft > 4);
    setCanScrollDatesForward(scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 4);
  }

  function scrollDates(direction: number) {
    const scroller = dayScrollerRef.current;
    if (!scroller) return;
    const distance = Math.max(scroller.clientWidth - 72, 160);
    scroller.scrollBy({ left: direction * distance, behavior: "smooth" });
  }

  useEffect(() => {
    const scroller = dayScrollerRef.current;
    const tab = tabListRef.current?.children[selectedDayIdx] as HTMLElement | undefined;
    if (!scroller || !tab) return;
    const left = tab.offsetLeft - (scroller.clientWidth - tab.clientWidth) / 2;
    scroller.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [selectedDayIdx, days]);

  useEffect(() => {
    const frame = requestAnimationFrame(updateDateScrollEdges);
    window.addEventListener("resize", updateDateScrollEdges);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateDateScrollEdges);
    };
  }, [days]);

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
    if (setSelectedTime) setSelectedTime(null);

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
      const newNumDays = diffDays + 1;
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

  function handleTimeClick(timeValue: string) {
    if (!selectedDay || !selectedDayIso) return;

      setSelectedDate?.(new Date(selectedDay.date));
      setSelectedTime?.(timeValue);
  }

  function displayTime(label: string) {
    return label.replace(/\s*(AM|PM)\b/i, (_, period: string) => period.toLowerCase());
  }

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col overflow-x-hidden">
        <div className="relative mb-8 flex items-start justify-between gap-3 sm:mb-10 sm:items-center">
          <h2 className="min-w-0 text-2xl font-semibold leading-tight text-[#0d0d0d] sm:text-[28px] sm:leading-9">Select date and time</h2>
          <button
            ref={calendarIconRef}
            type="button"
            className="flex h-12 w-14 shrink-0 items-center justify-center rounded-full border border-[#e5e5e5] bg-white"
            aria-label="Select date from a date picker"
            style={{ outline: "none", boxShadow: "none" }}
            onMouseDown={e => e.preventDefault()}
            onClick={() => setCalendarOpen(v => !v)}
            tabIndex={0}
          >
            <svg width="22" height="22" fill="none" viewBox="0 0 32 32">
              <path fill="#33383C" fillRule="evenodd" d="M10 2a1 1 0 0 1 1 1v1h10V3a1 1 0 1 1 2 0v1h3a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3V3a1 1 0 0 1 1-1M9 6H6v4h20V6h-3v1a1 1 0 1 1-2 0V6H11v1a1 1 0 1 1-2 0zm17 6H6v14h20z" clipRule="evenodd"></path>
            </svg>
          </button>
          {/* Calendar modal */}
          {calendarOpen && (
            <div
              id="calendar-modal"
              className="absolute right-0 top-[52px] z-[110] bg-white rounded-2xl border border-[#ededed] p-4"
              style={{
                width: "min(320px, calc(100vw - 2rem))",
                maxWidth: "calc(100vw - 2rem)",
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
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-[19px] font-semibold leading-6 text-[#0d0d0d]">Select a date</h3>
          <div className="flex items-center">
            <button
              type="button"
              aria-label="Previous dates"
              disabled={!canScrollDatesBack}
              onClick={() => scrollDates(-1)}
              className="flex h-8 w-8 items-center justify-center text-[#0d0d0d] disabled:text-[#d4d4d4]"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next dates"
              disabled={!canScrollDatesForward}
              onClick={() => scrollDates(1)}
              className="flex h-8 w-8 items-center justify-center text-[#0d0d0d] disabled:text-[#d4d4d4]"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        <div
          ref={dayScrollerRef}
          onScroll={updateDateScrollEdges}
          className="mb-6 w-full min-w-0 max-w-full touch-pan-x overflow-x-auto overscroll-x-contain scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <ul ref={tabListRef} className="flex w-max flex-row flex-nowrap gap-2 pb-1">
            {days.map((d, idx) => {
              const isSelected = selectedDayIdx === idx;
              const isClosed = !prototypeSlots && !availabilityLoading && (mergedAvailability[d.iso] || []).length === 0;
              return (
                <li key={d.iso}>
                  <button
                    type="button"
                    disabled={isClosed}
                    className={`flex h-[94px] w-16 flex-col items-center justify-center rounded-2xl border py-3 text-center ${
                      isSelected
                        ? "border-[#6950F3] bg-[#6950F3] text-white"
                        : isClosed
                          ? "cursor-not-allowed border-[#e5e5e5] bg-white text-[#acacac]"
                          : "border-[#e5e5e5] bg-white text-[#0d0d0d]"
                    }`}
                    onClick={() => {
                      setSelectedDayIdx(idx);
                      if (setSelectedTime) setSelectedTime(null);
                    }}
                  >
                    <span className="text-sm font-medium leading-5">{d.label}</span>
                    <span className="text-2xl font-semibold leading-8">{d.day}</span>
                    <span className="text-[13px] font-normal leading-4">{d.month}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <h3 className="mb-3 text-[19px] font-semibold leading-6 text-[#0d0d0d]">Pick a time</h3>
        {availabilityLoading && !prototypeSlots ? (
          <div className="flex flex-col items-center justify-center gap-4 mb-8 mt-4 w-full text-sm text-[#7B8487]">
            <div className="text-base font-medium text-[#141414]">Loading available times…</div>
            <div>This may take a moment.</div>
          </div>
        ) : times.length > 0 ? (
          <div className="mb-8 flex w-full min-w-0 flex-col gap-3">
            {times.map((t) => {
              const isSelected = selectedDateIso === selectedDayIso && selectedTime === t;
              const isBookable = prototypeSlots || availableTimesForSelectedDay.includes(t);
              const isDisabled = (!isBookable && !isSelected);
              const label = displayTime(t);
              const baseClasses = "w-full rounded-2xl bg-white px-4 py-4 text-left text-base font-normal leading-snug text-[#0d0d0d]";
              const stateClasses = isSelected
                ? "shadow-[inset_0_0_0_2px_#6950F3]"
                : isBookable
                  ? "shadow-[inset_0_0_0_1px_#e5e5e5]"
                  : "text-[#acacac] shadow-[inset_0_0_0_1px_#e5e5e5]";
              const disabledClasses = isDisabled && !isSelected ? " opacity-70 cursor-not-allowed" : "";

              return (
                <button
                  key={t}
                  className={`${baseClasses} ${stateClasses}${disabledClasses}`}
                  onClick={() => handleTimeClick(t)}
                  disabled={isDisabled && !isSelected}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 mb-8 mt-4 w-full" style={{ alignSelf: 'center' }}>
            <div className="text-lg font-semibold mt-6 text-[#141414]">Fully booked on this date</div>
            <div className="text-sm text-[#7B8487]">Available from {days.find((d, i) => (mergedAvailability[d.iso] || []).length > 0 && i > selectedDayIdx)?.label || "another day"}</div>
            <div className="flex gap-2 mt-2">
              <button className="px-4 py-2 rounded-full border font-medium text-[#33383C] hover:bg-gray-100" onClick={() => {
                // Go to next available date
                const nextIdx = days.findIndex((d, i) => (mergedAvailability[d.iso] || []).length > 0 && i > selectedDayIdx);
                if (nextIdx !== -1) setSelectedDayIdx(nextIdx);
              }}>Go to next available date</button>
              <button className="px-4 py-2 rounded-full border font-medium text-[#33383C] hover:bg-gray-100">Join waitlist</button>
            </div>
          </div>
        )}
        <div className="mt-2">
          <button
            onClick={onBack}
            className="text-sm font-medium text-[#0d0d0d]"
            style={{ textDecoration: "none" }}
          >
            Back
          </button>
        </div>
    </div>
  );
};

export default TimeSelectionModal;
