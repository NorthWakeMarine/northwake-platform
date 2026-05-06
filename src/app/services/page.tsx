import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingCTA from "@/components/FloatingCTA";
import ScrollDepthTracker from "@/components/ScrollDepthTracker";

export const metadata: Metadata = {
  title: "Marine Services, Detailing, Ceramic Coating & Yacht Management",
  description:
    "NorthWake Marine's full service menu: maintenance washes, full details, ceramic coating, interior detailing, marine transport, captain & crew, yacht management, and more in Jacksonville, FL.",
  keywords: [
    "boat detailing Jacksonville",
    "ceramic coating boat Jacksonville FL",
    "yacht management Jacksonville",
    "marine transport Jacksonville FL",
    "captain crew services Jacksonville",
    "boat maintenance wash Florida",
    "gel coat restoration Jacksonville",
    "interior boat detailing Florida",
  ],
  openGraph: {
    title: "Marine Services | NorthWake Marine, Jacksonville, FL",
    description:
      "From maintenance washes to full-service yacht management and marine transport, NorthWake Marine offers concierge-level care for every vessel.",
    url: "https://northwakemarine.com/services",
  },
  alternates: { canonical: "https://northwakemarine.com/services" },
};

const services = [
  {
    id: "yacht-management",
    icon: "◈",
    tier: "Management",
    badge: "Featured",
    title: "Yacht Management",
    tagline: "Full-Service Concierge Care",
    description:
      "Complete end-to-end management for serious yacht owners who want nothing left to chance. From crew sourcing and captain coordination to insurance compliance, provisioning, voyage planning, and haul-out scheduling, our dedicated marine professionals handle every operational detail so you can focus on enjoying the water.",
    includes: [
      "Dedicated vessel manager & single point of contact",
      "Crew sourcing, vetting & captain coordination",
      "Provisioning, fuel coordination & logistics",
      "Insurance, documentation & USCG compliance",
      "Haul-out scheduling, storage & relaunch",
      "Voyage planning & slip/anchorage reservations",
    ],
    schemaDescription:
      "Full-service yacht management in Jacksonville, FL, including crew coordination, provisioning, insurance compliance, and voyage planning.",
  },
  {
    id: "maintenance-wash",
    icon: "◇",
    tier: "Washing",
    badge: "Most Popular",
    title: "Maintenance Wash",
    tagline: "Fresh Off the Dock, Every Time",
    description:
      "Keep your vessel looking its best with our signature top-to-waterline clean that removes salt, grime, and buildup. Includes foam bath, chamois dry, and wipe-down of glass and non-skid for that fresh-off-the-dock shine, without the effort.",
    includes: [
      "Full exterior foam bath & rinse",
      "Chamois dry",
      "Glass & non-skid wipe-down",
      "Salt & grime removal",
      "Rubber & trim wipe",
      "Quick visual condition check",
    ],
    schemaDescription:
      "Signature maintenance wash for boats in Jacksonville, FL. Top-to-waterline salt and grime removal with foam bath, chamois dry, and glass wipe-down.",
  },
  {
    id: "one-off-wash",
    icon: "△",
    tier: "Washing",
    badge: null,
    title: "One-Off Washes",
    tagline: "Spotless Without Commitment",
    description:
      "Need a quick clean before a trip or a showing? Our one-off washes deliver a spotless finish without requiring a maintenance plan. Perfect for seasonal boaters or special occasions when your vessel needs to look its absolute best.",
    includes: [
      "Full exterior wash & rinse",
      "Salt & mineral deposit removal",
      "Glass & stainless wipe-down",
      "Deck & non-skid scrub",
      "Hull spot treatment",
      "Same-day availability (subject to scheduling)",
    ],
    schemaDescription:
      "One-off boat wash service in Jacksonville, FL. No commitment required, ideal for seasonal boaters and pre-trip cleanings.",
  },
  {
    id: "full-detail",
    icon: "◈",
    tier: "Detailing",
    badge: "Premium",
    title: "Full Detail",
    tagline: "Bow-to-Stern Perfection",
    description:
      "Our most comprehensive detailing service. We remove oxidation, water spots, salt deposits, and staining through a meticulous wash, clay-bar, compound, polish, and seal sequence — then finish every interior surface, stainless fitting, and non-skid panel to showroom condition.",
    includes: [
      "Full exterior wash & decontamination",
      "Clay bar paint correction",
      "Multi-stage compound & dual-action polish",
      "Marine wax or polymer sealant coat",
      "Full stainless, chrome & glass polishing",
      "Deck scrub & non-skid treatment",
      "Interior vacuum, wipe-down & sanitation",
      "Optional engine bay detailing",
    ],
    schemaDescription:
      "Full bow-to-stern boat detailing in Jacksonville, FL. Includes clay bar, multi-stage compounding, polishing, sealant, interior cleaning, and optional engine bay service.",
  },
  {
    id: "interior-detailing",
    icon: "✦",
    tier: "Detailing",
    badge: null,
    title: "Interior Cleaning & Cabin Detailing",
    tagline: "Luxury Restored, Every Surface",
    description:
      "Deep-clean and luxury restoration of every interior surface. Our marine-trained specialists condition teak, treat vinyl and fabric upholstery, polish stainless and chrome fittings, eliminate odors at the source, and sanitize cabins, heads, and galleys, leaving a new-yacht feel after every service.",
    includes: [
      "Full interior vacuum, wipe-down & sanitation",
      "Teak & teak-alternative conditioning",
      "Marine vinyl & fabric upholstery treatment",
      "Stainless & chrome polishing & protectant",
      "Odor elimination (ozone treatment available)",
      "Bilge cleaning & compartment sanitation",
    ],
    schemaDescription:
      "Comprehensive interior boat detailing and cabin cleaning in Jacksonville, FL, including teak conditioning, upholstery treatment, and odor elimination.",
  },
  {
    id: "canvas-cleaning",
    icon: "◉",
    tier: "Detailing",
    badge: null,
    title: "Canvas Cleaning & Treatment",
    tagline: "Restore Color. Repel the Elements.",
    description:
      "Deep-cleaning to remove mold, mildew, and stains from biminis, covers, and enclosures, followed by marine-grade UV and water-repellent treatment that restores original color and extends canvas life significantly.",
    includes: [
      "Mold, mildew & stain removal",
      "Marine-safe fabric deep clean",
      "UV-protective treatment application",
      "Water-repellent re-treatment",
      "Color restoration where applicable",
      "Zipper & hardware inspection",
    ],
    schemaDescription:
      "Canvas cleaning and UV treatment for boat biminis, covers, and enclosures in Jacksonville, FL. Removes mold and mildew and restores water repellency.",
  },
  {
    id: "vinyl-upholstery",
    icon: "⬖",
    tier: "Detailing",
    badge: null,
    title: "Vinyl & Upholstery Conditioning",
    tagline: "Prevent Cracking. Preserve Color.",
    description:
      "UV-protective cleaning and conditioning for seats, cushions, and all upholstery surfaces to prevent premature cracking and fading. We use marine-specific products that clean deep, restore suppleness, and leave a UV barrier that protects in Jacksonville's intense sun.",
    includes: [
      "Marine vinyl deep clean",
      "UV-protective conditioner application",
      "Stain treatment & removal",
      "Seam & stitching inspection",
      "Fabric upholstery treatment available",
      "Color restoration where possible",
    ],
    schemaDescription:
      "Marine vinyl and upholstery cleaning and UV conditioning for boats in Jacksonville, FL. Prevents cracking, fading, and UV damage.",
  },
  {
    id: "teak-cleaning",
    icon: "◇",
    tier: "Detailing",
    badge: null,
    title: "Teak Cleaning & Brightening",
    tagline: "Restore the Natural Beauty of Wood",
    description:
      "Two-part teak clean and brighten to remove stains, graying, and oxidation while restoring the natural golden color of teak decks and trim. Our process is gentle on the wood but tough on grime, extending the life of your teak significantly.",
    includes: [
      "Two-part teak cleaner application",
      "Deep scrub & stain removal",
      "Brightener application & rinse",
      "Natural color restoration",
      "Optional teak sealer application",
      "Caulking condition inspection",
    ],
    schemaDescription:
      "Professional teak cleaning and brightening for boat decks and trim in Jacksonville, FL. Two-part process restores natural wood color and removes graying.",
  },
  {
    id: "stainless-polish",
    icon: "△",
    tier: "Detailing",
    badge: null,
    title: "Stainless Polish",
    tagline: "Corrosion-Free. Mirror Shine.",
    description:
      "Hand-polishing for rails, hardware, cleats, and all stainless fittings to remove corrosion, rust staining, and water spots. Finished with a marine-grade protectant that leaves a brilliant shine and guards against the harsh marine environment.",
    includes: [
      "Full stainless inventory assessment",
      "Corrosion & rust stain removal",
      "Hand-polish with marine compounds",
      "Mirror finish buffing",
      "Marine-grade protectant application",
      "Hardware & cleat inspection",
    ],
    schemaDescription:
      "Stainless steel polishing and corrosion removal for boat rails, hardware, and fittings in Jacksonville, FL.",
  },
  {
    id: "engine-bilge",
    icon: "⬡",
    tier: "Detailing",
    badge: null,
    title: "Engine Bay & Bilge Cleaning",
    tagline: "Clean Below Decks. Spot Problems Early.",
    description:
      "Removal of grease, oil, and grime buildup from engine compartments and bilge areas using marine-safe degreasers. A clean engine bay improves appearance, makes maintenance easier, and, critically, helps you spot leaks, corrosion, or developing issues before they become costly repairs.",
    includes: [
      "Marine-safe degreaser application",
      "Engine bay scrub & rinse",
      "Bilge pump area cleaning",
      "Hose, fitting & wiring visual inspection",
      "Oil & fuel residue removal",
      "Before & after documentation",
    ],
    schemaDescription:
      "Engine bay and bilge cleaning for boats in Jacksonville, FL using marine-safe degreasers. Removes grease and oil buildup and helps identify developing issues.",
  },
  {
    id: "water-spots",
    icon: "◉",
    tier: "Detailing",
    badge: null,
    title: "Water Spot & Mineral Deposit Removal",
    tagline: "Streak-Free Glass. Spotless Surfaces.",
    description:
      "Specialized marine-safe removers and polishes eliminate hard water stains and calcium deposits from glass, stainless, and painted surfaces. Whether from dock hose drip or salt spray, we leave every surface spotless and streak-free.",
    includes: [
      "Mineral deposit analysis & treatment selection",
      "Marine-safe acid-free removers",
      "Glass, stainless & paint treatment",
      "Polish & sealant finish",
      "Window track & frame cleaning",
      "Streak-free final inspection",
    ],
    schemaDescription:
      "Water spot and mineral deposit removal for boat glass, stainless, and painted surfaces in Jacksonville, FL.",
  },
  {
    id: "ceramic-coating",
    icon: "◈",
    tier: "Protection",
    badge: "Premium",
    title: "Ceramic Coating",
    tagline: "Armor-Grade Hull Protection",
    description:
      "Professional-grade 9H nano-ceramic coating bonds permanently to your hull, gelcoat, and topside surfaces at a molecular level. The result is a hydrophobic, UV-resistant, self-cleaning barrier that repels salt, fuel stains, and marine growth for up to five years, with a mirror finish that no wax can match.",
    includes: [
      "Full paint correction prep (compound & polish)",
      "Surface decontamination & IPA wipe-down",
      "9H professional nano-ceramic application",
      "Infrared cure & hardness verification",
      "UV & salt-water resistance, up to 5 years",
      "Transferable protection warranty",
    ],
    schemaDescription:
      "Professional 9H nano-ceramic coating application for boats and yachts in Jacksonville, FL. Provides up to 5 years of UV and salt-water protection with a mirror-grade finish.",
  },
  {
    id: "wax-application",
    icon: "◇",
    tier: "Protection",
    badge: null,
    title: "Wax Application",
    tagline: "High-Gloss Protection That Lasts",
    description:
      "Polymer or carnauba-based marine waxes that shield gelcoat and paint from UV radiation, salt, and oxidation. A professionally applied wax delivers a durable, high-gloss finish that lasts for months, and serves as an excellent maintenance layer between ceramic coating services.",
    includes: [
      "Surface prep wash & light polish",
      "Polymer or carnauba wax selection",
      "Machine-applied even coat",
      "Hand-buff to high-gloss finish",
      "UV & salt oxidation barrier",
      "3–6 month protection layer",
    ],
    schemaDescription:
      "Professional marine wax application for boats in Jacksonville, FL. Polymer or carnauba-based wax for UV and salt protection with a high-gloss finish.",
  },
  {
    id: "gel-coat-restoration",
    icon: "⬖",
    tier: "Restoration",
    badge: null,
    title: "Gel Coat Restoration",
    tagline: "Eliminate Oxidation. Restore Brilliance.",
    description:
      "Years of UV exposure and salt air leave gelcoat chalky, faded, and dull. Our multi-stage restoration process, wet-sanding, compounding, machine polishing, and sealing, reverses that damage and returns your hull to a factory gloss. We finish with either a professional polymer seal or a full ceramic topper for long-term protection.",
    includes: [
      "Color depth & condition assessment",
      "Wet-sand (where required) to remove deep oxidation",
      "Multi-stage compound & machine polish",
      "High-speed rotary finishing pass",
      "Polymer sealant or ceramic topper finish",
      "Topsides trim & hardware polish",
    ],
    schemaDescription:
      "Gel coat oxidation removal and restoration service for boats in Jacksonville, FL. Multi-stage compounding and polishing returns hulls to factory gloss.",
  },
  {
    id: "marine-transport",
    icon: "△",
    tier: "Transport",
    badge: null,
    title: "Marine Transport",
    tagline: "Safe, Reliable. On Schedule.",
    description:
      "Safe, reliable vessel transport across Florida and beyond, moving slips, hauling for service, or relocating. Whether you're moving a vessel across the bay or across the state, our licensed team provides experienced coordination and protection in transit.",
    includes: [
      "Licensed & insured transport team",
      "Local Jacksonville bay moves",
      "Statewide Florida transport",
      "Haul-out & launch coordination",
      "In-transit protection & documentation",
      "Flexible scheduling & route planning",
    ],
    schemaDescription:
      "Licensed marine transport and vessel relocation services in Jacksonville, FL and across Florida. Includes haul-out coordination and in-transit protection.",
  },
  {
    id: "captain-crew",
    icon: "◉",
    tier: "Transport",
    badge: null,
    title: "Captain & Crew Services",
    tagline: "Experienced Professionals, On Demand",
    description:
      "Qualified captains, deckhands, and crew available on a day-rate or contract basis. Whether you need help moving a vessel, running a charter, delivery captaining, or simply want extra experienced hands onboard, we provide reliable, licensed marine professionals.",
    includes: [
      "USCG-licensed captains",
      "Day-rate & contract crew",
      "Delivery captaining (local & coastal)",
      "Charter support crew",
      "New vessel pickup & relocation",
      "On-call scheduling available",
    ],
    schemaDescription:
      "Captain and crew services in Jacksonville, FL. USCG-licensed captains and experienced crew available for charters, deliveries, and vessel relocations.",
  },
  {
    id: "custom-requests",
    icon: "✦",
    tier: "Custom",
    badge: null,
    title: "Custom Requests",
    tagline: "If You Can Describe It, We Can Handle It",
    description:
      "Don't see exactly what you need? We thrive on the unique and unexpected. From sourcing obscure parts and custom accessories to coordinating haul-outs, assisting with insurance inspections, pre-sale enhancements, or any other à la carte marine task, tell us what you need and we'll make it happen.",
    includes: [
      "À la carte service customization",
      "Pre-sale preparation & detailing",
      "Insurance inspection coordination",
      "Parts sourcing & accessory installation",
      "Haul-out & winterization assistance",
      "Any service combination or special request",
    ],
    schemaDescription:
      "Custom and à la carte marine services in Jacksonville, FL. From pre-sale prep to parts sourcing and insurance inspections, if you need it, we handle it.",
  },
];

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "NorthWake Marine, Marine Services Jacksonville FL",
  description:
    "Complete list of professional marine services offered by NorthWake Marine in Jacksonville, Florida.",
  url: "https://northwakemarine.com/services",
  numberOfItems: services.length,
  itemListElement: services.map((s, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Service",
      "@id": `https://northwakemarine.com/services#${s.id}`,
      name: s.title,
      description: s.schemaDescription,
      serviceType: s.tier,
      provider: {
        "@type": "LocalBusiness",
        name: "NorthWake Marine",
        "@id": "https://northwakemarine.com/#business",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Jacksonville",
          addressRegion: "FL",
          addressCountry: "US",
        },
      },
      areaServed: {
        "@type": "City",
        name: "Jacksonville",
        addressRegion: "FL",
        addressCountry: "US",
      },
      offers: {
        "@type": "Offer",
        availability: "https://schema.org/InStock",
        priceSpecification: {
          "@type": "PriceSpecification",
          priceCurrency: "USD",
          description: "Custom quote based on vessel size and condition. Contact for pricing.",
        },
      },
    },
  })),
};


