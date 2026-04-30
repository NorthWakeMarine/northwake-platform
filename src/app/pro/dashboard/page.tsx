import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import ProShell from "@/components/ProShell";
import LeadStatCard from "./LeadStatCard";
import type { CalendarEvent } from "@/lib/google-calendar";

type Lead = {
  id: string;
  created_at: string;
  name: string | null;
  email: string;
  phone: string | null;
  vessel_type: string | null;
  service: string | null;
  source: string | null;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

function startOfYear() {
  return new Date(new Date().getFullYear(), 0, 1).toISOString();
}

function ninetyDaysAgo() {
  return new Date(new Date().getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
}

function currentTimestamp() {
  return new Date().getTime();
}

function parseName(email: string, meta: Record<string, string> = {}) {
  const raw = meta?.full_name || meta?.name || email.split("@")[0] || "Admin";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}


async function fetchUpcomingEvents(): Promise<CalendarEvent[]> {
  try {
    const { listUpcomingEvents } = await import("@/lib/google-calendar");
    return await listUpcomingEvents(7);
  } catch {
    return [];
  }
}

export default async function ProDashboardPage() {
  const supabase = await createServerSupabase();

  const ninetyDaysAgoIso = ninetyDaysAgo();

  const [
    { data: leads },
    { count: allCount },
    { count: monthCount },
    { count: yearCount },
    { data: calDiscrepancies },
    { data: calConflicts },
    { data: rawVessels },
    { data: activeContacts },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("id, created_at, name, email, phone, vessel_type, service, source")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth()),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfYear()),
    supabase
      .from("timeline_events")
      .select("id, contact_id, body, created_at")
      .eq("event_type", "calendar_discrepancy")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("system_flags")
      .select("id, message, reference_id, created_at")
      .eq("flag_type", "scheduling_conflict")
      .eq("resolved", false)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("vessels")
      .select("id, last_service_date, service_interval_days"),
    supabase
      .from("timeline_events")
      .select("contact_id")
      .gte("created_at", ninetyDaysAgoIso),
  ]);

  const upcomingEvents = await fetchUpcomingEvents();

  const { data: { user } } = await supabase.auth.getUser();
  const userName = parseName(
    user?.email ?? "",
    (user?.user_metadata ?? {}) as Record<string, string>
  );

  const now = currentTimestamp();
  const overdueCount = (rawVessels ?? []).filter((v) => {
    if (!v.last_service_date) return false;
    const interval = v.service_interval_days ?? 90;
    const daysSince = Math.floor((now - new Date(v.last_service_date).getTime()) / 86400000);
    return daysSince > interval;
  }).length;

  const recentContactIds = new Set((activeContacts ?? []).map((e: { contact_id: string }) => e.contact_id));
  const { data: allContactIds } = await supabase.from("contacts").select("id");
  const followUpCount = (allContactIds ?? []).filter((c: { id: string }) => !recentContactIds.has(c.id)).length;

  return (
    <ProShell>
      <div className="flex-1 flex flex-col">

        {/* Page header */}
        <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-slate-900 text-xl font-bold tracking-tight">Welcome back, {userName}.</h1>
            <p className="text-slate-400 text-xs mt-0.5">Here&apos;s what&apos;s happening at NorthWake Marine today.</p>
          </div>
          <p className="text-slate-400 text-xs hidden sm:block">{todayLabel()}</p>
        </div>

        <div className="flex-1 px-8 py-6 flex flex-col gap-6">

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            {/* New Leads with range toggle */}
            <LeadStatCard
              monthCount={monthCount ?? 0}
              yearCount={yearCount ?? 0}
              allCount={allCount ?? 0}
              monthLabel={new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}
              yearLabel={String(new Date().getFullYear())}
            />

            {/* Overdue Services */}
            <Link
              href="/pro/contacts"
              className={`bg-white border rounded-sm p-5 flex flex-col gap-3 hover:border-slate-300 transition-colors ${overdueCount > 0 ? "border-red-200" : "border-slate-200"}`}
            >
              <div className="flex items-start justify-between">
                <p className="text-slate-500 text-xs font-medium">Overdue Services</p>
                <div className={`w-9 h-9 rounded-sm flex items-center justify-center shrink-0 ${overdueCount > 0 ? "bg-red-50" : "bg-slate-100"}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={overdueCount > 0 ? "text-red-500" : "text-slate-400"}>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
              </div>
              <div>
                <p className={`text-3xl font-bold tracking-tight ${overdueCount > 0 ? "text-red-600" : "text-slate-900"}`}>{overdueCount}</p>
                <p className="text-slate-400 text-[11px] mt-1">Vessels past service interval</p>
              </div>
            </Link>

            {/* Follow-ups Due */}
            <Link
              href="/pro/contacts"
              className={`bg-white border rounded-sm p-5 flex flex-col gap-3 hover:border-slate-300 transition-colors ${followUpCount > 0 ? "border-amber-200" : "border-slate-200"}`}
            >
              <div className="flex items-start justify-between">
                <p className="text-slate-500 text-xs font-medium">Follow-ups Due</p>
                <div className={`w-9 h-9 rounded-sm flex items-center justify-center shrink-0 ${followUpCount > 0 ? "bg-amber-50" : "bg-slate-100"}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={followUpCount > 0 ? "text-amber-500" : "text-slate-400"}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
              </div>
              <div>
                <p className={`text-3xl font-bold tracking-tight ${followUpCount > 0 ? "text-amber-600" : "text-slate-900"}`}>{followUpCount}</p>
                <p className="text-slate-400 text-[11px] mt-1">No contact in 90+ days</p>
              </div>
            </Link>

            {/* Calendar — links to calendar page */}
            <Link
              href="/pro/calendar"
              className="bg-white border border-slate-200 rounded-sm p-5 flex flex-col gap-3 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <p className="text-slate-500 text-xs font-medium">On the Calendar</p>
                <div className="w-9 h-9 rounded-sm bg-purple-50 flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-slate-900 text-3xl font-bold tracking-tight">{upcomingEvents.length}</p>
                <p className="text-slate-400 text-[11px] mt-1">Events in the next 7 days</p>
              </div>
            </Link>
          </div>

          {/* Scheduling Conflict Flags */}
          {calConflicts && calConflicts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-sm p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-red-100 border border-red-300 flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div>
                  <p className="text-red-800 text-xs font-bold tracking-wide uppercase">
                    Scheduling {calConflicts.length === 1 ? "Conflict" : "Conflicts"} Detected
                  </p>
                  <p className="text-red-600 text-[11px] mt-0.5">
                    A Google Calendar move created {calConflicts.length === 1 ? "an overlap" : "overlaps"} with existing CRM appointments. Review below.
                  </p>
                </div>
              </div>
              <ul className="flex flex-col gap-2 pl-10">
                {(calConflicts as { id: string; message: string; reference_id: string }[]).map((f) => (
                  <li key={f.id} className="text-red-700 text-xs leading-snug">
                    {f.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Calendar Discrepancy Flags */}
          {calDiscrepancies && calDiscrepancies.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-sm p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-red-100 border border-red-300 flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <p className="text-red-800 text-xs font-bold tracking-wide uppercase">
                    Calendar {calDiscrepancies.length === 1 ? "Discrepancy" : "Discrepancies"} Detected
                  </p>
                  <p className="text-red-600 text-[11px] mt-0.5">
                    {calDiscrepancies.length} Google Calendar {calDiscrepancies.length === 1 ? "event was" : "events were"} moved or deleted outside the CRM. Review and reconcile below.
                  </p>
                </div>
              </div>
              <ul className="flex flex-col gap-2 pl-10">
                {calDiscrepancies.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-4 text-xs">
                    <p className="text-red-700 leading-snug">{d.body}</p>
                    <Link
                      href={`/pro/contacts/${d.contact_id}`}
                      className="text-[10px] tracking-widest uppercase text-red-500 hover:text-red-700 font-semibold whitespace-nowrap transition-colors"
                    >
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Bottom two-column layout */}
          <div className="grid lg:grid-cols-3 gap-4">

            {/* Recent Leads — wider */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-sm flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-slate-800 text-sm font-semibold">Recent Leads</h2>
                <Link href="/pro/contacts" className="text-[10px] tracking-widest uppercase text-blue-500 hover:text-blue-700 font-medium transition-colors">
                  View All
                </Link>
              </div>
              {!leads || leads.length === 0 ? (
                <p className="text-slate-400 text-sm px-6 py-8">No leads yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {["Date", "Name", "Vessel", "Service", "Source", ""].map((h) => (
                          <th key={h} className="text-left text-slate-400 text-[10px] tracking-widest uppercase font-medium py-3 px-4 first:pl-6 last:pr-6">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(leads as Lead[]).map((lead) => (
                        <tr key={lead.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                          <td className="py-3 px-4 first:pl-6 text-slate-400 whitespace-nowrap">{fmt(lead.created_at)}</td>
                          <td className="py-3 px-4 text-slate-800 font-medium whitespace-nowrap">
                            <div>{lead.name || "—"}</div>
                            <div className="text-slate-400 text-[10px] mt-0.5 font-normal">{lead.email}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{lead.vessel_type || "—"}</td>
                          <td className="py-3 px-4 text-slate-500">{lead.service || "—"}</td>
                          <td className="py-3 px-4">
                            {lead.source && (
                              <span className="text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-sm font-medium bg-slate-100 text-slate-500 border border-slate-200 whitespace-nowrap">
                                {lead.source}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 last:pr-6">
                            <Link
                              href={`/pro/leads/${lead.id}`}
                              className="text-[10px] tracking-widest uppercase text-blue-500 hover:text-blue-700 font-medium transition-colors opacity-0 group-hover:opacity-100 whitespace-nowrap"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right column — placeholders for future data */}
            <div className="flex flex-col gap-4">

              {/* Recent Calls — Dialpad */}
              <div className="bg-white border border-slate-200 rounded-sm flex flex-col flex-1">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-slate-800 text-sm font-semibold">Recent Calls</h2>
                  <span className="text-[9px] tracking-widest uppercase text-slate-300 border border-slate-200 px-2 py-0.5 rounded-sm">Dialpad</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 text-center gap-2">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.89 12 19.79 19.79 0 0 1 1.85 3.37 2 2 0 0 1 3.84 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l.93-.93a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <p className="text-slate-400 text-xs">Connect Dialpad to see call history and auto-fill contact info from inbound calls.</p>
                </div>
              </div>

              {/* Upcoming Jobs — Google Calendar (live) */}
              <div className="bg-white border border-slate-200 rounded-sm flex flex-col flex-1">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-slate-800 text-sm font-semibold">Upcoming Jobs</h2>
                  <Link
                    href="/pro/calendar"
                    className="text-[9px] tracking-widest uppercase text-blue-500 hover:text-blue-700 font-medium transition-colors"
                  >
                    View All
                  </Link>
                </div>
                {upcomingEvents.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 text-center gap-2">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <p className="text-slate-400 text-xs">No jobs scheduled in the next 7 days.</p>
                  </div>
                ) : (
                  <ul className="flex flex-col divide-y divide-slate-50">
                    {upcomingEvents.slice(0, 5).map((ev) => (
                      <li key={ev.id} className="px-5 py-3 flex gap-3 items-start">
                        <div className="w-1 h-full min-h-[2rem] rounded-full bg-[#000080] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-slate-800 text-xs font-semibold truncate">{ev.title}</p>
                          <p className="text-slate-400 text-[10px] mt-0.5">
                            {new Date(ev.start).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            {ev.start.includes("T") && (
                              <> &middot; {new Date(ev.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</>
                            )}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </ProShell>
  );
}
