export const RANGE_PRESETS = {
  today: "Today",
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
  "12m": "12 months",
} as const;

export type RangeKey = keyof typeof RANGE_PRESETS;

export type DateRange = {
  key: RangeKey;
  label: string;
  start: Date;
  end: Date;
  /** The equal-length period immediately before, for "vs previous" deltas. */
  prevStart: Date;
  prevEnd: Date;
  bucket: "hour" | "day" | "month";
};

export function parseRange(value: string | string[] | undefined): DateRange {
  const key = (
    typeof value === "string" && value in RANGE_PRESETS ? value : "30d"
  ) as RangeKey;

  const end = new Date();
  const start = new Date(end);
  let bucket: DateRange["bucket"] = "day";

  switch (key) {
    case "today":
      start.setHours(0, 0, 0, 0);
      bucket = "hour";
      break;
    case "7d":
      start.setDate(start.getDate() - 7);
      break;
    case "30d":
      start.setDate(start.getDate() - 30);
      break;
    case "90d":
      start.setDate(start.getDate() - 90);
      break;
    case "12m":
      start.setMonth(start.getMonth() - 12);
      bucket = "month";
      break;
  }

  const length = end.getTime() - start.getTime();
  return {
    key,
    label: RANGE_PRESETS[key],
    start,
    end,
    prevStart: new Date(start.getTime() - length),
    prevEnd: start,
    bucket,
  };
}

export function bucketLabel(d: Date, bucket: DateRange["bucket"]) {
  if (bucket === "hour")
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (bucket === "month")
    return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
