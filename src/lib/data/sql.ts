import "server-only";
import { neon } from "@neondatabase/serverless";
import { COMPLETION_MIN_ENROLLMENT_AGE_DAYS, LEONES_PER_VYBECOIN } from "../config";
import { toLeones } from "../format";
import { bucketLabel, type DateRange } from "../range";
import type { CoinFlowPoint, CourseRow, DataSource, Kpi, MoneyRow, Point } from "./types";

/*
 * Queries against Univybe's real Neon schema (Laravel app, inspected 2026-11-16).
 *
 *   students                     learners (the dashboard's "users"); coins_available/_reserved/_redeemed
 *   creation_users               staff: tutors, contributors, admins
 *   courses                      status 'draft' | 'published' …; is_paid, price, coin_reward
 *   student_course_progress      one row per enrollment; progress_percent, completed_at
 *   course_payments              Leones in (Monime) — counted as revenue once paid_at is set
 *   resource_access_purchases    Leones in (resource-access packs) — same rule
 *   coin_transactions            vybecoin ledger; positive available_delta without exchange_id = earned
 *   coin_exchanges               students cashing coins out for Leones via mobile money (money OUT)
 *   coin_exchange_settings       current coin → Leone rate (latest row)
 *
 * Status strings in payment/exchange tables are not yet confirmed (tables were
 * empty when inspected), so success is judged by timestamps (paid_at /
 * processed_at) and rejection fields wherever possible.
 *
 * All timestamps are `timestamp without time zone` holding GMT, so range
 * bounds are converted with `at time zone 'UTC'` (S / E below).
 */

type Row = Record<string, unknown>;

function client() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

async function q<T extends Row = Row>(text: string, params: unknown[] = []) {
  return (await client().query(text, params)) as T[];
}

const num = (v: unknown) => Number(v ?? 0);
const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null);

/** Range start / end as GMT wall-clock timestamps ($1 / $2). */
const S = `($1::timestamptz at time zone 'UTC')`;
const E = `($2::timestamptz at time zone 'UTC')`;

/** Every Leone that came in, from both paid products. */
const PAYMENTS = `(
  select id, student_id, course_id, amount, status, paid_at, created_at, 'course' as kind, null::int as accesses
    from course_payments
  union all
  select id, student_id, null::bigint, amount, status, paid_at, created_at, 'resource', accesses
    from resource_access_purchases
)`;

/** Cash-outs that were actually paid to the student. */
const PAID_EXCHANGE = `x.processed_at is not null and x.rejection_reason is null
  and lower(x.status) not similar to '%(reject|fail|cancel|expire)%'`;
const PENDING_EXCHANGE = `x.processed_at is null and x.rejection_reason is null
  and lower(x.status) not similar to '%(reject|fail|cancel|expire)%'`;

/** Coins credited to a student that are not a returned/reversed cash-out. */
const EARNED = `t.available_delta > 0 and t.exchange_id is null`;

const STUDENT_NAME = `coalesce(nullif(trim(concat_ws(' ', s.firstname, s.lastname)), ''), s.email::text, '—')`;

function bounds(range: DateRange, prev = false) {
  return prev
    ? [range.prevStart.toISOString(), range.prevEnd.toISOString()]
    : [range.start.toISOString(), range.end.toISOString()];
}

/** Scalar aggregate `v` for the current and previous period. */
async function kpi(sqlText: string, range: DateRange): Promise<Kpi> {
  const [cur, prev] = await Promise.all([
    q<{ v: unknown }>(sqlText, bounds(range)),
    q<{ v: unknown }>(sqlText, bounds(range, true)),
  ]);
  return { value: num(cur[0]?.v), previous: num(prev[0]?.v) };
}

const leoneKpi = async (sqlText: string, range: DateRange): Promise<Kpi> => {
  const k = await kpi(sqlText, range);
  return { value: toLeones(k.value), previous: toLeones(k.previous) };
};

/**
 * Zero-filled time series. `inner` must select `bucket, value`, bucketing with
 * `date_trunc($3, <col>)` and filtering `<col> >= S and <col> < E`.
 */
async function series(inner: string, range: DateRange, extra: unknown[] = []): Promise<Point[]> {
  const rows = await q<{ bucket: string | Date; value: unknown }>(
    `with b as (
       select generate_series(date_trunc($3, ${S}), ${E}, ('1 ' || $3)::interval) as bucket
     ), d as (${inner})
     select b.bucket, coalesce(d.value, 0)::float8 as value
     from b left join d using (bucket) order by b.bucket`,
    [...bounds(range), range.bucket, ...extra],
  );
  return rows.map((r) => ({ label: bucketLabel(new Date(r.bucket), range.bucket), value: num(r.value) }));
}

