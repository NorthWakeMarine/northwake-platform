"use server";

import { headers } from "next/headers";

export type LoginState = {
  error?: string;
};

// Per-instance in-memory rate limiting.
// Swap Map → Upstash Redis when deploying to distributed infra.
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS  = 15 * 60 * 1000; // 15 minutes

function getClientIp(headersList: Awaited<ReturnType<typeof headers>>): string {
  return (
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ??
    headersList.get("x-real-ip") ??
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const rec = loginAttempts.get(ip);
  if (!rec) return false;
  if (rec.lockedUntil && Date.now() < rec.lockedUntil) return true;
  if (rec.lockedUntil && Date.now() >= rec.lockedUntil) {
    loginAttempts.delete(ip);
  }
  return false;
}

function recordFailure(ip: string): void {
  const rec = loginAttempts.get(ip) ?? { count: 0, lockedUntil: 0 };
  rec.count += 1;
  if (rec.count >= MAX_ATTEMPTS) rec.lockedUntil = Date.now() + LOCKOUT_MS;
  loginAttempts.set(ip, rec);
}

// Fixed-duration delay prevents timing-based username enumeration
async function secureDelay(): Promise<void> {
  await new Promise(r => setTimeout(r, 600 + Math.random() * 200));
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const headersList = await headers();
  const ip = getClientIp(headersList);

  if (checkRateLimit(ip)) {
    await secureDelay();
    return { error: "Too many sign-in attempts. Please wait 15 minutes and try again." };
  }

  const username = formData.get("username");
  const password = formData.get("password");

  // Server-side input validation — never trust client maxLength
  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username.length === 0 ||
    username.length > 64  ||
    password.length === 0 ||
    password.length > 128
  ) {
    await secureDelay();
    recordFailure(ip);
    return { error: "Invalid credentials." };
  }

  // Strip non-printable characters
  const cleanUsername = username.replace(/[^\x20-\x7E]/g, "").trim();
  if (!cleanUsername) {
    await secureDelay();
    recordFailure(ip);
    return { error: "Invalid credentials." };
  }

  // ─── Authentication ───────────────────────────────────────────────────────
  // Placeholder: reject all until Supabase auth is wired up.
  //
  // Replace this block with:
  //   const { data, error } = await supabase.auth.signInWithPassword({
  //     email: cleanUsername,
  //     password,
  //   });
  //   if (error) { recordFailure(ip); await secureDelay(); return { error: "Invalid credentials." }; }
  //   // set httpOnly session cookie, then:
  //   redirect("/pro/dashboard");
  // ─────────────────────────────────────────────────────────────────────────

  await secureDelay();
  recordFailure(ip);
  return { error: "Invalid credentials." };
}
