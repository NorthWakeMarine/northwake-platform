"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function FloatingCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      aria-label="Get a free quote"
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <Link
        href="/contact"
        className="chrome-btn flex items-center gap-2.5 font-bold text-[10px] tracking-[0.25em] uppercase px-5 py-3.5 shadow-xl shadow-black/60 transition-all duration-300 hover:scale-105 active:scale-95"
      >
        <svg
          aria-hidden="true"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="5" r="3" />
          <line x1="12" y1="8" x2="12" y2="21" />
          <path d="M5 14l7 7 7-7" />
          <line x1="5" y1="11" x2="19" y2="11" />
        </svg>
        Get a Free Quote
      </Link>
    </div>
  );
}