const revenueSeries = async (range: DateRange) =>
  (
    await series(
      `select date_trunc($3, p.paid_at) as bucket, sum(p.amount) as value
       from ${PAYMENTS} p where p.paid_at >= ${S} and p.paid_at < ${E} group by 1`,
      range,
    )
  ).map((p) => ({ ...p, value: toLeones(p.value) }));

const signupSeries = (range: DateRange) =>
  series(
    `select date_trunc($3, created_at) as bucket, count(*) as value from students
     where deleted_at is null and created_at >= ${S} and created_at < ${E} group by 1`,
    range,
  );

async function coinFlow(range: DateRange): Promise<CoinFlowPoint[]> {
  const [earned, cashed] = await Promise.all([
    series(
      `select date_trunc($3, t.created_at) as bucket, sum(t.available_delta) as value
       from coin_transactions t where ${EARNED} and t.created_at >= ${S} and t.created_at < ${E} group by 1`,
      range,
    ),
    series(
      `select date_trunc($3, x.processed_at) as bucket, sum(x.coins) as value
       from coin_exchanges x where ${PAID_EXCHANGE} and x.processed_at >= ${S} and x.processed_at < ${E} group by 1`,
      range,
    ),
  ]);
  return earned.map((e, i) => ({ label: e.label, earned: e.value, cashedOut: cashed[i]?.value ?? 0 }));
}

const REVENUE_KPI = `select sum(p.amount) as v from ${PAYMENTS} p where p.paid_at >= ${S} and p.paid_at < ${E}`;
const NEW_STUDENTS_KPI = `select count(*) as v from students where deleted_at is null and created_at >= ${S} and created_at < ${E}`;
const COINS_EARNED_KPI = `select sum(t.available_delta) as v from coin_transactions t where ${EARNED} and t.created_at >= ${S} and t.created_at < ${E}`;

/** Cumulative completion rate as of period end, over enrollments old enough to judge. */
const COMPLETION_RATE_KPI = `
  select count(*) filter (where completed_at is not null and completed_at < ${E})::float8 / nullif(count(*), 0) as v
  from student_course_progress
  where created_at < ${E} - interval '${COMPLETION_MIN_ENROLLMENT_AGE_DAYS} days'
    and $1::timestamptz is not null`;

async function courseRows(range: DateRange, opts: { limit?: number; id?: string } = {}): Promise<CourseRow[]> {
  const rows = await q(
    `select c.id::text, c.title, c.status, c.is_paid,
       (select count(*) from student_course_progress e where e.course_id = c.id
          and e.created_at >= ${S} and e.created_at < ${E}) as enrollments,
       (select count(*) from student_course_progress e where e.course_id = c.id
          and e.completed_at >= ${S} and e.completed_at < ${E}) as completions,
       (select count(*) filter (where e.completed_at is not null)::float8 / nullif(count(*), 0)
          from student_course_progress e where e.course_id = c.id) as completion_rate,
       (select coalesce(sum(p.amount), 0) from course_payments p where p.course_id = c.id
          and p.paid_at >= ${S} and p.paid_at < ${E}) as revenue,
       (select coalesce(sum(t.available_delta), 0) from coin_transactions t where t.course_id = c.id
          and ${EARNED} and t.created_at >= ${S} and t.created_at < ${E}) as coins_awarded
     from courses c
     where c.deleted_at is null ${opts.id ? "and c.id::text = $3" : ""}
     order by enrollments desc, (c.status = 'published') desc, c.title
     ${opts.limit ? `limit ${Number(opts.limit)}` : ""}`,
    opts.id ? [...bounds(range), opts.id] : bounds(range),
  );
  return rows.map((r) => ({
    id: String(r.id),
    title: String(r.title),
    status: String(r.status),
    isPaid: Boolean(r.is_paid),
    enrollments: num(r.enrollments),
    completions: num(r.completions),
    completionRate: num(r.completion_rate),
    revenue: toLeones(num(r.revenue)),
    coinsAwarded: num(r.coins_awarded),
  }));
}

function paymentStatus(status: unknown, paidAt: unknown) {
  return paidAt ? "paid" : String(status ?? "unknown");
}

