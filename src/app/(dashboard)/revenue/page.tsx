import { ArrowDownToLine, BookOpen, Coins, Hourglass, Library, PiggyBank, Scale, Wallet } from "lucide-react";
import { Suspense } from "react";
import { AreaTrend, CoinFlowChart } from "@/components/charts";
import { PageHeader } from "@/components/page-header";
import { DashboardSkeleton, Delta, DemoNotice, KpiCard, KpiGrid, Panel, SimpleTable, StatusChip } from "@/components/ui";
import { getDataSource } from "@/lib/data";
import { formatCoins, formatDate, formatLeones, formatNumber } from "@/lib/format";
import { parseRange } from "@/lib/range";

export default function RevenuePage({ searchParams }: PageProps<"/revenue">) {
  return (
    <>
      <PageHeader title="Revenue & Vybecoins" subtitle="Leones coming in from sales, and Leones going out as vybecoin cash-outs." />
      <Suspense fallback={<DashboardSkeleton />}>
        <RevenueContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function RevenueContent({ searchParams }: { searchParams: PageProps<"/revenue">["searchParams"] }) {
  // Must come first: it marks this render as request-time (see getDataSource).
  const db = await getDataSource();
  const range = parseRange((await searchParams).range);
  const d = await db.getRevenue(range);
  const leonesPerCoin = d.rate.leones / d.rate.coins;

  return (
    <>
      <DemoNotice show={db.isDemo} />
      <KpiGrid>
        <KpiCard highlight title="Revenue received" icon={Wallet} value={formatLeones(d.revenue.value)} current={d.revenue.value} previous={d.revenue.previous} />
        <KpiCard title="Course payments" icon={BookOpen} value={formatLeones(d.courseRevenue.value)} current={d.courseRevenue.value} previous={d.courseRevenue.previous} />
        <KpiCard title="Resource access packs" icon={Library} value={formatLeones(d.resourceRevenue.value)} current={d.resourceRevenue.value} previous={d.resourceRevenue.previous} />
        <KpiCard title="Paid out to students" icon={ArrowDownToLine} value={formatLeones(d.payouts.value)} current={d.payouts.value} previous={d.payouts.previous} inverse />
      </KpiGrid>

      <section className="grid gap-4 lg:grid-cols-5">
        <Panel className="lg:col-span-3" title="Revenue over time" description={`Paid course + resource purchases · ${range.label}`}>
          <AreaTrend data={d.revenueSeries} format="leones" height={280} />
        </Panel>
        <Panel className="lg:col-span-2" title="Net position" description={range.label}>
          <dl className="flex flex-col gap-4 text-sm">
            <Row label="Revenue received" value={formatLeones(d.revenue.value)} />
            <Row label="Paid out (vybecoin cash-outs)" value={`− ${formatLeones(d.payouts.value)}`} />
            <div className="flex items-center justify-between gap-2 rounded-2xl bg-default p-3">
              <dt className="flex items-center gap-2 font-medium">
                <Scale size={16} /> Net
              </dt>
              <dd className="text-right">
                <span className={`block text-lg font-semibold tabular-nums ${d.netRevenue.value < 0 ? "text-danger" : ""}`}>
                  {formatLeones(d.netRevenue.value)}
                </span>
                <Delta value={d.netRevenue.value} previous={d.netRevenue.previous} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-warning/40 bg-warning/10 p-3">
              <dt className="flex items-center gap-2 font-medium">
                <Hourglass size={16} /> Pending cash-outs
              </dt>
              <dd className="text-right">
                <span className="block font-semibold tabular-nums">{formatLeones(d.pendingPayouts.leones)}</span>
                <span className="text-xs text-muted">{formatNumber(d.pendingPayouts.count)} requests awaiting payout</span>
              </dd>
            </div>
          </dl>
        </Panel>
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <Panel className="lg:col-span-3" title="Vybecoin flow" description={`Earned by students vs cashed out · ${range.label}`}>
          <CoinFlowChart data={d.coinFlow} />
        </Panel>
        <Panel
          className="lg:col-span-2"
          title="Vybecoin summary"
          description={`Current rate: ${formatNumber(d.rate.coins)} VC = ${formatLeones(d.rate.leones)}`}
        >
          <dl className="flex flex-col gap-4 text-sm">
            {[
              { label: "Earned by students", k: d.coinsEarned },
              { label: "Cashed out", k: d.coinsCashedOut },
            ].map(({ label, k }) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-2 text-muted">
                  <Coins size={14} /> {label}
                </dt>
                <dd className="text-right">
                  <span className="block font-semibold tabular-nums">{formatCoins(k.value)}</span>
                  <Delta value={k.value} previous={k.previous} />
                </dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-2 rounded-2xl bg-default p-3">
              <dt className="flex items-center gap-2 font-medium">
                <PiggyBank size={16} /> Outstanding liability
              </dt>
              <dd className="text-right">
                <span className="block font-semibold tabular-nums">{formatLeones(d.outstandingCoins * leonesPerCoin)}</span>
                <span className="text-xs text-muted">{formatCoins(d.outstandingCoins)} held by students</span>
              </dd>
            </div>
          </dl>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title="Recent payments" description="Latest 25 · money in">
          <SimpleTable head={["Student", "For", "Amount", "Status", "Date"]} empty={d.recentPayments.length === 0}>
            {d.recentPayments.map((p) => (
              <tr key={p.id}>
                <td className="font-medium">{p.userName}</td>
                <td className="text-muted">{p.description}</td>
                <td>{formatLeones(p.amount)}</td>
                <td>
                  <StatusChip status={p.status} />
                </td>
                <td>{formatDate(p.createdAt)}</td>
              </tr>
            ))}
          </SimpleTable>
        </Panel>
        <Panel title="Recent cash-outs" description="Latest 25 · money out">
          <SimpleTable head={["Student", "Request", "Leones", "Status", "Date"]} empty={d.recentCashOuts.length === 0}>
            {d.recentCashOuts.map((x) => (
              <tr key={x.id}>
                <td className="font-medium">{x.userName}</td>
                <td className="text-muted">{x.description}</td>
                <td>{formatLeones(x.amount)}</td>
                <td>
                  <StatusChip status={x.status} />
                </td>
                <td>{formatDate(x.createdAt)}</td>
              </tr>
            ))}
          </SimpleTable>
        </Panel>
      </section>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
