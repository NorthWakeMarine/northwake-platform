"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "@/app/actions";
import { createBrowserSupabase } from "@/lib/supabase/client";

const navLinks = [
  {
    href: "/pro/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: "/pro/leads",
    label: "Leads",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    href: "/pro/contacts",
    label: "Contacts",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/pro/integrations",
    label: "Integrations",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  {
    href: "/pro/editor",
    label: "CMS Editor",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
];

function parseName(email: string, meta: Record<string, string>) {
  const raw = meta?.full_name || meta?.name || email.split("@")[0] || "Admin";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export default function ProShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userName, setUserName] = useState("Admin");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const supabase = createBrowserSupabase();
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? "";
      const meta = (data.user?.user_metadata ?? {}) as Record<string, string>;
      setUserName(parseName(email, meta));
      setUserEmail(email);
    });
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* ── Sidebar ── */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-[#06061a] sticky top-0 h-screen">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/[0.07]">
          <Link href="/pro/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#000080] flex items-center justify-center shrink-0">
              <Image
                src="/brand/nwmlogowhite.svg"
                alt="NorthWake Marine"
                width={22}
                height={22}
                className="w-5 h-5 opacity-90"
              />
            </div>
            <div className="leading-none">
              <p className="text-white text-[11px] font-bold tracking-wide">NorthWake</p>
              <p className="text-white/35 text-[9px] tracking-[0.3em] uppercase mt-0.5">Marine Pro</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5" aria-label="Pro portal">
          {navLinks.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-medium transition-colors duration-150 ${
                  active
                    ? "bg-[#000080] text-white"
                    : "text-white/45 hover:text-white/80 hover:bg-white/[0.05]"
                }`}
              >
                <span className="shrink-0">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User + sign out */}
        <div className="px-3 pb-4 border-t border-white/[0.07] pt-4 flex flex-col gap-1">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-[#000080] flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-bold">{userName.charAt(0)}</span>
            </div>
            <div className="leading-none min-w-0">
              <p className="text-white/80 text-[11px] font-semibold truncate">{userName}</p>
              <p className="text-white/30 text-[9px] truncate mt-0.5">{userEmail || "northwakemarine.com"}</p>
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 text-white/35 hover:text-white/70 text-xs transition-colors duration-150 rounded-sm hover:bg-white/[0.04]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 bg-[#06061a] border-b border-white/[0.07] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#000080] flex items-center justify-center">
            <Image src="/brand/nwmlogowhite.svg" alt="NorthWake Marine" width={16} height={16} className="opacity-90" />
          </div>
          <p className="text-white text-xs font-bold tracking-wide">NorthWake Pro</p>
        </div>
        <nav className="flex gap-1">
          {navLinks.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={`text-[9px] tracking-widest uppercase px-2.5 py-1.5 transition-colors ${
                  active ? "text-white bg-[#000080]" : "text-white/40 hover:text-white"
                }`}
              >
                {label.split(" ")[0]}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 md:pt-0 pt-12">
        {children}
      </div>

    </div>
  );
}
