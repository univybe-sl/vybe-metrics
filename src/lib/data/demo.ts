import "server-only";
import { bucketLabel, type DateRange } from "../range";
import type { CoinFlowPoint, CourseRow, DataSource, Kpi, Point } from "./types";

/*
 * Clearly-labelled sample data, used ONLY when DATABASE_URL is not set, so
 * the UI can be developed without database access. The UI shows a
 * "Demo data" banner whenever this source is active.
 */

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const COURSES = [
  "Intro to Python",
  "Web Development Bootcamp",
  "Graphic Design Basics",
  "Digital Marketing 101",
  "Data Analysis with Excel",
  "Mobile App Development",
  "Public Speaking Mastery",
  "Financial Literacy",
];
const NAMES = ["Aminata Kamara", "Mohamed Sesay", "Fatmata Conteh", "Ibrahim Bangura", "Mariama Koroma", "Abu Turay", "Isatu Jalloh", "Sorie Kanu", "Hawa Mansaray", "Alhaji Fofanah"];

function buckets(range: DateRange) {
  const out: Date[] = [];
  const d = new Date(range.start);
  if (range.bucket === "hour") d.setMinutes(0, 0, 0);
  else d.setHours(0, 0, 0, 0);
  if (range.bucket === "month") d.setDate(1);
  while (d <= range.end) {
    out.push(new Date(d));
    if (range.bucket === "hour") d.setHours(d.getHours() + 1);
    else if (range.bucket === "day") d.setDate(d.getDate() + 1);
    else d.setMonth(d.getMonth() + 1);
  }
  return out;
}

const days = (range: DateRange) => (range.end.getTime() - range.start.getTime()) / 86_400_000;

function series(range: DateRange, seed: number, perDay: number): Point[] {
  const r = rng(seed);
  const s = range.bucket === "hour" ? 1 / 24 : range.bucket === "month" ? 30 : 1;
  return buckets(range).map((d, i) => ({
    label: bucketLabel(d, range.bucket),
    value: Math.round(perDay * s * (0.6 + r() * 0.8) * (1 + i * 0.01)),
  }));
}

const sum = (p: Point[]) => p.reduce((a, b) => a + b.value, 0);
const kpi = (value: number, seed: number): Kpi => ({
  value,
  previous: Math.round(value * (0.75 + rng(seed)() * 0.4)),
});

function coinFlow(range: DateRange): CoinFlowPoint[] {
  const earned = series(range, 7, 12000);
  const cashed = series(range, 8, 7000);
  return earned.map((p, i) => ({ label: p.label, earned: p.value, cashedOut: cashed[i].value }));
}

function courseRows(range: DateRange): CourseRow[] {
  const r = rng(42);
  return COURSES.map((title, i) => {
    const enrollments = Math.max(1, Math.round((40 - i * 4) * r() * days(range) * 0.3));
    const rate = 0.25 + r() * 0.5;
    const isPaid = i % 3 === 0;
    return {
      id: String(i + 1),
      title,
      status: i === 7 ? "draft" : "published",
      isPaid,
      enrollments,
      completions: Math.round(enrollments * rate * 0.8),
      completionRate: rate,
      revenue: isPaid ? enrollments * 150 : 0,
      coinsAwarded: Math.round(enrollments * rate) * 100,
    };
  }).sort((a, b) => b.enrollments - a.enrollments);
}

