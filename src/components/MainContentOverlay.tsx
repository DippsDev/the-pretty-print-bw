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
      {navbarOpen && (
        <div
          className="fixed inset-0 z-[89] backdrop-blur-[4px] bg-black/10 transition-all duration-300"
          onClick={() => dispatch(setNavbarOpen(false))}
          aria-hidden="true"
        />
      )}
      {/* Main content, always visible, but under the overlay */}
      <div className="relative z-0">{children}</div>
    </>
  );
}
