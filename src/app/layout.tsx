import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "react-day-picker/style.css";
import { Providers } from "@/redux/provider";
import Navbar from "@/components/Navbar";
import BackgroundImage from "@/components/BackgroundImage";
import MainContentOverlay from "@/components/MainContentOverlay";
import Chatbot from "@/components/chat/Chatbot";
import BookingUpdatesProvider from "@/components/BookingUpdatesProvider";

// Chatbot is a Client Component; importing directly is supported from a Server Component

// Import your local font(s)
const fsBrabo = localFont({
  src: [
    {
      path: "../fonts/FS Brabo Pro Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/FS Brabo Pro SemiBold.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/FS Brabo Pro SemiBold Italic.otf",
      weight: "600",
      style: "italic",
    },
  ],
  variable: "--font-fsbrabo",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
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
    <html lang="en" className={fsBrabo.className}>
      <body className={`bg-white relative overflow-hidden`}>
        <Providers>
          <BookingUpdatesProvider />
          <BackgroundImage />
          <Navbar />
          <main className="bg-white min-h-[100dvh] w-full">
            <MainContentOverlay>{children}</MainContentOverlay>
          </main>
          <Chatbot />
        </Providers>
      </body>
    </html>
  );
}