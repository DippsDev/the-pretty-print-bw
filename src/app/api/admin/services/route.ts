import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, readSessionToken } from "@/lib/adminAuth";
import { readGroups, saveGroups } from "@/lib/studioStore";
import type { Service, ServiceGroup, ServicePriceOption } from "@/lib/servicesData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function adminEmail(request: NextRequest) {
  return readSessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function sanitizePriceOptions(value: unknown): ServicePriceOption[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const options = value
    .slice(0, 12)
    .map((option) => ({
      label: text((option as { label?: unknown })?.label, 40),
      value: text((option as { value?: unknown })?.value, 24),
    }))
    .filter((option) => option.label && option.value);
  return options.length ? options : undefined;
}

function sanitizeService(value: unknown): Service | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Service;
  const name = text(source.name, 80);
  if (!name) return null;
  const minutes = Number(source.durationMinutes);
  const durationMinutes = Number.isFinite(minutes)
    ? Math.min(600, Math.max(0, Math.round(minutes)))
    : undefined;
  const timeOptions = Array.isArray(source.timeOptions)
    ? source.timeOptions
        .filter((option): option is string => typeof option === "string")
        .map((option) => option.trim().slice(0, 40))
        .filter(Boolean)
        .slice(0, 4)
    : durationMinutes
      ? [`About ${durationMinutes} min`]
      : undefined;
  const price = typeof source.price === "string" ? text(source.price, 24) : undefined;
  const service: Service = {
    name,
    price,
    durationMinutes,
    timeOptions,
  };
  const description = text(source.description, 400);
  const type = text(source.type, 40);
  const slug = text(source.slug, 80);
  if (description) service.description = description;
  if (type) service.type = type;
  if (slug) service.slug = slug;
  return service;
}

function sanitizeGroups(value: unknown): ServiceGroup[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) return null;
  const groups: ServiceGroup[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const source = item as ServiceGroup;
    const label = text(source.label, 80);
    if (!label) return null;
    if (!Array.isArray(source.services) || source.services.length > 40) return null;
    const services = source.services
      .map(sanitizeService)
      .filter((service): service is Service => service !== null);
    groups.push({
      label,
      blurb: text(source.blurb, 400),
      services,
      prices: sanitizePriceOptions(source.prices),
    });
  }
  return groups;
}

export async function GET(request: NextRequest) {
  if (!adminEmail(request)) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  return NextResponse.json({ groups: readGroups() });
}

export async function PUT(request: NextRequest) {
  if (!adminEmail(request)) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const groups = sanitizeGroups(body?.groups);
  if (!groups) {
    return NextResponse.json({ error: "The menu could not be saved." }, { status: 400 });
  }
  const saved = await saveGroups(groups);
  return NextResponse.json({ groups: saved });
}
