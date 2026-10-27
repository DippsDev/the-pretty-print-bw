"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DM_Sans, Italiana } from "next/font/google";
import { ArrowRight, Menu, Scissors, X } from "lucide-react";
import { useDispatch } from "react-redux";
import { setNavbarOpen, setServicesPanelOpen } from "@/redux/features/navigationSlice";
import { HOUSE_RULES } from "@/lib/servicesData";
import "../home.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm",
  display: "swap",
});

const italiana = Italiana({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-italiana",
  display: "swap",
});

const SOCIAL_LINKS = [
  { label: "Instagram", href: "" },
  { label: "TikTok", href: "" },
  { label: "Facebook", href: "" },
];

const NAV = [
  { label: "Services", href: "/#services" },
  { label: "Our studio", href: "/#about" },
  { label: "Artists", href: "/#artists" },
  { label: "Contact", href: "/contact" },
  { label: "Admin", href: "/admin" },
];

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

  return (
    <form
      className="contact-form"
      onSubmit={(event) => {
        event.preventDefault();
        setSent(true);
      }}
    >
      <h2>Send a note</h2>
      <label className="contact-field">
        Name
        <input
          required
          name="name"
          autoComplete="name"
          placeholder="Your name"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        />
      </label>
      <label className="contact-field">
        Email
        <input
          required
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@email.com"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        />
      </label>
      <label className="contact-field">
        Phone
        <input
          required
          type="tel"
          name="phone"
          autoComplete="tel"
          placeholder="+267 71 234 567"
          value={form.phone}
          onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
        />
      </label>
      <label className="contact-field">
        Message
        <textarea
          required
          name="message"
          placeholder="Ask about a booking, a policy, or a style."
          value={form.message}
          onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
        />
      </label>
      <button type="submit" className="primary-button">
        Send a note <ArrowRight size={16} />
      </button>
      {sent && <p className="contact-note">Thanks. This preview keeps the note on the page.</p>}
    </form>
  );
}

export default function ContactPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const closeMenu = () => setMenuOpen(false);
  const openServices = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    closeMenu();
    dispatch(setNavbarOpen(true));
    dispatch(setServicesPanelOpen(true));
    router.push("/");
  };

  return (
    <div className={`home-page contact-page ${dmSans.variable} ${italiana.variable} ${dmSans.className}`}>
      <header className="header">
        <Link className="brand" href="/" aria-label="thePRETTYPRINT home">
          <Scissors size={19} strokeWidth={1.5} />
          <span>thePRETTYPRINT</span>
          <small>HAIR STUDIO</small>
        </Link>

        <nav className={menuOpen ? "nav open" : "nav"} aria-label="Main navigation">
          <button className="close-menu" onClick={closeMenu} aria-label="Close menu" type="button">
            <X size={22} />
          </button>
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              aria-current={item.href === "/contact" ? "page" : undefined}
              onClick={item.label === "Services" ? openServices : closeMenu}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link className="header-book" href="/book">
          Book an appointment <ArrowRight size={16} />
        </Link>
        <button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Open menu" type="button">
          <Menu size={23} />
        </button>
      </header>

      <section className="content-section contact-layout" aria-labelledby="contact-title">
        <div>
          <p className="kicker">
            <span /> Contact
          </p>
          <h2 id="contact-title">Talk to the studio.</h2>
          <p className="body-copy">
            Questions about a booking, the policies, or a style that is not on the menu.
          </p>
          <div className="location-details">
            <div>
              <span>Address</span>
              <p>
                Plot 4921, Extension 9
                <br />
                Gaborone, Botswana
              </p>
            </div>
            <div>
              <span>Opening hours</span>
              <p>
                Tue–Fri, 9am–7pm
                <br />
                Sat, 9am–5pm
              </p>
            </div>
            <div>
              <span>Contact</span>
              <p>
                +267 71 234 567
                <br />
                hello@thePRETTYPRINT.co
              </p>
            </div>
          </div>
          <ul className="contact-rules">
            {HOUSE_RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
          <a className="wire-link" href="https://maps.google.com/?q=Gaborone,Botswana">
            Get directions <ArrowRight size={16} />
          </a>
        </div>
        <ContactForm />
      </section>

      {menuOpen && <button className="scrim" onClick={closeMenu} aria-label="Close menu" type="button" />}

      <footer>
        <Link className="brand" href="/" aria-label="thePRETTYPRINT home">
          <Scissors size={19} strokeWidth={1.5} />
          <span>thePRETTYPRINT</span>
          <small>HAIR STUDIO</small>
        </Link>
        <nav className="footer-social" aria-label="Social media">
          {SOCIAL_LINKS.map((link) =>
            link.href ? (
              <a key={link.label} href={link.href}>
                {link.label}
              </a>
            ) : (
              <span key={link.label}>{link.label}</span>
            ),
          )}
        </nav>
        <span>© 2025 thePRETTYPRINT</span>
      </footer>
    </div>
  );
}
