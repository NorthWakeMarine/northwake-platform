import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollDepthTracker from "@/components/ScrollDepthTracker";
import HeroQuoteForm from "@/components/HeroQuoteForm";
import HeroCarouselClient from "@/components/HeroCarouselClient";
import HeroAmbientGlow from "@/components/HeroAmbientGlow";
import HeroDesktopNav from "@/components/HeroDesktopNav";
import ReviewsCarousel from "@/components/ReviewsCarousel";
import ServiceCategories from "@/components/ServiceCategories";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { CarouselSlideSource } from "@/components/HeroCarousel";
import { getGoogleReviews } from "@/lib/google-places";
import { clientConfig } from "@/config/client";


const getCMS = unstable_cache(
  async (): Promise<Record<string, string>> => {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
      );
      const { data } = await supabase.from("site_content").select("key, value");
      return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
    } catch {
      return {};
    }
  },
  ["cms-content"],
  { revalidate: 3600 }
);


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
      <main className="bg-white">

        {/* ── HERO: logo + tagline left · quote form right ── */}
        <section
          aria-labelledby="hero-heading"
          className="relative min-h-screen flex items-center overflow-hidden pt-[65px]"
        >
          {/* Dark backdrop + dot grid texture */}
          <div aria-hidden="true" className="absolute inset-0 bg-[#0a0a18]" />
          <div aria-hidden="true" className="absolute inset-0 dot-grid-dark" />

          {/* Ambient navy glow layer */}
          <HeroAmbientGlow />

          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10 py-8 grid md:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* ── Left: logo + tagline ── */}
            <div className="flex flex-col gap-4 order-2 md:order-1 text-center items-center">
              <Image
                src={clientConfig.logoFullWhitePng}
                alt={`${clientConfig.companyName}, ${clientConfig.seoDescription}`}
                width={260}
                height={70}
                className="w-full max-w-[320px] sm:max-w-[420px]"
                priority
              />
              <div className="flex flex-col gap-2 items-center">
                <h1 id="hero-heading" className="flex flex-col items-center gap-1 uppercase leading-[1.1]">
                  <span className="text-white font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight hero-text-shadow">
                    {heroHeadline}
                  </span>
                  <span className="text-white/85 font-bold text-lg sm:text-xl lg:text-2xl tracking-widest hero-text-shadow">
                    {heroSubheadline}
                  </span>
                </h1>
                <p className="text-white/70 text-xs sm:text-sm tracking-[0.3em] uppercase hero-text-shadow mt-1">
                  Professional Yacht, Aviation, RV and Luxury Auto Services
                </p>
                <p className="text-white/75 text-sm tracking-[0.45em] uppercase hero-text-shadow mt-1">
                  {clientConfig.city}, {clientConfig.state} &nbsp;·&nbsp; Est. {clientConfig.foundedYear}
                </p>
                <p className="sr-only">
                  {clientConfig.companyName} is {clientConfig.city}&apos;s premier marine services company. {clientConfig.seoDescription} Free, no-obligation quotes returned same day. Call {clientConfig.phone}.
                </p>
              </div>
              <HeroDesktopNav />
              <a
                href={`tel:${clientConfig.phoneE164}`}
                className="text-white/80 text-sm font-semibold tracking-widest hover:text-white transition-colors duration-200 hero-text-shadow"
                aria-label={`Call ${clientConfig.companyName}`}
              >
                {clientConfig.phone}
              </a>
            </div>

            {/* ── Right: Free Quote form card ── */}
            <div
              className="order-1 md:order-2 chrome-stage backdrop-blur-md p-5 sm:p-7"
              style={{ boxShadow: "0 30px 60px -20px rgba(0, 0, 128, 0.5), 0 0 0 1px rgba(160, 163, 166, 0.08)" }}
            >
              <div className="flex flex-col gap-0.5 mb-4">
                <h2 className="text-white text-xl font-bold tracking-tight">{clientConfig.ctaText}</h2>
                <p className="text-white/55 text-xs tracking-wide">{clientConfig.ctaSubtext}</p>
              </div>
              <HeroQuoteForm />
            </div>

          </div>

        </section>

        {/* ── SERVICES GRID ── */}
        <section id="services" aria-labelledby="services-heading" className="pt-10 pb-14 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <header className="flex flex-col items-center text-center gap-2 mb-8">
              <p className="text-gray-500 text-xs tracking-[0.4em] uppercase">What We Do</p>
              <h2
                id="services-heading"
                className="text-gray-900 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight"
              >
                Services Built for&nbsp;
                <span className="chrome-text-dark">Perfection</span>
              </h2>
              <hr className="accent-rule w-48 mt-2" />
              <Link
                href="/services"
                className="text-gray-500 text-xs tracking-[0.25em] uppercase hover:text-navy transition-colors duration-200 mt-2"
              >
                View all services →
              </Link>
            </header>

            <ServiceCategories services={clientConfig.services} />
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section aria-labelledby="testimonials-heading" className="py-16 px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <header className="flex flex-col items-center text-center gap-2 mb-10">
              <p className="text-gray-500 text-xs tracking-[0.4em] uppercase">Client Feedback</p>
              <h2 id="testimonials-heading" className="text-gray-900 text-2xl sm:text-3xl font-bold tracking-tight">
                What Clients Are <span className="chrome-text-dark">Saying</span>
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
        <section
          aria-labelledby="showcase-heading"
          className="pt-5 pb-0 bg-black"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        >
          {/* Thin chrome accent rule at top */}
          <div
            aria-hidden="true"
            className="accent-rule-dark mb-4"
          />
          <div className="max-w-7xl mx-auto px-6 lg:px-10 mb-4 flex items-center justify-between gap-4">
            <h2
              id="showcase-heading"
              className="text-white text-2xl sm:text-3xl font-bold tracking-tight"
            >
              Featured <span className="chrome-text">Work</span>
            </h2>
            <Link
              href="/services"
              className="text-steel text-xs tracking-[0.25em] uppercase hover:text-white transition-colors duration-200 shrink-0"
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
