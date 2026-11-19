"use client";

import { animate, MotionConfig, motion, useInView, useReducedMotion, type Variants } from "motion/react";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, useTransition, type ReactNode } from "react";

/* Motion language: quiet polish for a tool used daily. Short ease-out moves,
   nothing that makes you wait to read a number. The count-up is the one signature.
   `reducedMotion="user"` turns transforms off for people who ask their OS for less motion. */
const ease = [0.22, 1, 0.36, 1] as const;

export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/* ---------- page visits & range changes ---------- */

/**
 * A "visit" is one mount of the dashboard template, i.e. one page navigation.
 * Range changes (search params) don't remount the template, so they stay in the
 * same visit: that's how numbers know to count from their old value rather than 0.
 */
let visitCounter = 0;

type PageMotion = { visit: number; pending: boolean; navigate: (href: string) => void };
const PageMotionContext = createContext<PageMotion>({ visit: 0, pending: false, navigate: () => {} });
export const usePageMotion = () => useContext(PageMotionContext);

/** Page content fades in on each navigation and dims while a range change loads. */
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  const router = useRouter();
  const [visit] = useState(() => ++visitCounter);
  const [pending, start] = useTransition();
  const navigate = (href: string) => start(() => router.push(href, { scroll: false }));

  return (
    <PageMotionContext.Provider value={{ visit, pending, navigate }}>
      <motion.div
        className={className}
        data-pending={pending || undefined}
        aria-busy={pending || undefined}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </PageMotionContext.Provider>
  );
}

/* ---------- staggered entrances ---------- */

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease } },
};

type Tag = "section" | "div" | "ol" | "ul";

/** A group whose `StaggerItem` children enter one after another. */
export function Stagger({ as = "div", className, children }: { as?: Tag; className?: string; children: ReactNode }) {
  const Comp = motion[as];
  return (
    <Comp className={className} variants={container} initial="hidden" animate="show">
      {children}
    </Comp>
  );
}

export function StaggerItem({ as = "div", className, children }: { as?: "div" | "li"; className?: string; children: ReactNode }) {
  const Comp = motion[as];
  return (
    <Comp className={className} variants={item}>
      {children}
    </Comp>
  );
}

/** A single gentle entrance (used for the login card). */
export function FadeIn({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- count-up ---------- */

/** Last number each counter showed, per visit, so a range change counts old → new. */
const lastShown = new Map<string, number>();

const NUMBER = /^(.*?)(-?[\d,]+(?:\.(\d+))?)(.*)$/;

/**
 * Counts the number inside an already formatted value, keeping its prefix/suffix,
 * grouping and decimals: "Le 12,345", "48.2%", "1,200 VC". On a page's first load
 * it counts up from 0; after a range change it counts from the previous value.
 * Values without a number (e.g. "Free") render as-is.
 */
export function CountUp({ value, id, className }: { value: string; id: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const { visit } = usePageMotion();
  const key = `${visit}:${id}`;
  const match = value.match(NUMBER);

  // First paint: the previous value in this visit, else zero (so the server HTML
  // never flashes the final number before counting).
  const [initial] = useState(() => {
    if (!match) return value;
    const from = lastShown.get(key) ?? 0;
    return `${match[1]}${format(from, match[2], match[3])}${match[4]}`;
  });

  useEffect(() => {
    const m = value.match(NUMBER);
    const el = textRef.current;
    if (!m || !el) return;
    const [, prefix, num, decimals, suffix] = m;
    const target = Number(num.replace(/,/g, ""));
    if (reduce) {
      el.textContent = value;
      lastShown.set(key, target);
      return;
    }
    if (!inView) return;
    const from = lastShown.get(key) ?? 0;
    lastShown.set(key, target);
    const controls = animate(from, target, {
      duration: 0.7,
      ease,
      // Write straight to the DOM: no React re-render per frame.
      onUpdate: (v) => {
        el.textContent = `${prefix}${format(v, num, decimals)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [value, key, inView, reduce]);

  return (
    <span ref={ref} className={className}>
      {/* Screen readers get the final value, not every intermediate frame. */}
      <span ref={textRef} aria-hidden>
        {initial}
      </span>
      <span className="sr-only">{value}</span>
    </span>
  );
}

function format(v: number, original: string, decimals = "") {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals.length,
    maximumFractionDigits: decimals.length,
    useGrouping: original.includes(",") || Math.abs(Number(original.replace(/,/g, ""))) >= 1000,
  }).format(v);
}
