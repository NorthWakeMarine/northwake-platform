import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollDepthTracker from "@/components/ScrollDepthTracker";
import { createServerSupabase } from "@/lib/supabase/server";
import { clientConfig } from "@/config/client";

async function getCMS(): Promise<Record<string, string>> {
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase.from("site_content").select("key, value");
    return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  } catch {
    return {};
  }
}

export const metadata: Metadata = {
  title: `About ${clientConfig.companyName}, ${clientConfig.city}'s Premier Services`,
  description: `Learn about ${clientConfig.companyName}'s story and commitment to delivering the highest level of care in ${clientConfig.city}, ${clientConfig.state}.`,
  keywords: clientConfig.seoKeywords,
  openGraph: {
    title: `About ${clientConfig.companyName} | ${clientConfig.city}'s Premier Services`,
    description: `Founded in ${clientConfig.city}, ${clientConfig.companyName} was built to set a new standard for service.`,
    url: `${clientConfig.siteUrl}/about`,
  },
  alternates: { canonical: `${clientConfig.siteUrl}/about` },
};

const { team } = clientConfig;

export default async function AboutPage() {
  const cms = await getCMS();
  const aboutHeroIntro = cms.about_hero_intro ??
    `${clientConfig.companyName} was founded in ${clientConfig.city} with a single conviction: clients in ${clientConfig.state} deserve the same level of care that world-class service companies deliver, without the world-class distance or wait list.`;
  return (
    <>
      <Header />
      <ScrollDepthTracker />

      <main className="bg-white">
        {/* ── Hero ── */}
        <section
          aria-labelledby="about-hero-heading"
          className="hero-grid relative pt-32 pb-20 px-6 overflow-hidden bg-white"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 30% 40%, rgba(0,0,128,0.06) 0%, transparent 70%)",
            }}
          />
          <div className="relative z-10 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-7">
              <p className="text-gray-500 text-xs tracking-[0.4em] uppercase">
                Est. 2025 &nbsp;·&nbsp; Jacksonville, FL
              </p>
              <h1
                id="about-hero-heading"
                className="text-gray-900 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight"
              >
                Built on the<br />
                <span className="chrome-text-dark">St. Johns River.</span>
              </h1>
              <p className="text-gray-600 text-base leading-relaxed max-w-lg">
                {aboutHeroIntro}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <Link
                  href="/contact"
                  className="chrome-btn font-bold text-xs tracking-[0.3em] uppercase px-9 py-4 transition-all duration-300 hover:scale-105 text-center"
                >
                  Get a Free Quote
                </Link>
                <Link
                  href="/services"
                  className="border border-gray-300 text-gray-600 text-xs font-semibold tracking-[0.3em] uppercase px-9 py-4 hover:border-navy hover:text-navy transition-colors duration-300 text-center"
                >
                  Our Services
                </Link>
              </div>
            </div>

            {/* Team cards */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-200 list-none">
              {team.map((member) => (
                <li
                  key={member.name}
                  className="group bg-white p-7 flex flex-col gap-4 hover:bg-gray-50 transition-colors duration-300"
                >
                  <div
                    aria-hidden="true"
                    className="w-14 h-14 border border-gray-200 flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #e8eaf0 0%, #c8ccdc 100%)" }}
                  >
                    <span className="chrome-text-dark text-xl font-bold">{member.initial}</span>
                  </div>
                  <div>
                    <h3 className="text-gray-900 text-sm font-bold">{member.name}</h3>
                    <p className="text-gray-500 text-xs tracking-[0.25em] uppercase mt-0.5">
                      {member.role}
                    </p>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{member.bio}</p>
                </li>
              ))}
            </ul>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 inset-x-0 h-24"
            style={{ background: "linear-gradient(to bottom, transparent, #f9fafb)" }}
          />
        </section>

        {/* ── Why NorthWake Marine ── */}
        <section
          aria-labelledby="standard-heading"
          className="py-16 px-6 bg-gray-50"
        >
          <div className="max-w-7xl mx-auto flex flex-col gap-20">

            {/* Headline + intro */}
            <div className="flex flex-col md:flex-row gap-16 items-start">
              <div className="flex flex-col gap-5 md:w-1/2 md:sticky md:top-28">
                <p className="text-gray-500 text-xs tracking-[0.4em] uppercase">Why {clientConfig.companyName}</p>
                <h2
                  id="standard-heading"
                  className="text-gray-900 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight"
                >
                  Jacksonville&apos;s Waters Demand<br />
                  <span className="chrome-text-dark">A Different Standard</span>
                </h2>
                <Link
                  href="/contact"
                  className="self-start chrome-btn text-xs font-bold tracking-[0.3em] uppercase px-9 py-4 transition-all duration-300 hover:scale-105 mt-2"
                >
                  Get a Free Quote
                </Link>
              </div>
              <div className="flex flex-col gap-5 md:w-1/2">
                <p className="text-gray-600 text-sm leading-relaxed">
                  The St. Johns River and Northeast Florida&apos;s coastal waters are beautiful, and unforgiving. Salt air, UV intensity, and year-round use accelerate wear that undermines even well-maintained vessels faster than most markets in the country.
                </p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Jacksonville&apos;s mild winters mean most boats stay in the water twelve months a year. From the St. Johns to the Intracoastal and offshore Atlantic, the conditions demand a level of care that most services simply aren&apos;t built to deliver.
                </p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  The NorthWake Standard is not a checklist. It&apos;s a commitment every member of our team carries onto every vessel, that every detail, visible and invisible, meets the level our clients expect and their investments deserve. Not a detailing shop that occasionally does ceramic. A dedicated, certified marine services company where the standard is never negotiated.
                </p>
              </div>
            </div>

            {/* Values grid */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200 list-none">
              {[
                {
                  icon: "◈",
                  title: "Professional-Grade Products Only",
                  body: "Every product applied to your vessel is professional-specification, the same materials used by top yacht yards worldwide. Never diluted consumer lines.",
                },
                {
                  icon: "◉",
                  title: "Precision Over Speed",
                  body: "We never rush a job. Every step of our process has a reason, and every result is measured against a verifiable standard before we leave the dock.",
                },
                {
                  icon: "◇",
                  title: "Radical Transparency",
                  body: "No hidden fees. No surprise line items. Detailed quotes before any work begins, and honest conversation if scope changes mid-job.",
                },
                {
                  icon: "△",
                  title: "Continuous Certification",
                  body: "Certification isn't a one-time box to check. We mandate ongoing training as products, coatings, and best practices evolve.",
                },
                {
                  icon: "⬡",
                  title: "Concierge Scheduling",
                  body: "We work around your calendar and your marina&apos;s schedule. Priority access and flexible booking are part of every client relationship.",
                },
                {
                  icon: "✦",
                  title: "Full Documentation",
                  body: "Timestamped before-and-after photo reports after every service, with a condition summary and future care recommendations included.",
                },
              ].map((item) => (
                <li
                  key={item.title}
                  className="group bg-white p-8 flex flex-col gap-4 hover:bg-gray-50 transition-colors duration-300"
                >
                  <span aria-hidden="true" className="chrome-text-dark text-2xl leading-none">{item.icon}</span>
                  <div>
                    <h3 className="text-gray-900 text-sm font-bold mb-2 leading-snug">{item.title}</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">{item.body}</p>
                  </div>
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