export default function ServicesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />

      <Header />
      <FloatingCTA />
      <ScrollDepthTracker />

      <main>
        {/* ── Hero ── */}
        <section
          aria-labelledby="services-hero-heading"
          className="hero-grid relative pt-32 pb-8 px-6 text-center overflow-hidden"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(0,0,128,0.22) 0%, transparent 70%)",
            }}
          />
          <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-6">
            <p className="text-steel text-[10px] tracking-[0.4em] uppercase">
              Jacksonville, FL &nbsp;·&nbsp; Professional Marine Services
            </p>
            <h1
              id="services-hero-heading"
              className="chrome-text text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight"
            >
              Every Service.<br />
              <span className="text-wake">One Uncompromising Standard.</span>
            </h1>
            <p className="text-steel-light text-base max-w-2xl leading-relaxed">
              From single-day washes to full-service yacht management and marine transport,
              every NorthWake service is delivered by certified professionals using
              professional-grade products, with photo documentation on every job.
            </p>
            <hr className="accent-rule w-40 mt-2" />
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 inset-x-0 h-24"
            style={{ background: "linear-gradient(to bottom, transparent, #000000)" }}
          />
        </section>

        {/* ── Services grid ── */}
        <section
          id="services-grid"
          aria-labelledby="services-grid-heading"
          className="pt-8 pb-24 px-6"
        >
          <div className="max-w-7xl mx-auto">
            <h2 id="services-grid-heading" className="sr-only">All Services</h2>

            <ul className="flex flex-col gap-0 border border-steel-dark list-none" role="list">
              {services.map((svc, i) => (
                <li
                  key={svc.id}
                  id={svc.id}
                  className={`group grid md:grid-cols-[1fr_2fr] gap-0 ${
                    i !== services.length - 1 ? "border-b border-steel-dark" : ""
                  }`}
                >
                  {/* Left panel */}
                  <div className="flex flex-col gap-4 p-8 md:p-10 border-b md:border-b-0 md:border-r border-steel-dark bg-obsidian group-hover:bg-navy-dark transition-colors duration-300">
                    <div className="flex items-start justify-between gap-3">
                      <span aria-hidden="true" className="chrome-text text-4xl leading-none">
                        {svc.icon}
                      </span>
                      {svc.badge && (
                        <span className="badge-chrome text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1">
                          <span className="badge-chrome-text">{svc.badge}</span>
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-steel text-[9px] tracking-[0.35em] uppercase mb-1.5">
                        {svc.tier}
                      </p>
                      <h3 className="text-wake text-xl font-bold tracking-tight leading-tight">
                        {svc.title}
                      </h3>
                      <p className="text-steel text-xs mt-1 tracking-wide">{svc.tagline}</p>
                    </div>
                    <Link
                      href={`/contact?service=${encodeURIComponent(svc.title)}`}
                      aria-label={`Request service: ${svc.title}`}
                      className="chrome-btn self-start text-[10px] font-bold tracking-[0.25em] uppercase px-5 py-2.5 transition-all duration-300 hover:scale-105 mt-auto"
                    >
                      Request Service
                    </Link>
                  </div>

                  {/* Right panel */}
                  <div className="flex flex-col gap-6 p-8 md:p-10 bg-obsidian group-hover:bg-[#040408] transition-colors duration-300">
                    <p className="text-steel-light text-sm leading-relaxed">{svc.description}</p>
                    <div>
                      <p className="text-steel text-[9px] tracking-[0.3em] uppercase mb-4">
                        What&apos;s Included
                      </p>
                      <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5 list-none">
                        {svc.includes.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-steel-light text-xs">
                            <span aria-hidden="true" className="text-navy mt-0.5 shrink-0">▸</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── COMPARISON TABLE ── */}
        <section aria-labelledby="comparison-heading" className="py-20 px-6 border-t border-steel-dark">
          <div className="max-w-4xl mx-auto flex flex-col gap-10">
            <header className="flex flex-col items-center text-center gap-2">
              <p className="text-steel text-[10px] tracking-[0.4em] uppercase">Side by Side</p>
              <h2
                id="comparison-heading"
                className="text-wake text-2xl sm:text-3xl font-bold tracking-tight"
              >
                Ceramic Coating vs. <span className="chrome-text">Wax Application</span>
              </h2>
              <p className="text-steel text-sm max-w-lg mt-1">
                Both protect your hull. The difference is how long, how hard, and how much work you want to do next year.
              </p>
              <hr className="accent-rule w-48 mt-2" />
            </header>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-steel-dark">
                    <th className="text-left text-steel text-[10px] tracking-[0.3em] uppercase py-3 pr-6 font-semibold w-1/3">Feature</th>
                    <th className="text-left py-3 pr-6 w-1/3">
                      <span className="chrome-text font-bold text-xs tracking-wide">Ceramic Coating</span>
                    </th>
                    <th className="text-left py-3 w-1/3">
                      <span className="text-wake font-bold text-xs tracking-wide">Wax Application</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel-dark/40">
                  {[
                    ["Durability", "3 to 5 years", "3 to 6 months"],
                    ["UV Protection", "Yes, nano-bond barrier", "Limited"],
                    ["Salt Water Resistance", "High", "Moderate"],
                    ["Hardness Rating", "9H ceramic", "Soft wax layer"],
                    ["Finish Quality", "Mirror-grade gloss", "Good shine"],
                    ["Application Time", "Full-day professional job", "2 to 4 hours"],
                    ["Maintenance After", "Rinse only", "Re-wax every season"],
                    ["Best For", "Long-term hull protection", "Seasonal upkeep"],
                  ].map(([feature, ceramic, wax]) => (
                    <tr key={feature} className="hover:bg-navy-dark/30 transition-colors duration-150">
                      <td className="text-steel text-[11px] tracking-wide py-3.5 pr-6 font-medium">{feature}</td>
                      <td className="text-steel-light text-xs py-3.5 pr-6">{ceramic}</td>
                      <td className="text-steel text-xs py-3.5">{wax}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
