import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingCTA from "@/components/FloatingCTA";

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

const process = [
  {
    step: "01",
    title: "Consultation",
    body: "We start with a thorough vessel assessment, in-person or via detailed photos and video. We document the current condition, understand your goals, and ask the questions most services skip.",
  },
  {
    step: "02",
    title: "Custom Service Plan",
    body: "No two vessels are identical. We build a tailored service plan that matches your boat's condition, your usage pattern, and your budget, with full transparency before a single product is applied.",
  },
  {
    step: "03",
    title: "Preparation",
    body: "Proper prep is where most services fail. We decontaminate surfaces, mask hardware, protect electronics, and set up a controlled work environment before any chemical or abrasive is introduced.",
  },
  {
    step: "04",
    title: "Expert Execution",
    body: "Our certified technicians execute the plan using professional-grade products and calibrated equipment, the same tools used by top yacht yards. No shortcuts. No substitutions.",
  },
  {
    step: "05",
    title: "Final Inspection",
    body: "Before we pack up, every inch of your vessel is inspected against our internal quality standard. If it doesn't meet the NorthWake threshold, it gets addressed on the spot.",
  },
  {
    step: "06",
    title: "Documentation & Delivery",
    body: "You receive a timestamped before-and-after photo report within 24 hours, along with a service summary and any recommendations for future care, all in your client dashboard.",
  },
];

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

export default function AboutPage() {
  return (
    <>
      <Header />
      <FloatingCTA />

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
                NorthWake Marine was founded in Jacksonville with a single conviction: boat owners
                in Northeast Florida deserve the same level of care that world-class yacht yards
                deliver, without the world-class distance or wait list.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <Link
                  href="/contact"
                  className="chrome-btn font-bold text-xs tracking-[0.3em] uppercase px-9 py-4 transition-all duration-300 hover:scale-105 text-center"
                >
                  Work With Us
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
            <ul className="grid grid-cols-2 gap-px bg-steel-dark list-none">
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
                  Start a Conversation
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

        {/* ── The Process ── */}
        <section
          aria-labelledby="process-heading"
          className="py-16 px-6"
        >
          <div className="max-w-7xl mx-auto">
            <header className="flex flex-col items-center text-center gap-4 mb-16">
              <p className="text-steel text-[10px] tracking-[0.4em] uppercase">How We Work</p>
              <h2
                id="process-heading"
                className="text-wake text-3xl sm:text-4xl font-bold tracking-tight"
              >
                The NorthWake <span className="chrome-text">Process</span>
              </h2>
            </header>

            <ol className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-steel-dark list-none">
              {process.map((step) => (
                <li
                  key={step.step}
                  className="group bg-obsidian p-8 lg:p-10 flex flex-col gap-5 hover:bg-navy-dark transition-colors duration-300"
                >
                  <span
                    aria-hidden="true"
                    className="chrome-text text-4xl font-bold leading-none tracking-tighter"
                  >
                    {step.step}
                  </span>
                  <h3 className="text-wake text-lg font-bold tracking-tight">{step.title}</h3>
                  <p className="text-steel text-xs leading-relaxed">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
