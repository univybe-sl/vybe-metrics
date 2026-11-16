"use client";

import { useId, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CoinFlowPoint, Point } from "@/lib/data/types";

type Fmt = "leones" | "number" | "coins";

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const full = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function fmt(kind: Fmt, v: number, short = false) {
  const n = short ? compact.format(v) : full.format(v);
  return kind === "leones" ? `Le ${n}` : kind === "coins" ? `${n} VC` : n;
}

const tooltipStyle = {
  contentStyle: {
    background: "var(--overlay)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    color: "var(--overlay-foreground)",
    fontSize: 12,
  },
  labelStyle: { color: "var(--muted)", marginBottom: 4 },
};

const axis = { tickLine: false, axisLine: false, minTickGap: 16 } as const;

/** Smooth area line with soft accent gradient — "Marketing performance" style. */
export function AreaTrend({ data, format, height = 260 }: { data: Point[]; format: Fmt; height?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--separator)" />
          <XAxis dataKey="label" {...axis} />
          <YAxis {...axis} width={64} tickFormatter={(v: number) => fmt(format, v, true)} />
          <Tooltip {...tooltipStyle} formatter={(v) => [fmt(format, Number(v)), ""]} separator="" />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--accent)"
            strokeWidth={2.5}
            fill={`url(#g${id})`}
            activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2, fill: "var(--accent)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Rounded pill bars; the hovered (or latest) bar is solid accent — "Sales trends" style. */
export function BarTrend({ data, format, height = 260 }: { data: Point[]; format: Fmt; height?: number }) {
  const [active, setActive] = useState<number | null>(null);
  const highlighted = active ?? data.length - 1;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          onMouseMove={(s) => setActive(typeof s?.activeTooltipIndex === "number" ? s.activeTooltipIndex : null)}
          onMouseLeave={() => setActive(null)}
        >
          <CartesianGrid vertical={false} stroke="var(--separator)" />
          <XAxis dataKey="label" {...axis} />
          <YAxis {...axis} width={48} allowDecimals={false} tickFormatter={(v: number) => fmt(format, v, true)} />
          <Tooltip {...tooltipStyle} cursor={false} formatter={(v) => [fmt(format, Number(v)), ""]} separator="" />
          <Bar dataKey="value" radius={[999, 999, 999, 999]} maxBarSize={36}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === highlighted ? "var(--accent)" : "var(--chart-muted)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const COIN_SERIES: Record<string, string> = { earned: "Earned by students", cashedOut: "Cashed out for Leones" };

/** Vybecoins earned by students vs cashed out, per bucket. */
export function CoinFlowChart({ data, height = 260 }: { data: CoinFlowPoint[]; height?: number }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
          <CartesianGrid vertical={false} stroke="var(--separator)" />
          <XAxis dataKey="label" {...axis} />
          <YAxis {...axis} width={56} allowDecimals={false} tickFormatter={(v: number) => fmt("coins", v, true)} />
          <Tooltip {...tooltipStyle} formatter={(v, name) => [fmt("coins", Number(v)), COIN_SERIES[String(name)] ?? name]} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(v: string) => <span className="text-xs text-muted">{COIN_SERIES[v] ?? v}</span>}
          />
          <Bar dataKey="earned" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={18} />
          <Bar dataKey="cashedOut" fill="var(--chart-muted)" radius={[6, 6, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
