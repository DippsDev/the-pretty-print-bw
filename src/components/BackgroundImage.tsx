"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

export default function BackgroundImage() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <Image
      src="/bird.png"
      alt="Bird"
      fill
      className={`fixed left-0 top-0 mt-[156px] w-full h-[678px] object-cover z-[100] pointer-events-none select-none
        transition-opacity duration-500 ease-[cubic-bezier(.4,0,.2,1)]
        ${isHomePage ? 'opacity-100' : 'opacity-0'}
      `}
      priority
      draggable={false}
      style={{ pointerEvents: "none", userSelect: "none" }}
    />
  );
}
