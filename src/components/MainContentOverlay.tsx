"use client";

import React from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/redux/store";
import { setNavbarOpen } from "@/redux/features/navigationSlice";

export default function MainContentOverlay({ children }: { children: React.ReactNode }) {
  const navbarOpen = useSelector((state: RootState) => state.navigation.navbarOpen);
  const dispatch = useDispatch();

  return (
    <>
      {/* Blur/dark overlay on everything except the navbar and bird */}
      <div
        className={`fixed inset-0 z-[89] pointer-events-none transition-all duration-500 ease-[cubic-bezier(.4,0,.2,1)] ${
          navbarOpen
            ? "backdrop-blur-[4px] bg-black/10 opacity-100 pointer-events-auto"
            : "backdrop-blur-0 bg-black/0 opacity-0"
        }`}
        onClick={navbarOpen ? () => dispatch(setNavbarOpen(false)) : undefined}
        aria-hidden="true"
      />
      {/* Main content, always visible, but under the overlay */}
      <div className="relative z-0">{children}</div>
    </>
  );
}
