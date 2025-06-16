"use client"

import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentPage, setNavbarOpen, toggleNavbar } from '@/redux/features/navigationSlice';
import type { RootState } from '@/redux/store';
import Lottie from "lottie-react";
import menuIconAnimation from "@/animations/menu icon animation.json";
import localFont from 'next/font/local';
import { LottieRefCurrentProps } from "lottie-react";

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

const Navbar = () => {
  const isOpen = useSelector((state: RootState) => state.navigation.navbarOpen);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(0);
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

  const menuItems = ['Home', 'About', 'Services', 'Promotions'];

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
    "w-full mt-auto py-1 px-0 rounded-sm text-center font-semibold text-[1rem] transition-all duration-200 " +
    "bg-gradient-to-r from-[#b92bff99] to-[#ff2b7c99] text-[#b92bff] hover:bg-gradient-to-r hover:from-[#b92bffcc] hover:to-[#ff2b7ccc] " +
    "backdrop-blur-[2px] border-none outline-none";

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
          ${fsBrabo.className}
        `}
        style={{
          width: isOpen ? getNavWidth() : 0,
          minWidth: isOpen ? (servicesOpen ? "220px" : "160px") : 0,
          maxWidth: "100vw",
          marginLeft: isOpen ? "max(env(safe-area-inset-left, 0px), 0.5rem)" : 0,
        }}
      >
        <div className="h-full w-full py-2 px-2 sm:px-2 bg-white/90 shadow-xl rounded-md flex flex-col items-start
          transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)] backdrop-blur-[4px] relative overflow-hidden">
          
          <div className="mt-16 w-full flex-1 flex flex-col relative">
            {/* Main menu - simplified animation */}
            <div className={`w-full absolute inset-0 transition-opacity duration-300 ease-[cubic-bezier(.4,0,.2,1)]
              ${servicesOpen ? "opacity-0 pointer-events-none" : "opacity-100"}
            `}>
              {menuItems.map((item) => (
                <div key={item} className="mb-3">
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
                    className={`menu-item ml-4 text-sm font-medium ${
                      hoveredItem && hoveredItem !== item
                        ? 'text-gray-400'
                        : 'text-black'
                    }`}
                    style={{ letterSpacing: "0.01em" }}
                  >
                    {item}
                  </button>
                </div>
              ))}
            </div>

            {/* Services menu - keeping staggered animations only for services content */}
            <div 
              className={`w-full transition-all duration-500 ease-[cubic-bezier(.4,0,.2,1)]
                absolute top-0 left-0 overflow-hidden
                ${servicesOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full"}
              `}
              style={{
                visibility: servicesOpen ? 'visible' : 'hidden',
                transitionProperty: 'transform, opacity',
              }}
            >
              <div className="flex flex-row gap-4">
                {/* First column */}
                <div className="flex flex-col min-w-[200px] max-w-[180px] flex-shrink-0">
                  <button
                    onClick={() => setServicesOpen(false)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black mb-2"
                    style={{ transition: styles.hoverTransition }}
                  >
                    <span className="text-xl">&lt;</span> Services
                  </button>
                  <div className="w-full h-[1px] bg-gray-200 mb-2" />
                  {SERVICES.map((s, idx) => (
                    <button
                      key={s.label}
                      onClick={() => setSelectedService(idx)}
                      className={`flex justify-between items-center w-full text-sm font-medium py-1 px-2 rounded
                        ${selectedService === idx ? "bg-gray-100 text-black" : "text-black hover:bg-gray-50"}
                      `}
                      style={{ 
                        transition: "background-color 150ms ease-in-out, color 150ms ease-in-out",
                      }}
                    >
                      <span>{s.label}</span>
                      <span className="text-xl text-gray-400">{'>'}</span>
                    </button>
                  ))}
                </div>

                {/* Service columns wrapper */}
                <div className={`flex flex-row gap-4 transition-all duration-300
                  ${servicesOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-[20px]"}
                `}>
                  {/* Second column */}
                  <div className="flex flex-col min-w-[180px] max-w-[180px] flex-shrink-0">
                    {SERVICES[selectedService].right.map((item, i) => (
                      <div
                        key={item}
                        className="text-sm font-normal text-black py-1 px-2 rounded hover:bg-gray-50/80"
                        style={{ 
                          transition: "background-color 150ms ease-in-out",
                          transitionDelay: `${50 + (i * 25)}ms`,
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>

                  {/* Third column */}
                  <div className="flex flex-col min-w-[80px] max-w-[100px] flex-shrink-0">
                    {SERVICES[selectedService].times.map((time, i) => (
                      <div
                        key={`${time}-${i}`}
                        className="text-xs font-normal text-gray-600 py-1 px-2 rounded hover:bg-gray-50/80"
                        style={{ 
                          transition: "background-color 150ms ease-in-out",
                          transitionDelay: `${75 + (i * 25)}ms`,
                        }}
                      >
                        {time}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact button with fade animation */}
          <div className={`w-full transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)]
            ${servicesOpen ? "opacity-0 translate-y-4 pointer-events-none" : "opacity-100 translate-y-0"}
          `}>
            <button
              className={contactBtn}
              style={{
                color: "#b92bff",
                background: "linear-gradient(90deg,rgba(255, 119, 237, 0.8),rgba(224, 55, 173, 0.8))",
                border: "none",
                opacity: 0.85,
                boxShadow: "0 2px 12px 0 rgba(185,43,255,0.08)",
              }}
              onClick={() => {
                dispatch(setCurrentPage("contact"));
                dispatch(setNavbarOpen(false));
                setServicesOpen(false);
              }}
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