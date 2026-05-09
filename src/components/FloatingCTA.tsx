"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trackCtaClick } from "@/lib/analytics";

const DISMISSED_KEY = "floating_cta_dismissed";

export default function FloatingCTA() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISSED_KEY) === "1") {
      setDismissed(true);
      return;
    }
    const handleScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll, { passive: true });

    const footer = document.querySelector("footer");
    if (footer) {
      const observer = new IntersectionObserver(
        ([entry]) => setFooterVisible(entry.isIntersecting),
        { threshold: 0 }
      );
      observer.observe(footer);
      return () => {
        window.removeEventListener("scroll", handleScroll);
        observer.disconnect();
      };
    }
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function handleDismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
    setVisible(false);
  }

  if (dismissed) return null;

  return (
    <div
      aria-label="Get a free quote"
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 flex items-center gap-2 ${
        visible && !footerVisible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <Link
        href="/contact"
        onClick={() => trackCtaClick("Get a Free Quote", "floating_cta")}
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
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="w-6 h-6 flex items-center justify-center bg-black/60 text-steel-light hover:text-wake hover:bg-black/80 transition-colors rounded-full text-xs shadow-lg backdrop-blur-sm"
      >
        ×
      </button>
    </div>
  );
}
