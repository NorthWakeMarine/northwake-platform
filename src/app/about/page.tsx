import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingCTA from "@/components/FloatingCTA";

export const metadata: Metadata = {
  title: "About NorthWake Marine — Jacksonville's Premier Marine Services",
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
    body: "We start with a thorough vessel assessment — in-person or via detailed photos and video. We document the current condition, understand your goals, and ask the questions most services skip.",
  },
  {
    step: "02",
    title: "Custom Service Plan",
    body: "No two vessels are identical. We build a tailored service plan that matches your boat's condition, your usage pattern, and your budget — with full transparency before a single product is applied.",
  },
  {
    step: "03",
    title: "Preparation",
    body: "Proper prep is where most services fail. We decontaminate surfaces, mask hardware, protect electronics, and set up a controlled work environment before any chemical or abrasive is introduced.",
  },
  {
    step: "04",
    title: "Expert Execution",
    body: "Our certified technicians execute the plan using professional-grade products and calibrated equipment — the same tools used by top yacht yards. No shortcuts. No substitutions.",
  },
  {
    step: "05",
    title: "Final Inspection",
    body: "Before we pack up, every inch of your vessel is inspected against our internal quality standard. If it doesn't meet the NorthWake threshold, it gets addressed on the spot.",
  },
  {
    step: "06",
    title: "Documentation & Delivery",
    body: "You receive a timestamped before-and-after photo report within 24 hours, along with a service summary and any recommendations for future care — all in your client dashboard.",
  },
];

const values = [
  {
    icon: "◈",
    title: "Precision Over Speed",
    body: "We never rush a job. Every step of our process has a reason, and every result is measured against a verifiable standard.",
  },
  {
    icon: "◉",
    title: "Radical Transparency",
    body: "No hidden fees. No surprise line items. Detailed quotes before any work begins, and honest conversation if scope changes mid-job.",
  },
  {
    icon: "◇",
    title: "Continuous Certification",
    body: "Our technicians don't just get certified once. We mandate ongoing training as products, coatings, and best practices evolve.",
  },
  {
    icon: "△",
    title: "Client-First Scheduling",
    body: "We work around your calendar and your marina's schedule — not the other way around. Priority access is a core part of every plan.",
  },
];

