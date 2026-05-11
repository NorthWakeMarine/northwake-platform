import type { Metadata } from "next";
import { clientConfig } from "@/config/client";
import WebServicesForm from "./WebServicesForm";

export const metadata: Metadata = {
  title: `Web Services | ${clientConfig.companyName}`,
  description:
    "Professional websites and CRM systems built for marine, automotive, and aviation service businesses. Three tiers from a simple landing site to a fully integrated business platform.",
};

// ── Data ──────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: "⬡",
    title: "WCAG 2.1 AA Accessibility",
    body: "Every site we ship meets Level AA compliance: proper contrast ratios, keyboard navigation, screen reader support, semantic HTML, and ARIA labels throughout. Most agencies never test for this.",
  },
  {
    icon: "⬡",
    title: "Structured Data and AI SEO",
    body: "LocalBusiness, Service, WebSite, and FAQ JSON-LD schemas on every page. Your business appears correctly in Google Knowledge Panels, AI search results, and voice search.",
  },
  {
    icon: "⬡",
    title: "Calendar Sync",
    body: "Appointments booked through your site sync to your calendar in real time. Moves and cancellations reflect back in the CRM automatically. Supports Google Calendar, Outlook, and more.",
  },
  {
    icon: "⬡",
    title: "Accounting and Invoicing Integration",
    body: "New leads become customers in your accounting software automatically. Draft invoices push from the CRM with one click. Supports QuickBooks, Zoho Books, and others.",
  },
  {
    icon: "⬡",
    title: "Digital Liability Waivers",
    body: "Clients sign waivers digitally from a branded link. Signed documents are stored in their contact profile and optionally auto-saved to cloud storage.",
  },
  {
    icon: "⬡",
    title: "Live Reviews Carousel",
    body: "Pull your real ratings from your business profile and display them live on your landing page. No screenshots, no manual updates. Always current.",
  },
  {
    icon: "⬡",
    title: "Full CRM Pipeline",
    body: "Kanban board, contact profiles, asset and vehicle fleet tracking per client, activity timelines, call logging, and a complete lead inbox, all under your domain.",
  },
  {
    icon: "⬡",
    title: "VoIP Call and SMS Logging",
    body: "Every call and text is automatically logged to the right contact in the CRM. Supports Dialpad, RingCentral, and other VoIP providers.",
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
    tagline: "A high-performance landing site that generates leads and ranks on Google.",
    badge: null,
    includes: [
      "5-page landing site (Home, Services, About, Contact, Socials)",
      "Mobile-first, WCAG 2.1 AA accessible",
      "Quote and contact form routed to your email",
      "Analytics setup (Google Analytics 4 or equivalent)",
      "LocalBusiness + Service JSON-LD structured data",
      "SSL, global CDN hosting",
      "Business profile setup and optimization",
      "14-day launch timeline",
      "1 revision round after launch",
    ],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Platform",
    price: "$999",
    monthly: "$99/mo",
    tagline: "Everything in Launch, plus a full CRM and the integrations that run your business.",
    badge: "Most Popular",
    includes: [
      "Everything in Launch",
      "Full CRM: leads inbox, contacts, fleet, pipeline board",
      "Activity timeline per contact",
      "Digital liability waiver with e-signature",
      "Calendar sync (Google Calendar, Outlook, and others)",
      "Accounting integration (QuickBooks, Zoho Books, and others)",
      "Live reviews carousel",
      "Cloud document storage integration",
      "30-day launch timeline",
    ],
    cta: "Get Started",
    highlight: true,
  },
  {
    name: "Command",
    price: "$1,499",
    monthly: "$149/mo",
    tagline: "The complete platform, with call logging, AI-optimized SEO, and location pages.",
    badge: null,
    includes: [
      "Everything in Platform",
      "VoIP call and SMS logging (Dialpad, RingCentral, and others)",
      "AI-optimized SEO: semantic content, FAQ schema, entity coverage",
      "Location and service area pages for local rank coverage",
      "Quarterly SEO and content updates",
      "Priority support, same-day response",
      "Custom integrations on request (quoted separately)",
      "45-day launch timeline",
    ],
    cta: "Get Started",
    highlight: false,
  },
];

