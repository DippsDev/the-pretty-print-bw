"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

type Phase = "idle" | "cover" | "reveal";

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useLayoutEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduce;
}

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = usePrefersReducedMotion();
  const first = useRef(true);
  const [phase, setPhase] = useState<Phase>("idle");

  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    root.style.scrollBehavior = previous;
    if (reduce) return;

    setPhase("cover");
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setPhase("reveal"));
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, reduce]);

  useEffect(() => {
    if (phase !== "reveal") return;
    const timeout = window.setTimeout(() => setPhase("idle"), 460);
    return () => window.clearTimeout(timeout);
  }, [phase]);

  return (
    <div className="page-transition">
      {children}
      <div className="page-veil" data-phase={phase} aria-hidden="true" />
    </div>
  );
}