export const demoSource: DataSource = {
  isDemo: true,

  async getOverview(range) {
    const revenueSeries = series(range, 1, 2400);
    const signupSeries = series(range, 2, 35);
    const flow = coinFlow(range);
    return {
      revenue: kpi(sum(revenueSeries), 11),
      newUsers: kpi(sum(signupSeries), 12),
      coinsEarned: kpi(flow.reduce((a, b) => a + b.earned, 0), 13),
      completionRate: { value: 0.42, previous: 0.39 },
      revenueSeries,
      signupSeries,
      coinFlow: flow,
      topCourses: courseRows(range).slice(0, 5),
    };
  },

  async getUsers(range, search) {
    const signupSeries = series(range, 2, 35);
    const r = rng(99);
    const users = Array.from({ length: 30 }, (_, i) => {
      const name = NAMES[i % NAMES.length];
      const joined = new Date(range.end.getTime() - i * 9 * 3_600_000);
      return {
        id: String(i + 1),
        name,
        email: `${name.toLowerCase().replace(" ", ".")}${i}@example.com`,
        joinedAt: joined.toISOString(),
        lastActiveAt: r() > 0.2 ? new Date(joined.getTime() + r() * 5 * 3_600_000).toISOString() : null,
        coinBalance: Math.round(r() * 30) * 100,
        enrollments: Math.round(r() * 4),
      };
    }).filter((u) => !search || `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase()));
    const newUsers = sum(signupSeries);
    return {
      totalUsers: 4821,
      staffCount: 37,
      newUsers: kpi(newUsers, 12),
      activeUsers: kpi(Math.round(newUsers * 3.2), 14),
      signupSeries,
      users,
    };
  },

  async getRevenue(range) {
    const revenueSeries = series(range, 1, 2400);
    const flow = coinFlow(range);
    const total = sum(revenueSeries);
    const earned = flow.reduce((a, b) => a + b.earned, 0);
    const cashed = flow.reduce((a, b) => a + b.cashedOut, 0);
    const payouts = kpi(Math.round(cashed / 10), 24);
    const revenue = kpi(total, 11);
    const r = rng(5);
    return {
      revenue,
      courseRevenue: kpi(Math.round(total * 0.7), 21),
      resourceRevenue: kpi(Math.round(total * 0.3), 22),
      payouts,
      netRevenue: { value: revenue.value - payouts.value, previous: revenue.previous - payouts.previous },
      pendingPayouts: { count: 6, leones: 840 },
      coinsEarned: kpi(earned, 13),
      coinsCashedOut: kpi(cashed, 25),
      outstandingCoins: 1_284_500,
      rate: { coins: 10, leones: 1 },
      revenueSeries,
      coinFlow: flow,
      recentPayments: Array.from({ length: 12 }, (_, i) => ({
        id: String(i + 1),
        userName: NAMES[i % NAMES.length],
        description: r() > 0.4 ? `Course: ${COURSES[i % COURSES.length]}` : "Resource access pack (20)",
        amount: Math.round(r() * 20 + 1) * 50,
        status: r() > 0.15 ? "paid" : "pending",
        createdAt: new Date(range.end.getTime() - i * 2.5 * 3_600_000).toISOString(),
      })),
      recentCashOuts: Array.from({ length: 8 }, (_, i) => {
        const coins = Math.round(r() * 40 + 5) * 100;
        return {
          id: String(i + 1),
          userName: NAMES[(i + 3) % NAMES.length],
          description: `${coins.toLocaleString("en-US")} VC → mobile money`,
          amount: coins / 10,
          status: i < 2 ? "pending" : r() > 0.1 ? "paid" : "rejected",
          createdAt: new Date(range.end.getTime() - i * 7 * 3_600_000).toISOString(),
        };
      }),
    };
  },

  async getCourses(range) {
    const courses = courseRows(range);
    const enrollments = courses.reduce((a, c) => a + c.enrollments, 0);
    const completions = courses.reduce((a, c) => a + c.completions, 0);
    return {
      publishedCourses: courses.filter((c) => c.status === "published").length,
      draftCourses: courses.filter((c) => c.status !== "published").length,
      enrollments: kpi(enrollments, 31),
      completions: kpi(completions, 32),
      completionRate: { value: 0.42, previous: 0.39 },
      enrollmentSeries: series(range, 3, enrollments / Math.max(1, days(range))),
      courses,
    };
  },

  async getCourseDetail(id, range) {
    const course = courseRows(range).find((c) => c.id === id);
    if (!course) return null;
    const r = rng(Number(id));
    return {
      course,
      enrollmentSeries: series(range, 40 + Number(id), 4),
      completionSeries: series(range, 50 + Number(id), 1.5),
      recentEnrollments: Array.from({ length: 10 }, (_, i) => {
        const done = r() > 0.5;
        return {
          userName: NAMES[(i + Number(id)) % NAMES.length],
          enrolledAt: new Date(range.end.getTime() - i * 20 * 3_600_000).toISOString(),
          progress: done ? 1 : Math.round(r() * 90) / 100,
          completedAt: done ? new Date(range.end.getTime() - i * 5 * 3_600_000).toISOString() : null,
        };
      }),
    };
  },
};
