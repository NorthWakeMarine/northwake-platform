export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import ProShell from "@/components/ProShell";
import ConvertButton from "./ConvertButton";
import AddToPipelineButton from "@/components/AddToPipelineButton";
import DeleteLeadButton from "../DeleteLeadButton";
import BlockLeadButton from "../BlockLeadButton";
import LeadNotesSection from "./LeadNotesSection";
import LeadFieldEditor from "./LeadFieldEditor";
import LeadSourceEditor from "./LeadSourceEditor";

type TimelineEvent = {
  id: string;
  created_at: string;
  event_type: string;
  title: string | null;
  body: string | null;
  created_by: string | null;
  metadata?: Record<string, string> | null;
};

type Contact = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  waiver_signed: boolean | null;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

function fmtFull(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

const sourceConfig: Record<string, { label: string; cls: string; description: string }> = {
  hero:        { label: "Website — Hero Form",    cls: "bg-blue-50 text-blue-700 border border-blue-200",    description: "Submitted via the quote form on the home page." },
  contact:     { label: "Website — Contact Form", cls: "bg-blue-50 text-blue-700 border border-blue-200",    description: "Submitted via the contact page quote form." },
  website:     { label: "Website Form",           cls: "bg-blue-50 text-blue-700 border border-blue-200",    description: "Submitted via the website." },
  waiver:      { label: "Liability Waiver",       cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", description: "Created when the liability waiver was signed." },
  api:         { label: "API Ingest",             cls: "bg-slate-100 text-slate-600 border border-slate-200", description: "Received via the universal ingest API." },
  quo:         { label: "Quo — Inbound Call",     cls: "bg-purple-50 text-purple-700 border border-purple-200", description: "Auto-created from an inbound call via Quo." },
  google_ads:  { label: "Google Ads",             cls: "bg-green-50 text-green-700 border border-green-200",  description: "Generated from a Google Ads lead form." },
  manual:           { label: "Manual Entry",           cls: "bg-amber-50 text-amber-700 border border-amber-200",  description: "Entered manually by the team." },
  service_reminder: { label: "Service Reminder",       cls: "bg-orange-50 text-orange-700 border border-orange-200", description: "Auto-created from an overdue service interval." },
};

const eventConfig: Record<string, { dot: string }> = {
  lead_created:    { dot: "bg-blue-500" },
  form_submission: { dot: "bg-blue-400" },
  note:            { dot: "bg-slate-400" },
  call:            { dot: "bg-purple-500" },
  waiver_signed:   { dot: "bg-emerald-500" },
  invoice:         { dot: "bg-amber-500" },
};

function InfoRow({ label, value, href }: { label: string; value: string | null | undefined; href?: string }) {
  if (!value) return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10px] tracking-widest uppercase font-medium text-slate-400">{label}</dt>
      <dd className="text-slate-300 text-sm">Not provided</dd>
    </div>
  );
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10px] tracking-widest uppercase font-medium text-slate-400">{label}</dt>
      <dd className="text-slate-700 text-sm">
        {href ? <a href={href} className="hover:text-blue-600 transition-colors">{value}</a> : value}
      </dd>
    </div>
  );
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Use service client to ensure RLS doesn't block authenticated pro reads
  const svcClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { data: lead, error: leadError } = await svcClient
    .from("leads")
    .select("id, created_at, name, email, phone, vessel_type, vessel_length, service, referral_source, message, source, status, waiver_signed, last_service_date")
    .eq("id", id)
    .single();

  if (leadError) console.error("Lead fetch error:", leadError.message);
  if (!lead) notFound();

  // Fetch notes on this lead directly, plus orphaned notes from past leads with the same phone/email
  type LeadNote = { id: string; created_at: string; body: string | null; created_by: string | null; metadata: Record<string, unknown> | null };
  let leadNotes: LeadNote[] = [];
  {
    const { data: direct } = await svcClient
      .from("timeline_events")
      .select("id, created_at, body, created_by, metadata")
      .eq("lead_id", id)
      .eq("event_type", "note")
      .order("created_at", { ascending: true });
    leadNotes = direct ?? [];

    // Recover orphaned notes from prior deleted leads with the same phone number
    if (lead.phone) {
      const { data: orphaned } = await svcClient
        .from("timeline_events")
        .select("id, created_at, body, created_by, metadata")
        .eq("event_type", "note")
        .is("contact_id", null)
        .is("lead_id", null)
        .filter("metadata->>lead_phone", "eq", lead.phone)
        .order("created_at", { ascending: true });
      if (orphaned?.length) leadNotes = [...orphaned, ...leadNotes];
    }
  }

  // Try to find a matching contact record by email, then phone as fallback
  let contact: Contact | null = null;
  let timeline: TimelineEvent[] = [];

  // Timeline events fetched directly by phone (for Quo leads without a contact record yet)
  let quoTimeline: TimelineEvent[] = [];

  try {
    const svc = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );

    let contactData: Contact | null = null;
    if (lead.email) {
      const { data } = await svc
        .from("contacts")
        .select("id, name, email, phone, waiver_signed")
        .eq("email", lead.email)
        .maybeSingle();
      contactData = data ?? null;
    }
    if (!contactData && lead.phone) {
      const { data } = await svc
        .from("contacts")
        .select("id, name, email, phone, waiver_signed")
        .eq("phone", lead.phone)
        .maybeSingle();
      contactData = data ?? null;
    }

    if (contactData) {
      contact = contactData;
      const { data: events } = await svc
        .from("timeline_events")
        .select("id, created_at, event_type, title, body, created_by, metadata")
        .eq("contact_id", contactData.id)
        .order("created_at", { ascending: false });
      timeline = events ?? [];
    } else if (lead.phone) {
      // No contact yet: pull call/SMS events logged by the Quo webhook for this number.
      // Covers inbound calls (caller_number), inbound SMS (from_number), and outbound SMS (to_number).
      const [{ data: byCallerNumber }, { data: byFromNumber }, { data: byToNumber }] = await Promise.all([
        svc
          .from("timeline_events")
          .select("id, created_at, event_type, title, body, created_by, metadata")
          .is("contact_id", null)
          .filter("metadata->>caller_number", "eq", lead.phone)
          .in("event_type", ["call", "sms"])
          .order("created_at", { ascending: false }),
        svc
          .from("timeline_events")
          .select("id, created_at, event_type, title, body, created_by, metadata")
          .is("contact_id", null)
          .filter("metadata->>from_number", "eq", lead.phone)
          .eq("event_type", "sms")
          .order("created_at", { ascending: false }),
        svc
          .from("timeline_events")
          .select("id, created_at, event_type, title, body, created_by, metadata")
          .is("contact_id", null)
          .filter("metadata->>to_number", "eq", lead.phone)
          .eq("event_type", "sms")
          .order("created_at", { ascending: false }),
      ]);
      const seen = new Set<string>();
      quoTimeline = [...(byCallerNumber ?? []), ...(byFromNumber ?? []), ...(byToNumber ?? [])]
        .filter((e) => { if (seen.has(e.id)) return false; seen.add(e.id); return true; })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  } catch {
    // contacts table may not exist yet — degrade gracefully
  }

  const src = sourceConfig[lead.source ?? "website"] ?? sourceConfig.website;

  return (
    <ProShell>
      <div className="flex-1 flex flex-col">

        {/* Top bar */}
        <div className="bg-[#eceef1] border-b border-[#dcdee3] px-4 md:px-8 py-4 md:py-5 flex items-center gap-4 flex-wrap">
          <Link
            href="/pro/leads"
            className="text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1.5 text-sm shrink-0 py-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Leads
          </Link>
          <span className="text-slate-200 text-xs">/</span>
          <h1 className="text-[#1E2938] text-lg md:text-xl font-bold tracking-tight flex-1 truncate">
            {lead.name || lead.email}
          </h1>
          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2 shrink-0 flex-wrap">
            {lead.phone && (
              <a
                href={`openphone://call?number=${encodeURIComponent(lead.phone)}`}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] tracking-widest uppercase px-4 py-2.5 rounded-sm font-semibold transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.35 2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.95-1.36a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Call
              </a>
            )}
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] tracking-widest uppercase px-4 py-2.5 rounded-sm font-semibold transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Email
              </a>
            )}
            <span className={`text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-sm font-semibold ${src.cls}`}>
              {src.label}
            </span>
            <DeleteLeadButton leadId={lead.id} redirectTo="/pro/leads" />
            {lead.phone && <BlockLeadButton leadId={lead.id} />}
            {lead.status === "converted" && contact ? (
              <Link
                href={`/pro/contacts/${contact.id}`}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] tracking-widest uppercase px-5 py-2.5 rounded-sm font-semibold transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                View Client Profile
              </Link>
            ) : (
              <>
                <AddToPipelineButton id={lead.id} sourceType="lead" />
                <ConvertButton leadId={lead.id} />
              </>
            )}
          </div>
        </div>

        {/* Mobile action strip */}
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] inset-x-0 z-40 md:hidden bg-white border-t border-slate-200">
          <div className="flex gap-2 px-4 py-3 overflow-x-auto">
            {lead.phone && (
              <a
                href={`openphone://call?number=${encodeURIComponent(lead.phone)}`}
                className="flex items-center gap-2 bg-slate-800 text-white text-[10px] tracking-widest uppercase px-4 py-2.5 rounded-sm font-semibold whitespace-nowrap shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.35 2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.95-1.36a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Call
              </a>
            )}
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="flex items-center gap-2 bg-blue-600 text-white text-[10px] tracking-widest uppercase px-4 py-2.5 rounded-sm font-semibold whitespace-nowrap shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Email
              </a>
            )}
            {lead.status === "converted" && contact ? (
              <Link
                href={`/pro/contacts/${contact.id}`}
                className="flex items-center gap-2 bg-emerald-600 text-white text-[10px] tracking-widest uppercase px-4 py-2.5 rounded-sm font-semibold whitespace-nowrap shrink-0"
              >
                View Profile
              </Link>
            ) : (
              <>
                <AddToPipelineButton id={lead.id} sourceType="lead" />
                <ConvertButton leadId={lead.id} />
              </>
            )}
            <DeleteLeadButton leadId={lead.id} redirectTo="/pro/leads" />
            {lead.phone && <BlockLeadButton leadId={lead.id} />}
          </div>
        </div>

        <div className="flex-1 px-4 md:px-8 py-6 pb-48 md:pb-6">
          <div className="grid lg:grid-cols-3 gap-5">

            {/* Left: lead data */}
            <div className="lg:col-span-2 flex flex-col gap-5">

              {/* Service reminder flag */}
              {lead.source === "service_reminder" && lead.message && (
                <div className="bg-orange-50 border border-orange-200 rounded-md px-5 py-4 flex gap-3 items-start">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c2410c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  <div>
                    <p className="text-[10px] tracking-widest uppercase font-semibold text-orange-700 mb-1">Service Due</p>
                    <p className="text-sm text-orange-900 leading-snug">{lead.message}</p>
                  </div>
                </div>
              )}

              {/* Contact info */}
              <div className="bg-[#F1F2F5] neu-card rounded-md p-6">
                <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-400 mb-4">Contact Information</p>
                <dl className="grid sm:grid-cols-2 gap-4">
                  <LeadFieldEditor leadId={lead.id} field="name"  label="Full Name" value={lead.name} />
                  <LeadFieldEditor leadId={lead.id} field="email" label="Email"     value={lead.email} />
                  <LeadFieldEditor leadId={lead.id} field="phone" label="Phone"     value={lead.phone} />
                  <InfoRow label="Submitted" value={fmt(lead.created_at)} />
                </dl>
              </div>

              {/* Vessel info */}
              <div className="bg-[#F1F2F5] neu-card rounded-md p-6">
                <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-400 mb-4">Vessel Information</p>
                <dl className="grid sm:grid-cols-2 gap-4">
                  <LeadFieldEditor leadId={lead.id} field="vessel_type"   label="Vessel Type"   value={lead.vessel_type} />
                  <LeadFieldEditor leadId={lead.id} field="vessel_length" label="Vessel Length" value={lead.vessel_length} />
                  <InfoRow label="Last Service Date" value={lead.last_service_date ?? null} />
                  <InfoRow label="Waiver Signed"     value={lead.waiver_signed ? "Yes" : "No"} />
                </dl>
              </div>

              {/* Service request */}
              <div className="bg-[#F1F2F5] neu-card rounded-md p-6">
                <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-400 mb-4">Service Request</p>
                <dl className="flex flex-col gap-4">
                  <LeadFieldEditor leadId={lead.id} field="service" label="Service Requested" value={lead.service} />
                  <InfoRow label="Referral Source" value={lead.referral_source} />
                  {(() => {
                    const cleaned = lead.message
                      ?.split("\n\n")
                      .filter((p: string) => !/^(Campaign:|Form:|Lead ID:)/.test(p.trim()))
                      .join("\n\n")
                      .trim();
                    return cleaned ? (
                      <div className="flex flex-col gap-1">
                        <dt className="text-[10px] tracking-widest uppercase font-medium text-slate-400">Message</dt>
                        <dd className="text-slate-700 text-sm leading-relaxed bg-slate-50 border border-slate-100 rounded-sm px-3 py-2.5 whitespace-pre-wrap">{cleaned}</dd>
                      </div>
                    ) : null;
                  })()}
                </dl>
              </div>

              {/* Notes */}
              <div className="bg-[#F1F2F5] neu-card rounded-md p-6">
                <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-400 mb-4">Notes</p>
                <LeadNotesSection
                  leadId={id}
                  leadPhone={lead.phone ?? undefined}
                  leadEmail={lead.email ?? undefined}
                  initialNotes={leadNotes}
                />
              </div>

            </div>

            {/* Right: source + timeline */}
            <div className="flex flex-col gap-5">

              {/* Source details */}
              <div className="bg-[#F1F2F5] neu-card rounded-md p-5">
                <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-400 mb-3">Lead Source</p>
                <span className={`text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-sm font-semibold ${src.cls}`}>
                  {src.label}
                </span>
                <p className="text-slate-500 text-xs mt-2.5 leading-relaxed">{src.description}</p>
                <LeadSourceEditor leadId={lead.id} currentSource={lead.source ?? "website"} />
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-[10px] tracking-widest uppercase font-medium text-slate-400 mb-1">Received</p>
                  <p className="text-slate-600 text-xs">{fmtFull(lead.created_at)}</p>
                </div>
              </div>

              {/* Call / SMS log from Quo */}
              {(() => {
                const callEvents = contact
                  ? timeline.filter(e => e.event_type === "call" || e.event_type === "sms")
                  : quoTimeline;
                return (
                  <div className="bg-[#F1F2F5] neu-card rounded-md overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                      <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-400">Call Details</p>
                      {callEvents.length > 0 && (
                        <span className="text-slate-400 text-[11px]">{callEvents.length} {callEvents.length === 1 ? "event" : "events"}</span>
                      )}
                    </div>
                    {callEvents.length === 0 ? (
                      <p className="text-slate-400 text-xs px-5 py-5 leading-relaxed">
                        {contact ? "No calls or texts logged yet." : "No contact record found for this number."}
                      </p>
                    ) : (
                      <ul className="flex flex-col max-h-72 overflow-y-auto">
                        {callEvents.map((ev, i) => {
                          const isCall = ev.event_type === "call";
                          const recordingUrl = ev.metadata?.recording_url;
                          const t = (ev.title ?? "").toLowerCase();
                          const badge = t.includes("missed")
                            ? <span className="text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded-sm font-medium bg-red-50 text-red-500 border border-red-100">Missed</span>
                            : t.includes("voicemail")
                            ? <span className="text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded-sm font-medium bg-amber-50 text-amber-600 border border-amber-100">Voicemail</span>
                            : t.includes("inbound")
                            ? <span className="text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded-sm font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">Inbound</span>
                            : t.includes("outbound")
                            ? <span className="text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded-sm font-medium bg-blue-50 text-blue-600 border border-blue-100">Outbound</span>
                            : null;
                          return (
                            <li key={ev.id} className={`flex gap-3 px-5 py-3 ${i < callEvents.length - 1 ? "border-b border-slate-100" : ""}`}>
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isCall ? "bg-purple-50" : "bg-blue-50"}`}>
                                {isCall ? (
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l.87-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                                  </svg>
                                ) : (
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-slate-700 text-xs font-medium">{ev.title ?? (isCall ? "Call" : "SMS")}</span>
                                  {badge}
                                  <span className="text-slate-300 text-[10px] ml-auto whitespace-nowrap">
                                    {new Date(ev.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                                  </span>
                                </div>
                                {ev.body && <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{ev.body}</p>}
                                {recordingUrl && (
                                  <a href={recordingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-[#000080] hover:underline mt-1">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
                                    </svg>
                                    Listen to recording
                                  </a>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })()}


              {/* Timeline if contact matched */}
              {contact && (() => {
                const PHONE_TITLE_RE = /^(inbound|outbound)\s+(call|sms|voicemail)\b|^missed call\b/i;
                const activityEvents = timeline.filter(e =>
                  e.event_type !== "call" &&
                  e.event_type !== "sms" &&
                  !PHONE_TITLE_RE.test(e.title ?? "")
                );
                return (
                <div className="bg-[#F1F2F5] neu-card rounded-md flex flex-col">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-slate-800 text-sm font-semibold">Activity</p>
                    <span className="text-slate-400 text-[11px]">{activityEvents.length} events</span>
                  </div>
                  {activityEvents.length === 0 ? (
                    <p className="text-slate-400 text-xs px-5 py-6">No activity yet.</p>
                  ) : (
                    <ul className="px-5 py-4 flex flex-col">
                      {activityEvents.map((ev, i) => {
                        const dot = eventConfig[ev.event_type]?.dot ?? "bg-slate-300";
                        return (
                          <li key={ev.id} className="flex gap-3 relative">
                            {i < activityEvents.length - 1 && (
                              <div className="absolute left-[5px] top-4 bottom-0 w-px bg-slate-100" />
                            )}
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${dot}`} />
                            <div className="pb-4 flex-1 min-w-0">
                              <p className="text-slate-700 text-xs font-medium leading-snug">{ev.title ?? ev.event_type}</p>
                              {ev.body && <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">{ev.body}</p>}
                              <p className="text-slate-300 text-[10px] mt-0.5">{fmtFull(ev.created_at)}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                );
              })()}

            </div>
          </div>
        </div>

      </div>
    </ProShell>
  );
}
