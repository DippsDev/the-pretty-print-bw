"use client"

import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setCurrentPage,
  setNavbarOpen,
  toggleNavbar,
  setServiceSelection,
  clearServiceSelection,
} from '@/redux/features/navigationSlice';
import type { RootState } from '@/redux/store';
import Lottie from "lottie-react";
import menuIconAnimation from "@/animations/menu icon animation.json";
import localFont from 'next/font/local';
import { LottieRefCurrentProps } from "lottie-react";
import { Inter_Tight } from "next/font/google";

const interTight = Inter_Tight({ subsets: ["latin"], weight: "400" });

const fsBrabo = localFont({
  src: [
    {
      path: '../../src/fonts/FS Brabo Pro Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../src/fonts/FS Brabo Pro SemiBold.otf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../src/fonts/FS Brabo Pro SemiBold Italic.otf',
      weight: '600',
      style: 'italic',
    },
  ],
  variable: '--font-fsbrabo',
  display: 'swap',
});

const SERVICES = [
  {
    label: "Massages",
    right: [
      "Full Body Massage",
      "Full Body Hot Stone Massage",
      "Aroma - Therapy",
      "Swedish Massage",
      "Back Massage",
      "Head, Neck and Shoulder Massage",
    ],
    times: ["90min", "60min", "60min", "30min", "30min"], // Changed to prevent duplicate keys
  },
  {
    label: "Facial",
    right: ["Classic Facial", "Deep Cleansing Facial", "Anti-Aging Facial"],
    times: ["60 minutes", "45 minutes", "60 minutes"],
  },
  {
    label: "Half-Day Package",
    right: ["Package A", "Package B"],
    times: ["3 hours", "4 hours"],
  },
  {
    label: "Couples Treatment",
    right: ["Couples Massage", "Couples Facial"],
    times: ["90 minutes", "60 minutes"],
  },
];

// Arrow SVGs
const ArrowSvg = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width={16} height={16} fill="none" {...props}>
    <path d="M 5.801 3.801 C 5.983 3.618 6.278 3.618 6.46 3.801 L 10.217 7.559 C 10.399 7.741 10.399 8.037 10.217 8.219 L 6.46 11.977 C 6.278 12.16 5.983 12.16 5.801 11.977 C 5.618 11.795 5.618 11.499 5.801 11.317 L 9.227 7.889 L 5.801 4.461 C 5.618 4.279 5.618 3.983 5.801 3.801 Z" fill="#33383C"/>
  </svg>
);
const ArrowLeftSvg = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width={16} height={16} fill="none" style={{ transform: "rotate(180deg)" }} {...props}>
    <path d="M 5.801 3.801 C 5.983 3.618 6.278 3.618 6.46 3.801 L 10.217 7.559 C 10.399 7.741 10.399 8.037 10.217 8.219 L 6.46 11.977 C 6.278 12.16 5.983 12.16 5.801 11.977 C 5.618 11.795 5.618 11.499 5.801 11.317 L 9.227 7.889 L 5.801 4.461 C 5.618 4.279 5.618 3.983 5.801 3.801 Z" fill="#33383C"/>
  </svg>
);
const InsideArrowSvg = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width={24} height={24} fill="none" {...props}>
    <path d="M 15.129 18.131 C 14.856 18.404 14.412 18.404 14.139 18.131 L 8.503 12.495 C 8.23 12.222 8.23 11.778 8.503 11.505 L 14.139 5.869 C 14.412 5.596 14.856 5.596 15.129 5.869 C 15.402 6.142 15.402 6.586 15.129 6.859 L 9.988 12 L 15.129 17.141 C 15.402 17.414 15.402 17.858 15.129 18.131 Z" fill="#33383C"/>
  </svg>
);

