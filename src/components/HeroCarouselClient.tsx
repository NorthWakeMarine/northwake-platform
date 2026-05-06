"use client";

import dynamic from "next/dynamic";

const HeroCarousel = dynamic(() => import("@/components/HeroCarousel"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      className="w-full h-[52vh] sm:h-[60vh] lg:h-[72vh] bg-obsidian"
    />
  ),
});

export default HeroCarousel;
