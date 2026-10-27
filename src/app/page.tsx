"use client";

import { useState } from "react";
import Link from "next/link";
import { DM_Sans, Italiana } from "next/font/google";
import { ArrowDownRight, ArrowRight, Camera, Menu, Scissors, X } from "lucide-react";
import { useDispatch } from "react-redux";
import { setNavbarOpen, setServicesPanelOpen } from "@/redux/features/navigationSlice";
import "./home.css";

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

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const closeMenu = () => setMenuOpen(false);
  const openServices = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    closeMenu();
    dispatch(setNavbarOpen(true));
    dispatch(setServicesPanelOpen(true));
  };

  return (
    <div className={`home-page ${dmSans.variable} ${italiana.variable} ${dmSans.className}`}>
      <header className="header">
        <a className="brand" href="#top" aria-label="thePRETTYPRINT home">
          <Scissors size={19} strokeWidth={1.5} />
          <span>thePRETTYPRINT</span>
          <small>HAIR STUDIO</small>
        </a>

        <nav className={menuOpen ? "nav open" : "nav"} aria-label="Main navigation">
          <button className="close-menu" onClick={closeMenu} aria-label="Close menu" type="button">
            <X size={22} />
          </button>
          <a href="#services" onClick={openServices}>
            Services
          </a>
          <a href="#about" onClick={closeMenu}>
            Our studio
          </a>
          <a href="#artists" onClick={closeMenu}>
            Artists
          </a>
          <Link href="/contact" onClick={closeMenu}>
            Contact
          </Link>
          <Link href="/admin" onClick={closeMenu}>
            Admin
          </Link>
        </nav>

        <Link className="header-book" href="/book">
          Book an appointment <ArrowRight size={16} />
        </Link>
        <button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Open menu" type="button">
          <Menu size={23} />
        </button>
      </header>

      <div id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="kicker">
              <span /> Independent hair studio · Gaborone
            </div>
            <h1 id="hero-title">
              Hair that feels
              <br />
              <em>like you.</em>
            </h1>
            <p className="intro">
              Thoughtful cuts, dimensional colour, and effortless styling created around your texture, routine, and
              individuality.
            </p>
            <div className="hero-actions" id="booking">
              <Link className="primary-button" href="/book">
                Book your visit <ArrowRight size={18} />
              </Link>
              <a className="text-link" href="#services">
                Explore services <ArrowDownRight size={17} />
              </a>
            </div>
            <div className="availability">
              <span className="status-dot" />
              <p>
                <strong>Now booking</strong>
                <br />
                Appointments available this week
              </p>
            </div>
          </div>

          <div className="visual">
            <div className="main-image">
              <div className="image-placeholder" role="img" aria-label="Placeholder for salon hero photography">
                <span>Hero image</span>
                <small>Salon / hairstyling photography</small>
              </div>
              <span className="image-index">01 — 03</span>
            </div>
            <div className="detail-card">
              <div className="detail-placeholder" role="img" aria-label="Placeholder for hair detail photography">
                <span>Detail image</span>
              </div>
              <div>
                <span>OUR APPROACH</span>
                <p>
                  Modern craft.
                  <br />
                  Personal expression.
                </p>
              </div>
            </div>
            <span className="vertical-note">CUT · COLOUR · STYLE</span>
          </div>
        </section>

        <section className="service-strip" id="services" aria-label="Featured services">
          <p>Considered hair, never overdone.</p>
          <div className="service-list">
            <a href="#booking">
              <span>01</span> Cut &amp; finish
            </a>
            <a href="#booking">
              <span>02</span> Bespoke colour
            </a>
            <a href="#booking">
              <span>03</span> Styling
            </a>
          </div>
          <a className="social-link" href="https://instagram.com" aria-label="Visit thePRETTYPRINT on Instagram">
            <Camera size={17} /> @thePRETTYPRINT
          </a>
        </section>

        <section className="content-section about-section" id="about">
          <div className="section-label">01 / About</div>
          <div className="about-copy">
            <p className="eyebrow">A neighbourhood hair studio</p>
            <h2>Good hair starts with a good conversation.</h2>
            <p className="body-copy">
              We are an independent salon focused on thoughtful consultations, wearable cuts, and colour designed to grow
              out beautifully. Every appointment is tailored to your hair, your routine, and your goals.
            </p>
            <a className="wire-link" href="#artists">
              Meet the team <ArrowRight size={16} />
            </a>
          </div>
          <div className="about-image">
            <div className="image-placeholder" role="img" aria-label="Placeholder for salon interior image">
              <span>Salon interior image</span>
              <small>Studio / team photography</small>
            </div>
          </div>
        </section>

        <section className="content-section booking-section" id="booking-guide">
          <div className="section-label">02 / How to book</div>
          <div className="booking-heading">
            <p className="eyebrow">Three simple steps</p>
            <h2>Your next appointment, made easy.</h2>
          </div>
          <div className="steps">
            <article>
              <span>01</span>
              <h3>Choose a service</h3>
              <p>Browse our cut, colour, and styling options to find the right appointment.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Select your stylist</h3>
              <p>Choose your preferred artist, or let us match you with the right specialist.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Pick a time</h3>
              <p>View live availability and select a date and time that works for you.</p>
            </article>
          </div>
          <Link className="primary-button booking-cta" href="/book">
            Start a booking <ArrowRight size={18} />
          </Link>
        </section>

        <section className="content-section location-section" id="contact">
          <div className="section-label">03 / Location</div>
          <div className="map-placeholder" role="img" aria-label="Placeholder for salon location map">
            <div className="map-pin">
              <span />
            </div>
            <p>Map placeholder</p>
            <small>Insert interactive map here</small>
          </div>
          <div className="location-info">
            <p className="eyebrow">Come say hello</p>
            <h2>Find us in the heart of Gaborone.</h2>
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
            <a className="wire-link" href="https://maps.google.com/?q=Gaborone,Botswana">
              Get directions <ArrowRight size={16} />
            </a>
          </div>
        </section>
      </div>

      {menuOpen && (
        <button className="scrim" onClick={closeMenu} aria-label="Close menu" type="button" />
      )}
      <footer>
        <a className="brand" href="#top" aria-label="thePRETTYPRINT home">
          <Scissors size={19} strokeWidth={1.5} />
          <span>thePRETTYPRINT</span>
          <small>HAIR STUDIO</small>
        </a>
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
