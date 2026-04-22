import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import ProShell from "@/components/ProShell";
import NoteForm from "./NoteForm";
import CopyWaiverLink from "./CopyWaiverLink";
import FleetGallery, { type Asset } from "./FleetGallery";
import LinkedContacts, { type LinkedContact } from "./LinkedContacts";

type Contact = {
  id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  vessel_type: string | null;
  vessel_length: string | null;
  waiver_signed: boolean | null;
  status: string | null;
  source: string | null;
};

type TimelineEvent = {
  id: string;
  created_at: string;
  event_type: string;
  title: string | null;
  body: string | null;
  created_by: string | null;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function fmtFull(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

const eventConfig: Record<string, { dot: string; label: string }> = {
  lead_created:            { dot: "bg-blue-500",    label: "Lead Created" },
  form_submission:         { dot: "bg-blue-400",    label: "Form Submitted" },
  note:                    { dot: "bg-slate-400",   label: "Note" },
  call:                    { dot: "bg-purple-500",  label: "Call" },
  waiver_signed:           { dot: "bg-emerald-500", label: "Waiver Signed" },
  invoice:                 { dot: "bg-amber-500",   label: "Invoice" },
  lead_converted:          { dot: "bg-emerald-600", label: "Converted to Client" },
  web_lead:                { dot: "bg-blue-300",    label: "Web Lead Merged" },
  appointment_scheduled:   { dot: "bg-indigo-500",  label: "Appointment Scheduled" },
  calendar_discrepancy:    { dot: "bg-red-400",     label: "Calendar Discrepancy" },
};

function EventDot({ type }: { type: string }) {
  const cfg = eventConfig[type] ?? { dot: "bg-slate-300" };
  return <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 ${cfg.dot}`} />;
}

function EventLabel({ type }: { type: string }) {
  return (eventConfig[type] ?? { label: type }).label;
}

type HealthItem = { label: string; ok: boolean };

function HealthCheck({ contact, assetCount }: { contact: Contact; assetCount: number }) {
  const checks: HealthItem[] = [
    { label: "Email",         ok: !!contact.email },
    { label: "Phone",         ok: !!contact.phone },
    { label: "Fleet on File", ok: assetCount > 0 },
    { label: "Waiver Signed", ok: !!contact.waiver_signed },
  ];
  const allOk = checks.every((c) => c.ok);

  return (
    <div className="bg-white border border-slate-200 rounded-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-slate-800 text-sm font-semibold">Health Check</h3>
        {allOk ? (
          <span className="text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-sm font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">Complete</span>
        ) : (
          <span className="text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-sm font-medium bg-amber-50 text-amber-600 border border-amber-200">Incomplete</span>
        )}
      </div>
      <ul className="flex flex-col gap-1.5">
        {checks.map((c) => (
          <li key={c.label} className="flex items-center gap-2 text-xs">
            {c.ok ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 shrink-0">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400 shrink-0">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
            <span className={c.ok ? "text-slate-600" : "text-red-500 font-medium"}>{c.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function ContactProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const [
    { data: contact },
    { data: events },
    { data: rawVessels },
    { data: rawLinked },
  ] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, created_at, name, email, phone, vessel_type, vessel_length, waiver_signed, status, source")
      .eq("id", id)
      .single(),
    supabase
      .from("timeline_events")
      .select("id, created_at, event_type, title, body, created_by")
      .eq("contact_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("vessels")
      .select("id, asset_type, name, make_model, year, color, length_ft, location, registration, notes, last_service_date, vessel_type")
      .eq("owner_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("linked_contacts")
      .select("id, name, phone, email, relationship, authorized_to_approve")
      .eq("primary_contact_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!contact) notFound();

  const assets: Asset[]           = (rawVessels ?? []) as Asset[];
  const linkedContacts: LinkedContact[] = (rawLinked ?? []) as LinkedContact[];

  return (
    <ProShell>
      <div className="flex-1 flex flex-col">

        {/* Top bar */}
        <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center gap-4">
          <Link
            href="/pro/contacts"
            className="text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1.5 text-xs shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Contacts
          </Link>
          <span className="text-slate-200 text-xs">/</span>
          <h1 className="text-slate-900 text-xl font-bold tracking-tight truncate flex-1">
            {contact.name || contact.email || "Unknown Contact"}
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            <button
              disabled
              title="Coming soon"
              className="border border-slate-200 text-slate-400 text-[10px] tracking-widest uppercase px-4 py-2 rounded-sm cursor-not-allowed font-medium"
            >
              Create Invoice
            </button>
            <button
              disabled
              title="Coming soon"
              className="border border-slate-200 text-slate-400 text-[10px] tracking-widest uppercase px-4 py-2 rounded-sm cursor-not-allowed font-medium"
            >
              Log Call
            </button>
          </div>
        </div>

        {/* Waiver missing banner */}
        {!contact.waiver_signed && (
          <div className="bg-amber-50 border-b border-amber-200 px-8 py-3 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <p className="text-amber-800 text-xs font-bold tracking-wide uppercase">Action Required: Liability Waiver Missing</p>
                <p className="text-amber-700 text-[11px] mt-0.5">This contact has not signed the liability waiver. Send them the link below to complete it.</p>
              </div>
            </div>
            <CopyWaiverLink contactId={contact.id} />
          </div>
        )}

        <div className="flex-1 px-8 py-6 flex flex-col gap-5">

          {/* Fleet Gallery — full width */}
          <FleetGallery contactId={contact.id} assets={assets} />

          {/* Main two-column grid */}
          <div className="grid lg:grid-cols-3 gap-5">

            {/* Left column */}
            <div className="flex flex-col gap-4">

              <HealthCheck contact={contact} assetCount={assets.length} />

              {/* Contact details */}
              <div className="bg-white border border-slate-200 rounded-sm p-5 flex flex-col gap-4">
                <h3 className="text-slate-800 text-sm font-semibold">Contact Details</h3>
                <dl className="flex flex-col gap-3 text-xs">
                  <div>
                    <dt className="text-slate-400 text-[10px] tracking-widest uppercase font-medium mb-0.5">Email</dt>
                    <dd className="text-slate-700">
                      {contact.email
                        ? <a href={`mailto:${contact.email}`} className="hover:text-blue-600 transition-colors">{contact.email}</a>
                        : <span className="text-slate-300">Not provided</span>}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-[10px] tracking-widest uppercase font-medium mb-0.5">Phone</dt>
                    <dd className="text-slate-700">
                      {contact.phone
                        ? <a href={`tel:${contact.phone}`} className="hover:text-blue-600 transition-colors">{contact.phone}</a>
                        : <span className="text-slate-300">Not provided</span>}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-[10px] tracking-widest uppercase font-medium mb-0.5">Waiver</dt>
                    <dd>
                      {contact.waiver_signed ? (
                        <span className="text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-sm font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">Signed</span>
                      ) : (
                        <span className="text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-sm font-medium bg-red-50 text-red-600 border border-red-200">Pending</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-[10px] tracking-widest uppercase font-medium mb-0.5">Status</dt>
                    <dd className="text-slate-700 capitalize">{contact.status || "lead"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-[10px] tracking-widest uppercase font-medium mb-0.5">Source</dt>
                    <dd className="text-slate-700 capitalize">{contact.source || "website"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-[10px] tracking-widest uppercase font-medium mb-0.5">Created</dt>
                    <dd className="text-slate-700">{fmt(contact.created_at)}</dd>
                  </div>
                </dl>
              </div>

              {/* Household */}
              <LinkedContacts contactId={contact.id} linkedContacts={linkedContacts} />

            </div>

            {/* Right column */}
            <div className="lg:col-span-2 flex flex-col gap-4">

              <div className="bg-white border border-slate-200 rounded-sm p-5 flex flex-col gap-3">
                <h3 className="text-slate-800 text-sm font-semibold">Add Note</h3>
                <NoteForm contactId={contact.id} />
              </div>

              <div className="bg-white border border-slate-200 rounded-sm flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-slate-800 text-sm font-semibold">Activity Timeline</h3>
                  <span className="text-slate-400 text-[11px]">{(events ?? []).length} events</span>
                </div>

                {!events || events.length === 0 ? (
                  <p className="text-slate-400 text-sm px-6 py-8">No activity yet.</p>
                ) : (
                  <ul className="px-6 py-4 flex flex-col gap-0">
                    {(events as TimelineEvent[]).map((ev, i) => (
                      <li key={ev.id} className="flex gap-4 relative">
                        {i < events.length - 1 && (
                          <div className="absolute left-[5px] top-4 bottom-0 w-px bg-slate-100" />
                        )}
                        <div className="pt-0.5 shrink-0">
                          <EventDot type={ev.event_type} />
                        </div>
                        <div className="pb-5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-slate-700 text-xs font-medium">
                              <EventLabel type={ev.event_type} />
                            </span>
                            {ev.title && !["Lead created", "Note added", "New form submission"].includes(ev.title) && (
                              <span className="text-slate-500 text-xs">{ev.title}</span>
                            )}
                            <span className="text-slate-300 text-[10px] ml-auto whitespace-nowrap">{fmtFull(ev.created_at)}</span>
                          </div>
                          {ev.body && (
                            <p className="text-slate-500 text-xs mt-1 leading-relaxed">{ev.body}</p>
                          )}
                          {ev.created_by && ev.created_by !== "system" && (
                            <p className="text-slate-300 text-[10px] mt-0.5">by {ev.created_by}</p>
                          )}
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