export const sqlSource: DataSource = {
  isDemo: false,

  async getOverview(range) {
    const [revenue, newUsers, coinsEarned, completionRate, rev, signups, flow, topCourses] = await Promise.all([
      leoneKpi(REVENUE_KPI, range),
      kpi(NEW_STUDENTS_KPI, range),
      kpi(COINS_EARNED_KPI, range),
      kpi(COMPLETION_RATE_KPI, range),
      revenueSeries(range),
      signupSeries(range),
      coinFlow(range),
      courseRows(range, { limit: 5 }),
    ]);
    return { revenue, newUsers, coinsEarned, completionRate, revenueSeries: rev, signupSeries: signups, coinFlow: flow, topCourses };
  },

  async getUsers(range, search) {
    const like = search ? `%${search}%` : null;
    const [counts, newUsers, activeUsers, signups, users] = await Promise.all([
      q(`select (select count(*) from students where deleted_at is null) as students,
                (select count(*) from creation_users where deleted_at is null) as staff`),
      kpi(NEW_STUDENTS_KPI, range),
      // "Active" = did something: opened a course, earned XP, or (fallback) logged in.
      kpi(
        `select count(distinct sid) as v from (
           select student_id as sid, last_accessed_at as t from student_course_progress
           union all select student_id, created_at from xp_logs
           union all select id, last_login_at from students where deleted_at is null
           union all select id, last_activity_date::timestamp from students where deleted_at is null
         ) a where t >= ${S} and t < ${E}`,
        range,
      ),
      signupSeries(range),
      q(
        `select s.id::text, ${STUDENT_NAME} as name, s.email::text as email, s.created_at,
           greatest(s.last_login_at, s.last_activity_date::timestamp,
                    (select max(e.last_accessed_at) from student_course_progress e where e.student_id = s.id)) as last_active,
           s.coins_available + s.coins_reserved as coin_balance,
           (select count(*) from student_course_progress e where e.student_id = s.id) as enrollments
         from students s
         where s.deleted_at is null
           and ($1::text is null or s.email::text ilike $1 or s.firstname ilike $1 or s.lastname ilike $1)
         order by s.created_at desc limit 50`,
        [like],
      ),
    ]);
    return {
      totalUsers: num(counts[0]?.students),
      staffCount: num(counts[0]?.staff),
      newUsers,
      activeUsers,
      signupSeries: signups,
      users: users.map((u) => ({
        id: String(u.id),
        name: String(u.name),
        email: String(u.email ?? ""),
        joinedAt: iso(u.created_at) ?? "",
        lastActiveAt: iso(u.last_active),
        coinBalance: num(u.coin_balance),
        enrollments: num(u.enrollments),
      })),
    };
  },

  async getRevenue(range) {
    const PAYOUTS_KPI = `select sum(x.leone_amount) as v from coin_exchanges x
      where ${PAID_EXCHANGE} and x.processed_at >= ${S} and x.processed_at < ${E}`;
    const [revenue, courseRevenue, resourceRevenue, payouts, coinsEarned, coinsCashedOut, misc, rev, flow, payments, cashOuts] =
      await Promise.all([
        leoneKpi(REVENUE_KPI, range),
        leoneKpi(`select sum(amount) as v from course_payments where paid_at >= ${S} and paid_at < ${E}`, range),
        leoneKpi(`select sum(amount) as v from resource_access_purchases where paid_at >= ${S} and paid_at < ${E}`, range),
        leoneKpi(PAYOUTS_KPI, range),
        kpi(COINS_EARNED_KPI, range),
        kpi(`select sum(x.coins) as v from coin_exchanges x where ${PAID_EXCHANGE} and x.processed_at >= ${S} and x.processed_at < ${E}`, range),
        q(
          `select
             (select coalesce(sum(coins_available + coins_reserved), 0) from students where deleted_at is null) as outstanding,
             (select count(*) from coin_exchanges x where ${PENDING_EXCHANGE}) as pending_count,
             (select coalesce(sum(leone_amount), 0) from coin_exchanges x where ${PENDING_EXCHANGE}) as pending_leones,
             (select rate_coins from coin_exchange_settings order by created_at desc, id desc limit 1) as rate_coins,
             (select rate_leones from coin_exchange_settings order by created_at desc, id desc limit 1) as rate_leones`,
        ),
        revenueSeries(range),
        coinFlow(range),
        q(
          `select p.kind || '-' || p.id as id, ${STUDENT_NAME} as user_name, p.kind, c.title as course_title,
             p.accesses, p.amount, p.status, p.paid_at, p.created_at
           from ${PAYMENTS} p
           left join students s on s.id = p.student_id
           left join courses c on c.id = p.course_id
           order by p.created_at desc nulls last limit 25`,
        ),
        q(
          `select x.id::text, ${STUDENT_NAME} as user_name, x.coins, x.leone_amount, x.payout_method, x.status, x.created_at
           from coin_exchanges x left join students s on s.id = x.student_id
           order by x.created_at desc nulls last limit 25`,
        ),
      ]);
    const m = misc[0] ?? {};
    const rate = m.rate_coins
      ? { coins: num(m.rate_coins), leones: num(m.rate_leones) }
      : { coins: 1 / LEONES_PER_VYBECOIN, leones: 1 };
    return {
      revenue,
      courseRevenue,
      resourceRevenue,
      payouts,
      netRevenue: { value: revenue.value - payouts.value, previous: revenue.previous - payouts.previous },
      pendingPayouts: { count: num(m.pending_count), leones: num(m.pending_leones) },
      coinsEarned,
      coinsCashedOut,
      outstandingCoins: num(m.outstanding),
      rate,
      revenueSeries: rev,
      coinFlow: flow,
      recentPayments: payments.map(
        (p): MoneyRow => ({
          id: String(p.id),
          userName: String(p.user_name),
          description:
            p.kind === "course" ? `Course: ${p.course_title ?? "—"}` : `Resource access pack${p.accesses ? ` (${p.accesses})` : ""}`,
          amount: toLeones(num(p.amount)),
          status: paymentStatus(p.status, p.paid_at),
          createdAt: iso(p.created_at) ?? "",
        }),
      ),
      recentCashOuts: cashOuts.map(
        (x): MoneyRow => ({
          id: String(x.id),
          userName: String(x.user_name),
          description: `${num(x.coins).toLocaleString("en-US")} VC → ${String(x.payout_method ?? "payout").replace(/_/g, " ")}`,
          amount: num(x.leone_amount),
          status: String(x.status),
          createdAt: iso(x.created_at) ?? "",
        }),
      ),
    };
  },

  async getCourses(range) {
    const [counts, enrollments, completions, completionRate, enrollSeries, courses] = await Promise.all([
      q(`select count(*) filter (where status = 'published') as published,
                count(*) filter (where status <> 'published') as other
         from courses where deleted_at is null`),
      kpi(`select count(*) as v from student_course_progress where created_at >= ${S} and created_at < ${E}`, range),
      kpi(`select count(*) as v from student_course_progress where completed_at >= ${S} and completed_at < ${E}`, range),
      kpi(COMPLETION_RATE_KPI, range),
      series(
        `select date_trunc($3, created_at) as bucket, count(*) as value from student_course_progress
         where created_at >= ${S} and created_at < ${E} group by 1`,
        range,
      ),
      courseRows(range),
    ]);
    return {
      publishedCourses: num(counts[0]?.published),
      draftCourses: num(counts[0]?.other),
      enrollments,
      completions,
      completionRate,
      enrollmentSeries: enrollSeries,
      courses,
    };
  },

  async getCourseDetail(id, range) {
    if (!/^\d+$/.test(id)) return null;
    const [rows, enrolls, completes, recent] = await Promise.all([
      courseRows(range, { id }),
      series(
        `select date_trunc($3, created_at) as bucket, count(*) as value from student_course_progress
         where course_id = $4::bigint and created_at >= ${S} and created_at < ${E} group by 1`,
        range,
        [id],
      ),
      series(
        `select date_trunc($3, completed_at) as bucket, count(*) as value from student_course_progress
         where course_id = $4::bigint and completed_at >= ${S} and completed_at < ${E} group by 1`,
        range,
        [id],
      ),
      q(
        `select ${STUDENT_NAME} as user_name, e.created_at, e.progress_percent, e.completed_at
         from student_course_progress e left join students s on s.id = e.student_id
         where e.course_id = $1::bigint order by e.created_at desc limit 25`,
        [id],
      ),
    ]);
    if (!rows[0]) return null;
    return {
      course: rows[0],
      enrollmentSeries: enrolls,
      completionSeries: completes,
      recentEnrollments: recent.map((r) => ({
        userName: String(r.user_name),
        enrolledAt: iso(r.created_at) ?? "",
        progress: num(r.progress_percent) / 100,
        completedAt: iso(r.completed_at),
      })),
    };
  },
};
