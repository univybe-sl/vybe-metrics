import { Suspense } from "react";
import { Sidebar } from "@/components/sidebar";

/** Centered framed canvas: a rounded panel floating on a darker page, as in the reference. */
export default function DashboardLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-screen bg-page sm:px-6 sm:py-6">
      <div className="dashboard-frame mx-auto flex min-h-screen max-w-[1440px] flex-col gap-4 bg-frame px-4 py-4 sm:min-h-[calc(100vh-3rem)] sm:flex-row sm:gap-6 sm:rounded-[36px] sm:px-6 sm:py-6 lg:px-8">
        <Suspense fallback={<div className="h-14 sm:h-full sm:w-[56px]" />}>
          <Sidebar />
        </Suspense>
        <main className="flex min-w-0 flex-1 flex-col gap-6 sm:py-2">{children}</main>
      </div>
    </div>
  );
}
