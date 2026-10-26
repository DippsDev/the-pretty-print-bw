import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "react-day-picker/style.css";
import { Providers } from "@/redux/provider";
import Navbar from "@/components/Navbar";
import BackgroundImage from "@/components/BackgroundImage";
import MainContentOverlay from "@/components/MainContentOverlay";
import WireframeChrome from "@/components/WireframeChrome";
import BookingUpdatesProvider from "@/components/BookingUpdatesProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "thePRETTYPRINT",
  description: "Book a style at thePRETTYPRINT.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body className="wireframe">
        <Providers>
          <BookingUpdatesProvider />
          <BackgroundImage />
          <Navbar />
          <main>
            <MainContentOverlay>{children}</MainContentOverlay>
          </main>
          <WireframeChrome />
        </Providers>
      </body>
    </html>
  );
}
