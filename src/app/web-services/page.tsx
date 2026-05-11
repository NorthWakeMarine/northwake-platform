import type { Metadata } from "next";
import { clientConfig } from "@/config/client";
import WebServicesForm from "./WebServicesForm";

export const metadata: Metadata = {
  title: `Web Services | ${clientConfig.companyName}`,
  description:
    "Professional websites and CRM systems built for marine, automotive, and aviation service businesses. Three tiers from a simple landing site to a fully integrated business platform.",
};

const features = [
  {
    icon: "⬡",
    title: "WCAG 2.1 AA Accessibility",
    body: "Every site we ship meets Level AA compliance: proper contrast ratios, keyboard navigation, screen reader support, semantic HTML, and ARIA labels throughout.",
  },
  {
    icon: "⬡",
    title: "Structured Data and AI SEO",
    body: "LocalBusiness, Service, WebSite, and FAQ JSON-LD schemas built into every page. Your business appears correctly in Google Knowledge Panels, AI search results, and voice search.",
  },
  {
    icon: "⬡",
    title: "Calendar Sync",
    body: "Appointments booked through your site sync to your calendar in real time. Moves and cancellations reflect back in the CRM automatically. Supports Google Calendar, Outlook, and more.",
  },
  {
    icon: "⬡",
    title: "Accounting and Invoicing Integration",
    body: "New leads become customers in your accounting software automatically. Draft invoices push directly from the CRM with one click. Supports QuickBooks, Zoho Books, and others.",
  },
  {
    icon: "⬡",
    title: "Digital Liability Waivers",
    body: "Clients sign waivers digitally from a branded link. Signed documents are stored in their contact profile and optionally auto-saved to Google Drive.",
  },
  {
    icon: "⬡",
    title: "Live Google Reviews Carousel",
    body: "Pull your real Google Business ratings and display them live on your landing page. No screenshots. No manual updates. Always current.",
  },
  {
    icon: "⬡",
    title: "Full CRM Pipeline",
    body: "Kanban board, contact profiles, asset/vehicle fleet tracking per client, activity timelines, call logging, and a complete lead inbox, all under your domain.",
  },
  {
    icon: "⬡",
    title: "Ads Conversion Tracking",
    body: "Conversion events fire precisely on form submission, not on page load. Your ad spend data is clean and your ROAS reporting is accurate. Supports Google Ads, Meta, and more.",
  },
  {
    icon: "⬡",
    title: "Fully Isolated Per Client",
    body: "Every deployment runs on its own database and hosting environment. Your client data never shares infrastructure with anyone else. Not even us.",
  },
];

const tiers = [
  {
    name: "Launch",
    price: "$499",
    monthly: "$49/mo",
    tagline: "A high-performance landing site that generates leads and ranks.",
    badge: null,
    includes: [
      "5-page landing site (Home, Services, About, Contact, Socials)",
      "Mobile-first, WCAG 2.1 AA accessible",
      "Quote and contact form routed to your email",
      "Google Analytics 4",
      "LocalBusiness + Service JSON-LD structured data",
      "SSL, Vercel CDN hosting",
      "Google Business Profile setup",
      "14-day launch timeline",
      "1 revision round after launch",
    ],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Platform",
    price: "$999",
    monthly: "$49/mo",
    tagline: "Everything in Launch, plus a full CRM and the integrations that run your business.",
    badge: "Most Popular",
    includes: [
      "Everything in Launch",
      "Full CRM: leads inbox, contacts, fleet, pipeline board",
      "Activity timeline per contact",
      "Digital liability waiver with e-signature",
      "Google Calendar two-way sync",
      "QuickBooks Online integration",
      "Live Google Reviews carousel",
      "Google Drive document storage",
      "30-day launch timeline",
    ],
    cta: "Get Started",
    highlight: true,
  },
  {
    name: "Command",
    price: "$1,499",
    monthly: "$99/mo",
    tagline: "The complete platform, with call logging, paid ads, and AI-optimized SEO.",
    badge: null,
    includes: [
      "Everything in Platform",
      "Dialpad call and SMS logging (auto-logged to contacts)",
      "Google Ads conversion tracking",
      "AI-optimized SEO: semantic content, FAQ schema, location pages",
      "Marina or service area pages for local rank coverage",
      "Quarterly SEO and content updates",
      "Priority support, same-day response",
      "Custom integrations on request (quoted separately)",
      "45-day launch timeline",
    ],
    cta: "Get Started",
    highlight: false,
  },
];

