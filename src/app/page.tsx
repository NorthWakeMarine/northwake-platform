import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollDepthTracker from "@/components/ScrollDepthTracker";
import HeroQuoteForm from "@/components/HeroQuoteForm";
import HeroCarouselClient from "@/components/HeroCarouselClient";
import ReviewsCarousel from "@/components/ReviewsCarousel";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { CarouselSlideSource } from "@/components/HeroCarousel";
import { getGoogleReviews } from "@/lib/google-places";
import { clientConfig } from "@/config/client";

async function getCMS(): Promise<Record<string, string>> {
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase.from("site_content").select("key, value");
    return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  } catch {
    return {};
  }
}


const getCarouselImages = unstable_cache(
  async (): Promise<CarouselSlideSource[]> => {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
      );
      const { data } = await supabase
        .from("carousel_images")
        .select("public_url, focal_x, focal_y")
        .eq("active", true)
        .order("display_order");
      if (data && data.length > 0) {
        return data.map((r) => ({ src: r.public_url, focalX: r.focal_x, focalY: r.focal_y }));
      }
    } catch {
      // fall through to filesystem fallback
    }
    // Filesystem fallback for local dev / before any images uploaded
    try {
      const { default: fs } = await import("fs");
      const { default: path } = await import("path");
      const dir = path.join(process.cwd(), "public", "images");
      const exts = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
      return fs
        .readdirSync(dir)
        .filter((f) => exts.has(path.extname(f).toLowerCase()))
        .map((f) => ({ src: `/images/${f}`, focalX: 50, focalY: 50 }));
    } catch {
      return [];
    }
  },
  ["carousel-images"],
  { revalidate: 3600 }
);

