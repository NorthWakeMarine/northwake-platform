export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import ProShell from "@/components/ProShell";
import VesselDetailClient from "./VesselDetailClient";
import type { VesselService } from "@/app/pro/contacts/[id]/FleetGallery";
import {
  getVesselCalendarEvents,
  getVesselRecurringLinks,
  type ContactCalendarEvent,
  type VesselRecurringLink,
} from "@/app/actions";

type VesselRow = {
  id: string;
  name: string | null;
  make_model: string | null;
  year: number | null;
  length_ft: string | null;
  color: string | null;
  asset_type: string | null;
  notes: string | null;
  owner_id: string | null;
  contacts: { id: string; name: string | null; phone: string | null } | null;
  vessel_services: VesselService[];
};

function fmtEventDate(iso: string): string {
  if (!iso.includes("T")) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric",
    });
  }
  const dt = new Date(iso);
  return (
    dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
    " · " + dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}

export default async function VesselDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { data: rawVessel } = await supabase
    .from("vessels")
    .select(`
      id, name, make_model, year, length_ft, color, asset_type, notes, owner_id,
      contacts!owner_id ( id, name, phone ),
      vessel_services ( id, vessel_id, service_name, interval_days, last_service_date, notifications_enabled, typical_price )
    `)
    .eq("id", id)
    .maybeSingle();

  if (!rawVessel) notFound();

  const vessel = rawVessel as unknown as VesselRow;

  const [calendarEvents, recurringLinks] = await Promise.all([
    getVesselCalendarEvents(id),
    getVesselRecurringLinks(id),
  ]);

  const now = new Date().toISOString();
  const upcoming = calendarEvents.filter((e) => e.end >= now);
  const past     = calendarEvents.filter((e) => e.end <  now).reverse();

  const vesselLabel = [vessel.year, vessel.make_model, vessel.length_ft ? `${vessel.length_ft.replace(/\s*ft\s*$/i, "")}ft` : null]
    .filter(Boolean).join(" ") || vessel.name || "Vessel";

  return (
    <ProShell>
      <div className="flex-1 flex flex-col min-h-0">

        {/* Header */}
        <div className="bg-[#eceef1] border-b border-[#dcdee3] px-4 md:px-8 py-4 md:py-5">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/pro/vessels" className="text-[10px] tracking-widest uppercase font-semibold text-slate-400 hover:text-slate-600 transition-colors">
              Vessels
            </Link>
            <span className="text-slate-300 text-xs">/</span>
            <span className="text-[10px] tracking-widest uppercase font-semibold text-slate-600 truncate">
              {vesselLabel}
            </span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[#1E2938] text-lg md:text-xl font-bold tracking-tight">{vesselLabel}</h1>
              {vessel.name && vessel.name !== vesselLabel && (
                <p className="text-slate-500 text-xs mt-0.5">{vessel.name}</p>
              )}
              {vessel.contacts && (
                <Link
                  href={`/pro/contacts/${vessel.contacts.id}`}
                  className="text-[11px] text-[#000080] hover:underline font-medium mt-1 inline-block"
                >
                  {vessel.contacts.name ?? "View Owner"}
                </Link>
              )}
            </div>
            {vessel.contacts && (
              <Link
                href={`/pro/contacts/${vessel.contacts.id}`}
                className="shrink-0 text-[9px] tracking-widest uppercase font-semibold text-[#000080] border border-[#000080]/30 px-3 py-1.5 rounded-sm hover:bg-[#000080]/5 transition-colors"
              >
                Open Contact
              </Link>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 flex flex-col gap-6 pb-24 md:pb-6">

          {/* Vessel detail row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Make / Model", value: vessel.make_model ?? "Unknown" },
              { label: "Year", value: vessel.year?.toString() ?? "Unknown" },
              { label: "Length", value: vessel.length_ft ? `${vessel.length_ft.replace(/\s*ft\s*$/i, "")} ft` : "Unknown" },
              { label: "Color", value: vessel.color ?? "Not set" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white border border-slate-100 rounded-sm px-4 py-3">
                <p className="text-[10px] tracking-widest uppercase text-slate-400 font-medium">{label}</p>
                <p className="text-slate-800 text-sm font-semibold mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Interactive sections */}
          <VesselDetailClient
            vesselId={id}
            contactId={vessel.contacts?.id ?? null}
            initialServices={vessel.vessel_services ?? []}
            initialRecurring={recurringLinks}
          />

          {/* Upcoming appointments */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] tracking-widest uppercase font-medium text-slate-400">
              Upcoming Appointments
            </p>
            {upcoming.length === 0 ? (
              <p className="text-slate-400 text-xs">No upcoming events linked to this vessel.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {upcoming.map((ev) => (
                  <div key={ev.id} className="bg-white border border-slate-100 rounded-sm px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800">{ev.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{fmtEventDate(ev.start)}</p>
                    {ev.location && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{ev.location}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past appointments */}
          {past.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-[10px] tracking-widest uppercase font-medium text-slate-400 list-none flex items-center gap-2 select-none">
                <svg
                  width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className="transition-transform group-open:rotate-90"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                {past.length} Past Appointment{past.length !== 1 ? "s" : ""}
              </summary>
              <div className="flex flex-col gap-2 mt-3">
                {past.map((ev) => (
                  <div key={ev.id} className="bg-white border border-slate-100 rounded-sm px-4 py-3 opacity-70">
                    <p className="text-sm font-semibold text-slate-700">{ev.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{fmtEventDate(ev.start)}</p>
                    {ev.location && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{ev.location}</p>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Vessel notes */}
          {vessel.notes && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] tracking-widest uppercase font-medium text-slate-400">Notes</p>
              <div className="bg-white border border-slate-100 rounded-sm px-4 py-3">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{vessel.notes}</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </ProShell>
  );
}
