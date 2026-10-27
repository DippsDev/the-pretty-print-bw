"use client"

import React, { useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import {
  setNavbarOpen,
  setServicesPanelOpen,
  setServiceSelection,
  clearServiceSelection,
} from '@/redux/features/navigationSlice';
import type { RootState } from '@/redux/store';
import Lottie from "lottie-react";
import menuIconAnimation from "@/animations/menu icon animation.json";
import localFont from 'next/font/local';
import { LottieRefCurrentProps } from "lottie-react";
import { Inter_Tight } from "next/font/google";
import { SERVICES } from "@/lib/servicesData";

const interTight = Inter_Tight({ subsets: ["latin"], weight: "400" });

function MenuLottieIcon({ lottieRef }: { lottieRef: React.RefObject<LottieRefCurrentProps | null> }) {
  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={menuIconAnimation}
      loop={false}
      autoplay={false}
      className="w-6 h-6"
    />
  );
}

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

// Arrow SVGs
const ArrowLeftSvg = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width={16} height={16} fill="none" className="rotate-180" {...props}>
    <path d="M 5.801 3.801 C 5.983 3.618 6.278 3.618 6.46 3.801 L 10.217 7.559 C 10.399 7.741 10.399 8.037 10.217 8.219 L 6.46 11.977 C 6.278 12.16 5.983 12.16 5.801 11.977 C 5.618 11.795 5.618 11.499 5.801 11.317 L 9.227 7.889 L 5.801 4.461 C 5.618 4.279 5.618 3.983 5.801 3.801 Z" fill="#33383C"/>
  </svg>
);
const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const isOpen = useSelector((state: RootState) => state.navigation.navbarOpen);
  const servicesOpen = useSelector((state: RootState) => state.navigation.servicesPanelOpen);
  const setServicesOpen = (open: boolean) => dispatch(setServicesPanelOpen(open));
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
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
    lottieRef.current.setSpeed(2.2);
    if (isOpen) {
      lottieRef.current.playSegments([0, 74], true);
    } else {
      lottieRef.current.playSegments([74, 0], true);
    }
  }, [isOpen]);

  const [menuServices, setMenuServices] = React.useState(SERVICES);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/catalog")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && Array.isArray(data?.groups) && data.groups.length) {
          setMenuServices(data.groups);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  // Handler for clicking outside nav
  React.useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuButtonRef.current?.contains(target)) return;
      if (navRef.current && !navRef.current.contains(target)) {
        dispatch(setNavbarOpen(false));
        setServicesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, dispatch]);

  // Responsive width for nav: wider when servicesOpen
  // Use a state variable for navWidth to avoid SSR mismatch
  const [navWidth, setNavWidth] = React.useState<string>("min(60vw, 220px)");

  React.useEffect(() => {
    function updateWidth() {
      if (typeof window === "undefined") return;
      const width = window.innerWidth;
      // Two columns need ~460px. Tablet (including iPad portrait and landscape)
      // was capped at 40vw / 400px, which clipped the package list.
      if (width < 640) setNavWidth(servicesOpen ? "92vw" : "80vw");
      else if (width < 1280) setNavWidth(servicesOpen ? "min(92vw, 560px)" : "min(60vw, 240px)");
      else setNavWidth(servicesOpen ? "min(70vw, 560px)" : "min(60vw, 220px)");
    }
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [servicesOpen]);

  // Reset selection when closing services panel
  React.useEffect(() => {
    if (!servicesOpen) {
      setSelectedService(null);
      setSelectedPackage(null);
      dispatch(clearServiceSelection());
    }
  }, [servicesOpen, dispatch]);

  React.useEffect(() => {
    if (
      servicesOpen &&
      selectedService !== null &&
      selectedPackage !== null
    ) {
      const group = menuServices[selectedService];
      if (!group) return;
      dispatch(
        setServiceSelection({
          service: group.label,
          pkg: group.services[selectedPackage],
        } as any)
      );
      router.push('/book');
      dispatch(setNavbarOpen(false));
      setServicesOpen(false);
    }
  }, [servicesOpen, selectedService, selectedPackage, dispatch, router, menuServices]);

  // Show first service by default when opening services panel
  React.useEffect(() => {
    if (servicesOpen && selectedService === null) {
      setSelectedService(0);
      setSelectedPackage(null);
    }
  }, [servicesOpen, selectedService]);

  React.useEffect(() => {
    if (!isOpen && servicesOpen) {
      setServicesOpen(false);
    }
  }, [isOpen, servicesOpen, dispatch]);

  const hideHomeTrigger = pathname === "/" || pathname === "/admin";

  if (pathname === "/book" || pathname.startsWith("/book/") || pathname === "/contact") return null;

  return (
    <>
      {/* Menu icon: Lottie animation */}
      {!hideHomeTrigger && <button
        ref={menuButtonRef}
        onClick={() => {
          if (isOpen) {
            dispatch(setNavbarOpen(false));
            setServicesOpen(false);
          } else {
            dispatch(setNavbarOpen(true));
            setServicesOpen(true);
          }
        }}
        className={`menu-button fixed top-6 left-4 sm:left-6 z-[91] m-0 h-6 w-6 border-none bg-transparent p-0 outline-none ${
          isOpen ? "" : "menu-invite"
        }`}
        aria-label={isOpen ? "Close navigation" : "Open navigation"}
      >
        <span className="menu-invite-ring" aria-hidden="true" />
        <span className={`menu-invite-label ${interTight.className}`} aria-hidden="true">
          Menu
        </span>
        <MenuLottieIcon lottieRef={lottieRef} />
      </button>}
      {!hideHomeTrigger && <div
        className={`fixed left-4 sm:left-6 z-[91] top-[56px] h-[1px] bg-white/60
          transition-all duration-500 ease-in-out ${isOpen ? "opacity-100" : "opacity-0"}
          pointer-events-none ml-1`}
        style={{
          width: `calc(${navWidth} - 1.5rem)`,
        }}
      />}

      {/* Sliding navbar panel */}
      <nav
        ref={navRef}
        className={`fixed top-0 py-2 left-0 z-[90] h-full
          transition-all duration-500 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          overflow-hidden
          ${fsBrabo.className} ${interTight.className}
        `}
        style={{
          width: isOpen ? navWidth : 0,
          minWidth: isOpen ? (servicesOpen ? "220px" : "160px") : 0,
          marginLeft: isOpen ? "max(env(safe-area-inset-left, 0px), 0.5rem)" : 0,
        }}
      >
        <div className={`h-full w-full py-2 px-2 sm:px-2 bg-white/90 shadow-xl rounded-md flex flex-col items-start
          transition-all duration-300 ease-in-out backdrop-blur-[4px] relative overflow-hidden`}>
          <div className="mt-16 w-full flex-1 flex flex-col relative">
            {servicesOpen && (
              <div className={`w-full transition-all duration-500 ease-in-out
                absolute inset-0 overflow-x-hidden overflow-y-auto
                opacity-100 translate-x-0`}
              >
                <div className="flex flex-row gap-4">
                  {/* First column: Service */}
                  <div className="flex min-w-0 flex-1 flex-col basis-0">
                    <button
                      onClick={() => {
                        dispatch(setNavbarOpen(false));
                        setServicesOpen(false);
                      }}
                      className={`flex items-end gap-2 text-sm font-medium text-[#7B8487] hover:text-[#33383C] mb-2 ${interTight.className} transition-colors duration-150`}
                    >
                      <span className="flex items-center">
                        <ArrowLeftSvg
                          width={12}
                          height={12}
                          className="opacity-100 text-[#33383C] transition-opacity rotate-180 duration-200"
                        />
                      </span>
                      <span>Services</span>
                    </button>
                    <div className="w-full h-[1px] bg-gray-200 mb-2" />
                    {menuServices.map((s, idx) => (
                      <button
                        key={s.label}
                        onClick={() => {
                          if (s.prices) {
                            dispatch(
                              setServiceSelection({
                                service: s.label,
                                pkg: undefined,
                                time: undefined,
                              } as any)
                            );
                            router.push('/book');
                            dispatch(setNavbarOpen(false));
                            setServicesOpen(false);
                          } else {
                            setSelectedService(idx);
                            setSelectedPackage(null);
                          }
                        }}
                        className={`flex w-full items-center justify-between break-words rounded px-2 py-1 text-left text-sm font-medium
                          transition-colors duration-150
                          ${selectedService === idx ? "text-[#33383C]" : "text-[#33383C]/50"} ${interTight.className}`}
                      >
                        <span>{s.label}</span>
                        <span className="flex items-center ml-auto"></span>
                      </button>
                    ))}
                  </div>
                  {/* Second column: Packages */}
                  {selectedService !== null && menuServices[selectedService] && !menuServices[selectedService].prices && (
                    <div className="flex min-w-0 flex-[1.15] flex-col basis-0">
                      {menuServices[selectedService].services.map((item: any, i: number) => (
                        <button
                          key={item.name}
                          onClick={() => {
                            setSelectedPackage(i);
                          }}
                          className={`flex w-full flex-col items-start break-words rounded px-2 py-1 text-left text-sm font-normal
                            transition-colors duration-150
                            ${selectedPackage === i ? "text-[#33383C]" : "text-[#33383C]/50"} ${interTight.className}`}
                        >
                          <span className="text-left w-full font-medium">{item.name}</span>
                          {item.description && (
                            <span className="text-xs text-[#7B8487]">{item.description}</span>
                          )}
                          {/* Price removed from nav */}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Removed third column: Time */}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;