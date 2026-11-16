import { BookOpen, Coins, GraduationCap, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { AreaTrend, BarTrend, CoinFlowChart } from "@/components/charts";
import { PageHeader } from "@/components/page-header";
import { DashboardSkeleton, DemoNotice, EmptyState, KpiCard, KpiGrid, Panel } from "@/components/ui";
import { getDataSource } from "@/lib/data";
import { formatCoins, formatLeones, formatNumber, formatPercent } from "@/lib/format";
import { parseRange } from "@/lib/range";

export default function OverviewPage({ searchParams }: PageProps<"/">) {
  return (
    <>
      <PageHeader title="Dashboard Overview" subtitle="What's happening across Univybe — users, money and learning at a glance." />
      <Suspense fallback={<DashboardSkeleton />}>
        <Overview searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Overview({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  // Must come first: it marks this render as request-time (see getDataSource).
  const db = await getDataSource();
  const range = parseRange((await searchParams).range);
  const data = await db.getOverview(range);
  const qs = `?range=${range.key}`;

  return (
    <>
      <DemoNotice show={db.isDemo} />
      <KpiGrid>
        <KpiCard highlight title="Revenue" icon={Wallet} value={formatLeones(data.revenue.value)} current={data.revenue.value} previous={data.revenue.previous} />
        <KpiCard title="New students" icon={Users} value={formatNumber(data.newUsers.value)} current={data.newUsers.value} previous={data.newUsers.previous} />
        <KpiCard title="Vybecoins earned" icon={Coins} value={formatCoins(data.coinsEarned.value)} current={data.coinsEarned.value} previous={data.coinsEarned.previous} />
        <KpiCard title="Completion rate" icon={GraduationCap} value={formatPercent(data.completionRate.value)} current={data.completionRate.value} previous={data.completionRate.previous} />
      </KpiGrid>

      <section className="grid gap-4 lg:grid-cols-5">
        <Panel className="lg:col-span-3" title="Revenue" description={`Leones received · ${range.label}`} action={<Link href={`/revenue${qs}`} className="text-xs font-medium text-accent">Details →</Link>}>
          <AreaTrend data={data.revenueSeries} format="leones" />
        </Panel>
        <Panel className="lg:col-span-2" title="Signups" description={`New students · ${range.label}`} action={<Link href={`/users${qs}`} className="text-xs font-medium text-accent">Details →</Link>}>
          <BarTrend data={data.signupSeries} format="number" />
        </Panel>
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <Panel className="lg:col-span-3" title="Vybecoin flow" description={`Earned by students vs cashed out · ${range.label}`}>
          <CoinFlowChart data={data.coinFlow} />
        </Panel>
        <Panel className="lg:col-span-2" title="Top courses" description={`By enrollments · ${range.label}`} action={<Link href={`/courses${qs}`} className="text-xs font-medium text-accent">All →</Link>}>
          {data.topCourses.length === 0 ? (
            <EmptyState>No enrollments in this period.</EmptyState>
          ) : (
            <ol className="flex flex-col gap-3">
              {data.topCourses.map((c, i) => (
                <li key={c.id}>
                  <Link href={`/courses/${c.id}${qs}`} className="flex items-center gap-3 rounded-2xl p-1 transition hover:bg-default">
                    <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${i === 0 ? "bg-accent text-accent-foreground" : "bg-default"}`}>
                      {i === 0 ? <BookOpen size={14} /> : i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{c.title}</span>
                      <span className="text-xs text-muted">
                        {formatNumber(c.enrollments)} enrolled · {formatPercent(c.completionRate)} complete
                      </span>
                    </span>
                    <span className="text-right text-xs tabular-nums">
                      <span className="block font-semibold text-accent">{c.isPaid ? formatLeones(c.revenue) : "Free"}</span>
                      <span className="text-muted">{formatCoins(c.coinsAwarded)} awarded</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </section>
    </>
  );
}
