import React, { useState, useEffect } from "react";
import { Inter_Tight } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";

const interTight = Inter_Tight({ subsets: ["latin"], weight: "400" });

export type ServiceOption = {
  name: string;
  description?: string;
  price: string | { [time: string]: string } | Array<{ label: string; value: string; slug?: string }>;
  duration?: string;
  slug?: string;
  packages?: {
    name: string;
    description?: string;
    price: string;
  }[];
};

interface ServiceModalProps {
  open: boolean;
  onClose: () => void;
  service: {
    name: string;
    slug?: string;
    description?: string;
    options: ServiceOption[];
    basePrice?: string;
    baseDuration?: string;
    note?: string;
    timeOptions?: string[];
    durationMinutes?: number;
    packages?: {
      name: string;
      description?: string;
      price: string;
    }[];
  } | null;
  onAddBooking?: (booking: {
    name: string;
    option: string;
    time: string;
    price: string;
    metadata?: {
      serviceSlug?: string;
      durationMinutes?: number;
    };
  }) => void;
}

export default function ServiceModal({ open, onClose, service, onAddBooking }: ServiceModalProps) {
  if (!open || !service) return null;
  const isPackageGroup = Array.isArray(service.options) && service.options.length === 1 && Array.isArray(service.options[0].price);
  const [selectedOption, setSelectedOption] = useState(0);

  useEffect(() => {
    setSelectedOption(0);
  }, [service, open]);

  let option = service.options[0];
  let price = "";
  let priceOptions: Array<{ label: string; value: string; slug?: string }> = [];
  const timeOptions = service.timeOptions || [];
  const showTime = timeOptions.length === 1;
  const timeText = showTime ? timeOptions[0] : "";

  if (isPackageGroup && Array.isArray(option.price)) {
    priceOptions = option.price;
    price = priceOptions[selectedOption]?.value || priceOptions[0]?.value || "";
  } else {
    option = service.options[selectedOption];
    if (Array.isArray(option.price)) {
      priceOptions = option.price;
      price = priceOptions[selectedOption]?.value || priceOptions[0]?.value || "";
    } else if (typeof option.price === "string") {
      price = option.price;
    } else if (showTime && typeof option.price === "object") {
      price = option.price[timeText] || Object.values(option.price)[0] || "";
    } else if (typeof option.price === "object") {
      price = Object.values(option.price)[0];
    }
  }
  const canAdd = !!price;

  return (
    <AnimatePresence>
      {open && service && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ minHeight: "100dvh" }}>
          {/* Overlay */}
          <motion.div
            key="service-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "linear" }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            style={{ zIndex: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            key="service-modal-content"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 sm:p-8 flex flex-col min-h-0"
            style={{
              height: 'auto',
              zIndex: 1,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className={`text-xl sm:text-2xl font-semibold text-[#141414] ${interTight.className}`}>{service.name}</h2>
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
                <svg width="24" height="24" viewBox="0 0 32 32" fill="none"><path fill="#33383C" fillRule="evenodd" d="M7.293 7.293a1 1 0 0 1 1.414 0L16 14.586l7.293-7.293a1 1 0 1 1 1.414 1.414L17.414 16l7.293 7.293a1 1 0 0 1-1.414 1.414L16 17.414l-7.293 7.293a1 1 0 0 1-1.414-1.414L14.586 16 7.293 8.707a1 1 0 0 1 0-1.414" clipRule="evenodd"></path></svg>
              </button>
            </div>
            {isPackageGroup && priceOptions.length > 1 ? (
              <div className="mt-3 sm:mt-4">
                <p className="font-semibold mb-2 text-sm sm:text-base text-[#141414]">Select an option *</p>
                <div role="radiogroup" aria-orientation="vertical" className="flex flex-col gap-2">
                  {priceOptions.map((opt, idx) => (
                    <label key={opt.label} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="service-price-option"
                        checked={selectedOption === idx}
                        onChange={() => setSelectedOption(idx)}
                        className="accent-[#33383C]"
                      />
                      <div className="flex flex-col">
                        <span className="font-medium text-[#141414]">{opt.label}</span>
                        <span className="text-xs text-[#232323]">{opt.value}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
            {option.packages && option.packages.length > 0 && (
              <div className="mt-3 sm:mt-4">
                <div className="text-xs font-semibold text-[#232323] mb-1">Includes:</div>
                <ul className="flex flex-col gap-1">
                  {option.packages.map((pkg, idx) => (
                    <li key={pkg.name + idx} className="flex flex-row items-center gap-2">
                      <span className="font-medium text-sm text-[#141414]">{pkg.name}</span>
                      {pkg.description && <span className="text-xs text-[#7B8487]">{pkg.description}</span>}
                      <span className="text-xs text-[#232323]">{pkg.price}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {showTime && (
              <div className="mt-3 sm:mt-4">
                <span className="font-medium text-[#141414] text-sm sm:text-base">Time: {timeText}</span>
              </div>
            )}
            <div className="mt-2 sm:mt-3">
              <span className="font-medium text-[#141414] text-base sm:text-lg">
                {price ? `${price}` : ""}
              </span>
            </div>
            <div className="mt-6 sm:mt-8 flex flex-col items-center">
              <button
                className={`w-full py-2 rounded-full font-semibold text-sm sm:text-base ${canAdd ? "bg-[#33383C] text-white cursor-pointer hover:bg-[#232323]" : "bg-gray-300 text-gray-600 cursor-not-allowed"}`}
                disabled={!canAdd}
                onClick={() => {
                  if (canAdd && onAddBooking) {
                    let bookingPrice = price;
                    let bookingOption = option.name;
                    let bookingName = service.name;
                    if (isPackageGroup && priceOptions.length > 0) {
                      // Always use the selected price option for package group
                      bookingPrice = priceOptions[selectedOption]?.value || priceOptions[0]?.value || "";
                      bookingOption = priceOptions[selectedOption]?.label || option.name;
                      bookingName = `${service.name} - ${bookingOption}`;
                    } else if (service.options.length > 1) {
                      bookingPrice = typeof option.price === "string"
                        ? option.price
                        : Array.isArray(option.price)
                          ? (option.price[selectedOption]?.value || option.price[0]?.value || "")
                          : typeof option.price === "object" && showTime
                            ? (option.price[timeText] || Object.values(option.price)[0] || "")
                            : typeof option.price === "object"
                              ? Object.values(option.price)[0]
                              : "";
                      bookingOption = option.name;
                      bookingName = service.name;
                    }
                    onAddBooking({
                      name: bookingName,
                      option: bookingOption,
                      time: timeText,
                      price: bookingPrice,
                      metadata: {
                        serviceSlug: isPackageGroup
                          ? priceOptions[selectedOption]?.slug || priceOptions[0]?.slug || service.slug || option.slug
                          : service.slug || option.slug,
                        durationMinutes: service.durationMinutes,
                      },
                    });
                    onClose();
                  }
                }}
                type="button"
              >
                Add to booking
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