const Navbar = () => {
  const isOpen = useSelector((state: RootState) => state.navigation.navbarOpen);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const dispatch = useDispatch();
  const navRef = useRef<HTMLDivElement>(null);
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  // On mount, set to hamburger (frame 0)
  React.useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.goToAndStop(0, true);
    }
  }, []);

  // Play correct segment on nav state change
  React.useEffect(() => {
    if (!lottieRef.current) return;
    lottieRef.current.setSpeed(2.2); // Fast and responsive
    if (isOpen) {
      // Hamburger to X (frames 0 to 74)
      lottieRef.current.playSegments([0, 74], true);
    } else {
      // X to Hamburger (frames 74 to 0)
      lottieRef.current.playSegments([74, 0], true);
    }
  }, [isOpen]);

  // Lottie menu icon (controlled by ref, no key, no initialSegment)
  const MenuLottieIcon = () => (
    <Lottie
      lottieRef={lottieRef}
      animationData={menuIconAnimation}
      loop={false}
      autoplay={false}
      style={{ width: 24, height: 24 }}
    />
  );

  // Remove "Home" from menuItems
  const menuItems = ['About', 'Services', 'Promotions'];

  // Handler for clicking outside nav
  React.useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        dispatch(setNavbarOpen(false));
        setServicesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, dispatch]);

  // Contact button styles
  const contactBtn =
    "w-full mt-auto py-2 px-0 rounded-sm text-center font-semibold text-[1rem] transition-all duration-200 " +
    "bg-[#C34E961A] text-[#C34E96] hover:bg-[#C34E9633] border-none outline-none";

  // Add this CSS at the top level of your component
  const styles = {
    menuTransform: "cubic-bezier(0.4, 0, 0.2, 1)",
    revealTransform: "cubic-bezier(0.2, 0, 0, 1)",
    hoverTransition: "color 150ms cubic-bezier(0.4, 0, 0.2, 1)",
  };

  // Responsive width for nav: wider when servicesOpen
  // Adjust for mobile/tablet
  const navWidth = servicesOpen
    ? "min(90vw, 540px)"
    : "min(60vw, 320px)";

  // Responsive: adjust width for mobile/tablet
  const getNavWidth = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 640) return servicesOpen ? "90vw" : "80vw";
      if (window.innerWidth < 1024) return servicesOpen ? "70vw" : "50vw";
    }
    return navWidth;
  };

  // Reset selection when closing services panel
  React.useEffect(() => {
    if (!servicesOpen) {
      setSelectedService(null);
      setSelectedPackage(null);
      setSelectedTime(null);
      dispatch(clearServiceSelection());
    }
  }, [servicesOpen, dispatch]);

  // When all selections are made, go to services page and store selection
  React.useEffect(() => {
    if (
      servicesOpen &&
      selectedService !== null &&
      selectedPackage !== null &&
      selectedTime !== null
    ) {
      dispatch(
        setServiceSelection({
          service: SERVICES[selectedService].label,
          pkg: SERVICES[selectedService].right[selectedPackage],
          time: SERVICES[selectedService].times[selectedTime],
        })
      );
      dispatch(setCurrentPage("services"));
      dispatch(setNavbarOpen(false));
      setServicesOpen(false);
    }
  }, [servicesOpen, selectedService, selectedPackage, selectedTime, dispatch]);

  // Show first service by default when opening services panel
  React.useEffect(() => {
    if (servicesOpen && selectedService === null) {
      setSelectedService(0);
      setSelectedPackage(null);
      setSelectedTime(null);
    }
  }, [servicesOpen, selectedService]);

  return (
    <>
      {/* Menu icon: Lottie animation */}
      <button
        onClick={() => {
          if (isOpen) {
            dispatch(setNavbarOpen(false));
            setServicesOpen(false);
          } else {
            dispatch(toggleNavbar());
            setServicesOpen(false);
          }
        }}
        className="fixed top-6 left-6 z-[91] p-0 m-0 bg-transparent border-none outline-none w-6 h-6"
        aria-label="Open navigation"
        style={{ background: "none", boxShadow: "none" }}
      >
        <MenuLottieIcon />
      </button>
      {/* Divider below menu icon */}
      <div
        className={`fixed left-6 z-[91] top-[56px] h-[1px] bg-white/60
          transition-all duration-500 ease-[cubic-bezier(.4,0,.2,1)] ${isOpen ? "opacity-100" : "opacity-0"}
        `}
        style={{
          pointerEvents: "none",
          marginLeft: "0.25rem",
          width: `calc(${getNavWidth()} - 1.5rem)`,
          maxWidth: "calc(100vw - 2rem)",
        }}
      />

      {/* Sliding navbar panel */}
      <nav
        ref={navRef}
        className={`fixed top-0 py-2 left-0 z-[90] h-full
          transition-all duration-500 ease-[cubic-bezier(.4,0,.2,1)]
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          overflow-hidden
          ${fsBrabo.className} ${interTight.className}
        `}
        style={{
          width: isOpen ? getNavWidth() : 0,
          minWidth: isOpen ? (servicesOpen ? "220px" : "160px") : 0,
          maxWidth: "100vw",
          marginLeft: isOpen ? "max(env(safe-area-inset-left, 0px), 0.5rem)" : 0,
        }}
      >
        <div className={`h-full w-full py-2 px-2 sm:px-2 bg-white/90 shadow-xl rounded-md flex flex-col items-start
          transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)] backdrop-blur-[4px] relative overflow-hidden`}>
          <div className="mt-16 w-full flex-1 flex flex-col relative">
            {/* Main menu */}
            <div className={`w-full absolute inset-0 transition-opacity duration-300 ease-[cubic-bezier(.4,0,.2,1)]
              ${servicesOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
              {menuItems.map((item) => (
                <div key={item} className="mb-3 flex items-center">
                  <button
                    onMouseEnter={() => setHoveredItem(item)}
                    onMouseLeave={() => setHoveredItem(null)}
                    onClick={() => {
                      if (item === 'Services') {
                        setServicesOpen(true);
                      } else {
                        dispatch(setCurrentPage(item.toLowerCase()));
                        dispatch(setNavbarOpen(false));
                      }
                    }}
                    className={`menu-item ml-4 text-sm font-medium flex items-center gap-2 ${
                      hoveredItem && hoveredItem !== item
                        ? 'text-[#33383C]/50'
                        : 'text-[#33383C]'
                    } ${interTight.className}`}
                    style={{ letterSpacing: "0.01em", width: "100%", justifyContent: "space-between" }}
                  >
                    <span>{item}</span>
                    {/* Only show arrow for Services */}
                    {item === "Services" && (
                      <span className="flex items-center ml-auto">
                        <ArrowSvg
                          width={16}
                          height={16}
                          style={{
                            opacity: 1,
                            color: "#33383C",
                            transition: "opacity 0.2s",
                            transform: servicesOpen ? "rotate(180deg)" : "none"
                          }}
                        />
                      </span>
                    )}
                  </button>
                </div>
              ))}
            </div>
            {/* Services menu */} 
            {servicesOpen && (
              <div className={`w-full transition-all duration-500 ease-[cubic-bezier(.4,0,.2,1)]
                absolute top-0 left-0 overflow-hidden
                opacity-100 translate-x-0`}
                style={{
                  visibility: 'visible',
                  transitionProperty: 'transform, opacity',
                }}
              >
                <div className="flex flex-row gap-4">
                  {/* First column: Service */}
                  <div className="flex flex-col min-w-[200px] max-w-[180px] flex-shrink-0">
                    <button
                      onClick={() => setServicesOpen(false)}
                      className={`flex items-center gap-2 text-sm font-medium text-[#7B8487] hover:text-[#33383C] mb-2 ${interTight.className}`}
                      style={{ transition: styles.hoverTransition }}
                    >
                      <span className="flex items-center">
                        <ArrowLeftSvg
                          width={16}
                          height={16}
                          style={{
                            opacity: 1,
                            color: "#33383C",
                            transition: "opacity 0.2s"
                          }}
                        />
                      </span>
                      <span>Services</span>
                    </button>
                    <div className="w-full h-[1px] bg-gray-200 mb-2" />
                    {SERVICES.map((s, idx) => (
                      <button
                        key={s.label}
                        onClick={() => {
                          setSelectedService(idx);
                          setSelectedPackage(null);
                          setSelectedTime(null);
                        }}
                        className={`flex justify-between items-center w-full text-sm font-medium py-1 px-2 rounded
                          ${selectedService === idx ? "text-[#33383C]" : "text-[#33383C]/50"} ${interTight.className}`}
                        style={{ 
                          transition: "background-color 150ms ease-in-out, color 150ms ease-in-out",
                        }}
                      >
                        <span>{s.label}</span>
                        <span className="flex items-center ml-auto">
                          <InsideArrowSvg
                            width={24}
                            height={24}
                            style={{
                              opacity: selectedService === idx ? 1 : 0.5,
                              color: "#33383C",
                              transition: "opacity 0.2s"
                            }}
                          />
                        </span>
                      </button>
                    ))}
                  </div>
                  {/* Second column: Package */}
                  <div className="flex flex-col min-w-[180px] max-w-[180px] flex-shrink-0">
                    {selectedService !== null
                      ? SERVICES[selectedService].right.map((item, i) => (
                          <button
                            key={item}
                            onClick={() => {
                              setSelectedPackage(i);
                              setSelectedTime(null);
                            }}
                            className={`flex justify-between items-center w-full text-sm font-normal py-1 px-2 rounded
                              ${selectedPackage === i ? "text-[#33383C]" : "text-[#33383C]/50"} ${interTight.className}`}
                            style={{
                              transition: "background-color 150ms ease-in-out, color 150ms ease-in-out",
                            }}
                          >
                            <span>{item}</span>
                          </button>
                        ))
                      : SERVICES[0].right.map((item, i) => (
                          <button
                            key={item}
                            onClick={() => {
                              setSelectedService(0);
                              setSelectedPackage(i);
                              setSelectedTime(null);
                            }}
                            className={`flex justify-between items-center w-full text-sm font-normal py-1 px-2 rounded text-[#33383C]/50 ${interTight.className}`}
                            style={{
                              transition: "background-color 150ms ease-in-out, color 150ms ease-in-out",
                            }}
                          >
                            <span>{item}</span>
                          </button>
                        ))}
                  </div>
                  {/* Third column: Time */}
                  <div className="flex flex-col min-w-[100px] max-w-[120px] flex-shrink-0">
                    {selectedService !== null && selectedPackage !== null
                      ? SERVICES[selectedService].times.map((time, i) => (
                          <button
                            key={`${time}-${i}`}
                            onClick={() => setSelectedTime(i)}
                            className={`flex justify-between items-center w-full text-xs font-normal py-1 px-2 rounded
                              ${selectedTime === i ? "text-[#33383C]" : "text-[#33383C]/50"} ${interTight.className}`}
                            style={{
                              transition: "background-color 150ms ease-in-out, color 150ms ease-in-out",
                            }}
                          >
                            <span>{time}</span>
                          </button>
                        ))
                      : SERVICES[0].times.map((time, i) => (
                          <button
                            key={`${time}-${i}`}
                            onClick={() => {
                              setSelectedService(0);
                              setSelectedPackage(null);
                              setSelectedTime(i);
                            }}
                            className={`flex justify-between items-center w-full text-xs font-normal py-1 px-2 rounded text-[#33383C]/50 ${interTight.className}`}
                            style={{
                              transition: "background-color 150ms ease-in-out, color 150ms ease-in-out",
                            }}
                          >
                            <span>{time}</span>
                          </button>
                        ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Contact button with fade animation */}
          <div className={`w-full transition-opacity duration-300 ease-[cubic-bezier(.4,0,.2,1)] ${servicesOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
            <button
              onClick={() => dispatch(setCurrentPage("contact"))}
              className={contactBtn}
              style={{ opacity: isOpen ? 1 : 0 }}
            >
              Contact
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;