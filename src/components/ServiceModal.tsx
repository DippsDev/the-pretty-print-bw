import React, { useState, useEffect } from "react";
import { Inter_Tight } from "next/font/google";

const interTight = Inter_Tight({ subsets: ["latin"], weight: "400" });

export type ServiceOption = {
  name: string;
  description?: string;
  price: string | { [time: string]: string }; // allow price per time
  duration?: string;
};

interface ServiceModalProps {
  open: boolean;
  onClose: () => void;
  service: {
    name: string;
    description?: string;
    options: ServiceOption[];
    basePrice?: string;
    baseDuration?: string;
    note?: string;
    timeOptions?: string[];
  } | null;
  onAddBooking?: (booking: {
    name: string;
    option: string;
    time: string;
    price: string;
  }) => void;
}

export default function ServiceModal({ open, onClose, service, onAddBooking }: ServiceModalProps) {
  const [selectedOption, setSelectedOption] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  useEffect(() => {
    setSelectedOption(0);
    setSelectedTime(null);
  }, [service, open]);

  if (!open || !service) return null;

  // Get time options for selected option
  const timeOptions = service.timeOptions || [];

  // Get price for selected option and time
  const option = service.options[selectedOption];
  let price = "";
  if (typeof option.price === "string") {
    price = option.price;
  } else if (selectedTime && typeof option.price === "object") {
    price = option.price[selectedTime] || Object.values(option.price)[0] || "";
  } else if (typeof option.price === "object") {
    price = Object.values(option.price)[0];
  }

  // Only enable add if both option and time are selected
  const canAdd = selectedTime && price;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ minHeight: "100dvh" }}
      onClick={onClose}
    >
      {/* Blurred, darkened background */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        style={{ zIndex: 0, pointerEvents: 'auto' }}
      />
      {/* Modal content */}
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 flex flex-col"
        style={{
          minHeight: 400,
          zIndex: 1,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className={`text-2xl font-semibold text-[#141414] ${interTight.className}`}>{service.name}</h2>
            {service.note && (
              <p className="text-sm text-[#7B8487] mt-2">{service.note}</p>
            )}
          </div>
          <button
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100"
            aria-label="Close modal"
            onClick={onClose}
            type="button"
          >
            {/* Close SVG */}
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none"><path fill="#33383C" fillRule="evenodd" d="M7.293 7.293a1 1 0 0 1 1.414 0L16 14.586l7.293-7.293a1 1 0 1 1 1.414 1.414L17.414 16l7.293 7.293a1 1 0 0 1-1.414 1.414L16 17.414l-7.293 7.293a1 1 0 0 1-1.414-1.414L14.586 16 7.293 8.707a1 1 0 0 1 0-1.414" clipRule="evenodd"></path></svg>
          </button>
        </div>
        {/* Options */}
        <div className="mt-4">
          <p className="font-semibold mb-2 text-base text-[#141414]">Select an option *</p>
          <div role="radiogroup" aria-orientation="vertical" className="flex flex-col gap-2">
            {service.options.map((opt, idx) => (
              <label key={opt.name} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="service-option"
                  checked={selectedOption === idx}
                  onChange={() => {
                    setSelectedOption(idx);
                    setSelectedTime(null);
                  }}
                  className="accent-[#33383C]"
                />
                <div className="flex flex-col">
                  <span className="font-medium text-[#141414]">{opt.name}</span>
                  {/* Price removed from here */}
                  {opt.description && <span className="text-xs text-[#7B8487]">{opt.description}</span>}
                </div>
              </label>
            ))}
          </div>
        </div>
        {/* Time selection dropdown */}
        <div className="mt-4">
          <p className="font-semibold mb-2 text-base text-[#141414]">Select time *</p>
          <div className="relative w-full max-w-xs">
            <select
              className="w-full border rounded-lg p-3 pr-10 appearance-none text-[#141414] bg-white focus:outline-none focus:ring-1 focus:ring-[#33383C]"
              value={selectedTime || ''}
              onChange={e => setSelectedTime(e.target.value)}
            >
              <option value="" disabled>Select time</option>
              {(service.timeOptions || []).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {/* Down arrow icon */}
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M5 8l5 5 5-5" stroke="#33383C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </div>
          {/* Price display below dropdown, updates with selectedTime */}
          <div className="mt-3">
            <span className="font-medium text-[#141414]">
              {price ? `${price}` : ""}
            </span>
          </div>
        </div>
        {/* Footer */}
        <div className="mt-8 flex flex-col items-center">
          {/* Remove price display from here */}
          <button
            className={`w-full py-2 rounded-full font-semibold text-base ${canAdd ? "bg-[#33383C] text-white cursor-pointer hover:bg-[#232323]" : "bg-gray-300 text-gray-600 cursor-not-allowed"}`}
            disabled={!canAdd}
            onClick={() => {
              if (canAdd && onAddBooking) {
                onAddBooking({
                  name: service.name,
                  option: option.name,
                  time: selectedTime!,
                  price,
                });
                onClose();
              }
            }}
            type="button"
          >
            Add to booking
          </button>
        </div>
      </div>
    </div>
  );
}
