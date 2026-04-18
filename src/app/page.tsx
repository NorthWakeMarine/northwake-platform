import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingCTA from "@/components/FloatingCTA";
import HeroCarousel from "@/components/HeroCarousel";
import Link from "next/link";

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


export default function Home() {
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
            <div className="flex flex-col gap-4 order-2 md:order-1 text-center items-center">
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
                    From Dock to Destination
                  </span>
                  <span className="text-steel-light font-bold text-base sm:text-lg lg:text-xl tracking-widest">
                    Your Yacht Is Our Priority
                  </span>
                </h1>
                <p className="text-steel text-[10px] tracking-[0.45em] uppercase">
                  Jacksonville, FL &nbsp;·&nbsp; Est. 2025
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
            </div>

            {/* ── Right: Free Quote form card ── */}
            <div className="order-1 md:order-2 chrome-stage bg-obsidian/90 backdrop-blur-md p-5 sm:p-7">
              <h2 className="text-wake text-xl font-bold tracking-tight mb-4">Free Quote</h2>

              <form
                action="#"
                method="POST"
                aria-label="Free quote request form"
                className="flex flex-col gap-2.5"
              >
                {/* Row: First + Last */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="hero-first" className="text-steel-light text-[10px] tracking-[0.25em] uppercase">
                      First Name <span aria-hidden="true" className="text-navy">*</span>
                    </label>
                    <input id="hero-first" name="first_name" type="text" required autoComplete="given-name" placeholder="John"
                      className="bg-obsidian/60 border border-steel-dark text-wake placeholder-steel text-xs px-3 py-2 focus:outline-none focus:border-navy transition-colors duration-200" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="hero-last" className="text-steel-light text-[10px] tracking-[0.25em] uppercase">
                      Last Name <span aria-hidden="true" className="text-navy">*</span>
                    </label>
                    <input id="hero-last" name="last_name" type="text" required autoComplete="family-name" placeholder="Harrington"
                      className="bg-obsidian/60 border border-steel-dark text-wake placeholder-steel text-xs px-3 py-2 focus:outline-none focus:border-navy transition-colors duration-200" />
                  </div>
                </div>

                {/* Row: Email + Phone */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="hero-email" className="text-steel-light text-[10px] tracking-[0.25em] uppercase">
                      Email <span aria-hidden="true" className="text-navy">*</span>
                    </label>
                    <input id="hero-email" name="email" type="email" required autoComplete="email" placeholder="john@example.com"
                      className="bg-obsidian/60 border border-steel-dark text-wake placeholder-steel text-xs px-3 py-2 focus:outline-none focus:border-navy transition-colors duration-200" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="hero-phone" className="text-steel-light text-[10px] tracking-[0.25em] uppercase">
                      Phone <span aria-hidden="true" className="text-navy">*</span>
                    </label>
                    <input id="hero-phone" name="phone" type="tel" required autoComplete="tel" placeholder="(904) 606-5454"
                      className="bg-obsidian/60 border border-steel-dark text-wake placeholder-steel text-xs px-3 py-2 focus:outline-none focus:border-navy transition-colors duration-200" />
                  </div>
                </div>

                {/* Row: Vessel Type + Service Needed */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="hero-vessel" className="text-steel-light text-[10px] tracking-[0.25em] uppercase">
                      Vessel Type <span aria-hidden="true" className="text-navy">*</span>
                    </label>
                    <select id="hero-vessel" name="vessel_type" required defaultValue=""
                      className="bg-obsidian border border-steel-dark text-wake text-xs px-3 py-2 focus:outline-none focus:border-navy transition-colors duration-200 appearance-none cursor-pointer">
                      <option value="" disabled className="text-steel">Select type…</option>
                      {["Center Console","Bowrider","Pontoon","Cruiser","Motor Yacht","Sailboat","Sport Fishing","Other"].map(v => (
                        <option key={v} value={v} className="bg-obsidian text-wake">{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="hero-service" className="text-steel-light text-[10px] tracking-[0.25em] uppercase">
                      Service Needed <span aria-hidden="true" className="text-navy">*</span>
                    </label>
                    <select id="hero-service" name="service" required defaultValue=""
                      className="bg-obsidian border border-steel-dark text-wake text-xs px-3 py-2 focus:outline-none focus:border-navy transition-colors duration-200 appearance-none cursor-pointer">
                      <option value="" disabled className="text-steel">Select service…</option>
                      {["Maintenance Wash","One-Off Wash","Full Detail","Exterior Detailing","Interior Cleaning & Cabin Detailing","Canvas Cleaning & Treatment","Vinyl & Upholstery Conditioning","Teak Cleaning & Brightening","Stainless Polish","Engine Bay & Bilge Cleaning","Water Spot & Mineral Deposit Removal","Ceramic Coating","Wax Application","Gel Coat Restoration","Monthly Maintenance Plan","Marine Transport","Captain & Crew Services","Yacht Management","Custom Request","Not Sure, Need Consultation"].map(s => (
                        <option key={s} value={s} className="bg-obsidian text-wake">{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* How did you hear */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="hero-referral" className="text-steel-light text-[10px] tracking-[0.25em] uppercase">
                    How Did You Hear About Us?
                  </label>
                  <select id="hero-referral" name="referral_source" defaultValue=""
                    className="bg-obsidian border border-steel-dark text-wake text-xs px-3 py-2 focus:outline-none focus:border-navy transition-colors duration-200 appearance-none cursor-pointer">
                    <option value="" className="text-steel">Prefer not to say</option>
                    {["Google Search","Google Maps","Instagram","Facebook","TikTok","Friend / Word of Mouth","Boat Show","Marina Referral","Other"].map(r => (
                      <option key={r} value={r} className="bg-obsidian text-wake">{r}</option>
                    ))}
                  </select>
                </div>

                {/* Additional details */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="hero-comments" className="text-steel-light text-[10px] tracking-[0.25em] uppercase">
                    Additional Details
                  </label>
                  <textarea id="hero-comments" name="comments" rows={2}
                    placeholder="Vessel length, condition, preferred dates…"
                    className="bg-obsidian/60 border border-steel-dark text-wake placeholder-steel text-xs px-3 py-2 focus:outline-none focus:border-navy transition-colors duration-200 resize-none" />
                </div>

                {/* Terms */}
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" name="terms" required
                    className="mt-0.5 w-3 h-3 border border-steel-dark bg-obsidian/60 accent-navy shrink-0 cursor-pointer" />
                  <span className="text-steel-light text-[10px] leading-relaxed">
                    I agree to the{" "}
                    <Link href="/terms" target="_blank" className="text-link hover:text-wake transition-colors underline underline-offset-2">
                      terms &amp; conditions
                    </Link>
                    . By providing my phone number I agree to receive communications from NorthWake Marine.
                  </span>
                </label>

                <button type="submit"
                  className="chrome-btn font-bold text-xs tracking-[0.3em] uppercase py-3 transition-all duration-300 hover:scale-[1.02] w-full">
                  Submit
                </button>
              </form>
            </div>

          </div>

          {/* Bottom fade */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 inset-x-0 h-20"
            style={{ background: "linear-gradient(to bottom, transparent, #000000)" }}
          />
        </section>


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
          <HeroCarousel showHeroOverlay={false} />
        </section>

      </main>

      <Footer />
    </>
  );
}
