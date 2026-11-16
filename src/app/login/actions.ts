"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/config";
import { clearFailures, isLocked, recordFailure } from "@/lib/rate-limit";
import { createSessionToken, safeEqual } from "@/lib/session";

export type LoginState = { error?: string } | undefined;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) return { error: "DASHBOARD_PASSWORD is not configured on the server." };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";

  if (isLocked(ip)) {
    return { error: "Too many attempts. Try again in 15 minutes." };
  }

  const password = String(formData.get("password") ?? "");
  if (!safeEqual(password, expected)) {
    recordFailure(ip);
    return { error: "Incorrect password." };
  }

  clearFailures(ip);
  (await cookies()).set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  redirect("/");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
