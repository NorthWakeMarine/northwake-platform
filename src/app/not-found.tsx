import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { clientConfig } from "@/config/client";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  const { companyName, phone, phoneE164 } = clientConfig;

  return (
    <>
      <Header />

      <main className="bg-white">
        <section className="hero-grid relative pt-40 pb-24 px-6 text-center overflow-hidden bg-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(0,0,128,0.06) 0%, transparent 70%)",
            }}
          />
          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-6">
            <p className="text-gray-500 text-xs tracking-[0.4em] uppercase">404</p>
            <h1 className="text-gray-900 text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
              Page Not <span className="chrome-text-dark">Found</span>
            </h1>
            <p className="text-gray-600 text-base max-w-lg leading-relaxed">
              The page you&apos;re looking for doesn&apos;t exist or may have moved. Here are a
              few places to pick back up.
            </p>
            <div className="flex flex-wrap gap-4 justify-center mt-2">
              <Link
                href="/"
                className="chrome-btn font-bold text-xs tracking-[0.3em] uppercase px-8 py-3.5 transition-all duration-300 hover:scale-105"
              >
                Back to Home
              </Link>
              <Link
                href="/services"
                className="border border-gray-500 text-gray-700 text-xs font-semibold tracking-[0.3em] uppercase px-8 py-3.5 hover:border-navy hover:text-navy transition-colors duration-300"
              >
                Browse Services
              </Link>
            </div>
            <p className="text-gray-500 text-xs mt-4">
              Need help finding something? Call {companyName} at{" "}
              <a href={`tel:${phoneE164}`} className="text-navy hover:text-navy-dark transition-colors">
                {phone}
              </a>{" "}
              or <Link href="/contact" className="text-navy hover:text-navy-dark transition-colors">contact us</Link>.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
