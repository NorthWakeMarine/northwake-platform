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
  };
  return overrides[id] ?? `${schemaDescription} Mobile service throughout ${city}, ${state} and Northeast Florida. No trailering required.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const svc = clientConfig.services.find((s) => s.id === slug);
  if (!svc) return {};

  const { companyName, siteUrl, city, state } = clientConfig;

  const title = `${svc.title} in ${city}, FL | ${companyName}`;
  const description = buildMetaDescription(slug, svc.schemaDescription, city, state);

  return {
    title,
    description,
    openGraph: {
      title,
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