const addons = [
  {
    title: "Paid Ads Conversion Tracking",
    price: "+$299 one-time",
    body: "Conversion events wired to your Google Ads, Meta, or other ad platform. Fires on form submission, not page load. Clean ROAS data from day one.",
  },
  {
    title: "Additional Location Pages",
    price: "+$99 per page",
    body: "Dedicated pages targeting each marina, service area, or city you operate in. Each page is optimized independently for local search.",
  },
  {
    title: "Before and After Gallery Page",
    price: "+$199 one-time",
    body: "A dedicated gallery page showcasing your best work. Clients can filter by service type. Proven to increase quote form conversions.",
  },
  {
    title: "Additional Revision Rounds",
    price: "+$149 per round",
    body: "Need more back-and-forth on the design? Add revision rounds at any time during or after the build.",
  },
];

const comparisons = [
  { label: "Setup fee", us: "$499-$1,499", them: "$3,000-$5,000+" },
  { label: "Monthly", us: "$49-$149", them: "$150-$400 (site only)" },
  { label: "CRM included", us: "Yes, full pipeline", them: "No" },
  { label: "Calendar sync", us: "Two-way, real time", them: "No" },
  { label: "Accounting integration", us: "Auto-creates customers", them: "No" },
  { label: "VoIP call logging", us: "Auto-logged to contacts", them: "No" },
  { label: "Liability waivers", us: "Digital, e-signed", them: "No" },
  { label: "Accessibility", us: "WCAG 2.1 AA compliant", them: "Rarely tested" },
  { label: "Structured data", us: "Full JSON-LD suite", them: "Basic or none" },
  { label: "Data isolation", us: "Your own database", them: "Shared hosting" },
];

const vsOptions = [
  {
    name: "Wix / Squarespace / GoDaddy",
    verdict: "Good for a hobby. Not for a business.",
    points: [
      "You own nothing — cancel and your site is gone",
      "No CRM, no lead tracking, no pipeline",
      "No structured data or AI SEO out of the box",
      "Shared hosting, slow load times",
      "No integrations with your actual business tools",
      "Looks generic because it is generic",
    ],
  },
  {
    name: "Hiring a Generic Agency",
    verdict: "You pay for their office, not your site.",
    points: [
      "$3,000-$5,000+ upfront before a single page is live",
      "$150-$400/mo for hosting you could get for $20",
      "Account managers who have never worked on a boat",
      "Templated sites reused across clients",
      "No CRM — they upsell that separately",
      "Long contracts with vague deliverables",
    ],
  },
  {
    name: "Cheap Industry Site Builders",
    verdict: "Cheap because it is the same site for everyone.",
    points: [
      "Cookie-cutter templates with your name swapped in",
      "No CRM, no integrations, no pipeline",
      "Structured data often missing or incorrect",
      "Accessibility rarely tested",
      "Support means a ticket queue, not a person",
      "You share infrastructure with hundreds of other clients",
    ],
  },
];

