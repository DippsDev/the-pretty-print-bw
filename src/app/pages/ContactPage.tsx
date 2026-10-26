"use client";

import React, { useState } from "react";
import { HOUSE_RULES } from "@/lib/servicesData";

interface FormState {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export function ContactForm() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [sent, setSent] = useState(false);

  const inputClass = "w-full rounded-lg border border-[#e7e4df] bg-white px-3 py-2 text-sm outline-none";

  return (
    <form
      className="wf-frame flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setSent(true);
      }}
    >
      <h2 className="text-2xl font-semibold">Send a note</h2>
      <label className="flex flex-col gap-1 text-sm">
        Name
        <input
          required
          className={inputClass}
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          required
          type="email"
          className={inputClass}
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Phone
        <input
          required
          type="tel"
          className={inputClass}
          value={form.phone}
          onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Message
        <textarea
          required
          className={`${inputClass} min-h-[120px]`}
          value={form.message}
          onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
        />
      </label>
      <button type="submit" className="wf-btn w-fit">
        Send
      </button>
      {sent && (
        <p className="wf-note">
          Thanks. This preview keeps the note on the page.
        </p>
      )}
    </form>
  );
}

export default function ContactPage() {
  return (
    <div className="wf-page">
      <p className="wf-label">Contact</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="wf-frame">
          <h1 className="text-3xl font-semibold tracking-tight">Talk to the studio</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#5c5c5c]">
            Questions about a booking, the policies, or a style that is not on the menu.
          </p>
          <ul className="mt-6 flex flex-col gap-2">
            {HOUSE_RULES.map((rule) => (
              <li key={rule} className="rounded-xl bg-[#f6f5f3] px-3 py-2 text-sm">
                {rule}
              </li>
            ))}
          </ul>
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
