"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Service, ServiceGroup } from "@/lib/servicesData";
import type { StudioBooking } from "@/lib/studioTypes";

type Panel = "menu" | "bookings";

function priceText(price: Service["price"]) {
  return typeof price === "string" ? price : "";
}

function minutesOf(service: Service) {
  return service.durationMinutes ?? 60;
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

  async function actOnBooking(id: string, action: "cancel" | "refund") {
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
      <div className="min-h-[100dvh] bg-[#f5f5f5] px-4 pt-24 text-sm text-[#555]">
        Checking access…
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex min-h-[100dvh] items-start justify-center bg-[#f5f5f5] px-4 pt-28">
        <form
          onSubmit={onLogin}
          className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_8px_28px_rgba(0,0,0,0.06)]"
        >
          <h1 className="text-2xl font-semibold text-[#141414]">Admin</h1>
          <p className="mt-2 text-sm leading-snug text-[#555]">
            Studio staff only. Sign in to edit the menu and manage bookings.
          </p>
          <label className="mt-6 block text-sm font-medium text-[#141414]" htmlFor="admin-email">
            Email
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={loginEmail}
              onChange={(event) => setLoginEmail(event.target.value)}
              className="mt-1 w-full rounded-xl border border-[#e4e4e4] px-3 py-2.5 text-base text-[#141414] outline-none focus:border-[#141414]"
              required
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-[#141414]" htmlFor="admin-password">
            Password
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-xl border border-[#e4e4e4] px-3 py-2.5 text-base text-[#141414] outline-none focus:border-[#141414]"
              required
            />
          </label>
          {loginError && <p className="mt-3 text-sm text-[#9b2c2c]">{loginError}</p>}
          <button
            type="submit"
            disabled={signingIn}
            className="mt-6 w-full rounded-full bg-[#141414] py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {signingIn ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#f5f5f5] px-4 pb-16 pt-24 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#141414]">Admin</h1>
            <p className="mt-1 text-sm text-[#555]">{email}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-full border border-[#141414] px-4 py-2 text-sm font-semibold text-[#141414]"
          >
            Log out
          </button>
        </div>

        <div className="flex gap-2">
          {(["menu", "bookings"] as Panel[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPanel(item)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                panel === item ? "bg-[#141414] text-white" : "bg-white text-[#141414]"
              }`}
            >
              {item === "menu" ? "Services" : "Bookings"}
            </button>
          ))}
        </div>

        {notice && <p className="rounded-2xl bg-white px-4 py-3 text-sm text-[#141414]">{notice}</p>}

        {panel === "menu" && (
          <section className="flex flex-col gap-4">
            {groups.map((group, groupIndex) => (
              <article key={`${group.label}-${groupIndex}`} className="rounded-2xl bg-white p-4 sm:p-5">
                <label className="block text-sm font-medium text-[#141414]">
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
                    className="mt-1 w-full rounded-xl border border-[#e4e4e4] px-3 py-2 text-base font-semibold outline-none focus:border-[#141414]"
                  />
                </label>
                <div className="mt-4 flex flex-col gap-3">
                  {group.services.map((service, serviceIndex) => (
                    <div
                      key={`${service.name}-${serviceIndex}`}
                      className="grid grid-cols-1 gap-2 border-t border-[#f0f0f0] pt-3 sm:grid-cols-[1fr_7rem_6rem_auto]"
                    >
                      <input
                        aria-label="Service name"
                        value={service.name}
                        onChange={(event) => updateService(groupIndex, serviceIndex, { name: event.target.value })}
                        className="rounded-xl border border-[#e4e4e4] px-3 py-2 text-sm outline-none focus:border-[#141414]"
                      />
                      <input
                        aria-label="Price"
                        value={priceText(service.price)}
                        onChange={(event) => updateService(groupIndex, serviceIndex, { price: event.target.value })}
                        className="rounded-xl border border-[#e4e4e4] px-3 py-2 text-sm outline-none focus:border-[#141414]"
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
                        className="rounded-xl border border-[#e4e4e4] px-3 py-2 text-sm outline-none focus:border-[#141414]"
                      />
                      <button
                        type="button"
                        onClick={() => removeService(groupIndex, serviceIndex)}
                        className="rounded-full px-3 py-2 text-sm text-[#9b2c2c]"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addService(groupIndex)}
                  className="mt-3 text-sm font-semibold text-[#141414]"
                >
                  Add a style
                </button>
              </article>
            ))}
            <button
              type="button"
              onClick={saveMenu}
              disabled={savingMenu}
              className="rounded-full bg-[#141414] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {savingMenu ? "Saving…" : "Save menu"}
            </button>
          </section>
        )}

        {panel === "bookings" && (
          <section className="flex flex-col gap-3">
            {bookings.length === 0 && (
              <p className="rounded-2xl bg-white px-4 py-5 text-sm text-[#555]">
                No bookings yet. They appear here after a client confirms on the booking page.
              </p>
            )}
            {bookings.map((booking) => {
              const when = new Date(booking.date);
              const dateLabel = Number.isNaN(when.getTime())
                ? booking.date
                : when.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
              return (
                <article key={booking.id} className="rounded-2xl bg-white p-4 sm:p-5">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-[#141414]">{booking.clientName}</h2>
                      <p className="text-sm text-[#555]">
                        {booking.clientEmail}
                        {booking.clientPhone ? ` · ${booking.clientPhone}` : ""}
                      </p>
                      <p className="mt-1 text-sm text-[#141414]">
                        {dateLabel} · {booking.time}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[#141414]">
                      P{Number.isInteger(booking.total) ? booking.total.toFixed(0) : booking.total.toFixed(2)}
                    </p>
                  </div>
                  <ul className="mt-3 flex flex-col gap-1 text-sm text-[#333]">
                    {booking.services.map((service, index) => (
                      <li key={`${service.name}-${index}`}>
                        {service.name} · {service.price}
                        {service.stylist ? ` · ${service.stylist}` : ""}
                      </li>
                    ))}
                  </ul>
                  {booking.notes && <p className="mt-2 text-sm text-[#555]">{booking.notes}</p>}
                  <p className="mt-3 text-xs uppercase tracking-wide text-[#777]">
                    {booking.status} · {booking.payment}
                  </p>
                  {booking.refundNote && <p className="mt-2 text-sm text-[#555]">{booking.refundNote}</p>}
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      disabled={busyId === booking.id || booking.status === "cancelled"}
                      onClick={() => actOnBooking(booking.id, "cancel")}
                      className="rounded-full border border-[#141414] px-4 py-2 text-sm font-semibold text-[#141414] disabled:opacity-40"
                    >
                      Cancel booking
                    </button>
                    <button
                      type="button"
                      disabled={busyId === booking.id || booking.payment === "refunded"}
                      onClick={() => actOnBooking(booking.id, "refund")}
                      className="rounded-full bg-[#141414] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                    >
                      Refund client
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}
