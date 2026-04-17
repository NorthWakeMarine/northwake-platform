import Link from "next/link";

const navLinks = [
  { label: "Home",     href: "/"         },
  { label: "Services", href: "/services" },
  { label: "About",    href: "/about"    },
  { label: "Contact",  href: "/contact"  },
];

const services = [
  "Exterior Detailing",
  "Ceramic Coating",
  "Monthly Maintenance",
  "Yacht Management",
  "Marine Transport",
  "Gel Coat Restoration",
];

export default function Footer() {
  return (
    <footer className="border-t border-steel-dark bg-obsidian" role="contentinfo">

      {/* ── Get a Quote band ── */}
      <section
        aria-labelledby="footer-cta-heading"
        className="border-b border-steel-dark"
        style={{
          background: "linear-gradient(135deg, #000040 0%, #000080 50%, #000040 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-3 text-center md:text-left">
            <p className="text-steel-light text-[10px] tracking-[0.4em] uppercase">
              Free Estimate · No Obligation
            </p>
            <h2
              id="footer-cta-heading"
              className="text-wake text-2xl sm:text-3xl font-bold tracking-tight"
            >
              Ready to Elevate Your Vessel?
            </h2>
            <p className="text-steel-light text-sm max-w-md leading-relaxed">
              Tell us about your boat and we&apos;ll respond within one business day
              with a detailed, no-obligation quote.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            <Link
              href="/contact"
              className="chrome-btn font-bold text-xs tracking-[0.3em] uppercase px-9 py-4 transition-all duration-300 hover:scale-105 text-center"
            >
              Get a Free Quote
            </Link>
            <a
              href="tel:+19046065454"
              className="border border-steel text-steel-light text-xs font-semibold tracking-[0.3em] uppercase px-9 py-4 hover:border-wake hover:text-wake transition-colors duration-300 text-center"
            >
              Call (904) 606-5454
            </a>
          </div>
        </div>
      </section>

      {/* ── Main footer grid ── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
        {/* Brand */}
        <div className="flex flex-col gap-4 lg:col-span-1">
          <Link href="/" className="flex flex-col leading-none w-fit">
            <span className="text-wake text-base font-bold tracking-[0.2em] uppercase">NorthWake</span>
            <span className="text-steel text-[10px] tracking-[0.35em] uppercase">Marine</span>
          </Link>
          <p className="text-steel text-xs leading-relaxed max-w-xs">
            Jacksonville&apos;s premier marine services company. Expert detailing, ceramic
            coating, and vessel management on the St. Johns River since 2012.
          </p>
          <div className="flex gap-4 mt-1">
            <a
              href="https://www.instagram.com/northwakemarine"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="NorthWake Marine on Instagram"
              className="text-steel hover:text-wake transition-colors duration-200 text-xs tracking-widest uppercase"
            >
              IG
            </a>
            <a
              href="https://www.facebook.com/northwakemarine"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="NorthWake Marine on Facebook"
              className="text-steel hover:text-wake transition-colors duration-200 text-xs tracking-widest uppercase"
            >
              FB
            </a>
          </div>
        </div>

        {/* Navigation */}
        <nav aria-label="Footer site navigation">
          <p className="text-steel text-[9px] tracking-[0.35em] uppercase mb-5">Navigation</p>
          <ul className="flex flex-col gap-3 list-none">
            {navLinks.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-steel-light text-xs hover:text-wake transition-colors duration-200"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Services */}
        <nav aria-label="Footer services navigation">
          <p className="text-steel text-[9px] tracking-[0.35em] uppercase mb-5">Services</p>
          <ul className="flex flex-col gap-3 list-none">
            {services.map((s) => (
              <li key={s}>
                <Link
                  href={`/services#${s.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-steel-light text-xs hover:text-wake transition-colors duration-200"
                >
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contact */}
        <address className="flex flex-col gap-3 not-italic">
          <p className="text-steel text-[9px] tracking-[0.35em] uppercase mb-2">Contact</p>
          <a
            href="tel:+19046065454"
            className="text-steel-light text-xs hover:text-wake transition-colors duration-200"
          >
            (904) 606-5454
          </a>
          <a
            href="mailto:admin@northwakemarine.com"
            className="text-steel-light text-xs hover:text-wake transition-colors duration-200"
          >
            admin@northwakemarine.com
          </a>
          <p className="text-steel text-xs">Jacksonville, FL</p>
          <p className="text-steel text-xs leading-relaxed mt-1">
            Mon–Fri: 8:00 AM – 6:00 PM<br />
            Sat: 9:00 AM – 2:00 PM
          </p>
        </address>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-steel-dark px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-steel tracking-wide max-w-7xl mx-auto w-full">
        <p>© {new Date().getFullYear()} NorthWake Marine. All rights reserved.</p>
        <p>Premium Marine Services · Jacksonville, FL</p>
      </div>
    </footer>
  );
}
