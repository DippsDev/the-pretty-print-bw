"use client";

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
  preload: true,
  fallback: ['system-ui', 'arial'],
});

export default function Home() {
  return (
    <div className={`relative w-full h-full ${fsBrabo.className}`}>
      <div className="flex flex-col items-center justify-center h-[100dvh] w-full bg-white px-4">
        <h1 className="text-center font-semibold text-black text-2xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight drop-shadow-lg">
          Professional Beauty Therapists
          <br className="hidden sm:block" /> You Can Trust
        </h1>
      </div>
    </div>
  );
}
