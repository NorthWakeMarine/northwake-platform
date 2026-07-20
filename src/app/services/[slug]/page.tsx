import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollDepthTracker from "@/components/ScrollDepthTracker";
import { clientConfig } from "@/config/client";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return clientConfig.services.map((svc) => ({ slug: svc.id }));
}

function buildMetaDescription(id: string, schemaDescription: string, city: string, state: string): string {
  const overrides: Record<string, string> = {
    "marine-transport":
      `Boat transport and vessel relocation in ${city}, FL and across Florida. Yacht transport, sailboat shipping, slip moves, and haul-out coordination. Licensed, insured, flexible scheduling.`,
    "outboard-engine-service":
      `Yamaha-certified outboard engine service in ${city}, FL. 100-hour and 300-hour maintenance, oil changes, gear lube, and impeller service. Mobile service comes to your dock.`,
    "outboard-diagnostics":
      `Outboard engine diagnostics and repair in ${city}, FL. Boat mechanic for all major brands including Yamaha, Mercury, and Honda. Mobile service, no trailering required.`,
    "maintenance-wash":
      `Maintenance boat wash in ${city}, FL. Salt removal, foam bath, chamois dry, and full exterior rinse. Regular and one-time service available. Mobile, comes to your dock or slip.`,
    "ceramic-coating":
      `Marine ceramic coating in ${city}, FL. 9H nano-ceramic hull protection for up to 5 years. UV and salt-water resistant with a mirror finish. Professional application by NorthWake Marine.`,
    "yacht-management":
      `Full-service yacht management in ${city}, FL. Dedicated vessel manager, crew coordination, provisioning, USCG compliance, and voyage planning. Concierge-level care for serious yacht owners.`,
    "aero-detailing":
      `Aircraft detailing in ${city}, FL. Hangar-side service for piston singles, turboprops, and business jets. Aviation-safe exterior polish, interior cleaning, and brightwork.`,
    "rv-detailing":
      `Mobile RV detailing in ${city}, FL. Full interior and exterior service for motorhomes, fifth wheels, and travel trailers. Roof cleaning, awning treatment, and slide-out care at your site or storage facility.`,
    "automotive-detailing":
      `Mobile auto detailing in ${city}, FL. Full-service car, truck, and SUV detailing including paint correction and ceramic coating. Comes to your home or office. No drop-off required.`,
    "full-detail":
      `Full bow-to-stern boat detailing in ${city}, FL. Clay bar, multi-stage compounding, polish, sealant, and interior cleaning for showroom-condition results.`,
    "captain-crew":
      `USCG-licensed captains and crew for hire in ${city}, FL. Day-rate and contract crew, delivery captaining, charter support, and vessel pickup or relocation.`,
    "vinyl-upholstery":
      `Marine vinyl and upholstery conditioning in ${city}, FL. UV-protective cleaning that prevents cracking and fading and restores color on seats and cushions.`,
    "teak-cleaning":
      `Teak cleaning and brightening in ${city}, FL. Two-part process removes stains and graying and restores the natural golden color of teak decks and trim.`,
    "stainless-polish":
      `Stainless steel polishing in ${city}, FL. Hand-polished rails, hardware, and cleats with corrosion removal and a marine-grade protectant for a mirror finish.`,
    "engine-bilge":
      `Engine bay and bilge cleaning in ${city}, FL. Marine-safe degreasers remove grease and oil buildup and help you spot leaks or corrosion early.`,
    "water-spots":
      `Water spot and mineral deposit removal in ${city}, FL. Marine-safe removers eliminate hard water stains and calcium deposits from glass, stainless, and paint.`,
    "one-off-wash":
      `One-off boat wash in ${city}, FL. A spotless finish before a trip or showing, no maintenance plan required. Same-day availability, subject to scheduling.`,
    "wax-application":
      `Marine wax application in ${city}, FL. Polymer or carnauba wax shields gelcoat and paint from UV and salt oxidation with a durable, high-gloss finish.`,
    "gel-coat-restoration":
      `Gel coat restoration in ${city}, FL. Multi-stage wet-sand, compound, and polish process reverses UV and oxidation damage and returns hulls to factory gloss.`,
    "interior-detailing":
      `Interior cabin detailing in ${city}, FL. Teak conditioning, upholstery treatment, stainless polishing, and odor elimination for a new-yacht feel every visit.`,
    "canvas-cleaning":
      `Canvas cleaning and treatment in ${city}, FL. Removes mold, mildew, and stains from biminis, covers, and enclosures with a UV and water-repellent finish.`,
    "custom-requests":
      `Custom marine services in ${city}, FL. Parts sourcing, pre-sale prep, insurance inspection coordination, and haul-out assistance. Tell us what you need.`,
  };
  return overrides[id] ?? `${schemaDescription} Mobile service throughout ${city}, ${state} and Northeast Florida. No trailering required.`;
}

