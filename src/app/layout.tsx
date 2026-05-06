import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://northwakemarine.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  title: {
    default: "NorthWake Marine | Premium Boat Detailing & Vessel Management: Jacksonville, FL",
    template: "%s | NorthWake Marine",
  },
  description:
    "Jacksonville's premier marine services company. Expert ceramic coating, monthly boat maintenance, and full-service yacht management on the St. Johns River and beyond.",
  keywords: [
    "boat detailing Jacksonville FL",
    "ceramic coating marine Jacksonville",
    "yacht management Jacksonville",
    "vessel maintenance Florida",
    "boat cleaning Jacksonville",
    "marine services St Johns River",
    "NorthWake Marine",
  ],
  authors: [{ name: "NorthWake Marine", url: siteUrl }],
  creator: "NorthWake Marine",
  publisher: "NorthWake Marine",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "NorthWake Marine",
    title: "NorthWake Marine | Premium Boat Detailing & Vessel Management: Jacksonville, FL",
    description:
      "Ceramic coating, monthly maintenance plans, and full-service yacht management for discerning boat owners in Jacksonville, FL.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NorthWake Marine: Jacksonville's Premier Marine Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NorthWake Marine | Premium Boat Detailing & Vessel Management",
    description:
      "Ceramic coating, monthly maintenance plans, and full-service yacht management in Jacksonville, FL.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: siteUrl,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${siteUrl}/#business`,
  name: "NorthWake Marine",
  description:
    "Premium boat detailing, ceramic coating, monthly maintenance plans, and full-service yacht management in Jacksonville, FL.",
  url: siteUrl,
  telephone: "+1-904-606-5454",
  email: "info@northwakemarine.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Jacksonville",
    addressRegion: "FL",
    addressCountry: "US",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 30.3322,
    longitude: -81.6557,
  },
  areaServed: {
    "@type": "GeoCircle",
    geoMidpoint: {
      "@type": "GeoCoordinates",
      latitude: 30.3322,
      longitude: -81.6557,
    },
    geoRadius: "80000",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Marine Services",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Ceramic Coating",
          description:
            "Professional-grade ceramic coating for hulls and surfaces, providing years of protection and a mirror-like finish.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Monthly Maintenance Plans",
          description:
            "Scheduled maintenance packages to keep your vessel in peak condition year-round.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Yacht Management",
          description:
            "Full-service concierge yacht management including crew coordination, provisioning, and scheduling.",
        },
      },
    ],
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "18:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Saturday",
      opens: "09:00",
      closes: "14:00",
    },
  ],
  sameAs: [
    "https://www.instagram.com/northwakemarine",
    "https://www.facebook.com/profile.php?id=61577308802144",
    "https://www.youtube.com/@northwakemarine",
    "https://www.tiktok.com/@northwakemarine",
    "https://g.page/r/CdvYJ9aDJv8NEAE/review",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  name: "NorthWake Marine",
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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