export default async function Home() {
  const cms = await getCMS();
  const [carouselImages, googleReviews] = await Promise.all([getCarouselImages(), getGoogleReviews()]);
  const heroHeadline    = cms.hero_headline    ?? clientConfig.tagline;
  const heroSubheadline = cms.hero_subheadline ?? clientConfig.subTagline;

  return (
    <>
      <Header />
      <ScrollDepthTracker />

      {/* ─── MAIN ────────────────────────────────────────────────── */}
      <main>

        {/* ── HERO: logo + tagline left · quote form right ── */}
        <section
          aria-labelledby="hero-heading"
          className="relative min-h-screen flex items-center overflow-hidden pt-[65px]"
        >
          {/* Water-like gradient background */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 120% 80% at 50% 100%, #000830 0%, #000520 30%, #000210 60%, #000000 100%)",
            }}
          />
          {/* Subtle horizontal water-band layers */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, #000000 0%, #000510 20%, #000a28 55%, #000615 80%, #000000 100%)",
              opacity: 0.85,
            }}
          />
          {/* Navy depth glow, ties into the navy palette used site-wide */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(0,0,80,0.45) 0%, transparent 70%)",
            }}
          />

          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10 py-8 grid md:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* ── Left: logo + tagline ── */}
            <div className="flex flex-col gap-4 order-1 text-center items-center">
              <Image
                src={clientConfig.logoFullWhitePng}
                alt={`${clientConfig.companyName}, ${clientConfig.seoDescription}`}
                width={260}
                height={70}
                className="w-full max-w-[320px] sm:max-w-[420px]"
                priority
              />
              <div className="flex flex-col gap-1.5 items-center">
                <h1 id="hero-heading" className="flex flex-col items-center gap-0.5 uppercase leading-snug">
                  <span className="text-wake font-black text-xl sm:text-2xl lg:text-3xl tracking-wide">
                    {heroHeadline}
                  </span>
                  <span className="text-steel-light font-bold text-base sm:text-lg lg:text-xl tracking-widest">
                    {heroSubheadline}
                  </span>
                </h1>
                <p className="text-steel text-[10px] tracking-[0.45em] uppercase">
                  {clientConfig.city}, {clientConfig.state} &nbsp;·&nbsp; Est. {clientConfig.foundedYear}
                </p>
                <p className="sr-only">
                  {clientConfig.companyName} is {clientConfig.city}&apos;s premier marine services company. {clientConfig.seoDescription} Free, no-obligation quotes returned same day. Call {clientConfig.phone}.
                </p>
              </div>
              <div className="hidden md:flex gap-4 justify-center">
                <Link
                  href="/services"
                  className="border border-steel text-steel-light text-xs font-semibold tracking-[0.3em] uppercase px-6 py-3 hover:border-wake hover:text-wake transition-colors duration-300"
                >
                  View Services
                </Link>
                <Link
                  href="/about"
                  className="text-steel text-xs font-semibold tracking-[0.3em] uppercase px-6 py-3 hover:text-wake transition-colors duration-300"
                >
                  About Us
                </Link>
              </div>
              <a
                href={`tel:${clientConfig.phoneE164}`}
                className="text-steel-light text-sm font-semibold tracking-widest hover:text-wake transition-colors duration-200"
                aria-label={`Call ${clientConfig.companyName}`}
              >
                {clientConfig.phone}
              </a>
            </div>

            {/* ── Right: Free Quote form card ── */}
            <div className="order-2 chrome-stage bg-obsidian/90 backdrop-blur-md p-5 sm:p-7">
              <div className="flex flex-col gap-0.5 mb-4">
                <h2 className="text-wake text-xl font-bold tracking-tight">{clientConfig.ctaText}</h2>
                <p className="text-steel text-[11px] tracking-wide">{clientConfig.ctaSubtext}</p>
              </div>
              <HeroQuoteForm />
            </div>

          </div>

          {/* Bottom fade */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 inset-x-0 h-20"
            style={{ background: "linear-gradient(to bottom, transparent, #000000)" }}
          />
        </section>


        {/* ── TRUST BAR ── */}
        <div aria-label="Trust indicators" className="border-y border-steel-dark bg-obsidian/80">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {clientConfig.trustBadges.map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <span aria-hidden="true" className="chrome-text text-sm">{icon}</span>
                <span className="text-steel-light text-[10px] tracking-[0.2em] uppercase font-semibold">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── SERVICES GRID ── */}
        <section id="services" aria-labelledby="services-heading" className="pt-10 pb-14 px-6 bg-obsidian">
          <div className="max-w-7xl mx-auto">
            <header className="flex flex-col items-center text-center gap-2 mb-8">
              <p className="text-steel text-[10px] tracking-[0.4em] uppercase">What We Do</p>
              <h2
                id="services-heading"
                className="text-wake text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight"
              >
                Marine Services Built for&nbsp;
                <span className="chrome-text">Perfection</span>
              </h2>
              <hr className="accent-rule w-48 mt-2" />
              <Link
                href="/services"
                className="text-steel text-xs tracking-[0.25em] uppercase hover:text-wake transition-colors duration-200 mt-2"
              >
                View all services →
              </Link>
            </header>

            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-steel-dark list-none" role="list">
              {clientConfig.services.slice(0, 6).map((svc) => (
                <li
                  key={svc.title}
                  className="group bg-obsidian p-5 flex flex-col gap-3 hover:bg-navy-dark transition-colors duration-300"
                >
                  <span aria-hidden="true" className="chrome-text text-2xl leading-none">
                    {svc.icon}
                  </span>
                  <div>
                    <p className="text-steel text-[9px] tracking-[0.35em] uppercase mb-0.5">
                      {svc.tagline}
                    </p>
                    <h3 className="text-wake text-base font-bold tracking-tight">{svc.title}</h3>
                  </div>
                  <p className="text-steel-light text-xs leading-relaxed">{svc.description}</p>
                  <ul className="flex flex-col gap-1 mt-auto list-none">
                    {svc.includes.slice(0, 3).map((d) => (
                      <li key={d} className="flex items-start gap-2 text-steel text-[11px]">
                        <span aria-hidden="true" className="text-navy mt-0.5">▸</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section aria-labelledby="testimonials-heading" className="py-16 px-6 bg-obsidian">
          <div className="max-w-7xl mx-auto">
            <header className="flex flex-col items-center text-center gap-2 mb-10">
              <p className="text-steel text-[10px] tracking-[0.4em] uppercase">Client Feedback</p>
              <h2 id="testimonials-heading" className="text-wake text-2xl sm:text-3xl font-bold tracking-tight">
                What Vessel Owners Are <span className="chrome-text">Saying</span>
              </h2>
              <hr className="accent-rule w-48 mt-2" />
            </header>
            <ReviewsCarousel
              reviews={googleReviews.reviews}
              rating={googleReviews.rating}
              count={googleReviews.count}
            />
          </div>
        </section>

        {/* ── FEATURED WORK CAROUSEL (bottom showcase) ── */}
        <section aria-labelledby="showcase-heading" className="pt-20 pb-0">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 mb-8 flex items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h2
                id="showcase-heading"
                className="text-wake text-2xl sm:text-3xl font-bold tracking-tight"
              >
                Featured <span className="chrome-text">Work</span>
              </h2>
            </div>
            <Link
              href="/services"
              className="text-steel text-xs tracking-[0.25em] uppercase hover:text-wake transition-colors duration-200 shrink-0"
            >
              View all services →
            </Link>
          </div>
          <HeroCarouselClient showHeroOverlay={false} images={carouselImages} />
        </section>

      </main>

      <Footer />
    </>
  );
}