type FAQ = { q: string; a: string };

function buildFAQ(id: string, title: string, companyName: string, city: string, state: string): FAQ[] {
  const overrides: Record<string, FAQ[]> = {
    "yacht-management": [
      { q: "What does a NorthWake vessel manager actually handle?", a: "Crew sourcing and vetting, provisioning, fuel coordination, insurance and USCG documentation, haul-out scheduling, and voyage or slip planning, all through a single dedicated point of contact." },
      { q: "Is yacht management only for large vessels?", a: "It's built for owners who want operational details handled end-to-end, regardless of exact length. We evaluate every vessel individually during your free quote." },
    ],
    "aero-detailing": [
      { q: "Do you come to my hangar or ramp position?", a: "Yes. We perform hangar-side or ramp-side service so your aircraft never has to be moved for detailing." },
      { q: "Are your products safe for aircraft paint and composites?", a: "Yes. We use aviation-safe products for exterior polish, de-oxidation, brightwork, and interior cabin cleaning on piston singles, twins, turboprops, and business jets." },
    ],
    "rv-detailing": [
      { q: "What types of RVs do you service?", a: "Class A, B, and C motorhomes, fifth wheels, and travel trailers, including roof, awning, slide-out, and full interior and exterior detailing." },
      { q: "Do you come to my storage facility?", a: "Yes. Our mobile team comes to your site or storage facility, no need to move the RV." },
    ],
    "automotive-detailing": [
      { q: "Do you detail cars at my home or office?", a: "Yes. We bring professional-grade products and equipment to your home, office, or storage location, no drop-off required." },
      { q: "Do you offer paint correction and ceramic coating for vehicles?", a: "Yes. Automotive detailing ranges from a basic exterior and interior clean-up to full multi-stage paint correction and ceramic coating." },
    ],
    "maintenance-wash": [
      { q: "What's included in a maintenance wash?", a: "A full exterior foam bath and rinse, chamois dry, glass and non-skid wipe-down, salt and grime removal, and a quick visual condition check." },
      { q: "How often should I schedule a maintenance wash?", a: "Most owners in Jacksonville's saltwater environment book on a recurring schedule to prevent salt buildup and staining between deeper details." },
    ],
    "marine-transport": [
      { q: "Are you licensed and insured for vessel transport?", a: "Yes. Our transport team is licensed and insured for local Jacksonville bay moves and statewide Florida relocations, including haul-out and launch coordination." },
      { q: "Can you coordinate a haul-out for transport?", a: "Yes, we coordinate haul-out and launch scheduling as part of every transport job, with in-transit protection and documentation." },
    ],
    "outboard-engine-service": [
      { q: "Are your mechanics Yamaha-certified?", a: "Yes. Our Yamaha-certified mechanic performs 100-hour and 300-hour scheduled maintenance, oil and filter changes, gear lube, spark plug replacement, fuel filter service, and impeller inspections." },
      { q: "Do you service other outboard brands?", a: `This service is Yamaha-specific. For diagnostics and repair on other major brands, see our Outboard Diagnostics & Repair service.` },
    ],
    "outboard-diagnostics": [
      { q: "What outboard problems can you diagnose?", a: "Overheating, no-start conditions, trim and tilt issues, and propeller damage, across all major outboard brands." },
      { q: "Do you work on brands other than Yamaha?", a: "Yes. Diagnostics and repair cover all major outboard brands, not just Yamaha." },
    ],
    "ceramic-coating": [
      { q: "How long does ceramic coating last on a boat?", a: "Our 9H professional nano-ceramic application is rated for up to 5 years of UV and salt-water resistance, backed by a transferable protection warranty." },
      { q: "Does ceramic coating require paint correction first?", a: "Yes. Every application includes full paint correction prep (compound and polish) and surface decontamination before the ceramic coating is applied." },
    ],
  };

  return overrides[id] ?? [
    {
      q: `How much does ${title.toLowerCase()} cost in ${city}, ${state}?`,
      a: `Pricing depends on your asset's size and condition. Contact ${companyName} for a free, no-obligation quote, most quotes are returned the same day.`,
    },
    {
      q: `Do you come to my location for ${title.toLowerCase()}?`,
      a: `Yes. ${companyName} is fully mobile and comes to your dock, marina, hangar, or storage location throughout ${city}, ${state} and Northeast Florida. No trailering required.`,
    },
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const svc = clientConfig.services.find((s) => s.id === slug);
  if (!svc) return {};

  const { companyName, siteUrl, city, state } = clientConfig;

  const title = `${svc.title} in ${city}, FL`;
  const description = buildMetaDescription(slug, svc.schemaDescription, city, state);

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${companyName}`,
      description,
      url: `${siteUrl}/services/${slug}`,
    },
    alternates: { canonical: `${siteUrl}/services/${slug}` },
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const svc = clientConfig.services.find((s) => s.id === slug);
  if (!svc) notFound();

  const { companyName, siteUrl, phone, phoneE164, city, state, services } = clientConfig;

  const relatedServices = services
    .filter((s) => s.id !== svc.id && s.tier === svc.tier)
    .slice(0, 3);

  const otherServices = services
    .filter((s) => s.id !== svc.id && s.tier !== svc.tier)
    .slice(0, relatedServices.length < 3 ? 3 - relatedServices.length + 3 : 3);

  const showcaseServices = [...relatedServices, ...otherServices].slice(0, 4);

  const faq = buildFAQ(svc.id, svc.title, companyName, city, state);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${siteUrl}/services/${svc.id}`,
    name: svc.title,
    description: svc.schemaDescription,
    serviceType: svc.tier,
    provider: {
      "@type": "LocalBusiness",
      name: companyName,
      "@id": `${siteUrl}/#business`,
      telephone: phoneE164,
      address: {
        "@type": "PostalAddress",
        addressLocality: city,
        addressRegion: state,
        addressCountry: "US",
      },
    },
    areaServed: {
      "@type": "State",
      name: "Florida",
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
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Services", item: `${siteUrl}/services` },
      { "@type": "ListItem", position: 3, name: svc.title, item: `${siteUrl}/services/${svc.id}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Header />
      <ScrollDepthTracker />

      <main className="bg-white">

        {/* ── Hero ─────────────────────────────────────────────────────────────── */}
        <section
          className="hero-grid relative pt-32 pb-16 px-6 text-center overflow-hidden bg-white"
          aria-labelledby="svc-heading"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(0,0,128,0.06) 0%, transparent 70%)" }}
          />
          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-5">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-gray-400">
              <Link href="/" className="hover:text-navy transition-colors">Home</Link>
              <span aria-hidden="true">›</span>
              <Link href="/services" className="hover:text-navy transition-colors">Services</Link>
              <span aria-hidden="true">›</span>
              <span className="text-gray-600">{svc.title}</span>
            </nav>
            <p className="text-gray-500 text-xs tracking-[0.4em] uppercase">
              {svc.tier} &nbsp;·&nbsp; {city}, {state}
            </p>
            <h1 id="svc-heading" className="text-gray-900 text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
              <span className="chrome-text-dark">{svc.title}</span>
              <br />
              <span className="text-3xl sm:text-4xl font-semibold text-gray-700">in {city}, Florida</span>
            </h1>
            <p className="text-gray-600 text-base max-w-2xl leading-relaxed">{svc.tagline}</p>
            <div className="flex flex-wrap gap-4 justify-center mt-2">
              <Link
                href={`/contact?service=${encodeURIComponent(svc.title)}`}
                className="chrome-btn font-bold text-xs tracking-[0.3em] uppercase px-8 py-3.5 transition-all duration-300 hover:scale-105"
              >
                Request a Quote
              </Link>
              <a
                href={`tel:${phoneE164}`}
                className="border border-gray-500 text-gray-700 text-xs font-semibold tracking-[0.3em] uppercase px-8 py-3.5 hover:border-navy hover:text-navy transition-colors duration-300"
              >
                {phone}
              </a>
            </div>
          </div>
        </section>

        {/* ── Description + Includes ───────────────────────────────────────────── */}
        <section className="py-16 px-6 border-t border-gray-100" aria-labelledby="svc-details-heading">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div className="flex flex-col gap-5">
              <p className="text-gray-500 text-xs tracking-[0.4em] uppercase">About this service</p>
              <h2 id="svc-details-heading" className="text-gray-900 text-2xl font-bold tracking-tight">
                What is {svc.title}?
              </h2>
              <p className="text-gray-700 text-sm leading-relaxed">{svc.description}</p>
              <p className="text-gray-600 text-sm leading-relaxed">
                {companyName} provides {svc.title.toLowerCase()} as a fully mobile service throughout {city}, {state} and Northeast Florida.
                We come to your dock, marina slip, or dry storage facility. No trailering required, no scheduling around a fixed shop.
              </p>
            </div>
            <div className="flex flex-col gap-5">
              <p className="text-gray-500 text-xs tracking-[0.4em] uppercase">What&apos;s included</p>
              <h2 className="text-gray-900 text-2xl font-bold tracking-tight">
                Every {svc.title} includes
              </h2>
              <ul className="flex flex-col gap-3">
                {svc.includes.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="text-navy mt-0.5 shrink-0 font-bold">▸</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={`/contact?service=${encodeURIComponent(svc.title)}`}
                className="mt-2 chrome-btn inline-block text-xs font-bold tracking-[0.25em] uppercase px-6 py-3 transition-all duration-300 hover:scale-105 w-fit"
              >
                Get a Free Quote
              </Link>
            </div>
          </div>
        </section>

        {/* ── Why NorthWake ────────────────────────────────────────────────────── */}
        <section className="bg-obsidian py-16 px-6 border-t border-steel-dark" aria-labelledby="svc-why-heading">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-steel text-xs tracking-[0.4em] uppercase mb-3">Why {companyName}</p>
              <h2 id="svc-why-heading" className="chrome-text text-3xl font-bold tracking-tight mb-5">
                {city}&apos;s choice for {svc.title.toLowerCase()}
              </h2>
              <p className="text-steel-light text-sm leading-relaxed mb-4">
                {companyName} is a Jacksonville-based marine service company serving Northeast Florida. We are not a franchise
                and not a call center dispatching subcontractors. Every {svc.title.toLowerCase()} job is handled by our team
                with professional-grade products and photo documentation on every visit.
              </p>
              <p className="text-steel-light text-sm leading-relaxed">
                We operate throughout {city} and the surrounding waterfront communities, from the St. Johns River to the
                Intracoastal Waterway and the beaches. Wherever your vessel is kept, we can reach you.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {[
                { label: "Mobile service", desc: "We come to your dock, your marina, or your storage facility." },
                { label: "Photo documentation", desc: "Before and after photos on every job, every time." },
                { label: "Professional-grade products", desc: "Marine-specific compounds and coatings only. No consumer-grade shortcuts." },
                { label: "No contracts required", desc: "Book one service or book a season. No minimums, no commitments." },
              ].map((item) => (
                <div key={item.label} className="border-l-2 border-wake pl-4">
                  <p className="font-bold text-sm text-white">{item.label}</p>
                  <p className="text-xs text-steel-light mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
        <section className="py-16 px-6 border-t border-gray-100 bg-gray-50" aria-labelledby="svc-faq-heading">
          <div className="max-w-3xl mx-auto flex flex-col gap-8">
            <header className="flex flex-col gap-1">
              <p className="text-gray-500 text-xs tracking-[0.4em] uppercase">Common Questions</p>
              <h2 id="svc-faq-heading" className="text-gray-900 text-2xl font-bold tracking-tight">
                {svc.title} FAQs
              </h2>
            </header>
            <dl className="flex flex-col gap-px bg-gray-200">
              {faq.map(({ q, a }) => (
                <div key={q} className="bg-white p-6 hover:bg-gray-50 transition-colors duration-200">
                  <dt className="text-gray-900 text-sm font-semibold mb-2">{q}</dt>
                  <dd className="text-gray-700 text-sm leading-relaxed">{a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── Related Services ─────────────────────────────────────────────────── */}
        {showcaseServices.length > 0 && (
          <section className="bg-gray-50 py-16 px-6 border-t border-gray-100" aria-labelledby="svc-related-heading">
            <div className="max-w-5xl mx-auto">
              <div className="mb-8">
                <p className="text-gray-500 text-xs tracking-[0.4em] uppercase mb-2">Also available</p>
                <h2 id="svc-related-heading" className="text-gray-900 text-2xl font-bold tracking-tight">
                  Other services from {companyName}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {showcaseServices.map((s) => (
                  <Link
                    key={s.id}
                    href={`/services/${s.id}`}
                    className="group border border-gray-200 bg-white p-5 flex flex-col gap-3 hover:border-navy transition-colors duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-navy text-xl">{s.icon}</span>
                      {s.badge && (
                        <span className="badge-chrome text-[9px] font-bold tracking-[0.2em] uppercase px-2 py-0.5">
                          <span className="badge-chrome-text">{s.badge}</span>
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-400 text-[10px] tracking-[0.3em] uppercase mb-0.5">{s.tier}</p>
                      <h3 className="font-bold text-sm text-gray-900 group-hover:text-navy transition-colors">{s.title}</h3>
                      <p className="text-gray-500 text-xs mt-0.5">{s.tagline}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-8 text-center">
                <Link
                  href="/services"
                  className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-500 hover:text-navy transition-colors border-b border-gray-300 hover:border-navy pb-0.5"
                >
                  View all services
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── CTA ──────────────────────────────────────────────────────────────── */}
        <section className="bg-white py-16 px-6 border-t border-gray-100">
          <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-5">
            <h2 className="chrome-text-dark text-3xl font-bold tracking-tight">
              Ready to book {svc.title.toLowerCase()}?
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed max-w-lg">
              Request a free quote and we will be in touch within one business day. Most quotes are returned same day.
              We serve {city}, {state} and all of Northeast Florida.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href={`/contact?service=${encodeURIComponent(svc.title)}`}
                className="chrome-btn font-bold text-xs tracking-[0.3em] uppercase px-8 py-3.5 transition-all duration-300 hover:scale-105"
              >
                Get a Free Quote
              </Link>
              <a
                href={`tel:${phoneE164}`}
                className="border border-gray-500 text-gray-700 text-xs font-semibold tracking-[0.3em] uppercase px-8 py-3.5 hover:border-navy hover:text-navy transition-colors duration-300"
              >
                Call {phone}
              </a>
            </div>
            <p className="text-gray-400 text-xs">No obligation. No contracts. Mobile service throughout {city}, {state}.</p>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
