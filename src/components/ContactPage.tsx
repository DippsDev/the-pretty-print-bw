"use client";

import React, { useState } from "react";
import localFont from "next/font/local";
import { Inter } from "next/font/google";

const fsBrabo = localFont({
  src: [
    {
      path: '../../src/fonts/FS Brabo Pro Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../src/fonts/FS Brabo Pro SemiBold.otf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../src/fonts/FS Brabo Pro SemiBold Italic.otf',
      weight: '600',
      style: 'italic',
    },
  ],
  variable: '--font-fsbrabo',
  display: 'swap',
});

const inter = Inter({ subsets: ["latin"], weight: "400" });

interface FormState {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
}

export function ContactForm() {
  const [form, setForm] = useState<FormState>({
    title: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
  });

  const inputStyles = `w-full border-0 border-b border-gray-200 px-0 py-2 bg-white text-[#33383C] 
    focus:outline-none focus:border-[#33383C] transition-colors 
    placeholder:text-[#34393D] autofill:shadow-[inset_0_0_0_1000px_white] autofill:text-[#33383C]`;

  return (
    <form
      className={`flex flex-col gap-6 w-full max-w-[420px] mx-auto ${inter.className}`}
      autoComplete="off"
      onSubmit={e => e.preventDefault()}
    >
      <div className="text-[24px] font-semibold text-[#222222]">Contact us by e-mail</div>
      <div className="text-[12px] text-[#7B8487]">*Required fields</div>
      
      <div className="space-y-4">
        <div className="text-[16px] font-semibold text-[#222222]">Your information</div>
        
        {/* Title select */}
        <div>
          <label className="block text-[12px] font-medium text-[#7B8487] mb-1" htmlFor="title">
            *Title
          </label>
          <select
            id="title"
            required
            className={inputStyles + " text-[16px]"}
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          >
            <option value="" disabled>Mr</option>
            <option>Mr</option>
            <option>Ms</option>
            <option>Mrs</option>
            <option>Dr</option>
            <option>Prof</option>
            <option>Other</option>
          </select>
        </div>

        {/* Name inputs */}
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              required
              type="text"
              placeholder="*First name"
              className={inputStyles + " text-[16px]"}
              value={form.firstName}
              onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
              autoComplete="off"
            />
          </div>
          <div className="flex-1">
            <input
              required
              type="text"
              placeholder="*Last name"
              className={inputStyles + " text-[16px]"}
              value={form.lastName}
              onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
              autoComplete="off"
            />
          </div>
        </div>

        {/* Contact inputs */}
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              required
              type="email"
              placeholder="*Email"
              className={inputStyles + " text-[16px]"}
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              autoComplete="off"
            />
          </div>
          <div className="flex-1">
            <input
              required
              type="tel"
              placeholder="*Mobile phone"
              className={inputStyles + " text-[16px]"}
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      {/* Message area */}
      <div className="space-y-2 relative">
        <div className="text-[16px] font-semibold text-[#222222]">Your request</div>
        <div className="relative">
          <textarea
            required
            placeholder="*Your message"
            className={`${inputStyles} min-h-[120px] resize-none text-[16px]`}
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            autoComplete="off"
            style={{ position: "relative", zIndex: 1 }}
          />
          {/* Slanted lines in the bottom right corner */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-0 bottom-2 flex flex-col items-end z-10"
            style={{ height: 14, width: 14 }}
          >
            <svg width="14" height="14" style={{ display: "block" }}>
              <line x1="7" y1="14" x2="14" y2="7" stroke="#D1D5DB" strokeWidth="1" />
              <line x1="0" y1="14" x2="14" y2="0" stroke="#D1D5DB" strokeWidth="1" />
            </svg>
          </span>
        </div>
      </div>

      <button
        type="submit"
        className="mt-3 w-[16rem] bg-[#333333] text-white py-2 rounded-sm text-sm transition hover:bg-neutral-900"
        style={{ fontFamily: inter.style.fontFamily }}
      >
        Send
      </button>
    </form>
  );
}

export default function ContactPage() {
  return (
    <div className={`flex flex-col md:flex-row min-h-[100dvh] w-full bg-white ${inter.className}`}>
      {/* Left side */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-white">
        <div className="max-w-md mx-auto">
          <p className="text-[18px] text-[#6E6B68] mb-4">
            Our wellness specialists at Bel Amour Spa would be honored to guide you toward your perfect escape and rejuvenation experience.
          </p>
          <p className="text-[18px] text-[#6E6B68] mb-4">
            Contact us to begin your journey to radiant relaxation.
          </p>
          <p className="text-sm text-[#6E6B68]">
            Available Monday through Sunday 9am-6pm
          </p>
        </div>
      </div>
      {/* Right side */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-white">
        <ContactForm />
      </div>
    </div>
  );
}
