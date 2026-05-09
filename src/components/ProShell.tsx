"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "@/app/actions";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { clientConfig } from "@/config/client";

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
    href: "/pro/calls",
    label: "Calls",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l.87-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    href: "/pro/calendar",
    label: "Calendar",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
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
    label: "Site Editor",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    href: "/pro/release-notes",
    label: "Release Notes",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
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
  const [userName, setUserName] = useState(
    () => (typeof window !== "undefined" && localStorage.getItem("pro-user-name")) || ""
  );
  const [userEmail, setUserEmail] = useState(
    () => (typeof window !== "undefined" && localStorage.getItem("pro-user-email")) || ""
  );
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("sidebar-collapsed") === "true"
  );

  useEffect(() => {
    const supabase = createBrowserSupabase();
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? "";
      const meta = (data.user?.user_metadata ?? {}) as Record<string, string>;
      const name = parseName(email, meta);
      setUserName(name);
      setUserEmail(email);
      localStorage.setItem("pro-user-name", name);
      localStorage.setItem("pro-user-email", email);
    });
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar-collapsed", String(!prev));
      return !prev;
    });
  }

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* ── Sidebar ── */}
      <aside className={`hidden md:flex ${collapsed ? "w-14" : "w-60"} shrink-0 flex-col bg-[#06061a] sticky top-0 h-screen transition-all duration-200 ${collapsed ? "overflow-visible" : "overflow-hidden"}`}>

        {/* Logo */}
        <div className="px-3 py-5 border-b border-white/[0.07] flex items-center justify-center">
          <Link href="/pro/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-[#000080] flex items-center justify-center shrink-0">
              <Image
                src={clientConfig.logoWhiteSvg}
                alt={clientConfig.companyName}
                width={22}
                height={22}
                className="w-5 h-5 opacity-90"
              />
            </div>
            {!collapsed && (
              <div className="leading-none">
                <p className="text-white text-[11px] font-bold tracking-wide">{clientConfig.companyShortName}</p>
                <p className="text-white/35 text-[9px] tracking-[0.3em] uppercase mt-0.5">Marine Pro</p>
              </div>
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5" aria-label="Pro portal">
          {navLinks.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`group/navitem relative flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-medium transition-colors duration-150 ${
                  collapsed ? "justify-center" : ""
                } ${
                  active
                    ? "bg-[#000080] text-white"
                    : "text-white/45 hover:text-white/80 hover:bg-white/[0.05]"
                }`}
              >
                <span className="shrink-0">{icon}</span>
                {!collapsed && label}
                {collapsed && (
                  <span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap bg-[#1a1a3a] text-white text-[11px] font-medium px-2.5 py-1.5 rounded-sm border border-white/10 opacity-0 group-hover/navitem:opacity-100 transition-opacity duration-150 shadow-lg">
                    {label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="px-2 pb-2">
          <button
            onClick={toggle}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`w-full flex items-center gap-3 px-3 py-2 text-white/25 hover:text-white/60 text-xs transition-colors duration-150 rounded-sm hover:bg-white/[0.04] ${collapsed ? "justify-center" : ""}`}
          >
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
              className={`shrink-0 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>

        {/* User + sign out */}
        <div className="px-2 pb-4 border-t border-white/[0.07] pt-4 flex flex-col gap-1">
          <div className={`group/useravatar relative flex items-center gap-2.5 px-3 py-2 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-7 h-7 rounded-full bg-[#000080] flex items-center justify-center shrink-0">
              {collapsed && (
                <span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap bg-[#1a1a3a] text-white text-[11px] font-medium px-2.5 py-1.5 rounded-sm border border-white/10 opacity-0 group-hover/useravatar:opacity-100 transition-opacity duration-150 shadow-lg">
                  {userName}
                </span>
              )}
              {userName && <span className="text-white text-[10px] font-bold" suppressHydrationWarning>{userName.charAt(0)}</span>}
            </div>
            {!collapsed && (
              <div className="leading-none min-w-0">
                <p className="text-white/80 text-[11px] font-semibold truncate" suppressHydrationWarning>{userName}</p>
                <p className="text-white/30 text-[9px] truncate mt-0.5" suppressHydrationWarning>{userEmail || clientConfig.email}</p>
              </div>
            )}
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className={`group/signout relative w-full flex items-center gap-3 px-3 py-2 text-white/35 hover:text-white/70 text-xs transition-colors duration-150 rounded-sm hover:bg-white/[0.04] ${collapsed ? "justify-center" : ""}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {!collapsed && "Sign Out"}
              {collapsed && (
                <span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap bg-[#1a1a3a] text-white text-[11px] font-medium px-2.5 py-1.5 rounded-sm border border-white/10 opacity-0 group-hover/signout:opacity-100 transition-opacity duration-150 shadow-lg">
                  Sign Out
                </span>
              )}
            </button>
          </form>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 bg-[#06061a] border-b border-white/[0.07] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#000080] flex items-center justify-center">
            <Image src={clientConfig.logoWhiteSvg} alt={clientConfig.companyName} width={16} height={16} className="opacity-90" />
          </div>
          <p className="text-white text-xs font-bold tracking-wide">{clientConfig.proPortalName}</p>
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
