/**
 * Business constants agreed with Univybe. Change them here, nowhere else.
 */

/** Fallback vybecoin cash-out rate (1000 VC = Le 100), used only if the
 *  `coin_exchange_settings` table has no row. The live rate comes from the DB.
 *  Cash-outs always use the stored `leone_amount`, never this rate. */
export const LEONES_PER_VYBECOIN = 100 / 1000;

/** Set to true if payment amounts are stored in cents (e.g. 50000 = Le 500.00). */
export const AMOUNTS_IN_MINOR_UNITS = false;

/** Enrollments younger than this are excluded from completion rate so new
 *  students don't drag it down. */
export const COMPLETION_MIN_ENROLLMENT_AGE_DAYS = 14;

export const SESSION_COOKIE = "uv_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
