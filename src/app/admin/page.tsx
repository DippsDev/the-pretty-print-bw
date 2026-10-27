"use client";

import { FormEvent, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { DM_Sans, Italiana } from "next/font/google";
import { Scissors } from "lucide-react";
import type { Service, ServiceGroup } from "@/lib/servicesData";
import type { StudioBooking } from "@/lib/studioTypes";
import { formatPula, paymentLabel } from "@/lib/studioMoney";
import "../booking.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm",
});

const italiana = Italiana({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-italiana",
});

function BookingRow({
  booking,
  busy,
  onAction,
}: {
  booking: StudioBooking;
  busy: boolean;
  onAction: (id: string, action: "cancel" | "refund" | "paid") => void;
}) {
  const services = booking.services
    .map((service) => [service.name, service.price, service.stylist].filter(Boolean).join(" · "))
    .join(", ");

  return (
    <article className="admin-row" data-status={booking.status}>
      <p className="admin-row-time">{booking.time}</p>
      <div>
        <h3 className="booking-card-title">{booking.clientName}</h3>
        <p className="admin-row-contact">
          {booking.clientEmail}
          {booking.clientPhone ? ` · ${booking.clientPhone}` : ""}
        </p>
      </div>
      <div>
        <p className="admin-row-services">{services}</p>
        {booking.notes && <p className="admin-row-contact">{booking.notes}</p>}
        <p className="booking-kicker">
          {booking.status} · {paymentLabel(booking)}
        </p>
        {booking.refundNote && <p className="admin-row-contact">{booking.refundNote}</p>}
      </div>
      <div className="admin-row-side">
        <p className="admin-row-price">{formatPula(booking.total)}</p>
        <div className="admin-row-actions">
          {canMarkPaid(booking) && (
            <button type="button" disabled={busy} onClick={() => onAction(booking.id, "paid")} className="admin-action">
              Mark paid
            </button>
          )}
          <button
            type="button"
            disabled={busy || booking.status === "cancelled"}
            onClick={() => onAction(booking.id, "cancel")}
            className="booking-text"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || booking.payment === "refunded"}
            onClick={() => onAction(booking.id, "refund")}
            className="admin-action"
          >
            Refund
          </button>
        </div>
      </div>
    </article>
  );
}

function DaySchedule({
  bucket,
  busyId,
  onAction,
}: {
  bucket: DayBucket;
  busyId: string | null;
  onAction: (id: string, action: "cancel" | "refund" | "paid") => void;
}) {
  return (
    <section className="admin-day">
      <header className="admin-day-head">
        <div>
          <p className="booking-kicker">{bucket.label}</p>
          <h2 className="admin-day-title">{bucket.title}</h2>
        </div>
        <p className="booking-kicker">{daySummary(bucket.bookings)}</p>
      </header>
      <div className="admin-diary">
        {bucket.bookings.map((booking) => (
          <BookingRow key={booking.id} booking={booking} busy={busyId === booking.id} onAction={onAction} />
        ))}
      </div>
    </section>
  );
}