const team = [
  {
    name: "Marcus D.",
    role: "Founder & Head of Operations",
    bio: "15 years in the marine industry. Certified ceramic coating installer and former dock manager at a North Florida yacht club. Founded NorthWake to deliver professionalism that matches the vessels we care for.",
    initial: "M",
  },
  {
    name: "Jordan T.",
    role: "Lead Marine Technician",
    bio: "Factory-certified in multiple professional coating systems. 8 years of hands-on experience with everything from 18-foot center consoles to 60-foot sportfish yachts. Obsessive about prep work.",
    initial: "J",
  },
  {
    name: "Priya N.",
    role: "Client Relations & Vessel Management",
    bio: "Background in luxury hospitality management. Oversees all yacht management accounts, client communications, and the concierge scheduling system that keeps our clients on the water, not on the phone.",
    initial: "P",
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
                Est. 2012 &nbsp;·&nbsp; Jacksonville, FL
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
                deliver — without the world-class distance or wait list.
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

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-px bg-steel-dark">
              {[
                { value: "500+", label: "Vessels Serviced" },
                { value: "12+",  label: "Years on the Water" },
                { value: "98%",  label: "Client Retention" },
                { value: "5★",   label: "Google Rating" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-obsidian flex flex-col items-center justify-center gap-2 py-10 hover:bg-navy-dark transition-colors duration-300"
                >
                  <span className="chrome-text text-3xl font-bold tracking-tight">
                    {stat.value}
                  </span>
                  <span className="text-steel text-[10px] tracking-[0.25em] uppercase text-center">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 inset-x-0 h-24"
            style={{ background: "linear-gradient(to bottom, transparent, #000000)" }}
          />
        </section>

        {/* ── Mission / NorthWake Standard ── */}
        <section
          aria-labelledby="standard-heading"
          className="py-24 px-6 border-t border-steel-dark"
        >
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-start">
            <div className="flex flex-col gap-6 md:sticky md:top-28">
              <p className="text-steel text-[10px] tracking-[0.4em] uppercase">Our Mission</p>
              <h2
                id="standard-heading"
                className="text-wake text-3xl sm:text-4xl font-bold tracking-tight leading-tight"
              >
                The NorthWake<br />
                <span className="chrome-text">Standard</span>
              </h2>
              <hr className="accent-rule w-40" />
              <p className="text-steel-light text-sm leading-relaxed">
                The NorthWake Standard is not a checklist. It&apos;s a mindset that every member
                of our team carries onto every vessel, every day — a commitment that every detail
                visible and invisible meets the level our clients expect.
              </p>
              <p className="text-steel-light text-sm leading-relaxed">
                Jacksonville&apos;s waterways are extraordinary. The St. Johns River, the
                Intracoastal, and the Atlantic approaches demand boats that are maintained at
                their absolute best — for safety, performance, and pride of ownership.
              </p>
              <p className="text-steel-light text-sm leading-relaxed">
                We built NorthWake to be the answer to that demand. Not a detailing shop that
                occasionally does ceramic. Not a marina that reluctantly offers maintenance
                plans. A dedicated, certified marine services company — where the standard is
                never negotiated.
              </p>
            </div>

            {/* Values grid */}
            <ul className="flex flex-col gap-px bg-steel-dark list-none">
              {values.map((v) => (
                <li
                  key={v.title}
                  className="group bg-obsidian p-8 flex gap-6 items-start hover:bg-navy-dark transition-colors duration-300"
                >
                  <span aria-hidden="true" className="chrome-text text-2xl leading-none mt-0.5 shrink-0">
                    {v.icon}
                  </span>
                  <div>
                    <h3 className="text-wake text-base font-bold mb-2">{v.title}</h3>
                    <p className="text-steel text-xs leading-relaxed">{v.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Jacksonville Roots ── */}
        <section
          aria-labelledby="roots-heading"
          className="py-24 px-6 border-t border-steel-dark"
          style={{
            background:
              "linear-gradient(180deg, #000000 0%, #000020 50%, #000000 100%)",
          }}
        >
          <div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-8">
            <p className="text-steel text-[10px] tracking-[0.4em] uppercase">Our Home Waters</p>
            <h2
              id="roots-heading"
              className="text-wake text-3xl sm:text-4xl font-bold tracking-tight"
            >
              Jacksonville&apos;s Waters Demand<br />
              <span className="chrome-text">A Different Level of Care</span>
            </h2>
            <hr className="accent-rule w-40" />
            <div className="grid md:grid-cols-3 gap-px bg-steel-dark w-full text-left mt-4">
              {[
                {
                  heading: "Salt + UV Intensity",
                  body: "Northeast Florida's combination of coastal salt air, direct sun exposure, and humidity accelerates oxidation and gelcoat degradation faster than most markets in the country.",
                },
                {
                  heading: "Year-Round Boating",
                  body: "Jacksonville's mild winters mean most boats stay in the water twelve months a year — requiring regular maintenance intervals and protection regimens designed for continuous use.",
                },
                {
                  heading: "World-Class Destinations",
                  body: "From the St. Johns River to the St. Augustine inlet and offshore Atlantic, Jacksonville boaters reach extraordinary destinations. Your vessel should match the scenery.",
                },
              ].map((card) => (
                <div
                  key={card.heading}
                  className="bg-obsidian p-8 hover:bg-navy-dark transition-colors duration-300"
                >
                  <h3 className="text-wake text-sm font-bold mb-3">{card.heading}</h3>
                  <p className="text-steel text-xs leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── The Process ── */}
        <section
          aria-labelledby="process-heading"
          className="py-24 px-6 border-t border-steel-dark"
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
              <hr className="accent-rule w-40" />
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

        {/* ── Team ── */}
        <section
          aria-labelledby="team-heading"
          className="py-24 px-6 border-t border-steel-dark"
        >
          <div className="max-w-7xl mx-auto">
            <header className="flex flex-col items-center text-center gap-4 mb-16">
              <p className="text-steel text-[10px] tracking-[0.4em] uppercase">The People Behind the Work</p>
              <h2
                id="team-heading"
                className="text-wake text-3xl sm:text-4xl font-bold tracking-tight"
              >
                Our <span className="chrome-text">Team</span>
              </h2>
              <hr className="accent-rule w-40" />
            </header>

            <ul className="grid md:grid-cols-3 gap-px bg-steel-dark list-none">
              {team.map((member) => (
                <li
                  key={member.name}
                  className="group bg-obsidian p-8 lg:p-10 flex flex-col gap-5 hover:bg-navy-dark transition-colors duration-300"
                >
                  {/* Avatar placeholder */}
                  <div
                    aria-hidden="true"
                    className="w-14 h-14 border border-steel-dark flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, #000040 0%, #000080 100%)",
                    }}
                  >
                    <span className="chrome-text text-xl font-bold">{member.initial}</span>
                  </div>
                  <div>
                    <h3 className="text-wake text-base font-bold">{member.name}</h3>
                    <p className="text-steel text-[10px] tracking-[0.25em] uppercase mt-0.5">
                      {member.role}
                    </p>
                  </div>
                  <p className="text-steel text-xs leading-relaxed">{member.bio}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── CTA ── */}
        <section
          aria-labelledby="about-cta-heading"
          className="py-24 px-6 border-t border-steel-dark text-center"
        >
          <div className="max-w-2xl mx-auto flex flex-col items-center gap-7">
            <h2
              id="about-cta-heading"
              className="text-wake text-3xl sm:text-4xl font-bold tracking-tight"
            >
              Ready to Experience the<br />
              <span className="chrome-text">NorthWake Standard?</span>
            </h2>
            <p className="text-steel-light text-sm leading-relaxed">
              Whether you&apos;re looking for a one-time detail or a long-term management partner,
              we&apos;d love to start with a conversation about your vessel.
            </p>
            <Link
              href="/contact"
              className="chrome-btn font-bold text-xs tracking-[0.3em] uppercase px-10 py-4 transition-all duration-300 hover:scale-105"
            >
              Get a Free Quote
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
