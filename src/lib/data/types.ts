import type { DateRange } from "../range";

export type Kpi = { value: number; previous: number };
export type Point = { label: string; value: number };
/** Vybecoins earned by students vs cashed out for Leones, per bucket. */
export type CoinFlowPoint = { label: string; earned: number; cashedOut: number };

export type CourseRow = {
  id: string;
  title: string;
  status: string;
  isPaid: boolean;
  enrollments: number;
  completions: number;
  completionRate: number;
  revenue: number;
  coinsAwarded: number;
};

export type Overview = {
  revenue: Kpi;
  newUsers: Kpi;
  coinsEarned: Kpi;
  completionRate: Kpi;
  revenueSeries: Point[];
  signupSeries: Point[];
  coinFlow: CoinFlowPoint[];
  topCourses: CourseRow[];
};

export type UserRow = {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  lastActiveAt: string | null;
  coinBalance: number;
  enrollments: number;
};

export type UsersData = {
  totalUsers: number;
  staffCount: number;
  newUsers: Kpi;
  activeUsers: Kpi;
  signupSeries: Point[];
  users: UserRow[];
};

export type MoneyRow = {
  id: string;
  userName: string;
  description: string;
  amount: number;
  status: string;
  createdAt: string;
};

export type RevenueData = {
  /** Leones received: course payments + resource-access purchases. */
  revenue: Kpi;
  courseRevenue: Kpi;
  resourceRevenue: Kpi;
  /** Leones paid out to students for cashed-out vybecoins. */
  payouts: Kpi;
  netRevenue: Kpi;
  pendingPayouts: { count: number; leones: number };
  coinsEarned: Kpi;
  coinsCashedOut: Kpi;
  /** Coins students hold (available + reserved) — what Univybe would owe if all were cashed out. */
  outstandingCoins: number;
  rate: { coins: number; leones: number };
  revenueSeries: Point[];
  coinFlow: CoinFlowPoint[];
  recentPayments: MoneyRow[];
  recentCashOuts: MoneyRow[];
};

export type CoursesData = {
  publishedCourses: number;
  draftCourses: number;
  enrollments: Kpi;
  completions: Kpi;
  completionRate: Kpi;
  enrollmentSeries: Point[];
  courses: CourseRow[];
};

export type CourseDetail = {
  course: CourseRow;
  enrollmentSeries: Point[];
  completionSeries: Point[];
  recentEnrollments: {
    userName: string;
    enrolledAt: string;
    progress: number;
    completedAt: string | null;
  }[];
};

export interface DataSource {
  readonly isDemo: boolean;
  getOverview(range: DateRange): Promise<Overview>;
  getUsers(range: DateRange, search?: string): Promise<UsersData>;
  getRevenue(range: DateRange): Promise<RevenueData>;
  getCourses(range: DateRange): Promise<CoursesData>;
  getCourseDetail(id: string, range: DateRange): Promise<CourseDetail | null>;
}
