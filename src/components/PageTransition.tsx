"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { usePathname } from "next/navigation";
import { useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

const enterEase = [0.22, 1, 0.36, 1] as const;
const exitEase = [0.4, 0, 0.2, 1] as const;

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

function FrozenRouter({ children }: { children: ReactNode }) {
  const context = useContext(LayoutRouterContext);
  const frozen = useRef(context).current;
  return <LayoutRouterContext.Provider value={frozen}>{children}</LayoutRouterContext.Provider>;
}

function ScrollToTop() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return null;
}

function RisingContent({ play, children }: { play: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || !play) return;
    const finish = (event: AnimationEvent) => {
      if (event.target === node) setSettled(true);
    };
    node.addEventListener("animationend", finish);
    return () => node.removeEventListener("animationend", finish);
  }, [play]);

  return (
    <div ref={ref} className={play && !settled ? "page-rise" : undefined}>
      {children}
    </div>
  );
}

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = usePrefersReducedMotion();
  const skipEnter = useRef(true);
  useEffect(() => {
    skipEnter.current = false;
  }, []);
  const playEnter = !skipEnter.current && !reduce;

  if (reduce) {
    return <div className="page-stage">{children}</div>;
  }

  return (
    <MotionConfig reducedMotion="never">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          className="page-stage"
          initial={playEnter ? { opacity: 0 } : false}
          animate={{ opacity: 1, transition: { duration: 0.46, ease: enterEase } }}
          exit={{ opacity: 0, y: -14, transition: { duration: 0.34, ease: exitEase } }}
        >
          <RisingContent play={playEnter}>
            <FrozenRouter>
              <ScrollToTop />
              {children}
            </FrozenRouter>
          </RisingContent>
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  );
}
