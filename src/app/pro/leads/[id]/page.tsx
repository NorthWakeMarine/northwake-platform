export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import ProShell from "@/components/ProShell";
import ConvertButton from "./ConvertButton";
import AddToPipelineButton from "@/components/AddToPipelineButton";
import DeleteLeadButton from "../DeleteLeadButton";

type TimelineEvent = {
  id: string;
  created_at: string;
  event_type: string;
  title: string | null;
  body: string | null;
  created_by: string | null;
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
  dialpad:     { label: "Dialpad — Inbound Call", cls: "bg-purple-50 text-purple-700 border border-purple-200", description: "Auto-created from an inbound call via Dialpad." },
  google_ads:  { label: "Google Ads",             cls: "bg-green-50 text-green-700 border border-green-200",  description: "Generated from a Google Ads lead form." },
  manual:      { label: "Manual Entry",           cls: "bg-amber-50 text-amber-700 border border-amber-200",  description: "Entered manually by the team." },
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

  // Try to find a matching contact record by email
  let contact: Contact | null = null;
  let timeline: TimelineEvent[] = [];

  try {
    const svc = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );
    const { data: contactData } = await svc
      .from("contacts")
      .select("id, name, email, phone, waiver_signed")
      .eq("email", lead.email)
      .maybeSingle();

    if (contactData) {
      contact = contactData;
      const { data: events } = await svc
        .from("timeline_events")
        .select("id, created_at, event_type, title, body, created_by")
        .eq("contact_id", contactData.id)
        .order("created_at", { ascending: false });
      timeline = events ?? [];
    }
  } catch {
    // contacts table may not exist yet — degrade gracefully
  }

  const src = sourceConfig[lead.source ?? "website"] ?? sourceConfig.website;

  return (
    <ProShell>
      <div className="flex-1 flex flex-col">

        {/* Top bar */}
        <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center gap-4 flex-wrap">
          <Link
            href="/pro/dashboard"
            className="text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1.5 text-xs shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Dashboard
          </Link>
          <span className="text-slate-200 text-xs">/</span>
          <h1 className="text-slate-900 text-xl font-bold tracking-tight flex-1 truncate">
            {lead.name || lead.email}
          </h1>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
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

        <div className="flex-1 px-8 py-6">
          <div className="grid lg:grid-cols-3 gap-5">

            {/* Left: lead data */}
            <div className="lg:col-span-2 flex flex-col gap-5">

              {/* Contact info */}
              <div className="bg-white border border-slate-200 rounded-sm p-6">
                <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-400 mb-4">Contact Information</p>
                <dl className="grid sm:grid-cols-2 gap-4">
                  <InfoRow label="Full Name"    value={lead.name} />
                  <InfoRow label="Email"        value={lead.email} href={`mailto:${lead.email}`} />
                  <InfoRow label="Phone"        value={lead.phone} href={lead.phone ? `tel:${lead.phone}` : undefined} />
                  <InfoRow label="Submitted"    value={fmt(lead.created_at)} />
                </dl>
              </div>

              {/* Vessel info */}
              <div className="bg-white border border-slate-200 rounded-sm p-6">
                <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-400 mb-4">Vessel Information</p>
                <dl className="grid sm:grid-cols-2 gap-4">
                  <InfoRow label="Vessel Type"         value={lead.vessel_type} />
                  <InfoRow label="Vessel Length"       value={lead.vessel_length ? `${lead.vessel_length} ft` : null} />
                  <InfoRow label="Last Service Date"   value={lead.last_service_date ?? null} />
                  <InfoRow label="Waiver Signed"       value={lead.waiver_signed ? "Yes" : "No"} />
                </dl>
              </div>

              {/* Service request */}
              <div className="bg-white border border-slate-200 rounded-sm p-6">
                <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-400 mb-4">Service Request</p>
                <dl className="flex flex-col gap-4">
                  <InfoRow label="Service Requested" value={lead.service} />
                  <InfoRow label="Referral Source"   value={lead.referral_source} />
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

            </div>

            {/* Right: source + timeline */}
            <div className="flex flex-col gap-5">

              {/* Source details */}
              <div className="bg-white border border-slate-200 rounded-sm p-5">
                <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-400 mb-3">Lead Source</p>
                <span className={`text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-sm font-semibold ${src.cls}`}>
                  {src.label}
                </span>
                <p className="text-slate-500 text-xs mt-2.5 leading-relaxed">{src.description}</p>
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-[10px] tracking-widest uppercase font-medium text-slate-400 mb-1">Received</p>
                  <p className="text-slate-600 text-xs">{fmtFull(lead.created_at)}</p>
                </div>
              </div>

              {/* Future: Dialpad data */}
              {lead.source === "dialpad" ? (
                <div className="bg-white border border-slate-200 rounded-sm p-5">
                  <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-400 mb-3">Call Details</p>
                  <p className="text-slate-400 text-xs leading-relaxed">Call data will appear here once Dialpad is connected.</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-sm p-5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-400">Call Data</p>
                    <span className="text-[9px] tracking-widest uppercase text-slate-300 border border-slate-200 px-2 py-0.5 rounded-sm">Dialpad</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">Connect Dialpad to see inbound call data, duration, and recordings matched to this contact.</p>
                </div>
              )}


              {/* Timeline if contact matched */}
              {contact && (
                <div className="bg-white border border-slate-200 rounded-sm flex flex-col">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-slate-800 text-sm font-semibold">Activity</p>
                    <span className="text-slate-400 text-[11px]">{timeline.length} events</span>
                  </div>
                  {timeline.length === 0 ? (
                    <p className="text-slate-400 text-xs px-5 py-6">No activity yet.</p>
                  ) : (
                    <ul className="px-5 py-4 flex flex-col">
                      {timeline.map((ev, i) => {
                        const dot = eventConfig[ev.event_type]?.dot ?? "bg-slate-300";
                        return (
                          <li key={ev.id} className="flex gap-3 relative">
                            {i < timeline.length - 1 && (
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
              )}

            </div>
          </div>
        </div>

      </div>
    </ProShell>
  );
}
