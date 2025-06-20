"use client";

import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import ContactPage from '@/components/ContactPage';
import ServicesPage from '@/components/ServicesPage';
import localFont from 'next/font/local';

const fsBrabo = localFont({
  src: [
    {
      path: '../fonts/FS Brabo Pro Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/FS Brabo Pro SemiBold.otf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../fonts/FS Brabo Pro SemiBold Italic.otf',
      weight: '600',
      style: 'italic',
    },
  ],
  variable: '--font-fsbrabo',
  display: 'swap',
});

export default function Home() {
  const currentPage = useSelector((state: RootState) => state.navigation.currentPage);

  return (
    <div className={`relative w-full h-full ${fsBrabo.className}`}>
      {/* Home page content */}
      <div 
        className={`absolute inset-0 flex justify-center h-[100dvh] w-[100dvw] bg-white
          transition-all duration-500 ease-[cubic-bezier(.4,0,.2,1)]
          ${currentPage === 'home' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[20px] pointer-events-none'}
        `}
      >
        <h1 className="z-10 text-center font-sans pt-50 font-semibold text-black text-2xl sm:text-4xl md:text-5xl leading-tight drop-shadow-lg">
          Professional Beauty Therapists
          <br className="hidden sm:block" />You Can Trust
        </h1>
      </div>

      {/* Contact page content */}
      <div 
        className={`absolute inset-0 transition-all duration-500 ease-[cubic-bezier(.4,0,.2,1)]
          ${currentPage === 'contact' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[20px] pointer-events-none'}
        `}
      >
        <ContactPage />
      </div>

      {/* Services page content */}
      <div 
        className={`absolute inset-0 transition-all duration-500 ease-[cubic-bezier(.4,0,.2,1)]
          ${currentPage === 'services' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[20px] pointer-events-none'}
        `}
      >
        <ServicesPage />
      </div>
    </div>
  );
}
