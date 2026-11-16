import { Suspense } from "react";
import { RangePicker, RefreshButton } from "./header-controls";

export function PageHeader({ title, subtitle, showRange = true }: { title: string; subtitle: string; showRange?: boolean }) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {showRange && (
          <Suspense fallback={<div className="h-9 w-80 rounded-full bg-surface" />}>
            <RangePicker />
          </Suspense>
        )}
        <RefreshButton />
      </div>
    </header>
  );
}
