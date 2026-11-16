import { CheckCircle2, Coins, GraduationCap, UserPlus, Wallet } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AreaTrend, BarTrend } from "@/components/charts";
import { PageHeader } from "@/components/page-header";
import { DashboardSkeleton, DemoNotice, KpiCard, Panel, SimpleTable } from "@/components/ui";
import { getDataSource } from "@/lib/data";
import { formatCoins, formatDate, formatLeones, formatNumber, formatPercent } from "@/lib/format";
import { parseRange } from "@/lib/range";

export default function CourseDetailPage(props: PageProps<"/courses/[id]">) {
  return (
    <>
      <PageHeader title="Course detail" subtitle="Enrollment and completion for a single course." />
      <Suspense fallback={<DashboardSkeleton />}>
        <CourseContent {...props} />
      </Suspense>
    </>
  );
}

async function CourseContent({ params, searchParams }: PageProps<"/courses/[id]">) {
  // Must come first: it marks this render as request-time (see getDataSource).
  const db = await getDataSource();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const range = parseRange(sp.range);
  const d = await db.getCourseDetail(id, range);
  if (!d) notFound();
  const c = d.course;

  return (
    <>
      <DemoNotice show={db.isDemo} />
      <div className="flex items-center gap-2 text-sm">
        <Link href={`/courses?range=${range.key}`} className="text-muted hover:text-foreground">
          Courses
        </Link>
        <span className="text-muted">/</span>
        <h2 className="font-semibold">{c.title}</h2>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard highlight title="Enrollments" icon={UserPlus} value={formatNumber(c.enrollments)} footnote={range.label} />
        <KpiCard title="Completions" icon={CheckCircle2} value={formatNumber(c.completions)} footnote={range.label} />
        <KpiCard title="Completion rate" icon={GraduationCap} value={formatPercent(c.completionRate)} footnote="All time" />
        <KpiCard title="Revenue" icon={Wallet} value={c.isPaid ? formatLeones(c.revenue) : "Free"} footnote={c.isPaid ? range.label : "Free course"} />
        <KpiCard title="Vybecoins awarded" icon={Coins} value={formatCoins(c.coinsAwarded)} footnote={range.label} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title="Enrollments" description={range.label}>
          <BarTrend data={d.enrollmentSeries} format="number" />
        </Panel>
        <Panel title="Completions" description={range.label}>
          <AreaTrend data={d.completionSeries} format="number" />
        </Panel>
      </section>

      <Panel title="Recent enrollments" description="Latest 25">
        <SimpleTable head={["Student", "Enrolled", "Progress", "Completed"]} empty={d.recentEnrollments.length === 0}>
          {d.recentEnrollments.map((e, i) => (
            <tr key={i}>
              <td className="font-medium">{e.userName}</td>
              <td>{formatDate(e.enrolledAt)}</td>
              <td>{formatPercent(e.progress)}</td>
              <td>{e.completedAt ? formatDate(e.completedAt) : <span className="text-muted">In progress</span>}</td>
            </tr>
          ))}
        </SimpleTable>
      </Panel>
    </>
  );
}
