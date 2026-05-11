"use client";

import Link from "next/link";
import Image from "next/image";
import { trackNavClick, trackCtaClick, trackPhoneClick, trackEmailClick } from "@/lib/analytics";
import { clientConfig } from "@/config/client";

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

      {/* ── Single compact footer row ── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex flex-wrap items-center gap-x-10 gap-y-4 justify-between">

        {/* Logo */}
        <Link href="/" aria-label={`${clientConfig.companyName}, home`} className="shrink-0">
          <Image
            src={clientConfig.logoWhiteSvg}
            alt={clientConfig.companyName}
            width={36}
            height={36}
            className="h-9 w-auto"
          />
        </Link>

        {/* Nav */}
        <nav aria-label="Footer site navigation">
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 list-none">
            {navLinks.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => trackNavClick(label, href, "footer")}
                  className="text-steel text-xs hover:text-wake transition-colors duration-200"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contact inline */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <a
            href={`tel:${clientConfig.phoneE164}`}
            onClick={() => trackPhoneClick("footer")}
            className="text-steel text-xs hover:text-wake transition-colors duration-200"
          >
            {clientConfig.phone}
          </a>
          <a
            href={`mailto:${clientConfig.email}`}
            onClick={() => trackEmailClick("footer")}
            className="text-steel text-xs hover:text-wake transition-colors duration-200"
          >
            {clientConfig.email}
          </a>
        </div>

        {/* Get a Quote CTA */}
        <Link
          href="/contact"
          onClick={() => trackCtaClick("Get a Quote", "footer")}
          className="chrome-btn font-bold text-xs tracking-[0.25em] uppercase px-6 py-2.5 transition-all duration-300 hover:scale-105 shrink-0"
        >
          Get a Quote
        </Link>

      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-steel-dark px-6 lg:px-10 py-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 max-w-7xl mx-auto w-full">
        <p className="text-steel text-xs tracking-wide">
          © {new Date().getFullYear()} {clientConfig.companyName}. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="text-steel hover:text-wake transition-colors duration-200 tracking-[0.15em] uppercase text-xs">Terms</Link>
          <Link href="/privacy-policy" className="text-steel hover:text-wake transition-colors duration-200 tracking-[0.15em] uppercase text-xs">Privacy</Link>
          <Link
            href="/pro"
            className="flex items-center gap-1.5 border border-steel-dark px-3 py-1 text-steel hover:border-navy hover:text-wake transition-colors duration-300 tracking-[0.2em] uppercase text-xs"
          >
            <span aria-hidden="true" className="text-navy text-[9px]">◈</span>
            {clientConfig.proPortalName}
          </Link>
        </div>
        <p className="text-steel text-xs tracking-wide hidden sm:block">{clientConfig.footerTagline}</p>
      </div>

    </footer>
  );
}
