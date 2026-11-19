import { Card, Chip } from "@heroui/react";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { formatPercent, percentChange } from "@/lib/format";
import Link from "next/link";
import { CountUp, Stagger, StaggerItem } from "./motion";

export function Delta({ value, previous, inverse, onAccent }: { value: number; previous: number; inverse?: boolean; onAccent?: boolean }) {
  const change = percentChange(value, previous);
  if (change === null) return <span className={`text-xs ${onAccent ? "text-accent-foreground/80" : "text-muted"}`}>no prior data</span>;
  const up = change >= 0;
  const good = inverse ? !up : up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="flex items-center gap-1.5 text-xs">
      {onAccent ? (
        <span className="flex items-center gap-0.5 rounded-full bg-white px-1.5 py-0.5 font-semibold text-accent">
          <Icon size={12} />
          {formatPercent(Math.abs(change))}
        </span>
      ) : (
        <Chip size="sm" color={good ? "success" : "danger"} variant="soft">
          <Icon size={12} />
          {formatPercent(Math.abs(change))}
        </Chip>
      )}
      <span className={onAccent ? "text-accent-foreground/80" : "text-muted"}>vs previous period</span>
    </span>
  );
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  current,
  previous,
  highlight,
  inverse,
  footnote,
  href,
}: {
  /** Makes the card a link (with a hover lift); used on the overview. */
  href?: string;
  title: string;
  value: string;
  icon: LucideIcon;
  current?: number;
  previous?: number;
  highlight?: boolean;
  inverse?: boolean;
  footnote?: string;
}) {
  const card = (
    <Card
      className={`relative h-full overflow-hidden rounded-3xl ${
        href ? "transition-transform duration-200 group-hover:-translate-y-0.5" : ""
      } ${highlight ? "bg-accent text-accent-foreground" : ""}`}
    >
      {highlight && (
        <div aria-hidden className="pointer-events-none absolute -right-8 -bottom-10 size-36 rounded-full bg-white/15 blur-[1px]" />
      )}
      <Card.Header className="flex flex-row items-center gap-2">
        <span
          className={`flex size-8 items-center justify-center rounded-full ${
            highlight ? "bg-white text-accent" : "bg-default text-foreground"
          }`}
        >
          <Icon size={16} />
        </span>
        <Card.Title className={`text-sm font-medium ${highlight ? "text-accent-foreground" : ""}`}>{title}</Card.Title>
      </Card.Header>
      <Card.Content className="gap-2">
        <p className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
          <CountUp value={value} id={title} />
        </p>
        {current !== undefined && previous !== undefined ? (
          <Delta value={current} previous={previous} inverse={inverse} onAccent={highlight} />
        ) : (
          footnote && <span className={`text-xs ${highlight ? "text-accent-foreground/80" : "text-muted"}`}>{footnote}</span>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <StaggerItem>
      {href ? (
        <Link href={href} aria-label={`${title}: see details`} className="group block h-full rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          {card}
        </Link>
      ) : (
        card
      )}
    </StaggerItem>
  );
}

export function Panel({ title, description, action, children, className = "" }: { title: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={`rounded-3xl ${className}`}>
      <Card.Header className="flex flex-row items-start justify-between gap-2">
        <div>
          <Card.Title className="font-heading text-lg font-semibold">{title}</Card.Title>
          {description && <Card.Description className="text-xs">{description}</Card.Description>}
        </div>
        {action}
      </Card.Header>
      <Card.Content>{children}</Card.Content>
    </Card>
  );
}

export function DemoNotice({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div role="status" className="rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
      <strong>Demo data.</strong> No <code>DATABASE_URL</code> is configured, so these numbers are
      generated samples, not Univybe&apos;s real data.
    </div>
  );
}

/** Colour a free-form status string from the app (e.g. "paid", "pending", "rejected"). */
export function StatusChip({ status }: { status: string }) {
  const s = status.toLowerCase();
  const color = /reject|fail|cancel|expire/.test(s)
    ? "danger"
    : /paid|complete|success|processed|approved|published/.test(s)
      ? "success"
      : /draft/.test(s)
        ? "default"
        : "warning";
  return (
    <Chip size="sm" variant="soft" color={color}>
      {status.replace(/_/g, " ")}
    </Chip>
  );
}

export function KpiGrid({ children }: { children: ReactNode }) {
  return (
    <Stagger as="section" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {children}
    </Stagger>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-sm text-muted">{children}</p>;
}

export function SimpleTable({ head, children, empty }: { head: string[]; children: ReactNode; empty?: boolean }) {
  return (
    <div className="-mx-2 overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-separator text-xs text-muted">
            {head.map((h, i) => (
              <th key={h} className={`px-2 py-2 font-medium ${i > 0 ? "text-right" : ""}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_td]:px-2 [&_td]:py-2.5 [&_tr]:border-b [&_tr]:border-separator [&_tr:last-child]:border-0 [&_td:not(:first-child)]:text-right [&_td]:tabular-nums">
          {children}
        </tbody>
      </table>
      {empty && <EmptyState>Nothing in this period.</EmptyState>}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4" aria-busy="true" aria-label="Loading data">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-36 rounded-3xl bg-surface" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-80 rounded-3xl bg-surface" />
        <div className="h-80 rounded-3xl bg-surface" />
      </div>
    </div>
  );
}
