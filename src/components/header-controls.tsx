"use client";

import { Button } from "@heroui/react";
import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { RANGE_PRESETS, type RangeKey } from "@/lib/range";

export function RangePicker() {
  const pathname = usePathname();
  const params = useSearchParams();
  const current = (params.get("range") as RangeKey) ?? "30d";

  return (
    <div role="group" aria-label="Date range" className="flex flex-wrap gap-1 rounded-full bg-surface p-1">
      {(Object.keys(RANGE_PRESETS) as RangeKey[]).map((key) => {
        const next = new URLSearchParams(params);
        next.set("range", key);
        const active = key === current;
        return (
          <Link
            key={key}
            href={`${pathname}?${next}`}
            aria-current={active ? "true" : undefined}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              active ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            {RANGE_PRESETS[key]}
          </Link>
        );
      })}
    </div>
  );
}

export function RefreshButton() {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button variant="primary" size="sm" onPress={() => start(() => router.refresh())} isDisabled={pending}>
      <RefreshCw size={14} className={pending ? "animate-spin" : ""} />
      {pending ? "Updating…" : "Update data"}
    </Button>
  );
}
