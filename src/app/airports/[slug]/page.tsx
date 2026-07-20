import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollDepthTracker from "@/components/ScrollDepthTracker";
import { clientConfig } from "@/config/client";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return clientConfig.airports.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const airport = clientConfig.airports.find((a) => a.slug === slug);
  if (!airport) return {};

  const title = `Aircraft Detailing at ${airport.name}`;
  const description = `${clientConfig.companyName} provides hangar-side and ramp-side aircraft detailing at ${airport.name} (${airport.icao}) in ${airport.city}, FL.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${clientConfig.companyName}`,
      description,
      url: `${clientConfig.siteUrl}/airports/${slug}`,
    },
    alternates: { canonical: `${clientConfig.siteUrl}/airports/${slug}` },
  };
}

export default async function AirportPage({ params }: Props) {
  const { slug } = await params;
  const airport = clientConfig.airports.find((a) => a.slug === slug);
  if (!airport) notFound();

  const { companyName, siteUrl, phone, phoneE164, services, state } = clientConfig;
  const aeroService = services.find((s) => s.id === "aero-detailing");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteUrl}/#business`,
    name: companyName,
    url: siteUrl,
    telephone: phoneE164,
    areaServed: {
      "@type": "Airport",
      name: airport.name,
      iataCode: airport.iata,
      icaoCode: airport.icao,
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `Aircraft Detailing at ${airport.name}`,
      itemListElement: aeroService
        ? [
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: aeroService.title,
                description: aeroService.schemaDescription,
              },
            },
          ]
        : [],
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Airports", item: `${siteUrl}/airports` },
      { "@type": "ListItem", position: 3, name: airport.name, item: `${siteUrl}/airports/${slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header />
      <ScrollDepthTracker />

      <main className="bg-white">

        {/* ── Hero ────────────────────────────────────────────────────────────── */}
        <section
          className="hero-grid relative pt-32 pb-16 px-6 text-center overflow-hidden bg-white"
          aria-labelledby="airport-heading"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(0,0,128,0.06) 0%, transparent 70%)" }}
          />
          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-5">
            <p className="text-gray-500 text-xs tracking-[0.4em] uppercase">
              {airport.city}, {state} &nbsp;·&nbsp; {airport.icao}{airport.iata ? ` / ${airport.iata}` : ""}
            </p>
            <h1 id="airport-heading" className="text-gray-900 text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
              Aircraft Detailing at<br />
              <span className="chrome-text-dark">{airport.name}</span>
            </h1>
            <p className="text-gray-600 text-base max-w-2xl leading-relaxed">
              {airport.description}
            </p>
            <div className="flex flex-wrap gap-4 justify-center mt-2">
              <Link
                href="/contact?service=Aircraft%20Detailing"
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

        {/* ── Service ─────────────────────────────────────────────────────────── */}
        {aeroService && (
          <section className="py-16 px-6 border-t border-gray-100" aria-labelledby="airport-service-heading">
            <div className="max-w-4xl mx-auto">
              <div className="mb-10">
                <p className="text-gray-500 text-xs tracking-[0.4em] uppercase mb-2">What we offer</p>
                <h2 id="airport-service-heading" className="text-gray-900 text-3xl font-bold tracking-tight">
                  Aircraft detailing at {airport.icao}
                </h2>
                <p className="text-gray-600 text-sm mt-2 max-w-xl leading-relaxed">
                  Fully mobile service. We come to your hangar or tie-down at {airport.name}.
                  No trailering an aircraft, no scheduling around a fixed shop.
                </p>
              </div>
              <div className="border border-gray-200 bg-white p-8 flex flex-col gap-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-400 text-[10px] tracking-[0.3em] uppercase mb-0.5">{aeroService.tier}</p>
                    <h3 className="font-bold text-xl text-gray-900">{aeroService.title}</h3>
                    <p className="text-gray-500 text-xs mt-0.5">{aeroService.tagline}</p>
                  </div>
                  <span className="text-navy text-2xl">{aeroService.icon}</span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{aeroService.description}</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-1">
                  {aeroService.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-navy mt-0.5 shrink-0">▸</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contact?service=Aircraft%20Detailing"
                  className="chrome-btn self-start font-bold text-xs tracking-[0.3em] uppercase px-8 py-3 transition-all duration-300 hover:scale-105 mt-2"
                >
                  Request Service
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── Why NorthWake ────────────────────────────────────────────────────── */}
        <section className="bg-obsidian py-16 px-6 border-t border-steel-dark" aria-labelledby="airport-why-heading">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-steel text-xs tracking-[0.4em] uppercase mb-3">Why {companyName}</p>
              <h2 id="airport-why-heading" className="chrome-text text-3xl font-bold tracking-tight mb-5">
                {airport.icao}&apos;s choice for professional aircraft care
              </h2>
              <p className="text-steel-light text-sm leading-relaxed mb-4">
                {companyName} is a Jacksonville-based service company operating throughout Northeast Florida.
                We are not a franchise. We are not a call center dispatching subcontractors. Every job is
                handled by our team with aviation-safe products and photo documentation on every visit.
              </p>
              <p className="text-steel-light text-sm leading-relaxed">
                If your aircraft is based at {airport.name}, we come to your hangar or ramp position.
                No scheduling around a fixed shop location. We show up, do the work, and you get a recap
                with photos when we are done.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {[
                { label: "Hangar-side or ramp service", desc: "We come to your aircraft's parked location." },
                { label: "Photo documentation", desc: "Before and after photos on every job, every time." },
                { label: "Aviation-safe products", desc: "No consumer-grade products. Aviation-approved compounds only." },
                { label: "No contracts", desc: "Book one service or a recurring schedule. No minimums." },
              ].map((item) => (
                <div key={item.label} className="border-l-2 border-wake pl-4">
                  <p className="font-bold text-sm text-white">{item.label}</p>
                  <p className="text-xs text-steel-light mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Other airports ──────────────────────────────────────────────────── */}
        <section className="bg-white py-14 px-6 border-t border-gray-100" aria-labelledby="airport-other-heading">
          <div className="max-w-5xl mx-auto">
            <h2 id="airport-other-heading" className="text-gray-900 text-lg font-bold tracking-tight mb-6">
              Other airports we serve
            </h2>
            <div className="flex flex-wrap gap-2">
              {clientConfig.airports
                .filter((a) => a.slug !== slug)
                .map((a) => (
                  <Link
                    key={a.slug}
                    href={`/airports/${a.slug}`}
                    className="border border-gray-300 text-gray-600 text-xs px-3.5 py-1.5 hover:border-navy hover:text-navy transition-colors duration-200"
                  >
                    {a.name} ({a.icao})
                  </Link>
                ))}
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────────────── */}
        <section className="bg-gray-50 py-16 px-6 border-t border-gray-100">
          <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-5">
            <h2 className="chrome-text-dark text-3xl font-bold tracking-tight">
              Ready to book at {airport.icao}?
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed max-w-lg">
              Request a free quote and we will be in touch within one business day. Most quotes are returned same day.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/contact?service=Aircraft%20Detailing"
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
            <p className="text-gray-400 text-xs">No obligation. No contracts. Mobile service throughout Northeast Florida.</p>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