const faqs = [
  {
    q: "How long does it take to launch?",
    a: "Launch tier is 14 days from the time we have your content and assets. Platform is 30 days. Command is 45 days. These are firm commitments, not estimates.",
  },
  {
    q: "Do I need to provide content or do you write it?",
    a: "We write all the copy. We need your service list, a few sentences about your business, your logo, and some photos of your work. We handle the rest, including SEO-optimized service descriptions.",
  },
  {
    q: "What happens if I want to cancel?",
    a: "No contracts. Cancel any time with 30 days notice. You keep your domain. You keep any content you provided. We will export your CRM data to a CSV so you walk away with everything.",
  },
  {
    q: "Can I use my own domain?",
    a: "Yes, always. If you already own a domain we point it to your new site. If you need one we will help you register it. Your domain stays yours regardless of whether you are our client.",
  },
  {
    q: "What industries do you build for?",
    a: "Marine service businesses (detailing, maintenance, storage, repair), automotive service shops (detailing, wraps, PPF, ceramic coating, mechanical), and aviation (MRO, detailing, charter). If you run a service business with recurring clients and appointments, this platform fits.",
  },
  {
    q: "Is the CRM hard to use?",
    a: "No. It was built specifically for service businesses, not for enterprise software teams. You get a lead inbox, a Kanban pipeline, and contact profiles. We walk you through it on a screen share before handoff and provide a recorded walkthrough you can rewatch.",
  },
  {
    q: "What if I need a feature you do not offer?",
    a: "Command tier includes custom integrations on request, quoted separately. If it is a common need we will build it into the platform and all clients benefit.",
  },
  {
    q: "Do I have to use all the integrations?",
    a: "No. Every integration is opt-in. If you do not use QuickBooks, we do not connect it. The platform works fine with only the tools you actually use.",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WebServicesPage() {
  return (
    <main>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
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
            <a href="#pricing" className="chrome-btn font-bold text-xs tracking-[0.3em] uppercase px-8 py-3.5 transition-all duration-300 hover:scale-105">
              See Pricing
            </a>
            <a href="#contact" className="border border-steel text-steel-light text-xs font-semibold tracking-[0.3em] uppercase px-8 py-3.5 hover:border-wake hover:text-wake transition-colors duration-300">
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

      {/* ── Who it's for ─────────────────────────────────────────────────────── */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.4em] uppercase text-gray-500 mb-3">Who we build for</p>
            <h2 className="chrome-text-dark text-4xl font-bold tracking-tight">Built for your industry</h2>
            <p className="text-gray-600 text-sm mt-3 max-w-xl mx-auto leading-relaxed">
              Generic website builders know nothing about how your clients find you, how your jobs are booked,
              or what makes a service business grow. We do.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                industry: "Marine",
                icon: "⚓",
                examples: "Detailing, maintenance, storage, bottom paint, canvas, upholstery repair",
                insight: "Boat owners search by marina, by lake, by waterway. We build location pages that rank at every slip in your territory.",
              },
              {
                industry: "Automotive",
                icon: "◈",
                examples: "Detailing, ceramic coating, PPF, window tint, wraps, mechanical, tire shops",
                insight: "Car owners search by neighborhood and by service type. We build pages for every service and every area you cover.",
              },
              {
                industry: "Aviation",
                icon: "◈",
                examples: "MRO, aircraft detailing, charter, avionics, FBOs",
                insight: "Aviation clients research thoroughly before committing. A professional site with structured data and clear service details converts at a much higher rate.",
              },
            ].map((item) => (
              <div key={item.industry} className="border border-gray-200 p-7 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-navy text-xl">{item.icon}</span>
                  <h3 className="font-bold text-base text-gray-900">{item.industry}</h3>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{item.examples}</p>
                <p className="text-sm text-gray-700 leading-relaxed border-t border-gray-100 pt-4">{item.insight}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The problem ──────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <p className="text-xs tracking-[0.4em] uppercase text-gray-500 mb-3">The real problem</p>
            <h2 className="chrome-text-dark text-4xl font-bold tracking-tight max-w-2xl">
              Your next client is searching right now. Are they finding you or your competitor?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="flex flex-col gap-5 text-gray-700 text-sm leading-relaxed">
              <p>
                When someone needs their boat detailed, their car coated, or their aircraft serviced,
                the first thing they do is search Google. Not ask a friend. Not check a bulletin board.
                They type in a search and click one of the first three results.
              </p>
              <p>
                If your site is slow, generic, or buried on page two, that client calls your competitor.
                And because these are recurring service clients, you are not just losing one job.
                You are losing every job that client would have given you for the next five years.
              </p>
              <p>
                Most service businesses either have no website, a DIY site that loads in four seconds,
                or an expensive agency-built site that looks good but has no CRM behind it.
                Leads come in and disappear into an email inbox. Follow-up is manual. Repeat business
                is left to chance.
              </p>
            </div>
            <div className="flex flex-col gap-5 text-gray-700 text-sm leading-relaxed">
              <p>
                The businesses that win online have three things working together: a fast, professional site
                that ranks for the right searches, a system that captures and tracks every lead,
                and integrations that connect their website to the tools they already use.
              </p>
              <p>
                That is exactly what we build. Not a brochure. Not a placeholder. A complete operating
                platform that treats your website as the front door to a real business system.
              </p>
              <p>
                You focus on the work. The platform handles the rest, from the first Google search
                to a signed waiver to a paid invoice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CRM deep dive ────────────────────────────────────────────────────── */}
      <section className="bg-white py-20 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-14 items-start">
          <div>
            <p className="text-xs tracking-[0.4em] uppercase text-gray-500 mb-3">The CRM</p>
            <h2 className="chrome-text-dark text-3xl font-bold tracking-tight mb-5">
              Every lead tracked. Every client remembered.
            </h2>
            <div className="flex flex-col gap-4 text-gray-700 text-sm leading-relaxed">
              <p>
                When a client submits your quote form, they do not disappear into an email.
                They land in your lead inbox with their name, contact info, what they need,
                and what type of asset they have. You move them through a visual pipeline
                with one click.
              </p>
              <p>
                Every contact has a full profile: their vehicle or vessel fleet, every service
                you have ever done for them, every call logged, every note added, every document signed.
                When they call you six months later, you know exactly who they are and what their history is.
              </p>
              <p>
                The pipeline board shows you every active deal at a glance. Quoted, scheduled, in progress,
                complete, invoiced. No spreadsheets. No sticky notes. No missed follow-ups.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { label: "Lead inbox", desc: "Every form submission lands here with full contact details and what they are asking for." },
              { label: "Contact profiles", desc: "Name, phone, email, asset fleet, full service history, and activity timeline in one place." },
              { label: "Pipeline board", desc: "Kanban view of every active deal. Drag cards through stages from quote to paid." },
              { label: "Activity timeline", desc: "Every call, note, email, appointment, and document logged chronologically per contact." },
              { label: "Fleet tracking", desc: "Each contact can have multiple vehicles, vessels, or aircraft with their own service records." },
              { label: "Digital waivers", desc: "Send a branded link, client signs on their phone, document saves to their profile automatically." },
            ].map((item) => (
              <div key={item.label} className="border-l-2 border-navy pl-4">
                <p className="font-bold text-sm text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEO deep dive ────────────────────────────────────────────────────── */}
      <section className="bg-obsidian py-20 px-6 border-t border-steel-dark">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-14 items-start">
          <div>
            <p className="text-xs tracking-[0.4em] uppercase text-steel mb-3">Search and AI SEO</p>
            <h2 className="chrome-text text-3xl font-bold tracking-tight mb-5">
              Built to rank on Google and in AI search results.
            </h2>
            <div className="flex flex-col gap-4 text-steel-light text-sm leading-relaxed">
              <p>
                Search has changed. People still use Google but they also use AI tools like ChatGPT,
                Perplexity, and Google AI Overviews to find local businesses. The sites that appear
                in those results are the ones with structured data, clear entity signals, and
                semantically complete content.
              </p>
              <p>
                Every site we ship has full JSON-LD structured data: LocalBusiness schema with your
                coordinates, hours, and contact info. Service schema for every service you offer.
                WebSite schema with a search action. FAQPage schema for common questions.
                This is the technical layer that tells Google and AI systems exactly who you are
                and what you do.
              </p>
              <p>
                Command tier adds location and service area pages, AI-optimized content for each
                service, and quarterly updates to keep your content current and your rankings climbing.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { label: "LocalBusiness JSON-LD", desc: "Your coordinates, hours, phone, and service area in machine-readable format on every page." },
              { label: "Service schema", desc: "Each service gets its own schema entry so Google understands your full offering." },
              { label: "FAQPage schema", desc: "Common questions answered in structured data — eligible for rich results in search." },
              { label: "Location pages", desc: "Dedicated pages for each marina, city, or service area. Each one optimized independently." },
              { label: "Semantic content", desc: "Copy written with entity coverage and keyword depth, not just keyword stuffing." },
              { label: "Quarterly updates", desc: "Command tier includes quarterly content refreshes to keep rankings from stagnating." },
            ].map((item) => (
              <div key={item.label} className="border-l-2 border-wake pl-4">
                <p className="font-bold text-sm text-white">{item.label}</p>
                <p className="text-xs text-steel-light mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Integrations deep dive ───────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.4em] uppercase text-gray-500 mb-3">Integrations</p>
            <h2 className="chrome-text-dark text-4xl font-bold tracking-tight">Your website connects to your whole business</h2>
            <p className="text-gray-600 text-sm mt-3 max-w-2xl mx-auto leading-relaxed">
              A website that does not talk to your other tools creates work. Every integration we build
              eliminates a manual step you are doing right now.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "Calendar sync",
                examples: "Google Calendar, Outlook, and others",
                body: "When you schedule an appointment in the CRM it appears on your calendar immediately. When a client reschedules via Google Calendar, the CRM updates automatically. No double entry. No missed appointments. The system flags conflicts before they happen.",
              },
              {
                title: "Accounting and invoicing",
                examples: "QuickBooks, Zoho Books, and others",
                body: "Every new lead that converts becomes a customer record in your accounting software automatically. When you are ready to invoice, push a draft from the CRM directly to your accounting platform. Your books stay accurate without manual data entry.",
              },
              {
                title: "VoIP call and SMS logging",
                examples: "Dialpad, RingCentral, and others",
                body: "Every call and text you make or receive is automatically logged to the relevant contact in the CRM with a timestamp, direction, and duration. You never lose track of a conversation. New callers who are not in the system yet are flagged for follow-up.",
              },
              {
                title: "Cloud document storage",
                examples: "Google Drive, Dropbox, and others",
                body: "Signed liability waivers and generated invoices are automatically saved to a folder in your cloud storage, named and organized by client and date. No manual downloading, no missing paperwork, no digging through email attachments.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-gray-200 p-7">
                <h3 className="font-bold text-sm text-gray-900 mb-1">{item.title}</h3>
                <p className="text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-3">{item.examples}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature grid ─────────────────────────────────────────────────────── */}
      <section className="bg-white py-20 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.4em] uppercase text-gray-500 mb-3">Everything included</p>
            <h2 className="chrome-text-dark text-4xl font-bold tracking-tight">
              The details that separate a real platform from a brochure
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-gray-50 border border-gray-200 p-6 flex flex-col gap-3 hover:border-navy transition-colors duration-200">
                <span className="text-navy text-lg">{f.icon}</span>
                <h3 className="font-bold text-sm tracking-wide text-gray-900">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────────── */}
      <section id="pricing" className="bg-gray-50 py-20 px-6 border-t border-gray-100">
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

      {/* ── Add-ons ───────────────────────────────────────────────────────────── */}
      <section className="bg-white py-16 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs tracking-[0.4em] uppercase text-gray-500 mb-3">Add-ons</p>
            <h2 className="chrome-text-dark text-3xl font-bold tracking-tight">Available on any tier</h2>
            <p className="text-gray-600 text-sm mt-2 max-w-lg mx-auto">
              One-time additions you can bolt onto any tier at any time, during the build or after launch.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {addons.map((addon) => (
              <div key={addon.title} className="border border-gray-200 p-6 flex gap-5 items-start">
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h3 className="font-bold text-sm text-gray-900">{addon.title}</h3>
                    <span className="text-xs font-semibold text-navy whitespace-nowrap">{addon.price}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{addon.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VS comparison ────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.4em] uppercase text-gray-500 mb-3">Why not the alternatives</p>
            <h2 className="chrome-text-dark text-4xl font-bold tracking-tight">
              We have looked at what else is out there
            </h2>
            <p className="text-gray-600 text-sm mt-3 max-w-xl mx-auto leading-relaxed">
              Here is an honest breakdown of your other options and where they fall short for a serious service business.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
            {vsOptions.map((opt) => (
              <div key={opt.name} className="bg-white border border-gray-200 p-7">
                <h3 className="font-bold text-sm text-gray-900 mb-1">{opt.name}</h3>
                <p className="text-xs text-red-500 font-semibold mb-4 tracking-wide">{opt.verdict}</p>
                <ul className="flex flex-col gap-2.5">
                  {opt.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <span className="text-red-400 mt-0.5 flex-shrink-0">✕</span>
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Feature comparison table */}
          <div className="border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-3 bg-navy px-6 py-3">
              <span className="text-xs tracking-[0.2em] uppercase text-white">Feature</span>
              <span className="text-xs tracking-[0.2em] uppercase text-white text-center">Our Platform</span>
              <span className="text-xs tracking-[0.2em] uppercase text-white/60 text-center">Typical Agency</span>
            </div>
            {comparisons.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-3 px-6 py-3.5 border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
              >
                <span className="text-xs text-gray-700">{row.label}</span>
                <span className="text-xs text-navy text-center font-semibold">{row.us}</span>
                <span className="text-xs text-gray-400 text-center">{row.them}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section className="bg-obsidian py-20 px-6 border-t border-steel-dark">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.4em] uppercase text-steel mb-3">The process</p>
            <h2 className="chrome-text text-4xl font-bold tracking-tight">From inquiry to live in three steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Discovery",
                body: "Fill out the form below. We follow up within one business day to collect your services, brand assets, and integration needs. No lengthy intake forms, no kickoff calls with six people on the line.",
              },
              {
                step: "02",
                title: "Build",
                body: "We build your site and CRM in parallel. You get a staging link to review before anything goes live. We handle all the technical setup: DNS, SSL, Supabase, integrations, and structured data.",
              },
              {
                step: "03",
                title: "Launch and handoff",
                body: "We point your domain, run a full QA pass, and walk you through the CRM on a recorded screen share. You go live knowing exactly how to use everything.",
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col gap-4">
                <span className="chrome-text text-5xl font-bold tracking-tight">{item.step}</span>
                <h3 className="font-bold text-base text-white tracking-wide">{item.title}</h3>
                <p className="text-steel-light text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.4em] uppercase text-gray-500 mb-3">Common questions</p>
            <h2 className="chrome-text-dark text-4xl font-bold tracking-tight">Answered honestly</h2>
          </div>
          <div className="flex flex-col divide-y divide-gray-100">
            {faqs.map((faq) => (
              <div key={faq.q} className="py-6">
                <p className="font-bold text-sm text-gray-900 mb-2">{faq.q}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact form ─────────────────────────────────────────────────────── */}
      <section id="contact" className="bg-gray-50 py-20 px-6 border-t border-gray-100">
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
