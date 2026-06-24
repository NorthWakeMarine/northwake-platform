"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "@/app/actions";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { clientConfig } from "@/config/client";

type NavItem = {
  href: string;
  label: string;
  roles: string[];
  icon: React.ReactNode;
};

const allNavLinks: NavItem[] = [
  {
    href: "/pro/pipeline",
    label: "Pipeline",
    roles: ["admin"],
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: "/pro/vessels",
    label: "Vessels",
    roles: ["admin", "crew"],
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="3" />
        <line x1="12" y1="8" x2="12" y2="22" />
        <path d="M5 15H2a10 10 0 0 0 20 0h-3" />
      </svg>
    ),
  },
  {
    href: "/pro/leads",
    label: "Leads",
    roles: ["admin"],
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    href: "/pro/contacts",
    label: "Contacts",
    roles: ["admin", "crew"],
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
    roles: ["admin"],
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l.87-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    href: "/pro/calendar",
    label: "Calendar",
    roles: ["admin", "crew"],
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: "/pro/services",
    label: "Services",
    roles: ["admin"],
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    href: "/pro/integrations",
    label: "Integrations",
    roles: ["admin"],
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
    roles: ["admin"],
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
    roles: ["admin"],
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
  {
    href: "/pro/settings",
    label: "Settings",
    roles: ["admin"],
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

// Mobile bottom tab definitions (role-filtered at render time)
// Pinned bottom tabs: Pipeline, Calendar, Contacts (+ More for everything else)
const allBottomTabs = [
  {
    href: "/pro/pipeline",
    label: "Pipeline",
    roles: ["admin"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: "/pro/calendar",
    label: "Calendar",
    roles: ["admin", "crew"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: "/pro/contacts",
    label: "Contacts",
    roles: ["admin", "crew"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

// More drawer links (overflow menu on mobile)
const allMoreLinks = [
  { href: "/pro/leads",        label: "Leads",        roles: ["admin"] },
  { href: "/pro/calls",        label: "Calls",        roles: ["admin"] },
  { href: "/pro/vessels",      label: "Vessels",      roles: ["admin", "crew"] },
  { href: "/pro/services",     label: "Services",     roles: ["admin"] },
  { href: "/pro/integrations", label: "Integrations", roles: ["admin"] },
  { href: "/pro/editor",       label: "Site Editor",  roles: ["admin"] },
  { href: "/pro/settings",     label: "Settings",     roles: ["admin"] },
  { href: "/pro/release-notes",label: "Release Notes",roles: ["admin"] },
];

function parseName(email: string, meta: Record<string, string>) {
  const raw = meta?.full_name || meta?.name || email.split("@")[0] || "Admin";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  crew: "Field Crew",
};

export default function ProShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userName, setUserName] = useState(
    () => (typeof window !== "undefined" && localStorage.getItem("pro-user-name")) || ""
  );
  const [userEmail, setUserEmail] = useState(
    () => (typeof window !== "undefined" && localStorage.getItem("pro-user-email")) || ""
  );
  const [userRole, setUserRole] = useState(
    () => (typeof window !== "undefined" && localStorage.getItem("pro-user-role")) || "admin"
  );
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("sidebar-collapsed") === "true"
  );
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? "";
      const meta = (data.user?.user_metadata ?? {}) as Record<string, string>;
      const name = parseName(email, meta);
      const role = (data.user?.app_metadata?.role as string) ?? "admin";
      setUserName(name);
      setUserEmail(email);
      setUserRole(role);
      localStorage.setItem("pro-user-name", name);
      localStorage.setItem("pro-user-email", email);
      localStorage.setItem("pro-user-role", role);
    });
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar-collapsed", String(!prev));
      return !prev;
    });
  }

  const navLinks = allNavLinks.filter((l) => l.roles.includes(userRole));
  const bottomTabs = allBottomTabs.filter((l) => l.roles.includes(userRole));
  const moreLinks = allMoreLinks.filter((l) => l.roles.includes(userRole));

  return (
    <div className="pro-shell flex min-h-screen bg-[#F1F2F5]">

      {/* ── Sidebar ── */}
      <aside className={`hidden md:flex ${collapsed ? "w-14" : "w-60"} shrink-0 flex-col bg-[#06061a] sticky top-0 h-screen transition-all duration-200 z-10 ${collapsed ? "overflow-visible" : "overflow-hidden"}`}>

        {/* Logo */}
        <div className="px-3 py-5 border-b border-white/[0.07] flex items-center justify-center">
          <Link href={userRole === "crew" ? "/pro/contacts" : "/pro/pipeline"} className="flex items-center gap-3 min-w-0 group/logo">
            <Image
              src={clientConfig.logoWhiteSvg}
              alt={clientConfig.companyName}
              width={36}
              height={36}
              className="w-9 h-9 opacity-90 shrink-0"
            />
            {!collapsed && (
              <div className="leading-none">
                <p className="text-white text-[11px] font-bold tracking-[0.15em]">{clientConfig.companyShortName}</p>
                <p className="text-white/35 text-[9px] tracking-[0.3em] uppercase mt-0.5">Marine Pro</p>
              </div>
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5" aria-label="Pro portal">
          {navLinks.map(({ href, label, icon }) => {
            const active = pathname === href || (href !== "/pro/pipeline" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                style={
                  active
                    ? { boxShadow: "inset 0 0 22px rgba(80, 100, 255, 0.18), 0 0 0 1px rgba(160, 163, 166, 0.08)" }
                    : undefined
                }
                className={`group/navitem relative flex items-center gap-3 px-3 py-2 rounded-sm text-xs font-medium transition-colors duration-150 ${
                  collapsed ? "justify-center" : ""
                } ${
                  active
                    ? "bg-[#000080]/90 text-white border-l-2 border-white/60 pl-[10px]"
                    : "text-white/45 hover:text-white/80 hover:bg-white/[0.05] border-l-2 border-transparent pl-[10px]"
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
            <div
              className="w-7 h-7 rounded-full bg-[#000080] flex items-center justify-center shrink-0"
              style={{ boxShadow: "inset 0 0 0 1px rgba(160, 163, 166, 0.4)" }}
            >
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
                <p className="text-white/30 text-[9px] truncate mt-0.5" suppressHydrationWarning>
                  {ROLE_LABELS[userRole] ?? "Admin"}
                </p>
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

      {/* ── Mobile bottom tab bar ── */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#06061a] border-t border-white/[0.07] pb-[env(safe-area-inset-bottom)]">

        {/* More drawer */}
        {moreOpen && moreLinks.length > 0 && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
            <div className="relative z-50 bg-[#06061a] border-t border-white/[0.07] py-1">
              {moreLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-4 px-6 py-4 transition-colors ${
                    pathname.startsWith(href)
                      ? "text-white bg-[#000080]/30"
                      : "text-white/60 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <span className="text-base font-medium">{label}</span>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Tab bar */}
        <div className="flex h-16">
          {bottomTabs.map(({ href, label, icon }) => {
            const active = href === "/pro/pipeline" ? pathname === href || pathname.startsWith("/pro/pipeline") : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                  active ? "text-white" : "text-white/35"
                }`}
              >
                {icon}
                <span className="text-[9px] tracking-widest uppercase font-semibold">{label}</span>
              </Link>
            );
          })}
          {moreLinks.length > 0 && (
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                moreOpen ? "text-white" : "text-white/35"
              }`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
              </svg>
              <span className="text-[9px] tracking-widest uppercase font-semibold">More</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 pt-[env(safe-area-inset-top)] md:pt-0 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </div>

    </div>
  );
}
