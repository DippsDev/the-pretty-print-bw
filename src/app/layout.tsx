import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/redux/provider";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import MainContentOverlay from "@/components/MainContentOverlay";

const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bel Amour",
  description: "Luxury beauty services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-white/90 relative overflow-hidden`}>
        <Providers>
          {/* Bird image: fixed, fills viewport, always on top */}
          <Image
            src="/bird.png"
            alt="Bird"
            fill
            className="fixed left-0 top-0 mt-[156px] w-full h-[678px] object-cover z-[100] pointer-events-none select-none"
            priority
            draggable={false}
            style={{ pointerEvents: "none", userSelect: "none" }}
          />
          <Navbar />
          <main className="bg-white h-[100dvh] w-[100dvw]">
            <MainContentOverlay>{children}</MainContentOverlay>
          </main>
        </Providers>
      </body>
    </html>
  );
}
