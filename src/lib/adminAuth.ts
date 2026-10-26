import { createHash, createHmac, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "pp_admin";

const WEEK_SECONDS = 60 * 60 * 24 * 7;

type Attempt = { count: number; lockedUntil: number };
const attempts = new Map<string, Attempt>();

function allowlist() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function expectedPassword() {
  return process.env.ADMIN_PASSWORD || "";
}

function secret() {
  return process.env.ADMIN_SESSION_SECRET || "";
}

export function adminConfigured() {
  return allowlist().length > 0 && expectedPassword().length > 0 && secret().length > 0;
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

function same(left: string, right: string) {
  return timingSafeEqual(digest(left), digest(right));
}

export function cookieOptions(maxAge = WEEK_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function createSessionToken(email: string) {
  const exp = Date.now() + WEEK_SECONDS * 1000;
  const body = Buffer.from(JSON.stringify({ email, exp })).toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function readSessionToken(token: string | undefined | null) {
  if (!token || !adminConfigured()) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as {
      email?: unknown;
      exp?: unknown;
    };
    if (typeof data.email !== "string" || typeof data.exp !== "number") return null;
    if (data.exp < Date.now()) return null;
    const email = data.email.toLowerCase();
    if (!allowlist().includes(email)) return null;
    return email;
  } catch {
    return null;
  }
}

export function checkLogin(
  emailRaw: string,
  password: string,
): { ok: true; email: string } | { ok: false; error: string; status: number } {
  if (!adminConfigured()) {
    return { ok: false, error: "Admin access is not configured.", status: 503 };
  }
  const email = emailRaw.trim().toLowerCase();
  const now = Date.now();
  const record = attempts.get(email);
  if (record && record.lockedUntil > now) {
    return { ok: false, error: "Too many attempts. Try again in a few minutes.", status: 429 };
  }
  const allowed = allowlist().includes(email) && same(password, expectedPassword());
  if (!allowed) {
    const count = (record && record.lockedUntil <= now ? record.count : 0) + 1;
    attempts.set(email, {
      count,
      lockedUntil: count >= 5 ? now + 10 * 60 * 1000 : 0,
    });
    return { ok: false, error: "Those details are not recognised.", status: 401 };
  }
  attempts.delete(email);
  return { ok: true, email };
}
