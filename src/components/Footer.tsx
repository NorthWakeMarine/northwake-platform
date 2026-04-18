import Link from "next/link";
import Image from "next/image";

const navLinks = [
  { label: "Home",     href: "/"         },
  { label: "Services", href: "/services" },
  { label: "About",    href: "/about"    },
  { label: "Socials",  href: "/socials"  },
  { label: "Contact",  href: "/contact"  },
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
              Tell us about your boat and we&apos;ll put together a detailed,
              no-obligation quote.
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
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14 flex flex-col sm:flex-row gap-12 sm:gap-0 sm:justify-between">
        {/* Brand */}
        <div className="flex flex-col gap-4 sm:w-56">
          <Link href="/" className="w-fit">
            <Image
              src="/brand/nwmlogowhite.svg"
              alt="NorthWake Marine"
              width={160}
              height={48}
              className="h-12 w-auto"
            />
          </Link>
          <p className="text-steel text-xs leading-relaxed max-w-xs">
            Yacht management, expert detailing, ceramic coating, and full vessel
            services on the St. Johns River. Jacksonville&apos;s premier marine company.
          </p>
        </div>

        {/* Navigation */}
        <nav aria-label="Footer site navigation" className="flex flex-col items-center">
          <p className="text-steel text-[9px] tracking-[0.35em] uppercase mb-5">Navigation</p>
          <ul className="flex flex-row flex-wrap gap-x-6 gap-y-2 list-none justify-center">
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

        {/* Contact */}
        <address className="flex flex-col gap-3 not-italic sm:w-48">
          <p className="text-steel text-[9px] tracking-[0.35em] uppercase mb-2">Contact</p>
          <a
            href="tel:+19046065454"
            className="text-steel-light text-xs hover:text-wake transition-colors duration-200"
          >
            (904) 606-5454
          </a>
          <a
            href="mailto:info@northwakemarine.com"
            className="text-steel-light text-xs hover:text-wake transition-colors duration-200"
          >
            info@northwakemarine.com
          </a>
          <p className="text-steel text-xs">Jacksonville, FL</p>
        </address>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-steel-dark px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-steel tracking-wide max-w-7xl mx-auto w-full">
        <p>© {new Date().getFullYear()} NorthWake Marine. All rights reserved.</p>
        <Link
          href="/pro"
          className="flex items-center gap-2 border border-steel-dark px-4 py-1.5 text-steel hover:border-navy hover:text-wake transition-colors duration-300 tracking-[0.2em] uppercase text-[9px]"
        >
          <span aria-hidden="true" className="text-navy text-[7px]">◈</span>
          NorthWakePro
        </Link>
        <p>Premium Marine Services · Jacksonville, FL</p>
      </div>
    </footer>
  );
}
