import { AMOUNTS_IN_MINOR_UNITS, LEONES_PER_VYBECOIN } from "./config";

const int = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function toLeones(raw: number) {
  return AMOUNTS_IN_MINOR_UNITS ? raw / 100 : raw;
}

export function formatLeones(amount: number, opts?: { compact?: boolean }) {
  return `Le ${opts?.compact ? compact.format(amount) : int.format(amount)}`;
}

export function formatNumber(n: number, opts?: { compact?: boolean }) {
  return opts?.compact ? compact.format(n) : int.format(n);
}

export function formatPercent(ratio: number) {
  return `${(ratio * 100).toFixed(1)}%`;
}

export function formatCoins(n: number) {
  return `${int.format(n)} VC`;
}

export function coinsToLeones(coins: number) {
  return coins * LEONES_PER_VYBECOIN;
}

/** Relative change vs previous period; null when there's no baseline. */
export function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / previous;
}

export function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
