import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { SESSION_COOKIE } from "../config";
import { verifySessionToken } from "../session";
import { demoSource } from "./demo";
import { sqlSource } from "./sql";
import type { DataSource } from "./types";

/**
 * The single gateway to dashboard data.
 *  - Re-checks the session (the proxy is only the first line of defence).
 *  - connection() marks the caller as request-time, so every page load
 *    runs fresh, uncached queries.
 *  - Falls back to clearly-labelled demo data when DATABASE_URL is unset.
 */
export async function getDataSource(): Promise<DataSource> {
  // cookies() alone can be part of the prefetched App Shell; connection()
  // guarantees this runs per request, so the clock reads below are safe.
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await verifySessionToken(token))) redirect("/login");
  return process.env.DATABASE_URL ? sqlSource : demoSource;
}

export type * from "./types";
