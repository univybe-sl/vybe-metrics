import { PageTransition } from "@/components/motion";

/** Re-mounts on every page navigation (not on range changes), so each page fades in. */
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition className="flex flex-col gap-6">{children}</PageTransition>;
}
