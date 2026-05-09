"use client";

import dynamic from "next/dynamic";

const HeroCarousel = dynamic(() => import("@/components/HeroCarousel"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      className="w-full h-[52vh] sm:h-[60vh] lg:h-[72vh] bg-obsidian overflow-hidden relative"
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  ),
});

export default HeroCarousel;
