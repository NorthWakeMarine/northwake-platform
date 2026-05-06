import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingCTA from "@/components/FloatingCTA";
import ScrollDepthTracker from "@/components/ScrollDepthTracker";
import { createServerSupabase } from "@/lib/supabase/server";

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
  title: "About NorthWake Marine, Jacksonville's Premier Marine Services",
  description:
    "Learn about NorthWake Marine's story, the NorthWake Standard, and our commitment to delivering yacht-club-level care to every boat owner on Jacksonville's St. Johns River waterway.",
  keywords: [
    "NorthWake Marine Jacksonville",
    "marine services company Jacksonville FL",
    "boat detailing company Jacksonville",
    "certified marine technicians Florida",
    "St Johns River boat care",
  ],
  openGraph: {
    title: "About NorthWake Marine | Jacksonville's Premier Marine Services",
    description:
      "Founded on the banks of the St. Johns River, NorthWake Marine was built to set a new standard for marine care in Northeast Florida.",
    url: "https://northwakemarine.com/about",
  },
  alternates: { canonical: "https://northwakemarine.com/about" },
};


const team = [
  {
    name: "Alexander S.",
    role: "Co-Founder & Development",
    bio: "A licensed captain with firsthand knowledge of what boat owners actually need on the water, Alexander shapes the direction NorthWake grows. He leads strategy, client partnerships, and the business side of building something worth being proud of.",
    initial: "A",
  },
  {
    name: "Ian W.",
    role: "Co-Founder & Operations",
    bio: "NorthWake started as a shared vision between close friends who wanted to build something real together. Ian brings an engineering and technical mindset to everything the company touches, from how services are structured to the precision behind every job on the water.",
    initial: "I",
  },
];

export default async function AboutPage() {
  const cms = await getCMS();
  const aboutHeroIntro = cms.about_hero_intro ??
    "NorthWake Marine was founded in Jacksonville with a single conviction: boat owners in Northeast Florida deserve the same level of care that world-class yacht yards deliver, without the world-class distance or wait list.";
  return (
    <>
      <Header />
      <FloatingCTA />
      <ScrollDepthTracker />

      <main>
        {/* ── Hero ── */}
        <section
          aria-labelledby="about-hero-heading"
          className="hero-grid relative pt-32 pb-20 px-6 overflow-hidden"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 30% 40%, rgba(0,0,128,0.2) 0%, transparent 70%)",
            }}
          />
          <div className="relative z-10 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-7">
              <p className="text-steel text-[10px] tracking-[0.4em] uppercase">
                Est. 2025 &nbsp;·&nbsp; Jacksonville, FL
              </p>
              <h1
                id="about-hero-heading"
                className="text-wake text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight"
              >
                Built on the<br />
                <span className="chrome-text">St. Johns River.</span>
              </h1>
              <p className="text-steel-light text-base leading-relaxed max-w-lg">
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
                  className="border border-steel text-steel-light text-xs font-semibold tracking-[0.3em] uppercase px-9 py-4 hover:border-wake hover:text-wake transition-colors duration-300 text-center"
                >
                  Our Services
                </Link>
              </div>
            </div>

            {/* Team cards */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-steel-dark list-none">
              {team.map((member) => (
                <li
                  key={member.name}
                  className="group bg-obsidian p-7 flex flex-col gap-4 hover:bg-navy-dark transition-colors duration-300"
                >
                  <div
                    aria-hidden="true"
                    className="w-14 h-14 border border-steel-dark flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #000040 0%, #1a1aaa 100%)" }}
                  >
                    <span className="chrome-text text-xl font-bold">{member.initial}</span>
                  </div>
                  <div>
                    <h3 className="text-wake text-sm font-bold">{member.name}</h3>
                    <p className="text-steel text-[9px] tracking-[0.25em] uppercase mt-0.5">
                      {member.role}
                    </p>
                  </div>
                  <p className="text-steel text-xs leading-relaxed">{member.bio}</p>
                </li>
              ))}
            </ul>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 inset-x-0 h-24"
            style={{ background: "linear-gradient(to bottom, transparent, #000000)" }}
          />
        </section>

        {/* ── Why NorthWake Marine ── */}
        <section
          aria-labelledby="standard-heading"
          className="py-16 px-6"
          style={{ background: "linear-gradient(180deg, #000000 0%, #000018 60%, #000000 100%)" }}
        >
          <div className="max-w-7xl mx-auto flex flex-col gap-20">

            {/* Headline + intro */}
            <div className="flex flex-col md:flex-row gap-16 items-start">
              <div className="flex flex-col gap-5 md:w-1/2 md:sticky md:top-28">
                <p className="text-steel text-[10px] tracking-[0.4em] uppercase">Why NorthWake Marine</p>
                <h2
                  id="standard-heading"
                  className="text-wake text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight"
                >
                  Jacksonville&apos;s Waters Demand<br />
                  <span className="chrome-text">A Different Standard</span>
                </h2>
                <Link
                  href="/contact"
                  className="self-start chrome-btn text-[10px] font-bold tracking-[0.3em] uppercase px-9 py-4 transition-all duration-300 hover:scale-105 mt-2"
                >
                  Get a Free Quote
                </Link>
              </div>
              <div className="flex flex-col gap-5 md:w-1/2">
                <p className="text-steel-light text-sm leading-relaxed">
                  The St. Johns River and Northeast Florida&apos;s coastal waters are beautiful, and unforgiving. Salt air, UV intensity, and year-round use accelerate wear that undermines even well-maintained vessels faster than most markets in the country.
                </p>
                <p className="text-steel-light text-sm leading-relaxed">
                  Jacksonville&apos;s mild winters mean most boats stay in the water twelve months a year. From the St. Johns to the Intracoastal and offshore Atlantic, the conditions demand a level of care that most services simply aren&apos;t built to deliver.
                </p>
                <p className="text-steel-light text-sm leading-relaxed">
                  The NorthWake Standard is not a checklist. It&apos;s a commitment every member of our team carries onto every vessel, that every detail, visible and invisible, meets the level our clients expect and their investments deserve. Not a detailing shop that occasionally does ceramic. A dedicated, certified marine services company where the standard is never negotiated.
                </p>
              </div>
            </div>

            {/* Values grid */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-steel-dark list-none">
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
                  className="group bg-obsidian p-8 flex flex-col gap-4 hover:bg-navy-dark transition-colors duration-300"
                >
                  <span aria-hidden="true" className="chrome-text text-2xl leading-none">{item.icon}</span>
                  <div>
                    <h3 className="text-wake text-sm font-bold mb-2 leading-snug">{item.title}</h3>
                    <p className="text-steel text-xs leading-relaxed">{item.body}</p>
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
