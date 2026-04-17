"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { label: "Home",     href: "/"         },
  { label: "Services", href: "/services" },
  { label: "About",    href: "/about"    },
  { label: "Socials",  href: "/socials"  },
  { label: "Contact",  href: "/contact"  },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-obsidian/90 backdrop-blur-md border-b border-steel-dark">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" aria-label="NorthWake Marine — home">
          <Image
            src="/brand/nwmlogowhite.svg"
            alt="NorthWake Marine"
            width={44}
            height={44}
            className="h-11 w-auto"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Primary navigation" className="hidden md:block">
          <ul className="flex items-center gap-8 text-xs text-steel-light tracking-[0.2em] uppercase list-none">
            {navLinks.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`transition-colors duration-200 hover:text-wake ${
                    pathname === href ? "text-wake border-b border-navy pb-0.5" : ""
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Desktop CTA */}
        <Link
          href="/contact"
          className="hidden md:inline-block chrome-btn text-[10px] font-bold tracking-[0.25em] uppercase px-5 py-2.5 transition-all duration-300 hover:scale-105"
        >
          Get a Quote
        </Link>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden flex flex-col gap-1.5 p-2 focus:outline-none"
        >
          <span
            className={`block h-px w-6 bg-wake transition-transform duration-300 ${open ? "translate-y-2.5 rotate-45" : ""}`}
          />
          <span
            className={`block h-px w-6 bg-wake transition-opacity duration-300 ${open ? "opacity-0" : ""}`}
          />
          <span
            className={`block h-px w-6 bg-wake transition-transform duration-300 ${open ? "-translate-y-2.5 -rotate-45" : ""}`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={`md:hidden overflow-hidden transition-all duration-300 border-t border-steel-dark ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav aria-label="Mobile navigation" className="bg-obsidian px-6 py-6 flex flex-col gap-5">
          {navLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`text-sm tracking-[0.2em] uppercase transition-colors duration-200 hover:text-wake ${
                pathname === href ? "text-wake" : "text-steel-light"
              }`}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="chrome-btn text-[10px] font-bold tracking-[0.25em] uppercase px-5 py-3 text-center mt-2 transition-all duration-300"
          >
            Get a Quote
          </Link>
        </nav>
      </div>
    </header>
  );
}
