import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollDepthTracker from "@/components/ScrollDepthTracker";
import { clientConfig } from "@/config/client";

const { services, companyName, siteUrl, city, state, seoKeywords } = clientConfig;

export const metadata: Metadata = {
  title: `${companyName} Services`,
  description: `${companyName}'s full service menu in ${city}, ${state}.`,
  keywords: seoKeywords,
  openGraph: {
    title: `Services | ${companyName}, ${city}, ${state}`,
    description: `From maintenance washes to full-service management, ${companyName} offers concierge-level care.`,
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
            <p className="text-gray-400 text-xs tracking-[0.4em] uppercase">
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
                        <span className="badge-chrome text-xs font-bold tracking-[0.2em] uppercase px-2.5 py-1">
                          <span className="badge-chrome-text">{svc.badge}</span>
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-steel text-xs tracking-[0.35em] uppercase mb-1.5">
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
                      className="chrome-btn self-start text-xs font-bold tracking-[0.25em] uppercase px-5 py-2.5 transition-all duration-300 hover:scale-105 mt-auto"
                    >
                      Request Service
                    </Link>
                  </div>

                  {/* Right panel */}
                  <div className="flex flex-col gap-6 p-8 md:p-10 bg-obsidian group-hover:bg-[#040408] transition-colors duration-300">
                    <p className="text-steel-light text-sm leading-relaxed">{svc.description}</p>
                    <div>
                      <p className="text-steel text-xs tracking-[0.3em] uppercase mb-4">
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

            <div className="grid md:grid-cols-3 gap-8">

              {/* Marinas & Facilities */}
              <div>
                <p className="text-gray-400 text-xs tracking-[0.3em] uppercase mb-4 border-b border-gray-200 pb-2">
                  Marinas &amp; Facilities
                </p>
                <ul className="columns-2 gap-x-6 list-none space-y-1.5">
                  {[
                    "Port 32 Jax",
                    "Queens Harbour Yacht and Country Club",
                    "The Florida Yacht Club",
                    "Ortega Yacht Club",
                    "The Rudder Club",
                    "Rod-N-Gun Club",
                    "Harbortown Marina",
                    "Marina San Pablo",
                    "Mariners Pointe",
                    "Arlington Marina",
                    "Berkman Plaza Marina",
                    "Yacht Harbor Marina",
                    "River City Marina",
                    "Venetian Marina",
                    "Cedar River Marina",
                    "Light House Marina",
                    "Cats Paw Marina",
                    "Seafarers Marina",
                    "Bill Dye Marina",
                    "Bulls Bay Marina",
                    "Mandarin Holiday Marina",
                    "Julington Creek Marina",
                    "Julington Creek Pier 3",
                    "Doctors Lake Marina",
                    "Black Creek Marina",
                    "Palm Cove Marina",
                    "English Landing Marina",
                    "Queens Harbor Marina",
                    "Camachee Cove",
                    "Marsh Landing Marina",
                    "Hidden Harbor Marina",
                    "San Sebastian Marina",
                    "Beaches Marina Vilano",
                    "Villages of Vilano Marina",
                    "The Conch House Marina",
                    "St. Augustine Municipal Marina",
                    "St. Augustine Marine Center",
                    "Oasis Boatyard",
                    "Fish Island Marina",
                    "Rivers Edge Marina",
                    "Palm Coast Marina",
                    "Hammock Dunes Club",
                    "Huckins Yacht Corporation",
                    "Lamb's Yacht Center",
                    "Jacksonville Shipyard",
                    "Marina at Ortega Landing",
                    "Winward at Ortega River Marina",
                    "Winward at Beach Marine",
                    "Fernandina Beach Marina",
                    "Amelia Island Yacht Basin",
                    "The Bight Marina",
                    "Green Cove Springs Municipal Marina",
                    "Tiger Point Marina",
                  ].map((name) => (
                    <li key={name} className="text-gray-600 text-xs leading-snug break-inside-avoid">
                      {name}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Waterways & Inlets */}
              <div>
                <p className="text-gray-400 text-xs tracking-[0.3em] uppercase mb-4 border-b border-gray-200 pb-2">
                  Waterways &amp; Inlets
                </p>
                <ul className="columns-2 gap-x-6 list-none space-y-1.5">
                  {[
                    "St. Johns River",
                    "Ortega River",
                    "Trout River",
                    "Ribault River",
                    "Intercoastal Waterway",
                    "Julington Creek",
                    "Governors Creek",
                    "Sisters Creek",
                    "Browns Creek",
                    "Mills Creek",
                    "Pottsburg Creek",
                    "Goodby's Creek",
                    "Christopher Creek",
                    "Durbin Creek",
                    "Cedar River",
                    "Black Creek",
                    "Doctors Lake",
                    "Amelia River",
                    "Nassau River",
                    "Nassau Sound",
                    "Lofton Creek",
                    "Egans Creek",
                    "Blount Island",
                    "Fort George Island",
                    "Mayport Jetties",
                    "Mill Cove",
                    "Plumbers Cove",
                    "Pineapple Point",
                    "Racine Point",
                    "Bayard Point",
                  ].map((name) => (
                    <li key={name} className="text-gray-600 text-xs leading-snug break-inside-avoid">
                      {name}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Communities */}
              <div>
                <p className="text-gray-400 text-xs tracking-[0.3em] uppercase mb-4 border-b border-gray-200 pb-2">
                  Communities &amp; Neighborhoods
                </p>
                <ul className="columns-2 gap-x-6 list-none space-y-1.5">
                  {[
                    "Jacksonville",
                    "Mandarin",
                    "Avondale",
                    "Ortega",
                    "San Marco",
                    "Southside",
                    "Fort Caroline",
                    "Palm Valley",
                    "Fruit Cove",
                    "Orangedale",
                    "St. Johns",
                    "Jacksonville Beach",
                    "Atlantic Beach",
                    "Neptune Beach",
                    "Ponte Vedra",
                    "Mayport",
                    "Orange Park",
                    "Green Cove Springs",
                    "St. Augustine",
                    "Amelia Island",
                    "Fernandina Beach",
                    "Palm Coast",
                  ].map((name) => (
                    <li key={name} className="text-gray-600 text-xs leading-snug break-inside-avoid">
                      {name}
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
