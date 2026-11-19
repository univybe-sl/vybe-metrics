"use client";

import { BookOpen, LayoutDashboard, LogOut, Users, Wallet } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { logout } from "@/app/login/actions";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users },
  { href: "/revenue", label: "Revenue & Vybecoins", icon: Wallet },
  { href: "/courses", label: "Courses", icon: BookOpen },
];

/** A floating pill that groups sidebar buttons, as in the reference frame. */
const pill = "flex gap-1 rounded-full bg-surface p-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:flex-col";

export function Sidebar() {
  const pathname = usePathname();
  const range = useSearchParams().get("range");
  const qs = range ? `?range=${range}` : "";

  return (
    <nav className="flex shrink-0 items-center gap-3 sm:sticky sm:top-6 sm:h-[calc(100vh-6rem)] sm:max-h-[860px] sm:flex-col">
      <Link href={`/${qs}`} aria-label="Univybe home" className={`${pill} items-center sm:p-1`}>
        <Logo size={44} />
      </Link>

      <div className={pill}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={`${href}${qs}`}
              title={label}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`relative flex size-10 items-center justify-center rounded-full transition-colors ${
                active ? "text-accent-foreground" : "text-muted hover:bg-default hover:text-foreground"
              }`}
            >
              {/* One shared pill that glides to whichever item is active. */}
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <Icon size={18} className="relative" />
            </Link>
          );
        })}
      </div>

      <div className="flex-1" />

      <div className={pill}>
        <ThemeToggle />
        <form action={logout}>
          <button
            type="submit"
            aria-label="Sign out"
            title="Sign out"
            className="flex size-10 items-center justify-center rounded-full text-danger transition hover:bg-danger/10"
          >
            <LogOut size={18} />
          </button>
        </form>
      </div>
    </nav>
  );
}
