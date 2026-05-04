export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import ProShell from "@/components/ProShell";
import NoteForm from "./NoteForm";
import CopyWaiverLink from "./CopyWaiverLink";
import FleetGallery, { type Asset } from "./FleetGallery";
import LinkedContacts, { type LinkedContact } from "./LinkedContacts";
import EditableField from "./EditableField";
import ContactDocuments from "./ContactDocuments";
import ActivityTimeline from "./ActivityTimeline";
import LogCallModal from "./LogCallModal";
import SyncToQbButton from "./SyncToQbButton";
import type { DriveFile } from "@/lib/google-drive";

type Contact = {
  id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  vessel_type: string | null;
  vessel_length: string | null;
  waiver_signed: boolean | null;
  status: string | null;
  source: string | null;
  contact_type: string | null;
  qb_customer_id: string | null;
  drive_folder_id: string | null;
  drive_folder_url: string | null;
};

type TimelineEvent = {
  id: string;
  created_at: string;
  event_type: string;
  title: string | null;
  body: string | null;
  created_by: string | null;
  metadata?: Record<string, string> | null;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

type HealthItem = { label: string; ok: boolean };

function HealthCheck({ contact, assetCount }: { contact: Contact; assetCount: number }) {
  const checks: HealthItem[] = [
    { label: "Email",         ok: !!contact.email },
    { label: "Phone",         ok: !!contact.phone },
    { label: "Address",       ok: !!contact.address },
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
      .select("id, created_at, name, email, phone, address, vessel_type, vessel_length, waiver_signed, status, source, contact_type, qb_customer_id, drive_folder_id, drive_folder_url")
      .eq("id", id)
      .single(),
    supabase
      .from("timeline_events")
      .select("id, created_at, event_type, title, body, created_by, metadata")
      .eq("contact_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("vessels")
      .select("id, asset_type, name, make_model, year, color, length_ft, location, registration, notes, last_service_date, vessel_type, service_interval_days")
      .eq("owner_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("linked_contacts")
      .select("id, name, phone, email, relationship, authorized_to_approve")
      .eq("primary_contact_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!contact) notFound();

  const assets: Asset[] = (rawVessels ?? []) as Asset[];
  const linkedContacts: LinkedContact[] = (rawLinked ?? []) as LinkedContact[];

  // Fetch vessel services for all vessels belonging to this contact
  const vesselIds = assets.map((a) => a.id);
  const { data: vesselServicesData } = vesselIds.length > 0
    ? await supabase
        .from("vessel_services")
        .select("id, vessel_id, service_name, interval_days, last_service_date")
        .in("vessel_id", vesselIds)
        .order("created_at", { ascending: true })
    : { data: [] };
  const vesselServices = (vesselServicesData ?? []) as import("./FleetGallery").VesselService[];

  // Fetch Drive documents for this contact (best-effort — fails gracefully)
  let driveFiles: DriveFile[] = [];
  if (contact.drive_folder_id) {
    try {
      const { listFolderFiles } = await import("@/lib/google-drive");
      driveFiles = await listFolderFiles(contact.drive_folder_id);
    } catch { /* Drive unavailable */ }
  }

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
            {contact.contact_type !== "vendor" && (
              <>
                {contact.qb_customer_id ? (
                  <a
                    href={`https://app.qbo.intuit.com/app/customerdetail?nameId=${contact.qb_customer_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800 text-[10px] tracking-widest uppercase px-4 py-2 rounded-sm font-medium transition-colors"
                  >
                    View in QB
                  </a>
                ) : (
                  <SyncToQbButton contactId={contact.id} />
                )}
              </>
            )}
            <LogCallModal contactId={contact.id} />
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
          <FleetGallery contactId={contact.id} assets={assets} vesselServices={vesselServices} />

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
                    <dt className="text-slate-400 text-[10px] tracking-widest uppercase font-medium mb-0.5">Name</dt>
                    <dd>
                      <EditableField contactId={contact.id} field="name" value={contact.name} placeholder="Click to add name" />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-[10px] tracking-widest uppercase font-medium mb-0.5">Email</dt>
                    <dd>
                      <EditableField contactId={contact.id} field="email" value={contact.email} placeholder="Click to add email" />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-[10px] tracking-widest uppercase font-medium mb-0.5">Phone</dt>
                    <dd>
                      <EditableField contactId={contact.id} field="phone" value={contact.phone} placeholder="Click to add phone" />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-[10px] tracking-widest uppercase font-medium mb-0.5">Address</dt>
                    <dd>
                      <EditableField contactId={contact.id} field="address" value={contact.address} placeholder="Click to add address" />
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

              {/* Documents */}
              <ContactDocuments
                contactId={contact.id}
                initialFiles={driveFiles}
                folderUrl={contact.drive_folder_url}
                waiverEvents={(events as TimelineEvent[])?.filter(e => e.event_type === "waiver_signed") ?? []}
              />

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
                <ActivityTimeline events={(events as TimelineEvent[]) ?? []} />
              </div>

            </div>
          </div>
        </div>

      </div>
    </ProShell>
  );
}
