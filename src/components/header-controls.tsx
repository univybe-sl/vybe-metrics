"use client";

import { Button } from "@heroui/react";
import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { usePageMotion } from "@/components/motion";
import { RANGE_PRESETS, type RangeKey } from "@/lib/range";

export function RangePicker() {
  const pathname = usePathname();
  const params = useSearchParams();
  const current = (params.get("range") as RangeKey) ?? "30d";
  // Navigate inside the page's transition so content dims (not blanks) while loading.
  const { navigate, pending } = usePageMotion();
  const [clicked, setClicked] = useState<RangeKey | null>(null);
  const loadingKey = pending ? clicked : null;

  return (
    <div role="group" aria-label="Date range" className="flex flex-wrap gap-1 rounded-full bg-surface p-1">
      {(Object.keys(RANGE_PRESETS) as RangeKey[]).map((key) => {
        const next = new URLSearchParams(params);
        next.set("range", key);
        const href = `${pathname}?${next}`;
        const active = key === current;
        const loading = key === loadingKey;
        return (
          <Link
            key={key}
            href={href}
            scroll={false}
            onClick={(e) => {
              // Let modified clicks (new tab etc.) behave like normal links.
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              e.preventDefault();
              if (active) return;
              setClicked(key);
              navigate(href);
            }}
            aria-current={active ? "true" : undefined}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              active
                ? "bg-accent text-accent-foreground"
                : loading
                  ? "bg-accent/15 text-accent animate-pulse"
                  : "text-muted hover:text-foreground"
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
