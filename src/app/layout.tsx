import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import GoogleAdsTag from "@/components/GoogleAdsTag";
import { clientConfig } from "@/config/client";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const { siteUrl, companyName, seoTitle, seoDescription, seoKeywords, ogImagePath, faviconPath, geo, businessHours, sameAs, services, email, phoneE164, city, state, localBusinessType } = clientConfig;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  icons: {
    icon: faviconPath,
    shortcut: faviconPath,
    apple: faviconPath,
  },
  title: {
    default: seoTitle,
    template: `%s | ${companyName}`,
  },
  description: seoDescription,
  keywords: seoKeywords,
  authors: [{ name: companyName, url: siteUrl }],
  creator: companyName,
  publisher: companyName,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: companyName,
    title: seoTitle,
    description: seoDescription,
    images: [
      {
        url: ogImagePath,
        width: 1200,
        height: 630,
        alt: `${companyName}: ${city}'s Premier Marine Services`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: seoTitle,
    description: seoDescription,
    images: [ogImagePath],
  },
  alternates: {
    canonical: siteUrl,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": localBusinessType,
  "@id": `${siteUrl}/#business`,
  name: companyName,
  description: seoDescription,
  url: siteUrl,
  telephone: phoneE164,
  email,
  address: {
    "@type": "PostalAddress",
    addressLocality: city,
    addressRegion: state,
    addressCountry: "US",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: geo.latitude,
    longitude: geo.longitude,
  },
  areaServed: {
    "@type": "GeoCircle",
    geoMidpoint: {
      "@type": "GeoCoordinates",
      latitude: geo.latitude,
      longitude: geo.longitude,
    },
    geoRadius: String(geo.radiusMeters),
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: `${companyName} Services`,
    itemListElement: services.slice(0, 3).map((s) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: s.title,
        description: s.schemaDescription,
      },
    })),
  },
  openingHoursSpecification: businessHours.map((h) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: h.dayOfWeek,
    opens: h.opens,
    closes: h.closes,
  })),
  sameAs,
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  name: companyName,
  url: siteUrl,
  publisher: { "@id": `${siteUrl}/#business` },
  dateModified: new Date().toISOString(),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://nwyrfobdsdhptkdirqxp.supabase.co" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {sameAs.slice(0, 3).map((url) => (
          <link key={url} rel="me" href={url} />
        ))}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-obsidian text-wake">
        {children}
        <GoogleAnalytics />
        <GoogleAdsTag />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
