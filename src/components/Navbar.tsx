"use client"

import React, { useRef } from 'react';
import { Menu } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentPage, setNavbarOpen, toggleNavbar } from '@/redux/features/navigationSlice';
import type { RootState } from '@/redux/store';

const Navbar = () => {
  const isOpen = useSelector((state: RootState) => state.navigation.navbarOpen);
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
  const [servicesOpen, setServicesOpen] = React.useState(false);
  const dispatch = useDispatch();
  const navRef = useRef<HTMLDivElement>(null);

  const menuItems = ['Home', 'About', 'Services', 'Contact'];
  const serviceItems = ['Service 1', 'Service 2', 'Service 3'];

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

  return (
    <>
      {/* Menu icon: just lines, no background, always on top */}
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
        className="fixed top-6 left-6 z-[91] p-0 m-0 bg-transparent border-none outline-none"
        aria-label="Open navigation"
        style={{ background: "none", boxShadow: "none" }}
      >
        <Menu size={32} strokeWidth={1.5} className="text-black" />
      </button>

      {/* Sliding navbar panel */}
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 z-[90] h-full py-2 transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{
          width: "min(60vw, 200px)",
          marginLeft: "max(env(safe-area-inset-left, 0px), 0.5rem)", // prevent cut-off
        }}
        aria-modal={isOpen}
        aria-hidden={!isOpen}
      >
        <div className="h-full w-full p-6 sm:p-8 bg-white/90 shadow-xl rounded-r-md flex flex-col items-start
          mt-0 mb-0 sm:mb-8 ml-0
          transition-all duration-300
          backdrop-blur-[4px]
          ">
          <div className="mt-20 w-full">
            {/* If servicesOpen, only show services */}
            {servicesOpen ? (
              <div className="w-full flex flex-col items-start gap-4 transition-all duration-300">
                <button
                  onClick={() => setServicesOpen(false)}
                  className="text-base mb-6 text-gray-500 hover:text-black transition"
                >
                  ← Back
                </button>
                {serviceItems.map((service) => (
                  <button
                    key={service}
                    onClick={() => {
                      dispatch(setCurrentPage(service.toLowerCase()));
                      dispatch(setNavbarOpen(false));
                      setServicesOpen(false);
                    }}
                    className="menu-item text-2xl font-semibold text-black hover:scale-105 transition-all duration-200"
                  >
                    {service}
                  </button>
                ))}
              </div>
            ) : (
              menuItems.map((item) => (
                <div key={item} className="mb-4">
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
                    className={`menu-item text-2xl font-semibold transition-all duration-200 ${
                      hoveredItem && hoveredItem !== item
                        ? 'text-gray-400'
                        : 'text-black'
                    }`}
                  >
                    {item}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
