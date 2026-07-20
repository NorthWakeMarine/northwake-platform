import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollDepthTracker from "@/components/ScrollDepthTracker";
import ServicePageCategories from "@/components/ServicePageCategories";
import CoverageList from "@/components/CoverageList";
import { clientConfig } from "@/config/client";

const { services, companyName, siteUrl, city, state, seoKeywords } = clientConfig;

export const metadata: Metadata = {
  title: `Services in ${city}, ${state}`,
  description: `Marine detailing, ceramic coating, Yamaha-certified engine service, and full-service vessel management in ${city}, ${state}. Browse the catalog, get a free quote.`,
  keywords: seoKeywords,
  openGraph: {
    title: `Services | ${companyName}, ${city}, ${state}`,
    description: `From maintenance washes and Yamaha-certified outboard service to full-service management, ${companyName} offers concierge-level care.`,
    url: `${siteUrl}/services`,
  },
  alternates: { canonical: `${siteUrl}/services` },
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: `${companyName} Services, ${city}, ${state}`,
  description: `Complete list of professional services offered by ${companyName} in ${city}, ${state}.`,
  url: `${siteUrl}/services`,
  numberOfItems: services.length,
  itemListElement: services.map((s, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Service",
      "@id": `${siteUrl}/services#${s.id}`,
      name: s.title,
      description: s.schemaDescription,
      serviceType: s.tier,
      provider: {
        "@type": "LocalBusiness",
        name: companyName,
        "@id": `${siteUrl}/#business`,
        address: {
          "@type": "PostalAddress",
          addressLocality: city,
          addressRegion: state,
          addressCountry: "US",
        },
      },
      areaServed: {
        "@type": "City",
        name: city,
        addressRegion: state,
        addressCountry: "US",
      },
      offers: {
        "@type": "Offer",
        availability: "https://schema.org/InStock",
        priceSpecification: {
          "@type": "PriceSpecification",
          priceCurrency: "USD",
          description: "Custom quote based on asset size and condition. Contact for pricing.",
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
      <ScrollDepthTracker />

      <main className="bg-white">
        {/* ── Hero ── */}
        <section
          aria-labelledby="services-hero-heading"
          className="hero-grid relative pt-32 pb-8 px-6 text-center overflow-hidden bg-white"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(0,0,128,0.06) 0%, transparent 70%)",
            }}
          />
          <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-6">
            <p className="text-gray-500 text-xs tracking-[0.4em] uppercase">
              {city}, {state} &nbsp;·&nbsp; Professional Services
            </p>
            <h1
              id="services-hero-heading"
              className="text-gray-900 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight"
            >
              Every Service.<br />
              <span className="chrome-text-dark">One Uncompromising Standard.</span>
            </h1>
            <p className="text-gray-600 text-base max-w-2xl leading-relaxed">
              From single-day jobs to full-service management,
              every {companyName} service is delivered by certified professionals using
              professional-grade products, with photo documentation on every job.
            </p>
            <hr className="accent-rule w-40 mt-2" />
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 inset-x-0 h-24"
            style={{ background: "linear-gradient(to bottom, transparent, #ffffff)" }}
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

            <ServicePageCategories services={services} />
          </div>
        </section>

        {/* ── Service Areas ── */}
        <section
          id="service-areas"
          aria-labelledby="service-areas-heading"
          className="border-t border-gray-200 bg-gray-50 px-6 py-14"
        >
          <div className="max-w-7xl mx-auto flex flex-col gap-10">
            <header className="flex flex-col gap-1">
              <p className="text-steel text-xs tracking-[0.4em] uppercase">Coverage</p>
              <h2
                id="service-areas-heading"
                className="text-gray-900 text-lg font-bold tracking-tight"
              >
                Marinas &amp; Waterways We Serve
              </h2>
              <p className="text-gray-600 text-xs max-w-xl leading-relaxed">
                NorthWake Marine provides mobile marine services throughout the greater Jacksonville
                area, from Amelia Island and Fernandina Beach to St. Augustine, Palm Coast, and
                every marina and waterway in between.
              </p>
            </header>

            <CoverageList />
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
