import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { clientConfig } from "@/config/client";

const socialIcons: Record<string, React.ReactNode> = {
  youtube: (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  instagram: (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  tiktok: (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
    </svg>
  ),
  facebook: (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  google: (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  ),
};

export const metadata: Metadata = {
  title: `Follow ${clientConfig.companyName}, Social Media & Reviews`,
  description: `Follow ${clientConfig.companyName} on social media. Leave us a Google review and stay up to date with our latest services and work.`,
  openGraph: {
    title: `Follow ${clientConfig.companyName} | Social Media & Reviews`,
    description: `Stay connected with ${clientConfig.companyName}, follow us on social media and leave a Google review.`,
    url: `${clientConfig.siteUrl}/socials`,
  },
  alternates: { canonical: `${clientConfig.siteUrl}/socials` },
};

export default function SocialsPage() {
  return (
    <>
      <Header />

      <main className="bg-white">
        {/* ── Hero ── */}
        <section
          aria-labelledby="socials-heading"
          className="hero-grid relative pt-32 pb-6 px-6 overflow-hidden text-center bg-white"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(0,0,128,0.06) 0%, transparent 70%)",
            }}
          />
          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-5">
            <p className="text-gray-400 text-xs tracking-[0.4em] uppercase">Stay Connected</p>
            <h1
              id="socials-heading"
              className="chrome-text-dark text-4xl sm:text-5xl font-bold tracking-tight leading-tight"
            >
              Follow {clientConfig.companyName}
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed max-w-xl">
              Follow us for transformations, tips, and behind-the-scenes content from {clientConfig.companyName}.
            </p>
            <hr className="accent-rule w-40" />
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 inset-x-0 h-20"
            style={{ background: "linear-gradient(to bottom, transparent, #f9fafb)" }}
          />
        </section>

        {/* ── Social cards ── */}
        <section aria-label="Social media links" className="py-16 px-6 bg-gray-50">
          <div className="max-w-4xl mx-auto flex flex-col gap-px bg-gray-200">
            {clientConfig.socials.map((s) => (
              <a
                key={s.id}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${s.cta}, opens in a new tab`}
                className="group bg-white hover:bg-gray-50 transition-colors duration-300 flex flex-col sm:flex-row items-start sm:items-center gap-6 p-8"
              >
                {/* Icon */}
                <div
                  className="shrink-0 w-14 h-14 flex items-center justify-center border border-gray-200 group-hover:border-gray-300 transition-colors duration-300"
                  style={{ color: s.accent }}
                >
                  {socialIcons[s.id] ?? (
                    <span className="text-2xl font-bold">{s.platform[0]}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <span className="text-gray-900 text-base font-bold tracking-tight">{s.platform}</span>
                    <span className="text-gray-400 text-xs tracking-wide">{s.handle}</span>
                  </div>
                  <p className="text-gray-600 text-xs leading-relaxed max-w-lg">
                    {s.description}
                  </p>
                </div>

                {/* CTA arrow */}
                <div className="shrink-0 flex items-center gap-2 text-gray-400 group-hover:text-navy transition-colors duration-300 text-xs tracking-[0.2em] uppercase font-semibold">
                  <span className="hidden sm:inline">{s.cta}</span>
                  <svg
                    aria-hidden="true"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="group-hover:translate-x-1 transition-transform duration-200"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
