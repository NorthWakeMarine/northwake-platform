import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingCTA from "@/components/FloatingCTA";
import QuoteForm from "@/components/QuoteForm";

export const metadata: Metadata = {
  title: "Contact NorthWake Marine — Get a Free Quote in Jacksonville, FL",
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
    title: "Contact NorthWake Marine | Free Quote — Jacksonville, FL",
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
    sub: "Mon–Fri 8am–6pm · Sat 9am–2pm",
  },
  {
    icon: "◈",
    label: "Email",
    value: "admin@northwakemarine.com",
    href: "mailto:admin@northwakemarine.com",
    sub: "We reply within one business day",
  },
  {
    icon: "◇",
    label: "Location",
    value: "Jacksonville, FL",
    href: null,
    sub: "St. Johns River Corridor & Surrounding Areas",
  },
];

export default function ContactPage() {
  return (
    <>
      <Header />
      <FloatingCTA />

      <main>
        {/* ── Hero strip ── */}
        <section
          aria-labelledby="contact-hero-heading"
          className="hero-grid relative pt-32 pb-16 px-6 overflow-hidden"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 60% 30%, rgba(0,0,128,0.2) 0%, transparent 70%)",
            }}
          />
          <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-5">
            <p className="text-steel text-[10px] tracking-[0.4em] uppercase">
              Free · No Obligation
            </p>
            <h1
              id="contact-hero-heading"
              className="text-wake text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight"
            >
              Let&apos;s Talk About<br />
              <span className="chrome-text">Your Vessel.</span>
            </h1>
            <p className="text-steel-light text-base max-w-xl leading-relaxed">
              Fill out the form below, give us a call, or send an email. We respond to every
              inquiry within one business day with a detailed, no-obligation estimate.
            </p>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 inset-x-0 h-20"
            style={{ background: "linear-gradient(to bottom, transparent, #000000)" }}
          />
        </section>

        {/* ── Main contact layout ── */}
        <section
          aria-labelledby="contact-form-heading"
          className="py-16 px-6 border-t border-steel-dark"
        >
          <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_1.6fr] gap-16 items-start">

            {/* Left column — contact info + map */}
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
                      <p className="text-steel text-xs mt-0.5">{item.sub}</p>
                    </div>
                  </address>
                ))}
              </div>

              {/* Hours */}
              <div className="border border-steel-dark p-6 flex flex-col gap-4">
                <p className="text-steel text-[9px] tracking-[0.35em] uppercase">Business Hours</p>
                <table className="w-full text-xs" aria-label="NorthWake Marine business hours">
                  <tbody className="divide-y divide-steel-dark">
                    {[
                      ["Monday – Friday", "8:00 AM – 6:00 PM"],
                      ["Saturday",        "9:00 AM – 2:00 PM"],
                      ["Sunday",          "By Appointment"],
                    ].map(([day, hours]) => (
                      <tr key={day}>
                        <td className="py-2.5 text-steel pr-4">{day}</td>
                        <td className="py-2.5 text-steel-light text-right">{hours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Google Maps embed — Jacksonville, FL */}
              <div className="border border-steel-dark overflow-hidden">
                <p className="text-steel text-[9px] tracking-[0.35em] uppercase px-4 py-3 border-b border-steel-dark">
                  Service Area — Jacksonville, FL
                </p>
                <iframe
                  title="NorthWake Marine service area map — Jacksonville, Florida"
                  aria-label="Google Maps showing Jacksonville, Florida, the primary service area for NorthWake Marine boat detailing and vessel management"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d220927.69745792906!2d-81.88149869999999!3d30.3321838!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88e5b716f1ceafeb%3A0xc3f21e5d32819f4!2sJacksonville%2C%20FL!5e0!3m2!1sen!2sus!4v1713366000000!5m2!1sen!2sus"
                  width="100%"
                  height="260"
                  style={{ border: 0, display: "block", filter: "grayscale(1) invert(0.9) contrast(0.85)" }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            {/* Right column — form */}
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
                <hr className="accent-rule w-32" />
              </header>

              <div className="border border-steel-dark p-6 sm:p-10">
                <QuoteForm
                  formId="contact-quote-form"
                  showReferral={true}
                />
              </div>

              {/* Trust badges */}
              <ul className="grid grid-cols-3 gap-px bg-steel-dark list-none text-center">
                {[
                  { icon: "◈", text: "Certified Technicians" },
                  { icon: "◉", text: "1-Day Response" },
                  { icon: "◇", text: "No Hidden Fees" },
                ].map((badge) => (
                  <li key={badge.text} className="bg-obsidian py-5 px-4 flex flex-col items-center gap-2">
                    <span aria-hidden="true" className="chrome-text text-xl">{badge.icon}</span>
                    <p className="text-steel text-[9px] tracking-[0.2em] uppercase leading-tight">{badge.text}</p>
                  </li>
                ))}
              </ul>
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
                  a: "Yes. We always assess the substrate type before selecting products. Our technicians are trained to identify and protect painted hulls, varnished teak, vinyl faux-teak, and factory gelcoat finishes.",
                },
                {
                  q: "How does the monthly maintenance plan billing work?",
                  a: "Monthly plans are billed in advance on a recurring basis. The rate is locked in for the term of your plan, and the schedule is agreed upon upfront. Adjustments are handled with direct communication — no auto-escalations.",
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
