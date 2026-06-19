export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import ProShell from "@/components/ProShell";
import ClickableRow from "@/components/ClickableRow";
import { clientConfig } from "@/config/client";
import NewLeadButton from "./NewLeadButton";

type Lead = {
  id: string;
  created_at: string;
  name: string | null;
  email: string;
  phone: string | null;
  vessel_type: string | null;
  vessel_length: string | null;
  service: string | null;
  source: string | null;
  hasNote?: boolean;
};

const sourceConfig: Record<string, { label: string; cls: string }> = {
  hero:       { label: "Home Form",    cls: "bg-blue-50 text-blue-600 border border-blue-200" },
  contact:    { label: "Contact Form", cls: "bg-blue-50 text-blue-600 border border-blue-200" },
  website:    { label: "Website",      cls: "bg-blue-50 text-blue-600 border border-blue-200" },
  waiver:     { label: "Waiver",       cls: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
  api:        { label: "API",          cls: "bg-slate-100 text-slate-500 border border-slate-200" },
  quo:        { label: "Quo",           cls: "bg-purple-50 text-purple-600 border border-purple-200" },
  google_ads: { label: "Google Ads",   cls: "bg-green-50 text-green-600 border border-green-200" },
  manual:      { label: "Manual",       cls: "bg-amber-50 text-amber-600 border border-amber-200" },
  web_services: { label: "Web Client",  cls: "bg-violet-50 text-violet-600 border border-violet-200" },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

const SORTABLE_COLS: Record<string, string> = {
  Date: "created_at",
  Name: "name",
  Email: "email",
  Phone: "phone",
};

function SortableHeader({ label, field, currentSort, currentDir }: {
  label: string;
  field: string | null;
  currentSort: string;
  currentDir: string;
}) {
  if (!field) {
    return (
      <th className="text-left text-[#1E2938]/50 text-[11px] tracking-widest uppercase font-medium py-3 px-4 first:pl-6 last:pr-6 whitespace-nowrap">
        {label}
      </th>
    );
  }
  const isActive = currentSort === field;
  const nextDir = isActive && currentDir === "asc" ? "desc" : "asc";
  const params = new URLSearchParams({ sort: field, dir: nextDir }).toString();
  return (
    <th className="text-left text-slate-400 text-[10px] tracking-widest uppercase font-medium py-3 px-4 first:pl-6 last:pr-6 whitespace-nowrap">
      <a href={`?${params}`} className={`flex items-center gap-1 hover:text-slate-600 transition-colors ${isActive ? "text-slate-600" : ""}`}>
        {label}
        {isActive && <span className="text-slate-400">{currentDir === "asc" ? "↑" : "↓"}</span>}
      </a>
    </th>
  );
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams?: Promise<{ sort?: string; dir?: string }>;
}) {
  const { sort, dir } = (await searchParams) ?? {};
  const sortField = Object.values(SORTABLE_COLS).includes(sort ?? "") ? (sort ?? "created_at") : "created_at";
  const sortDir = dir === "asc" ? "asc" : "desc";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, created_at, name, email, phone, vessel_type, vessel_length, service, source")
    .order(sortField, { ascending: sortDir === "asc" });

  // Batch lookup for which phone numbers have a note
  const phones = (leads ?? []).map(l => l.phone).filter(Boolean) as string[];
  let notePhones = new Set<string>();
  if (phones.length > 0) {
    const { data: pnRows } = await supabase
      .from("phone_notes")
      .select("phone")
      .in("phone", phones);
    notePhones = new Set((pnRows ?? []).map(n => n.phone));
  }

  const leadsWithNotes: Lead[] = (leads ?? []).map(l => ({ ...l, hasNote: notePhones.has(l.phone ?? "") }));

  const total = leads?.length ?? 0;
  const thisMonth = leads?.filter((l) => {
    const d = new Date(l.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length ?? 0;

  return (
    <ProShell>
      <div className="flex-1 flex flex-col">

        <div className="bg-[#eceef1] border-b border-[#dcdee3] px-4 md:px-8 py-5">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-[#1E2938] text-xl font-bold tracking-tight">Leads</h1>
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-xs text-[#1E2938]/50"><strong className="text-[#1E2938] tabular-nums">{total}</strong> total</span>
              <span className="text-xs text-[#1E2938]/50"><strong className="text-[#1E2938] tabular-nums">{thisMonth}</strong> this month</span>
              <NewLeadButton />
            </div>
          </div>
          <p className="text-[#1E2938]/50 text-sm mt-1">Every lead received across all sources.</p>
        </div>

        <div className="px-4 md:px-8 py-6 flex flex-col gap-4">

          {/* Desktop table */}
          <div className="hidden md:block bg-[#F1F2F5] neu-card rounded-md overflow-hidden">
            {error ? (
              <p className="text-red-500 text-xs px-6 py-6">Failed to load leads: {error.message}</p>
            ) : !leads || leads.length === 0 ? (
              <div className="px-6 py-12 flex flex-col items-center gap-3 text-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="chrome-text-dark">
                  <path d="M22 12h-6l-2 3h-4l-2-3H2" />
                  <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                </svg>
                <p className="text-slate-400 text-[10px] tracking-[0.2em] uppercase">Awaiting your first lead</p>
                <p className="text-slate-400/80 text-xs max-w-xs leading-relaxed mt-1">
                  Leads appear here automatically when someone submits a quote request on the website.
                </p>
                <a
                  href={`${clientConfig.siteUrl}/contact`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] tracking-widest uppercase text-[#000080] font-semibold hover:underline mt-2"
                >
                  View Contact Page →
                </a>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#dcdee3]">
                      {(["Date", "Name", "Email", "Phone", "Vessel", "Service", "Source"] as const).map((h) => (
                        <SortableHeader
                          key={h}
                          label={h}
                          field={SORTABLE_COLS[h] ?? null}
                          currentSort={sortField}
                          currentDir={sortDir}
                        />
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leadsWithNotes.map((lead) => {
                      const src = sourceConfig[lead.source ?? "website"] ?? sourceConfig.website;
                      return (
                        <ClickableRow key={lead.id} href={`/pro/leads/${lead.id}`} className="border-b border-[#dcdee3]/50 hover:bg-white/60 transition-colors group">
                          <td className="py-3 px-4 first:pl-6 text-slate-400 whitespace-nowrap">{fmt(lead.created_at)}</td>
                          <td className="py-3 px-4 text-slate-800 font-medium whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              {lead.name || <span className="text-slate-300">—</span>}
                              {lead.hasNote && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Has caller note" />}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            <a href={`mailto:${lead.email}`} className="hover:text-blue-600 transition-colors">{lead.email}</a>
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {lead.phone
                              ? <a href={`openphone://call?number=${encodeURIComponent(lead.phone)}`} className="hover:text-blue-600 transition-colors">{lead.phone}</a>
                              : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {lead.vessel_type
                              ? <>{lead.vessel_type}{lead.vessel_length ? <span className="text-slate-400"> · {lead.vessel_length} ft</span> : null}</>
                              : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{lead.service || <span className="text-slate-300">—</span>}</td>
                          <td className="py-3 px-4 last:pr-6 whitespace-nowrap">
                            <span className={`text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-sm font-medium ${src.cls}`}>
                              {src.label}
                            </span>
                          </td>
                        </ClickableRow>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Mobile card list */}
          <div className="md:hidden flex flex-col gap-2">
            {error ? (
              <p className="text-red-500 text-sm text-center py-8">Failed to load leads.</p>
            ) : !leads || leads.length === 0 ? (
              <div className="flex flex-col items-center gap-3 text-center py-12">
                <p className="text-slate-400 text-sm">No leads yet.</p>
                <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
                  Leads appear automatically when someone submits a quote request on the website.
                </p>
              </div>
            ) : leadsWithNotes.map((lead) => {
              const src = sourceConfig[lead.source ?? "website"] ?? sourceConfig.website;
              return (
                <Link
                  key={lead.id}
                  href={`/pro/leads/${lead.id}`}
                  className="bg-white rounded-xl px-4 py-4 shadow-sm flex flex-col gap-2 active:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-800 font-semibold text-base leading-snug flex items-center gap-1.5">
                      {lead.name || <span className="text-slate-400 italic font-normal text-sm">Unknown</span>}
                      {lead.hasNote && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-0.5" />}
                    </span>
                    <span className="text-slate-400 text-xs shrink-0">{fmt(lead.created_at)}</span>
                  </div>
                  {lead.email && (
                    <span className="text-slate-500 text-sm truncate">{lead.email}</span>
                  )}
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-slate-600 text-sm font-medium">
                      {lead.phone || <span className="text-slate-300 text-xs font-normal">No phone</span>}
                    </span>
                    <span className={`text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-sm font-medium shrink-0 ${src.cls}`}>
                      {src.label}
                    </span>
                  </div>
                  {lead.vessel_type && (
                    <span className="text-slate-400 text-xs">
                      {lead.vessel_type}{lead.vessel_length ? ` · ${lead.vessel_length} ft` : ""}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

        </div>

      </div>
    </ProShell>
  );
}
