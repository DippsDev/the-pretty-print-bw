"use client";

import Image from "next/image";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";

export default function BackgroundImage() {
  const currentPage = useSelector((state: RootState) => state.navigation.currentPage);

  return (
    <Image
      src="/bird.png"
      alt="Bird"
      fill
      className={`fixed left-0 top-0 mt-[156px] w-full h-[678px] object-cover z-[100] pointer-events-none select-none
        transition-opacity duration-500 ease-[cubic-bezier(.4,0,.2,1)]
        ${currentPage === 'home' ? 'opacity-100' : 'opacity-0'}
      `}
      priority
      draggable={false}
      style={{ pointerEvents: "none", userSelect: "none" }}
    />
  );
}
