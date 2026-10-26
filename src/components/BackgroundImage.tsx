"use client";

import { usePathname } from "next/navigation";

export default function BackgroundImage() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-0 bg-white transition-opacity duration-500 ease-[cubic-bezier(.4,0,.2,1)] ${
        isHomePage ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden="true"
    />
  );
}
