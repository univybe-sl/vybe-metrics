import { BookOpen, CheckCircle2, GraduationCap, UserPlus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { BarTrend } from "@/components/charts";
import { PageHeader } from "@/components/page-header";
import { DashboardSkeleton, DemoNotice, KpiCard, KpiGrid, Panel, SimpleTable, StatusChip } from "@/components/ui";
import { getDataSource } from "@/lib/data";
import { COMPLETION_MIN_ENROLLMENT_AGE_DAYS } from "@/lib/config";
import { formatCoins, formatLeones, formatNumber, formatPercent } from "@/lib/format";
import { parseRange } from "@/lib/range";

export default function CoursesPage({ searchParams }: PageProps<"/courses">) {
  return (
    <>
      <PageHeader title="Courses" subtitle="Enrollments, completion and earnings per course." />
      <Suspense fallback={<DashboardSkeleton />}>
        <CoursesContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function CoursesContent({ searchParams }: { searchParams: PageProps<"/courses">["searchParams"] }) {
  // Must come first: it marks this render as request-time (see getDataSource).
  const db = await getDataSource();
  const range = parseRange((await searchParams).range);
  const d = await db.getCourses(range);

  return (
    <>
      <DemoNotice show={db.isDemo} />
      <KpiGrid>
        <KpiCard highlight title="Published courses" icon={BookOpen} value={formatNumber(d.publishedCourses)} footnote={`+ ${formatNumber(d.draftCourses)} in draft or review`} />
        <KpiCard title="Enrollments" icon={UserPlus} value={formatNumber(d.enrollments.value)} current={d.enrollments.value} previous={d.enrollments.previous} />
        <KpiCard title="Completions" icon={CheckCircle2} value={formatNumber(d.completions.value)} current={d.completions.value} previous={d.completions.previous} />
        <KpiCard title="Completion rate" icon={GraduationCap} value={formatPercent(d.completionRate.value)} current={d.completionRate.value} previous={d.completionRate.previous} />
      </KpiGrid>

      <Panel title="Enrollments" description={range.label}>
        <BarTrend data={d.enrollmentSeries} format="number" />
      </Panel>

      <Panel title="All courses" description={`Period figures for ${range.label}; completion rate is all-time. Enrollments under ${COMPLETION_MIN_ENROLLMENT_AGE_DAYS} days old are excluded from the headline rate.`}>
        <SimpleTable head={["Course", "Status", "Enrollments", "Completions", "Completion rate", "Revenue (Le)", "Vybecoins awarded"]} empty={d.courses.length === 0}>
          {d.courses.map((c) => (
            <tr key={c.id}>
              <td>
                <Link href={`/courses/${c.id}?range=${range.key}`} className="font-medium hover:text-accent">
                  {c.title}
                </Link>
              </td>
              <td>
                <StatusChip status={c.status} />
              </td>
              <td>{formatNumber(c.enrollments)}</td>
              <td>{formatNumber(c.completions)}</td>
              <td>{formatPercent(c.completionRate)}</td>
              <td>{c.isPaid ? formatLeones(c.revenue) : <span className="text-muted">Free</span>}</td>
              <td>{formatCoins(c.coinsAwarded)}</td>
            </tr>
          ))}
        </SimpleTable>
      </Panel>
    </>
  );
}