function BookingsDiary({
  bookings,
  busyId,
  onAction,
}: {
  bookings: StudioBooking[];
  busyId: string | null;
  onAction: (id: string, action: "cancel" | "refund" | "paid") => void;
}) {
  if (bookings.length === 0) {
    return (
      <p className="booking-panel text-sm text-[#626262]">
        No bookings yet. They appear here after a client confirms on the booking page.
      </p>
    );
  }

  const { coming, earlier, unknown } = groupBookings(bookings);
  const sections = [
    { label: "Coming up", days: coming },
    { label: "Earlier", days: earlier },
    { label: "Needs a date", days: unknown },
  ].filter((section) => section.days.length > 0);

  return (
    <div className="admin-days">
      {sections.map((section) => (
        <section key={section.label}>
          {sections.length > 1 && <p className="admin-section-label">{section.label}</p>}
          <div className="admin-days">
            {section.days.map((bucket) => (
              <DaySchedule key={bucket.key} bucket={bucket} busyId={busyId} onAction={onAction} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className={`booking-page min-h-[100dvh] ${dmSans.variable} ${italiana.variable} ${dmSans.className}`}>
      <header className="booking-header">
        <Link href="/" className="booking-brand" aria-label="thePRETTYPRINT home">
          <Scissors size={19} strokeWidth={1.5} />
          <span>thePRETTYPRINT</span>
          <small>HAIR STUDIO</small>
        </Link>
        <span className="booking-header-label">Admin</span>
      </header>
      {children}
    </div>
  );
}

type Panel = "menu" | "bookings";

function priceText(price: Service["price"]) {
  return typeof price === "string" ? price : "";
}

function minutesOf(service: Service) {
  return service.durationMinutes ?? 60;
}

function parseBookingDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dayStamp(date: Date) {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

function minutesFromTime(time: string) {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (!match) return Number.MAX_SAFE_INTEGER;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toLowerCase();
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function canMarkPaid(booking: StudioBooking) {
  return booking.payment === "unpaid" && booking.status !== "cancelled" && booking.paymentMethod !== "card";
}

type DayBucket = {
  key: string;
  date: Date | null;
  label: string;
  title: string;
  bookings: StudioBooking[];
};

function groupBookings(bookings: StudioBooking[]) {
  const today = new Date();
  const todayStamp = dayStamp(today);
  const tomorrowStamp = dayStamp(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));
  const map = new Map<string, DayBucket>();

  for (const booking of bookings) {
    const date = parseBookingDate(booking.date);
    const key = date ? String(dayStamp(date)) : `unknown:${booking.date || "none"}`;
    let bucket = map.get(key);
    if (!bucket) {
      let label = "Date";
      let title = booking.date || "Unscheduled";
      if (date) {
        const stamp = dayStamp(date);
        label =
          stamp === todayStamp ? "Today" : stamp === tomorrowStamp ? "Tomorrow" : date.toLocaleDateString(undefined, { weekday: "long" });
        title = date.toLocaleDateString(undefined, {
          day: "numeric",
          month: "long",
          ...(date.getFullYear() !== today.getFullYear() ? { year: "numeric" as const } : {}),
        });
      }
      bucket = { key, date, label, title, bookings: [] };
      map.set(key, bucket);
    }
    bucket.bookings.push(booking);
  }

  for (const bucket of map.values()) {
    bucket.bookings.sort((a, b) => minutesFromTime(a.time) - minutesFromTime(b.time) || a.clientName.localeCompare(b.clientName));
  }

  const buckets = [...map.values()];
  return {
    coming: buckets
      .filter((bucket) => bucket.date && dayStamp(bucket.date) >= todayStamp)
      .sort((a, b) => dayStamp(a.date!) - dayStamp(b.date!)),
    earlier: buckets
      .filter((bucket) => bucket.date && dayStamp(bucket.date) < todayStamp)
      .sort((a, b) => dayStamp(b.date!) - dayStamp(a.date!)),
    unknown: buckets.filter((bucket) => !bucket.date),
  };
}

function daySummary(bookings: StudioBooking[]) {
  const cancelled = bookings.filter((booking) => booking.status === "cancelled").length;
  const active = bookings.length - cancelled;
  const clients = `${active} ${active === 1 ? "client" : "clients"}`;
  return cancelled ? `${clients} · ${cancelled} cancelled` : clients;
}

export default function AdminPage() {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [panel, setPanel] = useState<Panel>("menu");
  const [groups, setGroups] = useState<ServiceGroup[]>([]);
  const [bookings, setBookings] = useState<StudioBooking[]>([]);
  const [notice, setNotice] = useState("");
  const [savingMenu, setSavingMenu] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  async function loadStudio() {
    const [menuResponse, bookingResponse] = await Promise.all([
      fetch("/api/admin/services"),
      fetch("/api/admin/bookings"),
    ]);
    if (menuResponse.ok) {
      const menu = (await menuResponse.json()) as { groups?: ServiceGroup[] };
      setGroups(menu.groups || []);
    }
    if (bookingResponse.ok) {
      const list = (await bookingResponse.json()) as { bookings?: StudioBooking[] };
      setBookings(list.bookings || []);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/session")
      .then(async (response) => {
        if (!response.ok) return;
        const body = (await response.json()) as { email?: string };
        if (!cancelled && body.email) {
          setEmail(body.email);
          await loadStudio();
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onLogin(event: FormEvent) {
    event.preventDefault();
    setSigningIn(true);
    setLoginError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password }),
      });
      const body = (await response.json().catch(() => ({}))) as { email?: string; error?: string };
      if (!response.ok || !body.email) {
        setLoginError(body.error || "Those details are not recognised.");
        return;
      }
      setEmail(body.email);
      setPassword("");
      await loadStudio();
    } catch {
      setLoginError("The studio could not be reached.");
    } finally {
      setSigningIn(false);
    }
  }

  async function onExport() {
    setExporting(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/export");
      if (!response.ok) {
        setNotice("The studio book could not be exported.");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `thePRETTYPRINT-studio-book-${stamp}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setNotice("The studio book could not be exported.");
    } finally {
      setExporting(false);
    }
  }

  async function onLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setEmail(null);
    setGroups([]);
    setBookings([]);
    setNotice("");
  }

  function updateService(groupIndex: number, serviceIndex: number, patch: Partial<Service>) {
    setGroups((current) =>
      current.map((group, index) => {
        if (index !== groupIndex) return group;
        return {
          ...group,
          services: group.services.map((service, itemIndex) => {
            if (itemIndex !== serviceIndex) return service;
            const next = { ...service, ...patch };
            if (typeof patch.durationMinutes === "number") {
              next.timeOptions = [`About ${patch.durationMinutes} min`];
            }
            return next;
          }),
        };
      }),
    );
  }

  function addService(groupIndex: number) {
    setGroups((current) =>
      current.map((group, index) =>
        index === groupIndex
          ? {
              ...group,
              services: [
                ...group.services,
                { name: "New style", price: "P0", durationMinutes: 60, timeOptions: ["About 60 min"] },
              ],
            }
          : group,
      ),
    );
  }

  function removeService(groupIndex: number, serviceIndex: number) {
    setGroups((current) =>
      current.map((group, index) =>
        index === groupIndex
          ? { ...group, services: group.services.filter((_, itemIndex) => itemIndex !== serviceIndex) }
          : group,
      ),
    );
  }

  async function saveMenu() {
    setSavingMenu(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groups }),
      });
      const body = (await response.json().catch(() => ({}))) as { groups?: ServiceGroup[]; error?: string };
      if (!response.ok || !body.groups) {
        setNotice(body.error || "The menu could not be saved.");
        return;
      }
      setGroups(body.groups);
      setNotice("Menu saved. The booking page now uses these prices.");
    } catch {
      setNotice("The menu could not be saved.");
    } finally {
      setSavingMenu(false);
    }
  }

  async function actOnBooking(id: string, action: "cancel" | "refund" | "paid") {
    setBusyId(id);
    setNotice("");
    try {
      const response = await fetch(`/api/admin/bookings/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        booking?: StudioBooking;
        message?: string;
        error?: string;
      };
      if (!response.ok || !body.booking) {
        setNotice(body.error || "That could not be completed.");
        return;
      }
      setBookings((current) => current.map((booking) => (booking.id === id ? body.booking! : booking)));
      setNotice(body.message || "Updated.");
    } catch {
      setNotice("That could not be completed.");
    } finally {
      setBusyId(null);
    }
  }

  if (!ready) {
    return (
      <AdminShell>
        <p className="booking-shell px-6 py-10 text-sm text-[#625d55]">Checking access…</p>
      </AdminShell>
    );
  }

  if (!email) {
    return (
      <AdminShell>
        <div className="booking-shell flex justify-center px-6 py-12">
          <form onSubmit={onLogin} className="booking-panel w-full max-w-md">
            <h1 className="booking-heading">Admin</h1>
            <p className="text-sm leading-relaxed text-[#626262]">
              Studio staff only. Sign in to edit the menu and manage bookings.
            </p>
            <label className="booking-field" htmlFor="admin-email">
              Email
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                required
              />
            </label>
            <label className="booking-field" htmlFor="admin-password">
              Password
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {loginError && <p className="mt-3 text-sm text-[#9b2c2c]">{loginError}</p>}
            <button type="submit" disabled={signingIn} className="booking-continue mt-8">
              {signingIn ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="booking-shell flex w-full flex-col gap-6 px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="booking-heading">Admin</h1>
            <p className="booking-kicker">{email}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onExport} disabled={exporting} className="booking-ghost">
              {exporting ? "Preparing…" : "Export PDF"}
            </button>
            <button type="button" onClick={onLogout} className="booking-ghost">
              Log out
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          {(["menu", "bookings"] as Panel[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPanel(item)}
              className="booking-chip"
              data-active={panel === item ? "true" : "false"}
            >
              {item === "menu" ? "Services" : "Bookings"}
            </button>
          ))}
        </div>

        {notice && <p className="booking-panel text-sm text-[#262626]">{notice}</p>}

        {panel === "menu" && (
          <section className="flex flex-col gap-4">
            {groups.map((group, groupIndex) => (
              <article key={`${group.label}-${groupIndex}`} className="booking-panel">
                <label className="booking-field" style={{ marginTop: 0 }}>
                  Group
                  <input
                    value={group.label}
                    onChange={(event) =>
                      setGroups((current) =>
                        current.map((item, index) =>
                          index === groupIndex ? { ...item, label: event.target.value } : item,
                        ),
                      )
                    }
                  />
                </label>
                <div className="mt-4 flex flex-col gap-3">
                  {group.services.map((service, serviceIndex) => (
                    <div
                      key={`${service.name}-${serviceIndex}`}
                      className="grid grid-cols-1 items-center gap-2 border-t border-[rgba(37,34,30,0.12)] pt-3 sm:grid-cols-[1fr_7rem_6rem_auto]"
                    >
                      <input
                        aria-label="Service name"
                        value={service.name}
                        onChange={(event) => updateService(groupIndex, serviceIndex, { name: event.target.value })}
                        className="booking-input"
                      />
                      <input
                        aria-label="Price"
                        value={priceText(service.price)}
                        onChange={(event) => updateService(groupIndex, serviceIndex, { price: event.target.value })}
                        className="booking-input"
                      />
                      <input
                        aria-label="Minutes"
                        type="number"
                        min={0}
                        max={600}
                        value={minutesOf(service)}
                        onChange={(event) =>
                          updateService(groupIndex, serviceIndex, {
                            durationMinutes: Number(event.target.value) || 0,
                          })
                        }
                        className="booking-input"
                      />
                      <button
                        type="button"
                        onClick={() => removeService(groupIndex, serviceIndex)}
                        className="booking-text"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addService(groupIndex)}
                  className="booking-text mt-4"
                  style={{ color: "#262626" }}
                >
                  Add a style
                </button>
              </article>
            ))}
            <button
              type="button"
              onClick={saveMenu}
              disabled={savingMenu}
              className="booking-continue booking-continue-inline"
            >
              {savingMenu ? "Saving…" : "Save menu"}
            </button>
          </section>
        )}

        {panel === "bookings" && (
          <BookingsDiary bookings={bookings} busyId={busyId} onAction={actOnBooking} />
        )}
      </div>
    </AdminShell>
  );
}
