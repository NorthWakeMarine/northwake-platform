import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollDepthTracker from "@/components/ScrollDepthTracker";
import { clientConfig } from "@/config/client";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return clientConfig.locations.map((loc) => ({ slug: loc.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const loc = clientConfig.locations.find((l) => l.slug === slug);
  if (!loc) return {};

  const title = `Marine Services in ${loc.name}, FL | ${clientConfig.companyName}`;
  const description = `${clientConfig.companyName} provides professional marine detailing, maintenance, and vessel management in ${loc.name}, FL. Mobile services that come to your dock or marina.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${clientConfig.siteUrl}/locations/${slug}`,
    },
    alternates: { canonical: `${clientConfig.siteUrl}/locations/${slug}` },
  };
}

export default async function LocationPage({ params }: Props) {
  const { slug } = await params;
  const loc = clientConfig.locations.find((l) => l.slug === slug);
  if (!loc) notFound();

  const { companyName, siteUrl, phone, phoneE164, services, city, state } = clientConfig;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteUrl}/#business`,
    name: companyName,
    url: siteUrl,
    telephone: phoneE164,
    areaServed: {
      "@type": "City",
      name: loc.name,
      addressRegion: state,
      addressCountry: "US",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `Marine Services in ${loc.name}, ${state}`,
      itemListElement: services.map((s) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: s.title,
          description: s.schemaDescription,
        },
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <ScrollDepthTracker />

      <main className="bg-white">

        {/* ── Hero ────────────────────────────────────────────────────────────── */}
        <section
          className="hero-grid relative pt-32 pb-16 px-6 text-center overflow-hidden bg-white"
          aria-labelledby="loc-heading"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(0,0,128,0.06) 0%, transparent 70%)" }}
          />
          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-5">
            <p className="text-gray-500 text-xs tracking-[0.4em] uppercase">
              {loc.name}, {state} &nbsp;·&nbsp; Mobile Marine Services
            </p>
            <h1 id="loc-heading" className="text-gray-900 text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
              Marine Services in<br />
              <span className="chrome-text-dark">{loc.name}, Florida</span>
            </h1>
            <p className="text-gray-600 text-base max-w-2xl leading-relaxed">
              {loc.description}
            </p>
            <div className="flex flex-wrap gap-4 justify-center mt-2">
              <Link
                href="/contact"
                className="chrome-btn font-bold text-xs tracking-[0.3em] uppercase px-8 py-3.5 transition-all duration-300 hover:scale-105"
              >
                Request Service
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

        {/* ── Services ────────────────────────────────────────────────────────── */}
        <section className="py-16 px-6 border-t border-gray-100" aria-labelledby="loc-services-heading">
          <div className="max-w-6xl mx-auto">
            <div className="mb-10">
              <p className="text-gray-500 text-xs tracking-[0.4em] uppercase mb-2">What we offer</p>
              <h2 id="loc-services-heading" className="text-gray-900 text-3xl font-bold tracking-tight">
                Services available in {loc.name}
              </h2>
              <p className="text-gray-600 text-sm mt-2 max-w-xl leading-relaxed">
                Every service is mobile. We come to your dock, your marina slip, or your dry storage facility.
                No trailering, no scheduling around a fixed location.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((svc) => (
                <Link
                  key={svc.id}
                  href={`/contact?service=${encodeURIComponent(svc.title)}`}
                  className="group border border-gray-200 bg-white p-6 flex flex-col gap-3 hover:border-navy transition-colors duration-200"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-navy text-xl">{svc.icon}</span>
                    {svc.badge && (
                      <span className="badge-chrome text-[9px] font-bold tracking-[0.2em] uppercase px-2 py-0.5">
                        <span className="badge-chrome-text">{svc.badge}</span>
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] tracking-[0.3em] uppercase mb-0.5">{svc.tier}</p>
                    <h3 className="font-bold text-sm text-gray-900 group-hover:text-navy transition-colors">{svc.title}</h3>
                    <p className="text-gray-500 text-xs mt-0.5">{svc.tagline}</p>
                  </div>
                  <ul className="flex flex-col gap-1 mt-1">
                    {svc.includes.slice(0, 3).map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-gray-600">
                        <span className="text-navy mt-0.5 shrink-0">▸</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Marinas and waterways ────────────────────────────────────────────── */}
        <section className="bg-gray-50 py-16 px-6 border-t border-gray-100" aria-labelledby="loc-marinas-heading">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <p className="text-gray-500 text-xs tracking-[0.4em] uppercase mb-2">Coverage</p>
              <h2 id="loc-marinas-heading" className="text-gray-900 text-3xl font-bold tracking-tight">
                Marinas and waterways we serve near {loc.name}
              </h2>
              <p className="text-gray-600 text-sm mt-2 max-w-xl leading-relaxed">
                {companyName} is fully mobile. We operate throughout the {loc.name} waterfront
                and every marina, slip, and private dock in the area.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {loc.nearbyMarinas.length > 0 && (
                <div>
                  <p className="text-gray-500 text-xs tracking-[0.3em] uppercase mb-4 border-b border-gray-200 pb-2">
                    Marinas and Facilities
                  </p>
                  <ul className="grid grid-cols-1 gap-2">
                    {loc.nearbyMarinas.map((marina) => (
                      <li key={marina} className="flex items-center gap-2.5 text-sm text-gray-700">
                        <span className="text-navy text-xs shrink-0">◈</span>
                        {marina}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {loc.waterways.length > 0 && (
                <div>
                  <p className="text-gray-500 text-xs tracking-[0.3em] uppercase mb-4 border-b border-gray-200 pb-2">
                    Waterways
                  </p>
                  <ul className="grid grid-cols-1 gap-2">
                    {loc.waterways.map((ww) => (
                      <li key={ww} className="flex items-center gap-2.5 text-sm text-gray-700">
                        <span className="text-navy text-xs shrink-0">◈</span>
                        {ww}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Why NorthWake ────────────────────────────────────────────────────── */}
        <section className="bg-obsidian py-16 px-6 border-t border-steel-dark" aria-labelledby="loc-why-heading">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-steel text-xs tracking-[0.4em] uppercase mb-3">Why {companyName}</p>
              <h2 id="loc-why-heading" className="chrome-text text-3xl font-bold tracking-tight mb-5">
                {loc.name}&apos;s choice for professional marine care
              </h2>
              <p className="text-steel-light text-sm leading-relaxed mb-4">
                {companyName} is a Jacksonville-based marine service company that operates throughout
                Northeast Florida. We are not a franchise. We are not a call center dispatching subcontractors.
                Every job is handled by our team with professional-grade products and photo documentation on every visit.
              </p>
              <p className="text-steel-light text-sm leading-relaxed">
                If you keep your vessel in {loc.name}, we come to you. No scheduling around a fixed shop location,
                no trailering required. We show up, do the work, and you get a recap with photos when we are done.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {[
                { label: "Mobile service", desc: "We come to your dock, your marina, or your storage facility." },
                { label: "Photo documentation", desc: "Before and after photos on every job, every time." },
                { label: "Professional-grade products", desc: "No consumer-grade products. Marine-specific compounds and coatings only." },
                { label: "No contracts", desc: "Book one service or book a season. No minimums, no commitments." },
              ].map((item) => (
                <div key={item.label} className="border-l-2 border-wake pl-4">
                  <p className="font-bold text-sm text-white">{item.label}</p>
                  <p className="text-xs text-steel-light mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Other locations ──────────────────────────────────────────────────── */}
        <section className="bg-white py-14 px-6 border-t border-gray-100" aria-labelledby="loc-other-heading">
          <div className="max-w-5xl mx-auto">
            <h2 id="loc-other-heading" className="text-gray-900 text-lg font-bold tracking-tight mb-6">
              Other areas we serve
            </h2>
            <div className="flex flex-wrap gap-2">
              {clientConfig.locations
                .filter((l) => l.slug !== slug)
                .map((l) => (
                  <Link
                    key={l.slug}
                    href={`/locations/${l.slug}`}
                    className="border border-gray-300 text-gray-600 text-xs px-3.5 py-1.5 hover:border-navy hover:text-navy transition-colors duration-200"
                  >
                    {l.name}
                  </Link>
                ))}
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────────────── */}
        <section className="bg-gray-50 py-16 px-6 border-t border-gray-100">
          <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-5">
            <h2 className="chrome-text-dark text-3xl font-bold tracking-tight">
              Ready to book in {loc.name}?
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed max-w-lg">
              Request a free quote and we will be in touch within one business day. Most quotes are returned same day.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/contact"
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
