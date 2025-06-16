"use client";

import React, { useState } from "react";
import localFont from "next/font/local";

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

interface FormState {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
}

function ContactForm() {
  const [form, setForm] = useState<FormState>({
    title: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
  });

  const inputStyles = `w-full border-0 border-b border-gray-200 px-0 py-2 bg-white focus:outline-none 
    focus:border-gray-400 transition-colors placeholder:text-black/80`;

  return (
    <form
      className="flex flex-col gap-6 w-full max-w-[420px] mx-auto"
      autoComplete="off"
      onSubmit={e => e.preventDefault()}
    >
      <div className="text-lg font-semibold">Contact us by e-mail</div>
      <div className="text-xs text-gray-400">*Required fields</div>
      
      <div className="space-y-4">
        <div className="text-sm font-semibold">Your information</div>
        
        {/* Title select */}
        <div>
          <label className="block text-xs font-medium mb-1" htmlFor="title">
            *Title
          </label>
          <select
            id="title"
            required
            className={inputStyles}
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
              className={inputStyles}
              value={form.firstName}
              onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
            />
          </div>
          <div className="flex-1">
            <input
              required
              type="text"
              placeholder="*Last name"
              className={inputStyles}
              value={form.lastName}
              onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
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
              className={inputStyles}
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="flex-1">
            <input
              required
              type="tel"
              placeholder="*Mobile phone"
              className={inputStyles}
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Message area */}
      <div className="space-y-2">
        <div className="text-sm font-semibold">Your request</div>
        <textarea
          required
          placeholder="*Your message"
          className={`${inputStyles} min-h-[120px] resize-none`}
          value={form.message}
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
        />
      </div>

      <button
        type="submit"
        className="mt-3 w-[16rem] bg-black text-white py-2 rounded-sm text-sm transition hover:bg-neutral-900 "
      >
        Send
      </button>
    </form>
  );
}

export default function ContactPage() {
  return (
    <div className={`flex flex-col md:flex-row h-[100dvh] w-[100dvw] bg-white ${fsBrabo.className}`}>
      {/* Left side */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-white">
        <div className="max-w-md mx-auto">
          <p className="text-md text-gray-700  md:text-md mb-4">
            Our wellness specialists at Bel Amour Spa would be honored to guide you toward your perfect escape and rejuvenation experience.
          </p>
          <p className="text-md md:text-md text-gray-700 mb-4">
            Contact us to begin your journey to radiant relaxation.
          </p>
          <p className="text-sm text-gray-700">
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
