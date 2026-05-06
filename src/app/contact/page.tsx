import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingCTA from "@/components/FloatingCTA";
import QuoteForm from "@/components/QuoteForm";

export const metadata: Metadata = {
  title: "Contact NorthWake Marine, Get a Free Quote in Jacksonville, FL",
  description:
    "Contact NorthWake Marine for a free, no-obligation quote on boat detailing, ceramic coating, or yacht management in Jacksonville, FL. Call, email, or submit your vessel details online.",
  keywords: [
    "contact NorthWake Marine",
    "boat detailing quote Jacksonville",
    "free marine services quote Florida",
    "ceramic coating estimate Jacksonville",
    "yacht management inquiry Florida",
  ],
  openGraph: {
    title: "Contact NorthWake Marine | Free Quote, Jacksonville, FL",
    description:
      "Ready to elevate your vessel? Contact NorthWake Marine for a free, no-obligation estimate on any of our professional marine services.",
    url: "https://northwakemarine.com/contact",
  },
  alternates: { canonical: "https://northwakemarine.com/contact" },
};

const contactInfo = [
  {
    icon: "◉",
    label: "Phone",
    value: "(904) 606-5454",
    href: "tel:+19046065454",
    sub: null,
  },
  {
    icon: "◈",
    label: "Email",
    value: "info@northwakemarine.com",
    href: "mailto:info@northwakemarine.com",
    sub: null,
  },
  {
    icon: "◇",
    label: "Location",
    value: "Jacksonville, FL",
    href: null,
    sub: "St. Johns River Corridor & Surrounding Areas",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How quickly can you schedule a service?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most standard detailing and maintenance jobs can be scheduled within 3–5 business days. Ceramic coating and larger packages typically require 5–10 days lead time depending on vessel size and current bookings.",
      },
    },
    {
      "@type": "Question",
      name: "Do you service boats at the marina or do I bring it to you?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We come to your vessel at your marina, boatyard, or private slip throughout the Jacksonville area. There is no need to move your boat unless a haul-out is required for the service (e.g., gel coat restoration or hull work).",
      },
    },
    {
      "@type": "Question",
      name: "What vessels are too large or too small for your services?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We service boats from 18 feet to 80+ feet. Our yacht management and ceramic coating services are particularly well-suited to vessels from 28 feet and above, but we evaluate every inquiry individually.",
      },
    },
    {
      "@type": "Question",
      name: "Are your products safe for fiberglass, painted hulls, and teak?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. We always assess the substrate type before selecting products. Every surface is evaluated to identify and protect painted hulls, varnished teak, vinyl faux-teak, and factory gelcoat finishes.",
      },
    },
    {
      "@type": "Question",
      name: "How does the monthly maintenance plan billing work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We never lock you into a contract. Plans are billed on a recurring basis with a rate and schedule agreed upon upfront. Adjustments are handled with direct communication.",
      },
    },
  ],
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Header />
      <FloatingCTA />

      <main>
        {/* ── Main contact layout ── */}
        <section
          aria-labelledby="contact-form-heading"
          className="pt-32 pb-16 px-6"
        >
          <h1 className="sr-only">Contact NorthWake Marine, Get a Free Quote in Jacksonville, FL</h1>
          <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_1.6fr] gap-16 items-start">

            {/* Left column, contact info + map */}
            <div className="flex flex-col gap-8 lg:sticky lg:top-28">
              {/* Contact cards */}
              <div className="flex flex-col gap-px bg-steel-dark">
                {contactInfo.map((item) => (
                  <address
                    key={item.label}
                    className="not-italic bg-obsidian p-6 flex gap-5 items-start hover:bg-navy-dark transition-colors duration-300"
                  >
                    <span aria-hidden="true" className="chrome-text text-xl leading-none mt-0.5 shrink-0">
                      {item.icon}
                    </span>
                    <div>
                      <p className="text-steel text-[9px] tracking-[0.35em] uppercase mb-1">
                        {item.label}
                      </p>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="text-wake text-sm font-semibold hover:text-steel-light transition-colors duration-200"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-wake text-sm font-semibold">{item.value}</p>
                      )}
                      {item.sub && <p className="text-steel text-xs mt-0.5">{item.sub}</p>}
                    </div>
                  </address>
                ))}
              </div>


            </div>

            {/* Right column, form */}
            <div className="flex flex-col gap-8">
              <header className="flex flex-col gap-3">
                <h2
                  id="contact-form-heading"
                  className="text-wake text-2xl sm:text-3xl font-bold tracking-tight"
                >
                  Request a <span className="chrome-text">Free Quote</span>
                </h2>
                <p className="text-steel text-sm leading-relaxed max-w-lg">
                  Tell us about your vessel and what you&apos;re looking for. The more detail you
                  provide, the more accurate and useful your estimate will be.
                </p>
                <p className="text-steel text-xs tracking-wide mt-1">
                  Most quotes returned same day. No obligation, no pressure.
                </p>
                <hr className="accent-rule w-32" />
              </header>

              <div className="border border-steel-dark p-6 sm:p-10">
                <QuoteForm
                  formId="contact-quote-form"
                  showReferral={true}
                />
              </div>

            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section
          aria-labelledby="faq-heading"
          className="py-24 px-6 border-t border-steel-dark"
        >
          <div className="max-w-3xl mx-auto flex flex-col gap-10">
            <header className="flex flex-col items-center text-center gap-4">
              <p className="text-steel text-[10px] tracking-[0.4em] uppercase">Common Questions</p>
              <h2
                id="faq-heading"
                className="text-wake text-3xl font-bold tracking-tight"
              >
                Before You Reach Out
              </h2>
              <hr className="accent-rule w-32" />
            </header>

            <dl className="flex flex-col gap-px bg-steel-dark">
              {[
                {
                  q: "How quickly can you schedule a service?",
                  a: "Most standard detailing and maintenance jobs can be scheduled within 3–5 business days. Ceramic coating and larger packages typically require 5–10 days lead time depending on vessel size and current bookings.",
                },
                {
                  q: "Do you service boats at the marina or do I bring it to you?",
                  a: "We come to your vessel at your marina, boatyard, or private slip throughout the Jacksonville area. There is no need to move your boat unless a haul-out is required for the service (e.g., gel coat restoration or hull work).",
                },
                {
                  q: "What vessels are too large or too small for your services?",
                  a: "We service boats from 18 feet to 80+ feet. Our yacht management and ceramic coating services are particularly well-suited to vessels from 28 feet and above, but we evaluate every inquiry individually.",
                },
                {
                  q: "Are your products safe for fiberglass, painted hulls, and teak?",
                  a: "Yes. We always assess the substrate type before selecting products. Every surface is evaluated to identify and protect painted hulls, varnished teak, vinyl faux-teak, and factory gelcoat finishes.",
                },
                {
                  q: "How does the monthly maintenance plan billing work?",
                  a: "We never lock you into a contract. Plans are billed on a recurring basis with a rate and schedule agreed upon upfront. Adjustments are handled with direct communication.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="bg-obsidian p-7 hover:bg-[#040408] transition-colors duration-200">
                  <dt className="text-wake text-sm font-semibold mb-2.5">{q}</dt>
                  <dd className="text-steel text-xs leading-relaxed">{a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
