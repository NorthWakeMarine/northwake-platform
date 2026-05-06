"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackScrollDepth } from "@/lib/analytics";

const DEPTHS = [25, 50, 75, 100] as const;

export function useScrollDepth() {
  const pathname = usePathname();
  const fired = useRef(new Set<number>());

  useEffect(() => {
    fired.current = new Set();

    function onScroll() {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      const pct = Math.round((scrolled / total) * 100);

      for (const depth of DEPTHS) {
        if (pct >= depth && !fired.current.has(depth)) {
          fired.current.add(depth);
          trackScrollDepth(depth, pathname);
        }
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);
}