const comparisons = [
  { label: "Setup fee", us: "Honest flat rate", them: "$3,000-$5,000+" },
  { label: "Monthly", us: "$97-$497", them: "$150-$400 (site only)" },
  { label: "CRM included", us: "Yes, full pipeline", them: "No" },
  { label: "Calendar sync", us: "Two-way, real time", them: "No" },
  { label: "QuickBooks", us: "Auto-creates customers", them: "No" },
  { label: "Liability waivers", us: "Digital, e-signed", them: "No" },
  { label: "Accessibility", us: "WCAG 2.1 AA certified", them: "Rarely tested" },
  { label: "Structured data", us: "Full JSON-LD suite", them: "Basic or none" },
  { label: "Data isolation", us: "Your own DB, always", them: "Shared hosting" },
];

export default function WebServicesPage() {
  return (
    <main>

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section
        className="relative bg-obsidian overflow-hidden pt-36 pb-24 px-6"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(0,0,128,0.18) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      >
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-6">
          <p className="text-xs tracking-[0.4em] uppercase text-steel-light">
            Marine &nbsp;·&nbsp; Automotive &nbsp;·&nbsp; Aviation
          </p>
          <h1 className="chrome-text text-5xl lg:text-6xl font-bold tracking-tight leading-none">
            Like our website?<br />
            <span className="text-wake">We built it. We can build yours.</span>
          </h1>
          <p className="text-steel-light text-base max-w-2xl leading-relaxed">
            {clientConfig.companyName} builds high-performance websites and full CRM systems
            for marine, automotive, and aviation service businesses. Not templates. Not page builders.
            A real platform built specifically for your industry, running on your domain.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-2">
            <a
              href="#pricing"
              className="chrome-btn font-bold text-xs tracking-[0.3em] uppercase px-8 py-3.5 transition-all duration-300 hover:scale-105"
            >
              See Pricing
            </a>
            <a
              href="#contact"
              className="border border-steel text-steel-light text-xs font-semibold tracking-[0.3em] uppercase px-8 py-3.5 hover:border-wake hover:text-wake transition-colors duration-300"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────────── */}
      <section className="bg-black border-y border-steel-dark py-6 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { stat: "3", label: "Industries served" },
            { stat: "9+", label: "Live integrations" },
            { stat: "AA", label: "Accessibility standard" },
            { stat: "100%", label: "Data isolation" },
          ].map(({ stat, label }) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="chrome-text text-3xl font-bold">{stat}</span>
              <span className="text-steel text-xs tracking-[0.15em] uppercase">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── What makes it different ───────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.4em] uppercase text-gray-500 mb-3">Built different</p>
            <h2 className="chrome-text-dark text-4xl font-bold tracking-tight">
              Everything your business actually needs
            </h2>
            <p className="text-gray-600 text-sm mt-3 max-w-xl mx-auto leading-relaxed">
              Most agencies sell you a brochure site. We ship a complete operating platform.
              Here is what is included at every tier.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white border border-gray-200 p-6 flex flex-col gap-3 hover:border-navy transition-colors duration-200">
                <span className="text-navy text-lg">{f.icon}</span>
                <h3 className="font-bold text-sm tracking-wide text-gray-900">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────────── */}
      <section id="pricing" className="bg-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.4em] uppercase text-gray-500 mb-3">Pricing</p>
            <h2 className="chrome-text-dark text-4xl font-bold tracking-tight">Three tiers. No surprises.</h2>
            <p className="text-gray-600 text-sm mt-3 max-w-xl mx-auto">
              No contracts. No lock-in. Cancel any time. Setup fee covers build and launch.
              Monthly covers hosting, support, and updates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`flex flex-col border p-8 relative ${
                  tier.highlight
                    ? "border-navy bg-obsidian text-white shadow-lg shadow-navy/20"
                    : "border-gray-200 bg-white"
                }`}
              >
                {tier.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge-chrome badge-chrome-text text-[9px] tracking-[0.2em] uppercase px-3 py-1">
                    {tier.badge}
                  </span>
                )}
                <div className="mb-6">
                  <p className={`text-xs tracking-[0.3em] uppercase font-semibold mb-2 ${tier.highlight ? "text-steel-light" : "text-gray-500"}`}>
                    {tier.name}
                  </p>
                  <div className="flex items-end gap-2 mb-1">
                    <span className={`text-4xl font-bold tracking-tight ${tier.highlight ? "chrome-text" : "chrome-text-dark"}`}>
                      {tier.price}
                    </span>
                    <span className={`text-sm pb-1 ${tier.highlight ? "text-steel-light" : "text-gray-500"}`}>setup</span>
                  </div>
                  <p className={`text-sm font-medium ${tier.highlight ? "text-wake" : "text-navy"}`}>{tier.monthly}</p>
                  <p className={`text-sm mt-3 leading-relaxed ${tier.highlight ? "text-steel-light" : "text-gray-600"}`}>
                    {tier.tagline}
                  </p>
                </div>

                <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                  {tier.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm">
                      <span className={`mt-0.5 flex-shrink-0 ${tier.highlight ? "text-wake" : "text-navy"}`}>✓</span>
                      <span className={tier.highlight ? "text-steel-light" : "text-gray-700"}>{item}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#contact"
                  className={`text-center text-xs font-bold tracking-[0.3em] uppercase py-3.5 transition-all duration-300 hover:scale-[1.02] block ${
                    tier.highlight
                      ? "chrome-btn"
                      : "border border-gray-500 text-gray-700 hover:border-navy hover:text-navy"
                  }`}
                >
                  {tier.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison ────────────────────────────────────────────────────────── */}
      <section className="bg-obsidian py-20 px-6 border-t border-steel-dark">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.4em] uppercase text-steel mb-3">Why not a regular agency</p>
            <h2 className="chrome-text text-4xl font-bold tracking-tight">
              What you actually get
            </h2>
          </div>
          <div className="border border-steel-dark overflow-hidden">
            <div className="grid grid-cols-3 bg-black px-6 py-3 border-b border-steel-dark">
              <span className="text-xs tracking-[0.2em] uppercase text-steel">Feature</span>
              <span className="text-xs tracking-[0.2em] uppercase text-wake text-center">Our Platform</span>
              <span className="text-xs tracking-[0.2em] uppercase text-steel text-center">Typical Agency</span>
            </div>
            {comparisons.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-3 px-6 py-3.5 border-b border-steel-dark/50 ${i % 2 === 0 ? "bg-obsidian" : "bg-black"}`}
              >
                <span className="text-xs text-steel-light">{row.label}</span>
                <span className="text-xs text-wake text-center font-medium">{row.us}</span>
                <span className="text-xs text-steel text-center">{row.them}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact form ─────────────────────────────────────────────────────── */}
      <section id="contact" className="bg-gray-50 py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs tracking-[0.4em] uppercase text-gray-500 mb-3">Get started</p>
            <h2 className="chrome-text-dark text-4xl font-bold tracking-tight">Let us build yours</h2>
            <p className="text-gray-600 text-sm mt-3 leading-relaxed">
              Tell us about your business and the tier you are interested in.
              We will follow up within one business day with next steps.
            </p>
          </div>
          <div className="bg-white border border-gray-200 p-8">
            <WebServicesForm />
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">
            Prefer to talk? Call us at{" "}
            <a href={`tel:${clientConfig.phoneE164}`} className="underline hover:text-navy">
              {clientConfig.phone}
            </a>
          </p>
        </div>
      </section>

    </main>
  );
}
