import React, { useState, useEffect, useRef } from "react";
import { Inter_Tight } from "next/font/google";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

const interTight = Inter_Tight({ subsets: ["latin"], weight: "400" });

// Helper to get days for the next N days
function getDays(numDays = 30, startDate?: Date) {
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
      iso: d.toISOString().slice(0, 10),
    });
  }
  return days;
}

const NUM_DAYS = 30;
const MAX_DAYS = 90; // Maximum days to render in carousel at any time
const CALENDAR_START = new Date();

interface TimeSelectionModalProps {
  onBack: () => void;
  onContinue: (selected: { date: string; time: string }) => void;
  availableTimes?: { [isoDate: string]: string[] };
  onOpenProfessionalModal?: () => void;
  professionalMode?: 'single' | 'perService';
}

const TimeSelectionModal: React.FC<TimeSelectionModalProps> = ({
  onBack,
  onContinue,
  availableTimes = {},
  onOpenProfessionalModal,
  professionalMode = 'single',
}) => {
  // Track the start date and number of days for the carousel range
  const [carouselStartDate, setCarouselStartDate] = useState<Date>(CALENDAR_START);
  const [carouselNumDays, setCarouselNumDays] = useState(NUM_DAYS);

  // Generate days for the carousel based on current start date
  const days = getDays(carouselNumDays, carouselStartDate);

  // Find the index of the selected day in the carousel
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [visibleMonthYear, setVisibleMonthYear] = useState(() => {
    const d = days[0].date;
    return `${d.toLocaleString(undefined, { month: "long" })} ${d.getFullYear()}`;
  });
  const tabListRef = useRef<HTMLUListElement>(null);

  // Calendar modal state
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarIconRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setSelectedDayIdx(0);
    setSelectedTime(null);
  }, [carouselStartDate, carouselNumDays]);

  // Update visibleMonthYear when selectedDayIdx changes
  useEffect(() => {
    const d = days[selectedDayIdx].date;
    setVisibleMonthYear(`${d.toLocaleString(undefined, { month: "long" })} ${d.getFullYear()}`);
  }, [selectedDayIdx, days]);

  // Defensive: ensure selectedDayIdx is valid and days is not empty
  const safeSelectedDayIdx = Math.max(0, Math.min(selectedDayIdx, days.length - 1));
  const selectedDay = days[safeSelectedDayIdx] ?? days[0];
  const times = selectedDay ? (availableTimes[selectedDay.iso] || []) : [];

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
    const iso = date.toISOString().slice(0, 10);

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

  // Only render the calendar for the same range as the carousel
  const calendarStartMonth = new Date(days[0].date.getFullYear(), days[0].date.getMonth(), 1);
  const calendarEndMonth = new Date(days[days.length - 1].date.getFullYear(), days[days.length - 1].date.getMonth(), 1);
  calendarEndMonth.setMonth(calendarEndMonth.getMonth() + 1);

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
            onClick={() => onOpenProfessionalModal && onOpenProfessionalModal()}
          >
            {/* Profile icon on the left */}
            <span className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              <svg width="20" height="20" fill="none" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="14" stroke="#d1d5db" strokeWidth="2" fill="none"/>
                <ellipse cx="16" cy="20" rx="7" ry="5" fill="#d1d5db" />
                <circle cx="16" cy="13" r="4" fill="#d1d5db" />
              </svg>
            </span>
            {/* Text in the middle */}
            <span className="mx-auto flex items-center" style={{ whiteSpace: 'nowrap' }}>
              {professionalMode === 'perService'
                ? "Multiple professionals"
                : "Any professional"}
            </span>
            {/* Down arrow icon on the right */}
            <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              <svg width="18" height="18" fill="none" viewBox="0 0 20 20">
                <path d="M5 8l5 5 5-5" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
                    {days[selectedDayIdx].date
                      ? `Selected: ${days[selectedDayIdx].date.toLocaleDateString()}`
                      : "Pick a day."}
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
                    onClick={() => { setSelectedDayIdx(idx); setSelectedTime(null); }}
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
            {times.map((t) => (
              <button
                key={t}
                className={`px-4 py-2 rounded-full border font-medium transition-colors ${selectedTime === t ? "bg-[#141414] text-white border-[#141414]" : "bg-white text-[#141414] border-[#d1d5db] hover:border-[#33383C]"}`}
                onClick={() => setSelectedTime(t)}
              >
                {t}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 mb-8 mt-4 w-full" style={{ alignSelf: 'center' }}>
            <div className="text-lg font-semibold mt-20 text-[#141414]">Fully booked on this date</div>
            <div className="text-sm text-[#7B8487]">Available from {days.find((d, i) => (availableTimes[d.iso] || []).length > 0 && i > selectedDayIdx)?.label || "another day"}</div>
            <div className="flex gap-2 mt-2">
              <button className="px-4 py-2 rounded-full border font-medium text-[#33383C] hover:bg-gray-100" onClick={() => {
                // Go to next available date
                const nextIdx = days.findIndex((d, i) => (availableTimes[d.iso] || []).length > 0 && i > selectedDayIdx);
                if (nextIdx !== -1) setSelectedDayIdx(nextIdx);
              }}>Go to next available date</button>
              <button className="px-4 py-2 rounded-full border font-medium text-[#33383C] hover:bg-gray-100">Join waitlist</button>
            </div>
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
