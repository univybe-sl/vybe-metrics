import { Activity, GraduationCap, UserPlus, Users } from "lucide-react";
import { Suspense } from "react";
import { BarTrend } from "@/components/charts";
import { PageHeader } from "@/components/page-header";
import { DashboardSkeleton, DemoNotice, KpiCard, Panel, SimpleTable } from "@/components/ui";
import { getDataSource } from "@/lib/data";
import { formatCoins, formatDate, formatNumber } from "@/lib/format";
import { parseRange } from "@/lib/range";

export default function UsersPage({ searchParams }: PageProps<"/users">) {
  return (
    <>
      <PageHeader title="Users" subtitle="Student signups, activity and individual accounts." />
      <Suspense fallback={<DashboardSkeleton />}>
        <UsersContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function UsersContent({ searchParams }: { searchParams: PageProps<"/users">["searchParams"] }) {
  // Must come first: it marks this render as request-time (see getDataSource).
  const db = await getDataSource();
  const sp = await searchParams;
  const range = parseRange(sp.range);
  const search = typeof sp.q === "string" ? sp.q.trim() : "";
  const data = await db.getUsers(range, search || undefined);

  return (
    <>
      <DemoNotice show={db.isDemo} />
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard highlight title="Total students" icon={GraduationCap} value={formatNumber(data.totalUsers)} footnote="All time" />
        <KpiCard title="New students" icon={UserPlus} value={formatNumber(data.newUsers.value)} current={data.newUsers.value} previous={data.newUsers.previous} />
        <KpiCard title="Active students" icon={Activity} value={formatNumber(data.activeUsers.value)} current={data.activeUsers.value} previous={data.activeUsers.previous} />
        <KpiCard title="Staff" icon={Users} value={formatNumber(data.staffCount)} footnote="Tutors, contributors & admins" />
      </section>

      <Panel title="Signups" description={range.label}>
        <BarTrend data={data.signupSeries} format="number" />
      </Panel>

      <Panel
        title="Students"
        description={search ? `Matching “${search}”` : "Most recent 50"}
        action={
          <form role="search" className="flex gap-2">
            <input type="hidden" name="range" value={range.key} />
            <input
              name="q"
              defaultValue={search}
              placeholder="Search name or email…"
              aria-label="Search students"
              className="w-48 rounded-full bg-default px-4 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent sm:w-64"
            />
          </form>
        }
      >
        <SimpleTable head={["Student", "Joined", "Last active", "Vybecoins", "Courses"]} empty={data.users.length === 0}>
          {data.users.map((u) => (
            <tr key={u.id}>
              <td>
                <span className="block font-medium">{u.name}</span>
                <span className="text-xs text-muted">{u.email}</span>
              </td>
              <td>{formatDate(u.joinedAt)}</td>
              <td>{u.lastActiveAt ? formatDate(u.lastActiveAt) : "—"}</td>
              <td>{formatCoins(u.coinBalance)}</td>
              <td>{u.enrollments}</td>
            </tr>
          ))}
        </SimpleTable>
      </Panel>
    </>
  );
}
