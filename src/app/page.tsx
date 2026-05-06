import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingCTA from "@/components/FloatingCTA";
import HeroCarousel from "@/components/HeroCarousel";
import HeroQuoteForm from "@/components/HeroQuoteForm";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import fs from "fs";
import path from "path";

async function getCMS(): Promise<Record<string, string>> {
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase.from("site_content").select("key, value");
    return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  } catch {
    return {};
  }
}

const services = [
  {
    icon: "◉",
    title: "Yacht Management",
    tagline: "Full-Service Concierge Care",
    description:
      "Complete end-to-end management for serious yacht owners. Crew sourcing, provisioning, insurance coordination, compliance, and voyage planning, all handled by our dedicated captains and marine professionals.",
    details: ["Crew & captain coordination", "Provisioning & logistics", "Insurance & compliance management"],
  },
  {
    icon: "◈",
    title: "Ceramic Coating",
    tagline: "Armor-Grade Hull Protection",
    description:
      "Professional-grade nano-ceramic coating bonds permanently to your hull, gelcoat, and topside surfaces. Repels water, salt, and UV damage for up to 5 years, leaving a mirror-grade finish that turns heads at every marina.",
    details: ["9H hardness rating", "UV & salt-water resistance", "5-year protection warranty"],
  },
  {
    icon: "⬡",
    title: "Monthly Maintenance",
    tagline: "Zero Effort. Perfect Condition.",
    description:
      "Bespoke maintenance programs designed around your schedule and vessel. From weekly wash-downs to seasonal engine checks and hull inspections, we handle every detail so your boat is always ready to launch.",
    details: ["Custom maintenance schedules", "Priority booking & storage coordination", "Detailed condition reports"],
  },
  {
    icon: "◈",
    title: "Full Detail",
    tagline: "Bow-to-Stern Perfection",
    description:
      "Clay bar, multi-stage compound, polish, and sealant on every exterior surface — then interior vacuum, wipe-down, and stainless polishing. Showroom condition, stem to stern.",
    details: ["Clay bar & multi-stage compound polish", "Marine wax or polymer sealant coat", "Interior vacuum, wipe-down & stainless polish"],
  },
  {
    icon: "△",
    title: "Marine Transport",
    tagline: "Safe, Reliable. On Schedule.",
    description:
      "Licensed vessel transport across Florida and beyond, moving slips, hauling for service, or full relocations. Experienced crew, coordinated scheduling, and full in-transit protection for your investment.",
    details: ["Licensed & insured transport team", "Local & statewide Florida moves", "Haul-out & launch coordination"],
  },
  {
    icon: "⬖",
    title: "Captain & Crew Services",
    tagline: "Experienced Professionals, On Demand",
    description:
      "USCG-licensed captains and qualified crew available on a day-rate or contract basis. Delivery captaining, charter support, new vessel pickups, reliable marine professionals whenever you need them.",
    details: ["USCG-licensed captains", "Day-rate & contract crew", "Delivery & relocation captaining"],
  },
];


function getCarouselImages(): string[] {
  try {
    const dir = path.join(process.cwd(), "public", "images");
    const exts = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
    return fs
      .readdirSync(dir)
      .filter((f) => exts.has(path.extname(f).toLowerCase()))
      .map((f) => `/images/${f}`);
  } catch {
    return [];
  }
}

export default async function Home() {
  const cms = await getCMS();
  const carouselImages = getCarouselImages();
  const heroHeadline    = cms.hero_headline    ?? "From Dock to Destination";
  const heroSubheadline = cms.hero_subheadline ?? "Your Yacht Is Our Priority";

  return (
    <>
      <Header />
      <FloatingCTA />

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
                src="/brand/nwmlogofullwhite.png"
                alt="NorthWake Marine, Premium Boat Detailing and Vessel Management, Jacksonville FL"
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
                  Jacksonville, FL &nbsp;·&nbsp; Est. 2025
                </p>
                <p className="sr-only">
                  NorthWake Marine is Jacksonville&apos;s premier marine services company, offering ceramic coating, monthly maintenance plans, full detail, and yacht management on the St. Johns River. We serve vessels from 18 to 80+ feet across Northeast Florida. All jobs include photo documentation. Free, no-obligation quotes returned same day. Call (904) 606-5454.
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
                href="tel:+19046065454"
                className="text-steel-light text-sm font-semibold tracking-widest hover:text-wake transition-colors duration-200"
                aria-label="Call NorthWake Marine"
              >
                (904) 606-5454
              </a>
            </div>

            {/* ── Right: Free Quote form card ── */}
            <div className="order-2 chrome-stage bg-obsidian/90 backdrop-blur-md p-5 sm:p-7">
              <div className="flex flex-col gap-0.5 mb-4">
                <h2 className="text-wake text-xl font-bold tracking-tight">Get a Free Quote</h2>
                <p className="text-steel text-[11px] tracking-wide">No obligation. Most quotes returned same day.</p>
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
            {[
              { icon: "◈", text: "Professional-Grade Products Only" },
              { icon: "◉", text: "Photo Documentation on Every Job" },
              { icon: "◈", text: "No Obligation. No Contracts." },
              { icon: "△", text: "Serving Jacksonville Since 2025" },
            ].map(({ icon, text }) => (
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
              {services.map((svc) => (
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
                    {svc.details.map((d) => (
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-steel-dark">
              {[
                {
                  quote: "They turned my 32ft center console from embarrassing to showroom. Ceramic coating looks unreal even after a month of salt water. NorthWake is the only call I make.",
                  name: "D. Harrington",
                  vessel: "32ft Center Console, Jacksonville",
                },
                {
                  quote: "Monthly maintenance plan took a full chore off my list. They show up, document everything, and my boat is always ready. The photo reports after every visit are a nice touch.",
                  name: "R. Castellano",
                  vessel: "41ft Cruiser, St. Johns River",
                },
                {
                  quote: "Booked a full detail and ceramic before selling. Got asking price. The NorthWake guys are meticulous and actually care about the work they do. Rare.",
                  name: "M. Sullivan",
                  vessel: "28ft Sport Fishing, Orange Park",
                },
              ].map(({ quote, name, vessel }) => (
                <div key={name} className="bg-obsidian p-6 flex flex-col gap-4">
                  <p className="text-steel-light text-xs leading-relaxed italic">&ldquo;{quote}&rdquo;</p>
                  <div className="mt-auto flex flex-col gap-0.5">
                    <span className="text-wake text-xs font-bold tracking-wide">{name}</span>
                    <span className="text-steel text-[10px] tracking-[0.2em] uppercase">{vessel}</span>
                  </div>
                </div>
              ))}
            </div>
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
          <HeroCarousel showHeroOverlay={false} images={carouselImages} />
        </section>

      </main>

      <Footer />
    </>
  );
}
