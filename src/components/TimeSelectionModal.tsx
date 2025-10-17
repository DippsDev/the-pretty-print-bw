import React, { useState, useEffect, useRef } from "react";
import { Inter_Tight } from "next/font/google";

const interTight = Inter_Tight({ subsets: ["latin"], weight: "400" });

// Helper to get days for the next N days
function getDays(numDays = 30) {
  const days = [];
  const today = new Date();
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

interface TimeSelectionModalProps {
  onBack: () => void;
  onContinue: (selected: { date: string; time: string }) => void;
  availableTimes?: { [isoDate: string]: string[] };
}

const TimeSelectionModal: React.FC<TimeSelectionModalProps> = ({
  onBack,
  onContinue,
  availableTimes = {},
}) => {
  const days = getDays(30);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const tabListRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    setSelectedDayIdx(0);
    setSelectedTime(null);
  }, []);

  const selectedDay = days[selectedDayIdx];
  const times = availableTimes[selectedDay.iso] || [];

  // Scroll to selected day in carousel
  useEffect(() => {
    if (tabListRef.current) {
      const tab = tabListRef.current.children[selectedDayIdx] as HTMLElement;
      if (tab) {
        tab.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [selectedDayIdx]);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex flex-col w-full max-w-2xl bg-white rounded-2xl shadow-none p-0 mx-0 " style={{ minHeight: 0, flex: 1 }}>
        {/* Days carousel */}
        <div className="mb-6 w-full px-0 overflow-x-auto scrollbar-hide" style={{ maxWidth: '100%' }}>
          <ul
            ref={tabListRef}
            className="flex gap-2 flex-1 w-full px-0"
            style={{ scrollBehavior: "smooth", minWidth: 0 }}
          >
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
            <img src="/calendar-illustration.png" alt="Not available" className="w-16 h-16 opacity-80" />
            <div className="text-lg font-semibold text-[#141414]">Fully booked on this date</div>
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
          <button
            className={`ml-auto px-4 py-2 rounded-full font-semibold text-base ${selectedTime ? "bg-[#33383C] text-white cursor-pointer hover:bg-[#232323]" : "bg-gray-300 text-gray-600 cursor-not-allowed"}`}
            disabled={!selectedTime}
            onClick={() => {
              if (selectedTime) {
                onContinue({ date: selectedDay.iso, time: selectedTime });
              }
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeSelectionModal;
