import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { SERVICES, type ServiceGroup } from "./servicesData";
import type { StudioBooking } from "./studioTypes";

export type { StudioBooking } from "./studioTypes";

type StudioFile = {
  groups: ServiceGroup[];
  bookings: StudioBooking[];
};

const FILE = path.join(process.cwd(), "data", "studio.json");

function seed(): StudioFile {
  return {
    groups: JSON.parse(JSON.stringify(SERVICES)) as ServiceGroup[],
    bookings: [],
  };
}

function readFile(): StudioFile {
  try {
    if (!existsSync(FILE)) return seed();
    const parsed = JSON.parse(readFileSync(FILE, "utf8")) as StudioFile;
    if (!parsed || !Array.isArray(parsed.groups) || !Array.isArray(parsed.bookings)) return seed();
    if (parsed.groups.length === 0) return { ...parsed, groups: seed().groups };
    return parsed;
  } catch {
    return seed();
  }
}

function persist(data: StudioFile) {
  mkdirSync(path.dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(data, null, 2));
}

let queue: Promise<unknown> = Promise.resolve();

function withStore<T>(fn: (data: StudioFile) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const data = readFile();
    const result = await fn(data);
    persist(data);
    return result;
  });
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function readGroups() {
  return readFile().groups;
}

export function readBookings() {
  return [...readFile().bookings].reverse();
}

export function readBooking(id: string) {
  return readFile().bookings.find((item) => item.id === id) ?? null;
}

export function findBookingByCheckoutId(checkoutId: string) {
  return readFile().bookings.find((item) => item.yocoCheckoutId === checkoutId) ?? null;
}

export function saveGroups(groups: ServiceGroup[]) {
  return withStore((data) => {
    data.groups = groups;
    return data.groups;
  });
}

export function createBooking(
  input: Omit<StudioBooking, "id" | "createdAt" | "status" | "payment">,
) {
  return withStore((data) => {
    const booking: StudioBooking = {
      ...input,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      status: "confirmed",
      payment: "unpaid",
    };
    data.bookings.push(booking);
    return booking;
  });
}

export function updateBooking(id: string, patch: (booking: StudioBooking) => void) {
  return withStore((data) => {
    const booking = data.bookings.find((item) => item.id === id);
    if (!booking) return null;
    patch(booking);
    return { ...booking };
  });
}
