import { Logo } from "@/components/logo";
import { FadeIn } from "@/components/motion";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-4">
      <FadeIn className="dashboard-frame w-full max-w-sm rounded-[32px] bg-frame p-2">
        <div className="rounded-3xl bg-surface p-8">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <Logo size={88} />
            <div>
              <h1 className="text-xl font-semibold">Univybe Dashboard</h1>
              <p className="text-sm text-muted">Admin access only</p>
            </div>
          </div>
          <LoginForm />
        </div>
      </FadeIn>
    </main>
  );
}
