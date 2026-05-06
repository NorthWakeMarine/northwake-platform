"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, startTransition, useState } from "react";

export type CarouselSlideSource = {
  src: string;
  focalX?: number;
  focalY?: number;
};

interface HeroCarouselProps {
  /** When false the "Premium Marine Care" headline + CTAs are hidden, use for bottom-of-page showcase */
  showHeroOverlay?: boolean;
  images?: string[] | CarouselSlideSource[];
}

export default function HeroCarousel({ showHeroOverlay = true, images = [] }: HeroCarouselProps) {
  const slides = (images as Array<string | CarouselSlideSource>).map((item, i) => {
    const src = typeof item === "string" ? item : item.src;
    const focalX = typeof item === "string" ? 50 : (item.focalX ?? 50);
    const focalY = typeof item === "string" ? 50 : (item.focalY ?? 50);
    return {
      id: `slide-${i + 1}`,
      src,
      focalX,
      focalY,
      alt: "NorthWake Marine, professional marine detailing and vessel care, Jacksonville FL",
      caption: "Professional marine detailing by NorthWake Marine, Jacksonville, FL.",
      service: "NorthWake Marine",
      tagline: "",
      href: "/services",
    };
  });
  const autoplayPlugin = useMemo(
    () => Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true }),
    []
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, duration: 40, dragFree: false },
    [autoplayPlugin]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setActiveIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    startTransition(onSelect);
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const active = slides[activeIndex];

  return (
    <>
      {/* ─── CAROUSEL STAGE ─────────────────────────────────────── */}
      <section
        aria-label="NorthWake Marine, featured work carousel"
        className="relative w-full overflow-visible"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Chrome border wrapper */}
        <div className={`chrome-stage relative w-full overflow-hidden ${
          showHeroOverlay
            ? "h-[60vh] sm:h-[70vh] lg:h-[88vh]"
            : "h-[52vh] sm:h-[60vh] lg:h-[72vh]"
        }`}>

          {/* ── Embla viewport ── */}
          <div ref={emblaRef} className="overflow-hidden h-full" aria-live="polite">
            <div className="flex h-full" role="list">
              {slides.map((slide, i) => (
                <figure
                  key={slide.id}
                  role="listitem"
                  aria-hidden={i !== activeIndex}
                  className="relative flex-[0_0_100%] min-w-0 h-full"
                >
                  {/*
                   * TO SWAP IMAGES: replace `src` in the `slides` array above
                   * with your real photo path, e.g. "/images/ceramic-coating.jpg"
                   * Keep the same `alt` and `caption` values, they drive SEO.
                   */}
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    priority={i === 0}
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 100vw, 1280px"
                    className="object-cover"
                    style={{ objectPosition: `${slide.focalX}% ${slide.focalY}%` }}
                    quality={80}
                  />

                  {/* Bottom-to-top gradient for text legibility */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.08) 75%, transparent 100%)",
                    }}
                  />

                  {/* AI-readable caption (screen-reader + crawler visible) */}
                  <figcaption className="sr-only">{slide.caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>

          {/* ── Hero text overlay, desktop (hero mode only) ── */}
          {showHeroOverlay && (
            <div
              className="hidden md:flex absolute inset-x-0 bottom-0 z-20 flex-col items-start gap-5 px-12 pb-16 max-w-4xl"
              aria-hidden="false"
            >
              <p className="text-steel-light text-[10px] tracking-[0.4em] uppercase font-medium">
                Jacksonville, FL &nbsp;·&nbsp; Est. 2025
              </p>
              <h1 className="chrome-text text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-none">
                Premium Marine Care,<br />
                <span className="text-wake">Uncompromised.</span>
              </h1>
              <p className="text-steel-light text-base max-w-xl leading-relaxed">
                NorthWake Marine delivers concierge-level detailing, ceramic coating, and
                full-service vessel management to Jacksonville&apos;s most discerning boat
                owners, on the St. Johns River and beyond.
              </p>
              <div className="flex gap-4 mt-1">
                <Link
                  href="/contact"
                  className="chrome-btn font-bold text-xs tracking-[0.3em] uppercase px-8 py-3.5 transition-all duration-300 hover:scale-105"
                >
                  Book Now
                </Link>
                <Link
                  href="/services"
                  className="border border-steel text-steel-light text-xs font-semibold tracking-[0.3em] uppercase px-8 py-3.5 hover:border-wake hover:text-wake transition-colors duration-300"
                >
                  View Services
                </Link>
              </div>
            </div>
          )}

          {/* ── Dot indicators (bottom-right, desktop) ── */}
          <div
            aria-live="polite"
            aria-atomic="true"
            className="absolute bottom-6 right-6 z-20 hidden md:flex flex-col items-end gap-3"
          >
            <div className="flex gap-2" role="tablist" aria-label="Carousel slides">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={i === activeIndex}
                  aria-label={`Go to slide: ${s.service}`}
                  onClick={() => emblaApi?.scrollTo(i)}
                  className={`h-px transition-all duration-300 ${
                    i === activeIndex
                      ? "w-10 chrome-btn-dot"
                      : "w-4 bg-steel-dark hover:bg-steel"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* ── Prev arrow ── */}
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous slide"
            className={`
              absolute left-5 top-1/2 -translate-y-1/2 z-20
              w-11 h-11 flex items-center justify-center
              border border-steel-dark bg-obsidian/70 backdrop-blur-sm
              text-steel-light hover:text-wake hover:border-steel
              transition-all duration-300
              ${isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}
              md:flex hidden
            `}
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          {/* ── Next arrow ── */}
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next slide"
            className={`
              absolute right-5 top-1/2 -translate-y-1/2 z-20
              w-11 h-11 flex items-center justify-center
              border border-steel-dark bg-obsidian/70 backdrop-blur-sm
              text-steel-light hover:text-wake hover:border-steel
              transition-all duration-300
              ${isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"}
              md:flex hidden
            `}
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          {/* ── Mobile dot indicators (centered bottom) ── */}
          <div
            className="absolute bottom-5 inset-x-0 z-20 flex justify-center gap-2 md:hidden"
            role="tablist"
            aria-label="Carousel slides"
          >
            {slides.map((s, i) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={`Go to slide: ${s.service}`}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`h-px transition-all duration-300 ${
                  i === activeIndex ? "w-8 chrome-btn-dot" : "w-3 bg-steel-dark"
                }`}
              />
            ))}
          </div>

          {/* ── Bottom fade to page bg ── */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 inset-x-0 h-16 md:hidden"
            style={{ background: "linear-gradient(to bottom, transparent, #000000)" }}
          />
        </div>
      </section>

      {/* ─── MOBILE HERO TEXT (below carousel, hero mode only) ─── */}
      {showHeroOverlay && (
        <section
          aria-labelledby="hero-mobile-heading"
          className="md:hidden px-6 pt-10 pb-28 flex flex-col gap-6 text-center items-center"
        >
          <p className="text-steel text-[10px] tracking-[0.4em] uppercase">
            Jacksonville, FL &nbsp;·&nbsp; Est. 2025
          </p>
          <h1
            id="hero-mobile-heading"
            className="chrome-text text-4xl font-bold tracking-tight leading-tight"
          >
            Premium Marine Care,<br />
            <span className="text-wake">Uncompromised.</span>
          </h1>
          <p className="text-steel-light text-sm max-w-sm leading-relaxed">
            NorthWake Marine delivers concierge-level detailing, ceramic coating, and
            vessel management to Jacksonville&apos;s most discerning boat owners.
          </p>
          <p className="text-steel text-[10px] tracking-[0.3em] uppercase">
            Currently viewing: <span className="text-steel-light">{active.service}</span>
          </p>
          <div className="flex flex-col w-full gap-3 max-w-xs">
            <Link
              href="/contact"
              className="chrome-btn font-bold text-xs tracking-[0.3em] uppercase px-8 py-4 transition-all duration-300 text-center"
            >
              Book Now
            </Link>
            <Link
              href="/services"
              className="border border-steel text-steel-light text-xs font-semibold tracking-[0.3em] uppercase px-8 py-4 hover:border-wake hover:text-wake transition-colors duration-300 text-center"
            >
              View Services
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
