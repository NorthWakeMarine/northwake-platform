"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions";

const navLinks = [
  { href: "/pro/dashboard",    label: "Leads"        },
  { href: "/pro/contacts",     label: "Contacts"     },
  { href: "/pro/integrations", label: "Integrations" },
  { href: "/pro/editor",       label: "CMS Editor"   },
];

export default function ProNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-steel-dark bg-obsidian sticky top-0 z-40">
      <div className="px-6 lg:px-10 py-3 flex items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span aria-hidden="true" className="chrome-text text-base">◈</span>
          <div>
            <p className="text-steel text-[8px] tracking-[0.35em] uppercase leading-none">NorthWake Marine</p>
            <p className="text-wake text-[11px] font-bold tracking-widest uppercase leading-none mt-0.5">Pro</p>
          </div>
        </div>

        {/* Nav links */}
        <nav aria-label="Pro portal navigation" className="hidden sm:flex items-center gap-1">
          {navLinks.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`text-[10px] tracking-[0.25em] uppercase px-3.5 py-2 transition-colors duration-200 ${
                  active
                    ? "text-wake border-b border-navy"
                    : "text-steel hover:text-wake"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <form action={signOut} className="shrink-0">
          <button
            type="submit"
            className="border border-steel-dark text-steel text-[9px] tracking-[0.25em] uppercase px-3.5 py-1.5 hover:border-navy hover:text-wake transition-colors duration-200"
          >
            Sign Out
          </button>
        </form>
      </div>

      {/* Mobile nav */}
      <nav aria-label="Pro portal mobile navigation" className="sm:hidden flex overflow-x-auto border-t border-steel-dark/50">
        {navLinks.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`shrink-0 text-[9px] tracking-[0.2em] uppercase px-4 py-2.5 transition-colors duration-200 ${
                active ? "text-wake border-b border-navy" : "text-steel"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
