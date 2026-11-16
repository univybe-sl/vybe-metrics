import "server-only";

/**
 * Best-effort in-memory login throttle: 5 failed attempts per IP per 15 min.
 * On Vercel each serverless instance has its own memory, so this slows
 * guessing rather than guaranteeing a hard limit. Swap for Upstash/Redis
 * if a strict limit is ever needed.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const failures = new Map<string, { count: number; resetAt: number }>();

export function isLocked(ip: string) {
  const entry = failures.get(ip);
  if (!entry) return false;
  if (entry.resetAt < Date.now()) {
    failures.delete(ip);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

export function recordFailure(ip: string) {
  const now = Date.now();
  const entry = failures.get(ip);
  if (!entry || entry.resetAt < now) {
    failures.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count++;
  }
}

export function clearFailures(ip: string) {
  failures.delete(ip);
}
