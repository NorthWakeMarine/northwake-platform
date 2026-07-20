import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollDepthTracker from "@/components/ScrollDepthTracker";
import { clientConfig } from "@/config/client";

const { locations, companyName, siteUrl, city, state } = clientConfig;

export const metadata: Metadata = {
  title: `Service Areas in ${city}, ${state}`,
  description: `${companyName} provides mobile marine services throughout ${city}, ${state} and Northeast Florida. Browse every marina, waterway, and community we serve.`,
  openGraph: {
    title: `Service Areas | ${companyName}`,
    description: `Mobile marine services throughout ${city}, ${state} and Northeast Florida.`,
    url: `${siteUrl}/locations`,
  },
  alternates: { canonical: `${siteUrl}/locations` },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
    { "@type": "ListItem", position: 2, name: "Locations", item: `${siteUrl}/locations` },
  ],
};

export default function LocationsIndexPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header />
      <ScrollDepthTracker />

      <main className="bg-white">
        <section
          aria-labelledby="locations-hero-heading"
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
              {city}, {state} &nbsp;·&nbsp; Service Areas
            </p>
            <h1
              id="locations-hero-heading"
              className="text-gray-900 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight"
            >
              Everywhere You Keep<br />
              <span className="chrome-text-dark">Your Vessel.</span>
            </h1>
            <p className="text-gray-600 text-base max-w-2xl leading-relaxed">
              {companyName} is fully mobile. Browse the marinas, waterways, and communities we
              serve throughout {city}, {state} and Northeast Florida.
            </p>
            <hr className="accent-rule w-40 mt-2" />
          </div>
        </section>

        <section className="pt-8 pb-24 px-6" aria-labelledby="locations-grid-heading">
          <div className="max-w-7xl mx-auto">
            <h2 id="locations-grid-heading" className="sr-only">All Service Areas</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 list-none" role="list">
              {locations.map((loc) => (
                <li key={loc.slug}>
                  <Link
                    href={`/locations/${loc.slug}`}
                    className="group flex flex-col gap-2 border border-gray-200 bg-white p-6 h-full hover:border-navy transition-colors duration-200"
                  >
                    <h3 className="text-gray-900 text-base font-bold tracking-tight group-hover:text-navy transition-colors">
                      {loc.name}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                      {loc.description}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
